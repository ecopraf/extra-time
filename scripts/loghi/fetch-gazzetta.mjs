/**
 * Recupero loghi società dei campionati Lazio da Gazzetta Regionale.
 *
 * Fonte: API JSON pubblica v2.apiweb.gazzettaregionale.it (nessun browser).
 * Porting della logica del wizard loghi di YFM
 * (backend/api/helpers/gazzettaRegionale.js + scripts/import-loghi-gr.js):
 *   levels → championships → groups → calendario (ogni match ha home_logo/away_logo)
 * Livelli: 1 = Giovanili, 2 = Dilettanti.
 *
 * Scarica i loghi in /tmp/gr-loghi/<nomeNorm>.png e produce
 * /tmp/gr-loghi/index.json = [{ nome, url, file }] per il match col Core e
 * l'upload su R2 (a valle, con match-loghi/upload-loghi).
 *
 * Uso: node scripts/loghi/fetch-gazzetta.mjs            # tutti i livelli 1,2
 *      node scripts/loghi/fetch-gazzetta.mjs --level=2  # solo dilettanti
 */
import fs from "node:fs";
import path from "node:path";

const BASE = "https://v2.apiweb.gazzettaregionale.it";
const OUT = "/tmp/gr-loghi";
const DELAY_MS = 300;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const args = process.argv.slice(2);
const levelArg = (args.find((a) => a.startsWith("--level=")) || "").split("=")[1];
const LEVELS = levelArg ? [parseInt(levelArg, 10)] : [1, 2];

fs.mkdirSync(OUT, { recursive: true });

/** Normalizzazione nome → filename (coerente con YFM import-loghi-gr). */
function normalizeLogoName(name) {
  return (name || "")
    .toLowerCase()
    .replace(/\b(s\.?s\.?d\.?|s\.?r\.?l\.?|a\.?s\.?d\.?|a\.?r\.?l\.?|s\.?s\.?|a\.?c\.?|f\.?c\.?)\b\.?/gi, "")
    .replace(/[^a-z0-9\u00e0-\u00fa]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fetchJson(url) {
  const resp = await fetch(url, { headers: { Accept: "application/json" } });
  if (!resp.ok) return null;
  return resp.json();
}

async function downloadImage(url) {
  const resp = await fetch(url);
  if (!resp.ok) return null;
  return Buffer.from(await resp.arrayBuffer());
}

/** Estrae {nome: url} dai loghi del calendario di un girone. */
async function logosFromGroup(level, champ, group) {
  const data = await fetchJson(`${BASE}/calendari/levels/${level}/${champ}/${group}/calendario`);
  if (!data) return {};
  const logos = {};
  const rounds = [...(data.matches_first || []), ...(data.matches_second || [])];
  for (const round of rounds) {
    if (!Array.isArray(round)) continue;
    for (const m of round) {
      if (m.home_logo && m.home_club_name) logos[m.home_club_name] = m.home_logo;
      if (m.away_logo && m.away_club_name) logos[m.away_club_name] = m.away_logo;
    }
  }
  return logos;
}

async function main() {
  const index = [];
  const seenName = new Set();
  let downloaded = 0, skipped = 0, errors = 0, groups = 0;

  for (const level of LEVELS) {
    const champs = await fetchJson(`${BASE}/classifiche/levels/${level}`);
    if (!Array.isArray(champs)) { console.error(`level ${level}: nessun campionato`); continue; }
    console.error(`\n═══ Level ${level} (${level === 1 ? "Giovanili" : "Dilettanti"}): ${champs.length} campionati ═══`);
    for (const champ of champs) {
      await sleep(DELAY_MS);
      const grs = await fetchJson(`${BASE}/classifiche/levels/${level}/${champ.id}`);
      if (!Array.isArray(grs) || grs.length === 0) continue;
      console.error(`  ${champ.text} — ${grs.length} gironi`);
      for (const g of grs) {
        await sleep(DELAY_MS);
        groups++;
        const logos = await logosFromGroup(level, champ.id, g.id);
        for (const [nome, url] of Object.entries(logos)) {
          if (seenName.has(nome)) continue;
          seenName.add(nome);
          const norm = normalizeLogoName(nome);
          if (!norm) { errors++; continue; }
          const file = path.join(OUT, `${norm}.png`);
          if (fs.existsSync(file)) { skipped++; index.push({ nome, url, file }); continue; }
          try {
            const buf = await downloadImage(url);
            if (!buf || buf.length < 100) { errors++; continue; }
            fs.writeFileSync(file, buf);
            index.push({ nome, url, file });
            downloaded++;
          } catch { errors++; }
        }
      }
    }
  }

  fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index, null, 2));
  console.error(`\n✅ Gironi ${groups} | scaricati ${downloaded} | già presenti ${skipped} | errori ${errors}`);
  console.error(`Loghi unici: ${index.length} → ${OUT}/index.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
