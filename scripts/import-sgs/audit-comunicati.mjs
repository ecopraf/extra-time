/**
 * Audit COMPLETO dei comunicati LND Lazio: scarica tutti i comunicati di una o
 * più aree/tipi (URL deterministico) fino all'ultimo numero, ne estrae il testo
 * e segnala quelli che modificano i CALENDARI (riformulazioni, variazioni,
 * nuovi orari/giornate/programmi gara).
 *
 * Non modifica il DB: produce un report per capire quali aggiornamenti mancano
 * rispetto a quanto già importato (seed 0002..0006).
 *
 * Uso:
 *   node scripts/import-sgs/audit-comunicati.mjs                 # SGS + Dilettanti, tutti
 *   node scripts/import-sgs/audit-comunicati.mjs --area=Regionali --tipo=SGS --max=32
 */
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const YFM_BACKEND =
  "/Users/Raffaele/Documents/Youth-Foorball-Manager/youth-football-manager/backend";
const pdfParse = require(`${YFM_BACKEND}/node_modules/pdf-parse`);

const BASE = "https://comunicatilazio.it/storage/comunicati/2026/2027";
const UA = "Mozilla/5.0 (EXTRA TIME audit)";
const CACHE = "/tmp/lnd-audit";

const args = process.argv.slice(2);
const argVal = (k, d) => {
  const a = args.find((x) => x.startsWith(`--${k}=`));
  return a ? a.split("=")[1] : d;
};

// Aree/tipi da controllare: (area, tipo, maxNumero atteso)
const TARGETS = [
  { area: "Regionali", tipo: "SGS", max: parseInt(argVal("sgsMax", "32"), 10) },
  { area: "Regionali", tipo: "Dilettanti", max: parseInt(argVal("dilMax", "64"), 10) },
];

// Parole chiave che indicano un impatto sui calendari (date/orari/giornate).
const CAL_RE =
  /riformulazione|nuovo calendario|variazion|programma gare|anticipo|posticipo|recuper|orario|rinvi|spostat|modifica.*(gara|calendario|orario)/i;
// Categorie che ci interessano (per capire quale campionato tocca).
const CAT_RE =
  /eccellenza|promozione|prima categoria|seconda categoria|under\s?1[456789]|allievi|giovanissimi|juniores|u1[456789]|girone\s+[a-z]/gi;

async function fetchPdf(area, tipo, n) {
  fs.mkdirSync(CACHE, { recursive: true });
  const safe = `${area}_${tipo}_${n}`.replace(/[^A-Za-z0-9_]/g, "");
  const cached = `${CACHE}/${safe}.pdf`;
  if (fs.existsSync(cached)) return fs.readFileSync(cached);
  const url = `${BASE}/${area}/${tipo}/${n}/COMUNICATO_UFFICIALE_${n}.pdf`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(cached, buf);
  return buf;
}

async function main() {
  const report = [];
  for (const t of TARGETS) {
    console.error(`\n═══ ${t.area}/${t.tipo} (1..${t.max}) ═══`);
    for (let n = 1; n <= t.max; n++) {
      const buf = await fetchPdf(t.area, t.tipo, n);
      if (!buf) {
        continue;
      }
      let text = "";
      try {
        text = (await pdfParse(buf)).text;
      } catch {
        console.error(`  CU${n}: PDF illeggibile`);
        continue;
      }
      // Prime righe = oggetto/titolo del comunicato.
      const head = text.slice(0, 600).replace(/\s+/g, " ").trim();
      // Guardia: NON trattiamo il calcio a 5 (ha campionati e categorie proprie).
      // I TARGETS sono già solo SGS/Dilettanti calcio a 11, ma un comunicato
      // misto potrebbe citarlo: se l'intestazione è di calcio a 5, saltiamo.
      if (/calcio a 5|calcio a cinque|futsal|serie c1|serie c2/i.test(head)) {
        console.error(`  CU${n}: saltato (calcio a 5)`);
        continue;
      }
      const touchesCal = CAL_RE.test(text);
      if (!touchesCal) continue;
      // Categorie citate (uniche, prime 8).
      const cats = [...new Set((text.match(CAT_RE) || []).map((s) => s.toLowerCase().trim()))].slice(0, 10);
      const item = {
        tipo: t.tipo,
        numero: n,
        url: `${BASE}/${t.area}/${t.tipo}/${n}/COMUNICATO_UFFICIALE_${n}.pdf`,
        head: head.slice(0, 200),
        categorie: cats,
      };
      report.push(item);
      console.error(`  ★ CU${n} [${t.tipo}] tocca calendari → ${cats.join(", ") || "(cat n/d)"}`);
    }
  }
  fs.writeFileSync("/tmp/audit-comunicati.json", JSON.stringify(report, null, 2));
  console.error(`\nComunicati che toccano i calendari: ${report.length}`);
  console.error(`Report: /tmp/audit-comunicati.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
