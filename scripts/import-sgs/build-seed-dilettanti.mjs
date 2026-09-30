/**
 * Genera un seed SQL idempotente per i campionati DILETTANTI (Eccellenza,
 * Promozione, Prima/Seconda Categoria) a partire dal JSON di extract-dilettanti.mjs.
 *
 * Differenze rispetto a build-seed.mjs (giovanile):
 *  - category è il NOME PIENO del campionato ("Eccellenza", "Prima Categoria")
 *    e diventa lo slug URL. level = 'dilettantistico'.
 *  - il code competizione è derivato dal nome (ECCELLENZA, PRIMA_CATEGORIA...).
 *  - la squadra (team) non ha una categoria d'età: usiamo il nome campionato
 *    come categoria del team, così la stessa società può avere squadre distinte
 *    in campionati diversi senza collidere con quelle giovanili.
 *
 * UUID deterministici namespaced (md5) → idempotente via ON CONFLICT.
 *
 * Uso: node scripts/import-sgs/build-seed-dilettanti.mjs <in.json> <out.sql> [regionCode]
 */
import fs from "node:fs";
import crypto from "node:crypto";

const [inPath, outPath, regionCode = "LAZ"] = process.argv.slice(2);
if (!inPath || !outPath) {
  console.error("Uso: node build-seed-dilettanti.mjs <in.json> <out.sql> [regionCode]");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inPath, "utf8"));

function uuid(ns, key) {
  const h = crypto.createHash("md5").update(`${ns}:${key}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
const esc = (s) => String(s).replace(/'/g, "''");

const SEASON_LABEL = data.season; // "2026/2027"
const seasonId = uuid("season", SEASON_LABEL);
const startYear = SEASON_LABEL.split("/")[0];
const endYear = SEASON_LABEL.split("/")[1];

// Codice competizione: "Prima Categoria" -> "LAZ_PRIMA_CATEGORIA".
// Prefisso regione per evitare collisioni col vincolo unique(code) (il seed
// pilota usa già "ECCELLENZA"). Lo slug URL deriva da category, non dal code.
function compCode(cat) {
  const base = cat.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
  return `${regionCode}_${base}`;
}

const lines = [];
lines.push("-- EXTRA TIME — Seed Dilettanti Lazio 2026/2027 (brochure calendari LND ufficiali)");
lines.push("-- Generato da scripts/import-sgs/build-seed-dilettanti.mjs — NON modificare a mano.");
lines.push("-- Idempotente: ON CONFLICT DO NOTHING. Non tocca is_current (già gestita dal seed SGS).");
lines.push("-- Fonti: brochure Eccellenza/Promozione/U19, Prima e Seconda Categoria (lazio.lnd.it).");
lines.push("");
lines.push("begin;");
lines.push("");
lines.push("-- La stagione 2026/2027 esiste già (seed SGS). La riaffermiamo idempotente.");
lines.push("insert into seasons (id, label, start_date, end_date, is_current) values");
lines.push(`  ('${seasonId}', '${SEASON_LABEL}', '${startYear}-09-01', '${endYear}-06-30', true)`);
lines.push("on conflict (id) do nothing;");
lines.push("");

const regionSub = `(select id from regions where code = '${regionCode}')`;
const provinceSub = `(select id from provinces where code = 'RM')`;
const lndSub = `(select id from federations where code = 'LND')`;

// --- Competizioni ---
lines.push("-- Competizioni dilettanti (una per campionato)");
const compVals = [];
const compIdByCat = new Map();
for (const c of data.competitions) {
  const id = uuid("competition", `${c.category}|dilettantistico`);
  compIdByCat.set(c.category, id);
  const code = compCode(c.category);
  compVals.push(
    `  ('${id}', ${lndSub}, ${regionSub}, '${esc(code)}', '${esc(c.category)}', '${esc(c.category)}', 'dilettantistico')`,
  );
}
lines.push("insert into competitions (id, federation_id, region_id, code, name, category, level) values");
lines.push(compVals.join(",\n"));
lines.push("on conflict (id) do nothing;");
lines.push("");

// --- Gironi ---
lines.push("-- Gironi");
const groupVals = [];
const groupIdByKey = new Map();
for (const c of data.competitions) {
  const compId = compIdByCat.get(c.category);
  for (const g of c.groups) {
    const gkey = `${c.category}|${g.code}`;
    const id = uuid("group", gkey);
    groupIdByKey.set(gkey, id);
    groupVals.push(
      `  ('${id}', '${compId}', '${seasonId}', ${provinceSub}, '${esc(g.code)}', 'Girone ${esc(g.code)}')`,
    );
  }
}
lines.push("insert into competition_groups (id, competition_id, season_id, province_id, code, name) values");
lines.push(groupVals.join(",\n"));
lines.push("on conflict (id) do nothing;");
lines.push("");

// --- Club (una società per nome distinto, condivisa con i giovanili via UUID) ---
const allTeamNames = new Set();
for (const c of data.competitions)
  for (const g of c.groups) for (const t of g.teams) allTeamNames.add(t);

lines.push(`-- Club (${allTeamNames.size} società distinte nei dilettanti)`);
const clubVals = [];
const clubIdByName = new Map();
for (const name of [...allTeamNames].sort()) {
  const id = uuid("club", name); // stesso namespace del build-seed SGS → riuso club esistenti
  clubIdByName.set(name, id);
  clubVals.push(`  ('${id}', '${esc(name)}', ${provinceSub}, null)`);
}
lines.push("insert into clubs (id, canonical_name, province_id, city) values");
lines.push(clubVals.join(",\n"));
lines.push("on conflict (id) do nothing;");
lines.push("");

// --- Team (una squadra per club+campionato) ---
lines.push("-- Squadre (club × campionato dilettanti)");
const teamVals = [];
const teamIdByKey = new Map(); // clubName|category -> teamId
for (const c of data.competitions) {
  for (const g of c.groups) {
    for (const name of g.teams) {
      const tkey = `${name}|${c.category}`;
      if (teamIdByKey.has(tkey)) continue;
      const id = uuid("team", tkey);
      teamIdByKey.set(tkey, id);
      const clubId = clubIdByName.get(name);
      const teamName = `${name} — ${c.category}`;
      teamVals.push(`  ('${id}', '${clubId}', '${esc(teamName)}', '${esc(c.category)}')`);
    }
  }
}
lines.push("insert into teams (id, club_id, name, category) values");
lines.push(teamVals.join(",\n"));
lines.push("on conflict (id) do nothing;");
lines.push("");

// --- Iscrizioni ai gironi ---
lines.push("-- Iscrizioni squadra→girone");
const enrollVals = [];
for (const c of data.competitions) {
  for (const g of c.groups) {
    const gid = groupIdByKey.get(`${c.category}|${g.code}`);
    for (const name of g.teams) {
      const tid = teamIdByKey.get(`${name}|${c.category}`);
      enrollVals.push(`  ('${gid}', '${tid}')`);
    }
  }
}
lines.push("insert into group_teams (group_id, team_id) values");
lines.push(enrollVals.join(",\n"));
lines.push("on conflict do nothing;");
lines.push("");

// --- Partite (solo andata, tutte scheduled) ---
lines.push("-- Calendario (partite programmate — solo andata dalle brochure)");
const matchVals = [];
let mcount = 0;
for (const c of data.competitions) {
  for (const g of c.groups) {
    const gid = groupIdByKey.get(`${c.category}|${g.code}`);
    for (const m of g.matches) {
      const homeId = teamIdByKey.get(`${m.home}|${c.category}`);
      const awayId = teamIdByKey.get(`${m.away}|${c.category}`);
      if (!homeId || !awayId) continue;
      const mid = uuid("match", `${gid}|${m.matchday}|${m.home}|${m.away}|${m.date}`);
      const time = m.time || "15:00";
      const kickoff = m.date ? `${m.date} ${time}:00+02` : null;
      const kickoffSql = kickoff ? `'${kickoff}'` : "null";
      matchVals.push(
        `  ('${mid}', '${gid}', '${seasonId}', ${m.matchday}, '${homeId}', '${awayId}', ${kickoffSql}, 'scheduled', null, null)`,
      );
      mcount++;
    }
  }
}
lines.push(
  "insert into matches (id, group_id, season_id, matchday, home_team_id, away_team_id, kickoff_at, status, home_score, away_score) values",
);
lines.push(matchVals.join(",\n"));
lines.push("on conflict (id) do nothing;");
lines.push("");
lines.push("commit;");
lines.push("");

fs.writeFileSync(outPath, lines.join("\n"));
console.error(`Seed scritto: ${outPath}`);
console.error(
  `Competizioni: ${data.competitions.length}, gironi: ${groupIdByKey.size}, club: ${clubIdByName.size}, squadre: ${teamIdByKey.size}, iscrizioni: ${enrollVals.length}, partite: ${mcount}`,
);
