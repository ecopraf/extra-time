/**
 * Enumeratore dell'inventario comunicati LND dallo storage pubblico.
 *
 * La pagina /comunicati è renderizzata via JS (Bricks/AJAX) e in HTML espone
 * solo i più recenti. Lo storage però ha URL prevedibili:
 *   https://comunicatilazio.it/storage/comunicati/<ANNO>/<STAG>/<AREA>/<TIPO>/<N>/COMUNICATO_UFFICIALE_<N>.(pdf|zip)
 * Qui enumeriamo i numeri CU per ogni (area, tipo), rileviamo i file esistenti
 * con richieste HEAD e classifichiamo il contenuto (programma gare / risultati /
 * altro) scaricando solo i comunicati nuovi. Produce un inventario JSON.
 *
 * NON applica nulla al database: è sola lettura. Pensato per girare in CI
 * (GitHub Action), dove non ci sono i limiti serverless di Vercel.
 *
 * Uso:
 *   node scripts/import-sgs/enumera-comunicati.mjs            # stampa inventario JSON su stdout
 *   node scripts/import-sgs/enumera-comunicati.mjs --out file.json
 *   node scripts/import-sgs/enumera-comunicati.mjs --max 80 --gap 5
 *
 * Risoluzione dipendenze: usa fflate e pdf-parse del package @extra-time/ingest
 * (vanno installate; in CI eseguire dopo `pnpm install`).
 */
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..");
const INGEST = path.join(REPO, "packages", "ingest");
const req = createRequire(path.join(INGEST, "package.json"));
const { unzipSync, strFromU8 } = req("fflate");
const pdfParse = req("pdf-parse/lib/pdf-parse.js");

const UA = "Mozilla/5.0 (EXTRA TIME inventory)";
const YEAR = "2026";
const SEASON = "2027";
const BASE = `https://comunicatilazio.it/storage/comunicati/${YEAR}/${SEASON}`;
// Aree/tipi noti dei comunicati che toccano i calendari del pilota Lazio.
const AREA_TIPI = [
  ["Regionali", "Dilettanti"],
  ["Regionali", "SGS"],
  ["Regionali", "Provinciali"],
];

const args = process.argv.slice(2);
const outPath = args.includes("--out") ? args[args.indexOf("--out") + 1] : null;
const MAX = args.includes("--max") ? parseInt(args[args.indexOf("--max") + 1], 10) : 80;
const GAP = args.includes("--gap") ? parseInt(args[args.indexOf("--gap") + 1], 10) : 6;

async function head(url) {
  try {
    const r = await fetch(url, { method: "HEAD", headers: { "User-Agent": UA } });
    return r.ok;
  } catch { return false; }
}

async function textOf(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (/\.zip$/i.test(url)) {
    const files = unzipSync(new Uint8Array(buf));
    const docxName = Object.keys(files).find((n) => /\.docx$/i.test(n));
    if (!docxName) return "";
    const inner = unzipSync(files[docxName]);
    const xml = inner["word/document.xml"];
    if (!xml) return "";
    return strFromU8(xml).replace(/<[^>]+>/g, " ");
  }
  const data = await pdfParse(buf);
  return data.text;
}

function classify(text) {
  const t = text.toLowerCase();
  const kinds = [];
  if (/risultati ufficiali/.test(t)) kinds.push("risultati");
  if (/programma gare/.test(t)) kinds.push("programma-gare");
  if (/variazion/.test(t)) kinds.push("variazione");
  return kinds.length ? kinds : ["altro"];
}

async function main() {
  const inventory = [];
  for (const [area, tipo] of AREA_TIPI) {
    let gap = 0;
    for (let n = 1; n <= MAX && gap < GAP; n++) {
      const dir = `${BASE}/${area}/${tipo}/${n}/COMUNICATO_UFFICIALE_${n}`;
      let fileUrl = null;
      if (await head(`${dir}.pdf`)) fileUrl = `${dir}.pdf`;
      else if (await head(`${dir}.zip`)) fileUrl = `${dir}.zip`;
      if (!fileUrl) { gap++; continue; }
      gap = 0;
      let kinds = ["?"];
      try { kinds = classify(await textOf(fileUrl)); }
      catch (e) { kinds = [`errore:${e.message}`]; }
      const rec = { id: `${area}/${tipo}/${n}`, numero: n, area, tipo, fileUrl, kinds };
      inventory.push(rec);
      console.error(`  [${kinds.join(",")}] ${area}/${tipo}/${n}  ${fileUrl.split("/").pop()}`);
    }
  }
  const out = { generatedAt: new Date().toISOString(), season: `${YEAR}/${SEASON}`, count: inventory.length, comunicati: inventory };
  const json = JSON.stringify(out, null, 2);
  if (outPath) { fs.writeFileSync(outPath, json); console.error(`\nScritto ${inventory.length} comunicati in ${outPath}`); }
  else console.log(json);
}

main().catch((e) => { console.error("Enumeratore errore:", e); process.exit(1); });
