/**
 * Estrattore delle "Variazioni al programma gare" dai comunicati LND Lazio.
 *
 * Le variazioni puntuali (spostamenti di data/ora/campo di singole partite) hanno
 * un formato irregolare, difficile da parsare in modo affidabile al 100%. Questo
 * script fa un'estrazione BEST-EFFORT e produce un REPORT leggibile da rivedere
 * a mano: NON applica nulla al database.
 *
 * L'aggiornamento effettivo della singola partita va fatto dal backoffice /admin
 * o con una query mirata, dopo aver verificato il report.
 *
 * Uso: node scripts/import-sgs/parse-variazioni.mjs <pdf> [<pdf> ...]
 */
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const YFM_BACKEND =
  "/Users/Raffaele/Documents/Youth-Foorball-Manager/youth-football-manager/backend";
const pdfParse = require(`${YFM_BACKEND}/node_modules/pdf-parse`);

const DATE_RE = /(\d{1,2}\/\d{1,2}\/\d{2,4})/;
const TIME_RE = /(\d{1,2}[:.]\d{2})/;

/** Trova le sezioni "VARIAZIONI ... GARE" nel testo e le ritaglia. */
function extractVariazioniSections(text) {
  const sections = [];
  const re = /VARIAZIONI\s+(?:AL\s+)?PROGRAMMA\s+GARE[^\n]*\n/gi;
  const marks = [...text.matchAll(re)].map((m) => m.index);
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i];
    // fine: prossima variazione, o inizio riformulazione/calendario, o fine testo
    const rest = text.slice(start + 30);
    const stop = rest.search(/RIFORMULAZIONE|Nuovo Calendario|G I O R N A T A|\*{5,}/i);
    const end = stop >= 0 ? start + 30 + stop : text.length;
    sections.push(text.slice(start, end));
  }
  return sections;
}

/** Best-effort: da una sezione ricava categoria/girone e righe di variazione. */
function parseSection(section) {
  const catM = section.match(
    /((?:UNDER|JUNIORES|ALLIEVI|GIOVANISSIMI)[^\n]*?)(?:\s+GIRONE)/i,
  );
  const gironeM = section.match(/GIRONE\s+([A-Z])\b/i);
  const category = catM ? catM[1].trim().replace(/\s+/g, " ") : "?";
  const girone = gironeM ? gironeM[1].toUpperCase() : "?";

  // righe candidate: contengono una data e un orario
  const rows = [];
  for (const raw of section.split("\n")) {
    const line = raw.trim();
    if (!line || !DATE_RE.test(line) || !TIME_RE.test(line)) continue;
    const date = line.match(DATE_RE)?.[1] ?? "";
    const time = line.match(TIME_RE)?.[1] ?? "";
    // le squadre stanno prima della data; il campo dopo l'orario
    const beforeDate = line.slice(0, line.indexOf(date)).trim();
    rows.push({ raw: line, teamsAndField: beforeDate, date, time });
  }
  return { category, girone, rows };
}

async function main() {
  const pdfs = process.argv.slice(2);
  if (pdfs.length === 0) {
    console.error("Uso: node parse-variazioni.mjs <pdf> [<pdf> ...]");
    process.exit(1);
  }
  for (const pdf of pdfs) {
    const data = await pdfParse(fs.readFileSync(pdf));
    const sections = extractVariazioniSections(data.text);
    console.log(`\n================ ${pdf.split("/").pop()} ================`);
    if (sections.length === 0) {
      console.log("Nessuna sezione 'Variazioni al programma gare' trovata.");
      continue;
    }
    for (const sec of sections) {
      const { category, girone, rows } = parseSection(sec);
      if (rows.length === 0) continue;
      console.log(`\n[${category} — girone ${girone}] ${rows.length} variazioni:`);
      for (const r of rows) {
        console.log(`  • ${r.date} ${r.time}  | ${r.teamsAndField}`);
      }
    }
    console.log(
      "\n⚠ Report best-effort. Verificare e applicare le variazioni dal backoffice /admin.",
    );
  }
}

main().catch((e) => {
  console.error("Errore:", e.message);
  process.exit(1);
});
