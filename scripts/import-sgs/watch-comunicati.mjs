/**
 * Watcher dei Comunicati Ufficiali LND Lazio.
 *
 * Legge la pagina comunicati (server-rendered), estrae la lista strutturata
 * {numero, area, tipo, titolo, data, pdfUrl}, la confronta con lo stato salvato
 * e riporta i NUOVI comunicati rilevanti (SGS/Dilettanti che toccano i calendari),
 * scaricandone i PDF in una cartella di lavoro.
 *
 * NON applica nulla al database: si limita a rilevare e scaricare. La pipeline
 * di import/seed resta a valle, con revisione umana.
 *
 * Uso:
 *   node scripts/import-sgs/watch-comunicati.mjs            # rileva e scarica i nuovi
 *   node scripts/import-sgs/watch-comunicati.mjs --all      # elenca tutti (ignora lo stato)
 *   node scripts/import-sgs/watch-comunicati.mjs --dry      # rileva senza scaricare/aggiornare stato
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STATE_PATH = path.join(HERE, "state.json");
const DOWNLOAD_DIR = "/tmp/lnd";
const LIST_URL = "https://lazio.lnd.it/comunicati/?q=calendari";
const UA = "Mozilla/5.0 (EXTRA TIME calendar watcher)";

const args = process.argv.slice(2);
const ALL = args.includes("--all");
const DRY = args.includes("--dry");

/** Categorie di comunicato che ci interessano (toccano i calendari). */
function isRelevant(c) {
  // Aree: consideriamo SGS (giovanili) e Dilettanti. Ignoriamo Calcio a 5.
  if (!/^(SGS|Dilettanti)$/i.test(c.tipo)) return false;
  // Titoli che indicano un impatto sui calendari.
  return /calendar|riformulazione|variazion|programma gare|nuovo/i.test(c.titolo);
}

/** Classificazione grezza del tipo di aggiornamento dal titolo. */
function classify(titolo) {
  const t = titolo.toLowerCase();
  if (/riformulazione|nuovo calendario/.test(t)) return "nuovo-calendario";
  if (/variazion/.test(t)) return "variazione";
  if (/programma gare/.test(t)) return "programma-gare";
  return "altro";
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} su ${url}`);
  return res.text();
}

/** Estrae la lista comunicati dall'HTML (blocchi cu-box). */
function parseList(html) {
  const items = [];
  // Ogni comunicato è un blocco "cu-box color--lnd". Divido su quel marcatore
  // (il loop Bricks marca solo il primo con data-brx-loop-start, ma la classe
  // cu-box color--lnd è presente su tutte le card).
  const blocks = html.split("cu-box color--lnd").slice(1);
  for (const b of blocks) {
    const numbers = [...b.matchAll(/cu-box--number">([^<]+)</g)].map((m) => m[1].trim());
    const titles = [...b.matchAll(/cu-box--title">([^<]+)</g)].map((m) => m[1].trim());
    const dateM = b.match(/cu-box--data">([^<]+)</);
    const pdfM = b.match(/href="(https:\/\/comunicatilazio\.it\/storage\/[^"]+\.pdf)"/);
    if (numbers.length < 2 || !pdfM) continue;

    // numbers[0] = "C.U. 32 - Regionali", numbers[1] = "SGS"
    const numAreaM = numbers[0].match(/C\.U\.\s*(\d+)\s*-\s*(.+)/i);
    const numero = numAreaM ? parseInt(numAreaM[1], 10) : null;
    const area = numAreaM ? numAreaM[2].trim() : "";
    const tipo = numbers[1] ?? "";
    const titolo = titles[1] ?? titles[0] ?? "";
    const data = dateM ? dateM[1].trim() : "";
    const pdfUrl = pdfM[1];
    if (numero === null) continue;

    items.push({
      id: `${area}/${tipo}/${numero}`,
      numero,
      area,
      tipo,
      titolo,
      data,
      pdfUrl,
      tipoAggiornamento: classify(titolo),
    });
  }
  return items;
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  } catch {
    return { seen: [] };
  }
}

async function download(item) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  const out = path.join(DOWNLOAD_DIR, `CU${item.numero}_${item.tipo}.pdf`);
  const res = await fetch(item.pdfUrl, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`download HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(out, buf);
  return { out, bytes: buf.length };
}

async function main() {
  const html = await fetchText(LIST_URL);
  const all = parseList(html);
  const relevant = all.filter(isRelevant);
  const state = loadState();
  const seen = new Set(state.seen);

  const nuovi = ALL ? relevant : relevant.filter((c) => !seen.has(c.id));

  console.log(`Comunicati totali in pagina: ${all.length} | rilevanti: ${relevant.length} | nuovi: ${nuovi.length}`);
  if (nuovi.length === 0) {
    console.log("Nessun nuovo comunicato rilevante.");
    return;
  }

  for (const c of nuovi) {
    let dl = "";
    if (!DRY) {
      try {
        const r = await download(c);
        dl = ` -> ${r.out} (${r.bytes} byte)`;
      } catch (e) {
        dl = ` -> ERRORE download: ${e.message}`;
      }
    }
    console.log(`[${c.tipoAggiornamento}] CU${c.numero} ${c.area}/${c.tipo} — ${c.titolo}${dl}`);
  }

  if (!DRY && !ALL) {
    const updated = { seen: [...seen, ...nuovi.map((c) => c.id)], updatedAt: new Date().toISOString() };
    fs.writeFileSync(STATE_PATH, JSON.stringify(updated, null, 2));
    console.log(`\nStato aggiornato: ${nuovi.length} comunicati segnati come visti.`);
  }
}

main().catch((e) => {
  console.error("Watcher errore:", e.message);
  process.exit(1);
});
