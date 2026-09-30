/**
 * Orchestratore semi-automatico dell'aggiornamento calendari da comunicati LND.
 *
 * Mette insieme i pezzi dell'epic:
 *   1. rileva i nuovi comunicati rilevanti (come watch-comunicati)
 *   2. scarica i PDF
 *   3. per "nuovo-calendario": estrae e genera un SEED SQL di aggiornamento
 *      (in db/seeds/_pending/) — NON lo applica
 *   4. per "variazione": genera un report testuale da rivedere
 *   5. produce un riepilogo di cosa è stato generato
 *
 * L'APPLICAZIONE al database resta un passo umano/di revisione:
 *   - controllare i file generati in db/seeds/_pending/
 *   - spostarli in db/seeds/ con il numero progressivo e applicare con pnpm db:seed
 *
 * Uso: node scripts/import-sgs/sync-comunicati.mjs [--dry]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..");
const STATE_PATH = path.join(HERE, "state.json");
const PENDING_DIR = path.join(REPO, "db", "seeds", "_pending");
const DL_DIR = "/tmp/lnd";
const LIST_URL = "https://lazio.lnd.it/comunicati/?q=calendari";
const UA = "Mozilla/5.0 (EXTRA TIME sync)";
const DRY = process.argv.includes("--dry");

function classify(t) {
  const s = t.toLowerCase();
  if (/riformulazione|nuovo calendario/.test(s)) return "nuovo-calendario";
  if (/variazion/.test(s)) return "variazione";
  if (/programma gare/.test(s)) return "programma-gare";
  return "altro";
}
function isRelevant(c) {
  return /^(SGS|Dilettanti)$/i.test(c.tipo) &&
    /calendar|riformulazione|variazion|programma gare|nuovo/i.test(c.titolo);
}

async function fetchText(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

function parseList(html) {
  const items = [];
  for (const b of html.split("cu-box color--lnd").slice(1)) {
    const numbers = [...b.matchAll(/cu-box--number">([^<]+)</g)].map((m) => m[1].trim());
    const titles = [...b.matchAll(/cu-box--title">([^<]+)</g)].map((m) => m[1].trim());
    const pdfM = b.match(/href="(https:\/\/comunicatilazio\.it\/storage\/[^"]+\.pdf)"/);
    if (numbers.length < 2 || !pdfM) continue;
    const numAreaM = numbers[0].match(/C\.U\.\s*(\d+)\s*-\s*(.+)/i);
    if (!numAreaM) continue;
    const numero = parseInt(numAreaM[1], 10);
    const area = numAreaM[2].trim();
    const tipo = numbers[1] ?? "";
    const titolo = titles[1] ?? titles[0] ?? "";
    items.push({ id: `${area}/${tipo}/${numero}`, numero, area, tipo, titolo, pdfUrl: pdfM[1], tipoAggiornamento: classify(titolo) });
  }
  return items;
}

async function download(item) {
  fs.mkdirSync(DL_DIR, { recursive: true });
  const out = path.join(DL_DIR, `CU${item.numero}_${item.tipo}.pdf`);
  const r = await fetch(item.pdfUrl, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`download HTTP ${r.status}`);
  fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
  return out;
}

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_PATH, "utf8")); }
  catch { return { seen: [] }; }
}

async function main() {
  const items = parseList(await fetchText(LIST_URL)).filter(isRelevant);
  const seen = new Set(loadState().seen);
  const nuovi = items.filter((c) => !seen.has(c.id));

  console.log(`Nuovi comunicati rilevanti: ${nuovi.length}`);
  if (nuovi.length === 0) return;

  fs.mkdirSync(PENDING_DIR, { recursive: true });
  const summary = [];

  for (const c of nuovi) {
    if (DRY) { summary.push(`[${c.tipoAggiornamento}] CU${c.numero} ${c.area}/${c.tipo} — ${c.titolo} (dry)`); continue; }
    let pdf;
    try { pdf = await download(c); }
    catch (e) { summary.push(`CU${c.numero}: ERRORE download ${e.message}`); continue; }

    if (c.tipoAggiornamento === "nuovo-calendario") {
      // estrai -> json -> seed nel pending (livello dedotto dal tipo/titolo)
      const level = /elite/i.test(c.titolo) ? "--elite" : "--regionale";
      const jsonOut = `/tmp/lnd/cu${c.numero}.json`;
      const seedOut = path.join(PENDING_DIR, `CU${c.numero}_${c.tipo}.sql`);
      try {
        execFileSync("node", [path.join(HERE, "extract-all.mjs"), jsonOut, level, pdf], { stdio: "pipe" });
        execFileSync("node", [path.join(HERE, "build-seed.mjs"), jsonOut, seedOut, "LAZ"], { stdio: "pipe" });
        summary.push(`[SEED] CU${c.numero} — ${c.titolo}\n         generato: ${seedOut}`);
      } catch (e) {
        summary.push(`CU${c.numero}: ERRORE generazione seed — ${e.message}`);
      }
    } else if (c.tipoAggiornamento === "variazione") {
      const rep = path.join(PENDING_DIR, `CU${c.numero}_${c.tipo}_variazioni.txt`);
      try {
        const out = execFileSync("node", [path.join(HERE, "parse-variazioni.mjs"), pdf], { encoding: "utf8" });
        fs.writeFileSync(rep, out);
        summary.push(`[VARIAZIONE] CU${c.numero} — report: ${rep}`);
      } catch (e) {
        summary.push(`CU${c.numero}: ERRORE variazioni — ${e.message}`);
      }
    } else {
      summary.push(`[SKIP] CU${c.numero} (${c.tipoAggiornamento}) — ${c.titolo}`);
    }
  }

  console.log("\n=== RIEPILOGO ===");
  console.log(summary.join("\n"));
  console.log(`\nⓘ File generati in db/seeds/_pending/. NON applicati: revisionare e poi`);
  console.log(`  spostare in db/seeds/ con numero progressivo e lanciare 'pnpm db:seed <file>'.`);
  console.log(`  Aggiornare state.json dopo aver confermato i comunicati processati.`);
}

main().catch((e) => { console.error("Sync errore:", e.message); process.exit(1); });
