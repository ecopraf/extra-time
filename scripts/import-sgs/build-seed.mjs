/**
 * Genera un seed SQL idempotente per il Football Data Core a partire dal JSON
 * estratto dai calendari SGS (extract-all.mjs).
 *
 * UUID deterministici (namespace + chiave -> md5 -> UUID v4-like) così il seed
 * è ri-eseguibile e stabile tra esecuzioni. Idempotente via ON CONFLICT.
 *
 * Uso: node scripts/import-sgs/build-seed.mjs <in.json> <out.sql> <region_code>
 */
import fs from "node:fs";
import crypto from "node:crypto";

const [inPath, outPath, regionCode = "LAZ"] = process.argv.slice(2);
if (!inPath || !outPath) {
  console.error("Uso: node build-seed.mjs <in.json> <out.sql> [regionCode]");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inPath, "utf8"));

/** UUID deterministico da una stringa (namespaced). */
function uuid(ns, key) {
  const h = crypto.createHash("md5").update(`${ns}:${key}`).digest("hex");
  // formato 8-4-4-4-12, forziamo versione 4 e variante per validità
  return `${h.slice(0, 8)}-${h.slice(8, 4 + 8)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

const esc = (s) => String(s).replace(/'/g, "''");

const SEASON_LABEL = data.season; // "2026/2027"
const seasonId = uuid("season", SEASON_LABEL);
const startYear = SEASON_LABEL.split("/")[0];
const endYear = SEASON_LABEL.split("/")[1];

// Codice competizione a partire da categoria+livello.
function compCode(cat, level) {
  return `${cat}_${level.toUpperCase()}`;
}
function compName(cat, level) {
  const n = cat.replace("U", "Under ");
  return `${n} ${level === "elite" ? "Elite" : "Regionale"}`;
}
// Categoria "logica" per la gerarchia URL: distinguiamo livello per non
// collassjonare Elite e Regionale sotto lo stesso slug.
function categoryLabel(cat, level) {
  return `${cat} ${level === "elite" ? "Elite" : "Regionale"}`;
}

const lines = [];
lines.push("-- EXTRA TIME — Seed Lazio reale 2026/2027 (generato da calendari SGS ufficiali)");
lines.push("-- Generato automaticamente da scripts/import-sgs/build-seed.mjs — NON modificare a mano.");
lines.push("-- Idempotente: ON CONFLICT DO NOTHING. Imposta 2026/2027 come stagione corrente.");
lines.push("");
lines.push("begin;");
lines.push("");
lines.push("-- La stagione reale diventa quella corrente; le altre non lo sono più.");
lines.push("update seasons set is_current = false where is_current = true;");
lines.push("");
lines.push("insert into seasons (id, label, start_date, end_date, is_current) values");
lines.push(`  ('${seasonId}', '${SEASON_LABEL}', '${startYear}-09-01', '${endYear}-06-30', true)`);
lines.push("on conflict (id) do update set is_current = excluded.is_current;");
lines.push("");

// Ricava region_id e una provincia (RM) esistenti dal seed pilota via subquery.
// Usiamo i codici, non gli UUID hardcoded, per non dipendere dal seed pilota.
const regionSub = `(select id from regions where code = '${regionCode}')`;
const provinceSub = `(select id from provinces where code = 'RM')`;
const lndSub = `(select id from federations where code = 'LND')`;

// --- Competizioni ---
lines.push("-- Competizioni (una per categoria+livello)");
const compVals = [];
const compIdByKey = new Map();
for (const c of data.competitions) {
  const key = `${c.category}|${c.level}`;
  const id = uuid("competition", key);
  compIdByKey.set(key, id);
  const code = compCode(c.category, c.level);
  const name = compName(c.category, c.level);
  const category = categoryLabel(c.category, c.level);
  const level = c.level === "elite" ? "giovanile-elite" : "giovanile";
  compVals.push(
    `  ('${id}', ${lndSub}, ${regionSub}, '${esc(code)}', '${esc(name)}', '${esc(category)}', '${esc(level)}')`,
  );
}
lines.push(
  "insert into competitions (id, federation_id, region_id, code, name, category, level) values",
);
lines.push(compVals.join(",\n"));
lines.push("on conflict (id) do nothing;");
lines.push("");

// --- Gironi ---
lines.push("-- Gironi");
const groupVals = [];
const groupIdByKey = new Map();
for (const c of data.competitions) {
  const compId = compIdByKey.get(`${c.category}|${c.level}`);
  for (const g of c.groups) {
    const gkey = `${c.category}|${c.level}|${g.code}`;
    const id = uuid("group", gkey);
    groupIdByKey.set(gkey, id);
    groupVals.push(
      `  ('${id}', '${compId}', '${seasonId}', ${provinceSub}, '${esc(g.code)}', 'Girone ${esc(g.code)}')`,
    );
  }
}
lines.push(
  "insert into competition_groups (id, competition_id, season_id, province_id, code, name) values",
);
lines.push(groupVals.join(",\n"));
lines.push("on conflict (id) do nothing;");
lines.push("");

// --- Club (una società per nome distinto) ---
const allTeamNames = new Set();
for (const c of data.competitions)
  for (const g of c.groups) for (const t of g.teams) allTeamNames.add(t);

lines.push(`-- Club (${allTeamNames.size} società distinte)`);
const clubVals = [];
const clubIdByName = new Map();
for (const name of [...allTeamNames].sort()) {
  const id = uuid("club", name);
  clubIdByName.set(name, id);
  clubVals.push(`  ('${id}', '${esc(name)}', ${provinceSub}, null)`);
}
lines.push("insert into clubs (id, canonical_name, province_id, city) values");
lines.push(clubVals.join(",\n"));
lines.push("on conflict (id) do nothing;");
lines.push("");

// --- Team (una squadra per club+categoria+livello) ---
// La stessa società può avere squadre in U14/U15/... quindi il team è per categoria.
lines.push("-- Squadre (club × categoria+livello)");
const teamVals = [];
const teamIdByKey = new Map(); // clubName|category|level -> teamId
for (const c of data.competitions) {
  for (const g of c.groups) {
    for (const name of g.teams) {
      const tkey = `${name}|${c.category}|${c.level}`;
      if (teamIdByKey.has(tkey)) continue;
      const id = uuid("team", tkey);
      teamIdByKey.set(tkey, id);
      const clubId = clubIdByName.get(name);
      const teamName = `${name} ${c.category}${c.level === "elite" ? " Elite" : ""}`;
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
    const gid = groupIdByKey.get(`${c.category}|${c.level}|${g.code}`);
    for (const name of g.teams) {
      const tid = teamIdByKey.get(`${name}|${c.category}|${c.level}`);
      enrollVals.push(`  ('${gid}', '${tid}')`);
    }
  }
}
lines.push("insert into group_teams (group_id, team_id) values");
lines.push(enrollVals.join(",\n"));
lines.push("on conflict do nothing;");
lines.push("");

// --- Partite (tutte scheduled) ---
lines.push("-- Calendario (partite programmate)");
const matchVals = [];
let mcount = 0;
for (const c of data.competitions) {
  for (const g of c.groups) {
    const gid = groupIdByKey.get(`${c.category}|${c.level}|${g.code}`);
    for (const m of g.matches) {
      const homeId = teamIdByKey.get(`${m.home}|${c.category}|${c.level}`);
      const awayId = teamIdByKey.get(`${m.away}|${c.category}|${c.level}`);
      if (!homeId || !awayId) continue; // squadra non nella lista girone: salta
      const mid = uuid("match", `${gid}|${m.matchday}|${m.home}|${m.away}|${m.date}`);
      const time = m.time || "15:00";
      const kickoff = `${m.date} ${time}:00+02`;
      matchVals.push(
        `  ('${mid}', '${gid}', '${seasonId}', ${m.matchday}, '${homeId}', '${awayId}', '${kickoff}', 'scheduled', null, null)`,
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
