/**
 * Match dei club EXTRA TIME SENZA logo con i loghi scaricati da Gazzetta
 * Regionale (/tmp/gr-loghi/index.json). Produce /tmp/gr-loghi/match.json con
 * { clubId, club, nome, url, file, metodo } per l'upload su R2.
 *
 * Strategia (come match-loghi.mjs YFM):
 *   1. nome normalizzato esatto
 *   2. nome ripulito dai suffissi societari (strip)
 *   3. contenimento forte (>=5 char)
 * Considera solo i club che NON hanno già un logo, per non sovrascrivere.
 *
 * Env: DATABASE_URL (Neon). Uso:
 *   node --env-file=.env.local scripts/loghi/match-gazzetta.mjs
 */
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { Client } = require("pg");

function norm(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
function stripNoise(s) {
  return norm(s)
    .replace(/\b(ssd|srl|asd|acd|ac|fc|us|usd|ssdarl|arl|ss|pol|polisportiva|scsrl|calcio|sportiva|societa|s c|a r l)\b/g, "")
    .replace(/\s+/g, " ").trim();
}

async function main() {
  const index = JSON.parse(fs.readFileSync("/tmp/gr-loghi/index.json", "utf8"));
  const et = new Client({ connectionString: process.env.DATABASE_URL });
  await et.connect();

  // Solo club senza logo, iscritti a gironi della stagione corrente (visibili).
  const { rows: clubs } = await et.query(`
    select distinct cl.id, cl.canonical_name
      from clubs cl
      join teams t on t.club_id = cl.id
      join group_teams gt on gt.team_id = t.id
      join competition_groups g on g.id = gt.group_id
      join seasons s on s.id = g.season_id and s.is_current
     where cl.logo_media_id is null
     order by cl.canonical_name`);

  // Indici sui loghi Gazzetta.
  const byNorm = new Map(), byStrip = new Map();
  for (const l of index) {
    const n = norm(l.nome); if (n && !byNorm.has(n)) byNorm.set(n, l);
    const st = stripNoise(l.nome); if (st && !byStrip.has(st)) byStrip.set(st, l);
  }

  const matched = [], missing = [];
  for (const club of clubs) {
    const cn = norm(club.canonical_name), cs = stripNoise(club.canonical_name);
    let hit = byNorm.get(cn); let metodo = "esatto";
    if (!hit && cs) { hit = byStrip.get(cs); metodo = "strip"; }
    if (!hit && cs.length >= 5) {
      const cand = index.find((l) => {
        const ls = stripNoise(l.nome);
        return ls.length >= 5 && (ls.includes(cs) || cs.includes(ls));
      });
      if (cand) { hit = cand; metodo = "contenimento"; }
    }
    if (hit) matched.push({ clubId: club.id, club: club.canonical_name, nome: hit.nome, url: hit.url, file: hit.file, metodo });
    else missing.push(club.canonical_name);
  }

  fs.writeFileSync("/tmp/gr-loghi/match.json", JSON.stringify(matched, null, 2));
  console.error(`Club senza logo (visibili): ${clubs.length}`);
  console.error(`  match: ${matched.length} (esatto ${matched.filter(m=>m.metodo==="esatto").length}, strip ${matched.filter(m=>m.metodo==="strip").length}, contenimento ${matched.filter(m=>m.metodo==="contenimento").length})`);
  console.error(`  ancora senza: ${missing.length}`);
  console.error(`\nEsempi match contenimento (da rivedere):`);
  matched.filter(m=>m.metodo==="contenimento").slice(0,12).forEach(m=>console.error(`  ${m.club}  ->  ${m.nome}`));
  console.error(`\nEsempi ancora senza logo:`);
  missing.slice(0,12).forEach(n=>console.error(`  ${n}`));
  await et.end();
}
main().catch((e)=>{console.error(e);process.exit(1);});
