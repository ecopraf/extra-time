/**
 * Parser dei comunicati "PROGRAMMA GARE" LND Lazio (SGS + Dilettanti).
 *
 * A differenza delle brochure calendario (solo data d'andata generica), i
 * programma gare riportano per ogni partita CAMPO, DATA e ORA reali della
 * giornata. Servono ad AGGIORNARE gli orari/date delle partite già importate.
 *
 * Formato (colonne a larghezza fissa):
 *   CAMPIONATO <NOME>
 *   GIRONE  X                             GIORNATA  N  ANDATA
 *    1)  CASA (col 5..~37)  OSPITE (col ~38..~70)  <codice+campo+località>  dd/mm/yy  hh:mm
 *        <indirizzo>                        (riga successiva, ignorata)
 *
 * Output JSON: [{ categoria, girone, giornata, casa, ospite, dataIso, ora, campo }]
 *
 * Uso: node scripts/import-sgs/parse-programma-gare.mjs <out.json> <pdf...>
 */
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const YFM_BACKEND =
  "/Users/Raffaele/Documents/Youth-Foorball-Manager/youth-football-manager/backend";
const pdfParse = require(`${YFM_BACKEND}/node_modules/pdf-parse`);

// ── Classificazione categoria dal titolo "CAMPIONATO ..." ────────────────────
/**
 * Ritorna la category EXTRA TIME (come nel DB) dal titolo del campionato.
 *
 * NOTA sul settore/fonte: i comunicati LND sono divisi per AREA (SGS, Dilettanti,
 * Provinciali, Calcio a 5). La regola pratica:
 *   - SGS         → sempre giovanili (U14-U17, "Regionale" o "Eccellenza"=Elite)
 *   - Dilettanti  → senior (Eccellenza/Promozione/Prima/Seconda) MA ANCHE i
 *                   Juniores U19/U18 (giovanili) che LND pubblica sotto Dilettanti
 *   - Provinciali → Terza Categoria (senior) e alcune categorie provinciali
 *   - Calcio a 5  → IGNORATA (non importata)
 * Per questo la classificazione NON è un mapping area→settore, ma avviene sul
 * NOME del campionato. Attenzione: nel giovanile "Eccellenza" = livello Elite.
 */
function classifyCategoria(raw) {
  const c = raw.toUpperCase().replace(/\s+/g, " ").trim();
  // Dilettanti prime squadre
  if (/\bECCELLENZA\b/.test(c) && !/UNDER/.test(c)) return "Eccellenza";
  if (/\bPROMOZIONE\b/.test(c) && !/UNDER/.test(c)) return "Promozione";
  if (/PRIMA CATEGORIA/.test(c)) return "Prima Categoria";
  if (/SECONDA CATEGORIA/.test(c)) return "Seconda Categoria";
  const under = c.match(/UNDER\s*(\d{2})/);
  // ATTENZIONE: nel settore giovanile LND il livello alto si chiama "ECCELLENZA"
  // (spesso scritto "REG. ECCELLENZA" = Regionale Eccellenza), che nel nostro
  // modello è "Elite". Quindi ECCELLENZA (con UNDER) ⇒ Elite, NON Regionale.
  const isElite = /ELITE/.test(c) || /ECCELLENZA/.test(c);
  const isReg = /REGIONAL/.test(c) && !/ECCELLENZA/.test(c);

  // U19 è un caso speciale: LND lo divide in "Regionale A" (2 gironi, che noi
  // chiamiamo U19 Elite) e "Regionale B" (6 gironi = U19 Regionale). Nei
  // programma gare la sezione A appare come "JUNIORES UNDER 19" nuda.
  if ((under && under[1] === "19") || /JUNIORES/.test(c)) {
    if (/ECCELLENZA/.test(c)) return "U19 Elite";
    if (/REGIONALE\s*B|UNDER\s*19\s*B|\b19\s*B\b/.test(c)) return "U19 Regionale";
    if (/REGIONALE\s*A|UNDER\s*19\s*A|\b19\s*A\b/.test(c)) return "U19 Elite";
    return "U19 Elite"; // "JUNIORES UNDER 19" nudo = girone A/Elite
  }

  // Altri giovanili: "<Code> <Livello>" come nel seed SGS.
  if (under) {
    const code = `U${under[1]}`;
    if (isElite) return `${code} Elite`;
    if (isReg) return `${code} Regionale`;
    if (under[1] === "18") return "U18 Elite";
    return `${code} Regionale`;
  }
  if (/ALLIEVI/.test(c)) return "U17 Regionale";
  if (/GIOVANISSIMI/.test(c)) return "U15 Regionale";
  return null;
}

const ACCENT_MAP = { Citta: "Città", Universita: "Università" };
function normalizeTeamName(name) {
  let clean = name.replace(/\s+/g, " ").trim();
  clean = clean
    .replace(/\s*\bSSD\s+A\s+R\.?L\.?\s*$/gi, "")
    .replace(/\s*\bS\.?S\.?D\.?\s*A\s*R\.?L\.?\s*$/gi, "")
    .replace(/\s*\bA\s+R\.?L\.?\s*$/gi, "")
    .replace(/\s*\bS\.?R\.?L\.?\s*$/gi, "")
    .replace(/\s*\bA\.?S\.?D\.?\s*$/gi, "")
    .replace(/\s*\b(S\.?S\.?D\.?|A\.?S\.?D\.?|A\.?C\.?|F\.?C\.?)\s*\.?\s*$/gi, "")
    .trim();
  clean = clean.replace(/[’`´]/g, "'");
  const LOWER = new Set(["di","del","dei","della","delle","da","de","il","la","le","lo","gli","e","ed"]);
  clean = clean.split(" ").map((w,i)=>{
    const wl=w.toLowerCase();
    if(i>0&&LOWER.has(wl))return wl;
    if(w.length<=2)return w.toUpperCase();
    if(/\./.test(w))return w.toUpperCase();
    return w.charAt(0).toUpperCase()+w.slice(1).toLowerCase();
  }).join(" ");
  for(const [p,a] of Object.entries(ACCENT_MAP)) clean=clean.replace(new RegExp(`\\b${p}\\b`,"g"),a);
  clean = clean.replace(/\s+/g, " ").trim();
  return canonicalizeClub(clean);
}

// Alias canonici: varianti OCR/denominazione della STESSA società che, se non
// unificate, creano club duplicati (es. il girone U19 con 17 squadre). La chiave
// è il nome normalizzato ridotto; il valore è il nome canonico usato altrove.
const CLUB_CANONICAL = {
  "mprenestinicavese1919": "Monti Prenestini 1919",
  "prenestinicavese1919": "Monti Prenestini 1919",
  "montiprenestini1919": "Monti Prenestini 1919",
};
function canonicalizeClub(name) {
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return CLUB_CANONICAL[key] ?? name;
}

function toIso(dmy) {
  const m = dmy.match(/(\d{1,2})\/(\d{1,2})\/(\d{2})/);
  if (!m) return null;
  const dd = m[1].padStart(2, "0");
  const mm = m[2].padStart(2, "0");
  return `20${m[3]}-${mm}-${dd}`;
}

/** Estrae le partite da una sezione di programma gare. */
function parsePdfText(text) {
  const rows = [];
  const lines = text.split("\n");
  let categoria = null;
  let girone = null;
  let giornata = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/,"");
    const t = line.trim();
    if (!t) continue;

    // Header categoria
    const catM = t.match(/^CAMPIONATO\s+(.+)$/i);
    if (catM && !/GIRONE/i.test(t)) {
      const cat = classifyCategoria(catM[1]);
      if (cat) { categoria = cat; }
      continue;
    }
    // Header girone + giornata
    const gM = t.match(/GIRONE\s+([A-Z0-9]+)\s+GIORNATA\s+(\d+)\s+ANDATA/i);
    if (gM) {
      girone = gM[1].toUpperCase();
      giornata = parseInt(gM[2], 10);
      continue;
    }
    // Righe indice / titoli / avvisi: skip
    if (/^Campionato .+giornata/i.test(t)) continue;
    if (/COPPA ITALIA|TROFEO|AVVISO|PROGRAMMA GARE|VARIAZIONI/i.test(t)) {
      // in area coppa/variazioni disattivo il contesto campionato
      if (/COPPA ITALIA|TROFEO/i.test(t)) { categoria = null; girone = null; }
      continue;
    }

    // Riga partita: " N)  CASA...OSPITE...  d/mm/yy  hh:mm" (giorno 1-2 cifre)
    const mM = line.match(/^\s*\d+\)\s+(.+?)\s+(\d{1,2}\/\d{1,2}\/\d{2})\s+(\d{1,2}:\d{2})\s*$/);
    if (mM && categoria && girone && giornata) {
      const dataIso = toIso(mM[2]);
      const ora = mM[3].padStart(5, "0");
      // Colonne separate da 2+ spazi. Dopo il " N) ", i campi sono:
      // [casa] [ospite] [codice campo] [nome campo] [località] ...
      // Casa e ospite sono i PRIMI DUE campi. Il codice campo è numerico.
      const afterNum = line.replace(/^\s*\d+\)\s+/, "");
      const cols = afterNum.split(/\s{2,}/).map((x) => x.trim()).filter(Boolean);
      if (cols.length < 2) continue;
      const casa = normalizeTeamName(cols[0]);
      const ospite = normalizeTeamName(cols[1]);
      // campo: primo campo testuale dopo l'eventuale codice numerico
      let campoRaw = null;
      for (let ci = 2; ci < cols.length; ci++) {
        if (/^\d{1,4}$/.test(cols[ci])) continue; // codice campo numerico
        campoRaw = cols[ci];
        break;
      }
      if (casa.length < 2 || ospite.length < 2) continue;
      rows.push({ categoria, girone, giornata, casa, ospite, dataIso, ora, campo: campoRaw });
    }
  }
  return rows;
}

async function main() {
  const [outPath, ...pdfs] = process.argv.slice(2);
  if (!outPath || pdfs.length === 0) {
    console.error("Uso: node parse-programma-gare.mjs <out.json> <pdf...>");
    process.exit(1);
  }
  const all = [];
  for (const pdf of pdfs) {
    const buf = fs.readFileSync(pdf);
    let text;
    try { text = (await pdfParse(buf)).text; } catch { console.error(`  ! ${pdf}: illeggibile`); continue; }
    const rows = parsePdfText(text);
    // il file più recente vince: aggiungiamo con un ordinale di file
    for (const r of rows) all.push({ ...r, _src: pdf.split("/").pop() });
    // riepilogo per categoria
    const byCat = {};
    for (const r of rows) byCat[r.categoria] = (byCat[r.categoria]||0)+1;
    console.error(`[${pdf.split("/").pop()}] ${rows.length} gare — ${Object.entries(byCat).map(([k,v])=>`${k}:${v}`).join(", ")}`);
  }
  fs.writeFileSync(outPath, JSON.stringify(all, null, 2));
  console.error(`\nTotale gare estratte: ${all.length}`);
  console.error(`Scritto: ${outPath}`);
}

main().catch((e)=>{console.error(e);process.exit(1);});
