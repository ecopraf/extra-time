/**
 * Applica gli orari/date reali dei "programma gare" alle partite già presenti
 * nel Core (Neon). NON crea partite: aggiorna kickoff_at (data+ora) e venue
 * delle gare esistenti, individuate per (categoria → girone → giornata → squadre).
 *
 * Il matching squadre è tollerante: i programma gare usano ragioni sociali più
 * lunghe ("F.C. Rieti 1936") rispetto ai nomi del Core ("F.C. Rieti"). Usiamo
 * una chiave normalizzata + confronto per contenimento/prefisso sui token.
 *
 * Idempotente: rieseguire riscrive gli stessi valori. In caso di più programma
 * gare per la stessa giornata, l'ULTIMO applicato vince (ordine di input).
 *
 * Uso: node --env-file=.env.local scripts/import-sgs/apply-programma-gare.mjs <in.json> [--dry]
 */
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { Client } = require("pg");

const IN = process.argv[2];
const DRY = process.argv.includes("--dry");
const SQL_OUT = (process.argv.find((a) => a.startsWith("--sql=")) || "").split("=")[1] || null;
if (!IN) { console.error("Uso: apply-programma-gare.mjs <in.json> [--dry] [--sql=<out.sql>]"); process.exit(1); }

function norm(s) {
  return (s || "")
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/j/g, "i")                 // Torvajanica ↔ Torvaianica
    .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
/** Abbreviazioni note che vanno espanse per confronto (una fonte abbrevia). */
const ABBR = { sport: "sporting", n: "nuova", atl: "atletico", pol: "polisportiva",
  acc: "accademia", camp: "campagnano", cvn: "", spqv: "", oir: "" };
/** token significativi (rimuove sigle societarie, numeri d'anno, espande abbr.) */
function tokens(s) {
  const stop = new Set(["ssd","srl","asd","acd","ac","fc","us","usd","arl","ss","pol","polisportiva","calcio","sportiva","societa","a","r","l","di","del","della","citta","real","new","c","aps","atletico","sporting","virtus","academy","1919","1920","1926","1936","1948","1957","1949","2014","2020","2000","1986","1972","2004","2024","1932","1925","1946","1947","1960","1918"]);
  return norm(s).split(" ")
    .map((w) => ABBR[w] ?? w)
    .filter((w) => w && !stop.has(w) && !/^\d{4}$/.test(w));
}
// Alias espliciti: coppie di nomi (normalizzati) che sono la STESSA squadra ma
// senza token in comune, quindi non catturabili dall'euristica. Verificati a
// mano confrontando programma gare e rosa del girone nel Core.
const ALIAS_PAIRS = [
  ["monti prenestini 1919", "m p cavese"],       // M.P. = Monti Prenestini (Cavese)
  ["monti prenestini 1919", "mp cavese"],
];
const ALIAS_SET = new Set(ALIAS_PAIRS.map(([x, y]) => `${norm(x)}|${norm(y)}`));
function isAlias(a, b) {
  const na = norm(a), nb = norm(b);
  return ALIAS_SET.has(`${na}|${nb}`) || ALIAS_SET.has(`${nb}|${na}`);
}

/** true se due nomi si riferiscono plausibilmente alla stessa squadra */
function sameTeam(a, b) {
  const na = norm(a), nb = norm(b);
  if (na === nb) return true;
  if (isAlias(a, b)) return true;
  if (na.length >= 5 && (na.includes(nb) || nb.includes(na))) return true;
  const ta = tokens(a), tb = tokens(b);
  if (ta.length === 0 || tb.length === 0) return false;
  const setB = new Set(tb);
  const shared = ta.filter((w) => setB.has(w));
  const long = ta.filter((w) => w.length >= 4);
  const longShared = long.filter((w) => setB.has(w));
  if (shared.length >= 2) return true;
  // 1 token lungo condiviso basta se rappresenta la parte distintiva del nome
  if (longShared.length >= 1 && (ta.length <= 2 || tb.length <= 2)) return true;
  // token distintivo lungo (>=6) condiviso: molto probabile stessa squadra
  if (longShared.some((w) => w.length >= 6)) return true;
  return false;
}

async function main() {
  const gare = JSON.parse(fs.readFileSync(IN, "utf8"));
  const et = new Client({ connectionString: process.env.DATABASE_URL });
  await et.connect();

  // Mappa categoria → { gironeCode → { groupId, teams:[{id,name}], matches:[{id,matchday,homeId,awayId,homeName,awayName}] } }
  const { rows: groups } = await et.query(`
    select g.id as group_id, g.code as girone, c.category
      from competition_groups g
      join competitions c on c.id = g.competition_id
      join seasons s on s.id = g.season_id and s.is_current`);
  const groupIdByKey = new Map();
  for (const g of groups) groupIdByKey.set(`${g.category}|${(g.girone||"").toUpperCase()}`, g.group_id);

  // Alias di categoria: il programma gare usa denominazioni leggermente diverse
  // da quelle importate. Proviamo la categoria del programma e i suoi alias.
  const CAT_ALIAS = {
    "U18 Regionale": ["U18 Elite"],
    "U19 Elite": ["U19 Regionale"],
  };

  // Rietichettatura gironi: alcuni comunicati di riformulazione (CU31/32) usano
  // per l'U15 Regionale lettere di girone diverse dal calendario base (CU17):
  // il loro "girone A" = girone C del Core, "B" = F. Mappa verificata per
  // intersezione squadre (12/14 comuni, univoca). Chiave: "categoria|src|gironePG".
  const GIRONE_REMAP = {
    "U15 Regionale|Regionali_SGS_31.pdf|A": "C",
    "U15 Regionale|Regionali_SGS_31.pdf|B": "F",
    "U15 Regionale|Regionali_SGS_32.pdf|A": "C",
    "U15 Regionale|Regionali_SGS_32.pdf|B": "F",
  };
  const remapGirone = (gara) => {
    const k = `${gara.categoria}|${gara._src}|${(gara.girone || "").toUpperCase()}`;
    return GIRONE_REMAP[k] ?? gara.girone;
  };
  const resolveGroup = (categoria, girone) => {
    const g = (girone || "").toUpperCase();
    const direct = groupIdByKey.get(`${categoria}|${g}`);
    if (direct) return direct;
    for (const alt of CAT_ALIAS[categoria] || []) {
      const hit = groupIdByKey.get(`${alt}|${g}`);
      if (hit) return hit;
    }
    return null;
  };

  // Precarico squadre e partite per girone (solo quelli citati).
  const neededGroupIds = new Set();
  for (const gara of gare) {
    const gid = resolveGroup(gara.categoria, remapGirone(gara));
    if (gid) neededGroupIds.add(gid);
  }
  const teamsByGroup = new Map();
  const matchesByGroup = new Map();
  for (const gid of neededGroupIds) {
    const { rows: tr } = await et.query(`
      select t.id, cl.canonical_name as name
        from group_teams gt join teams t on t.id = gt.team_id
        join clubs cl on cl.id = t.club_id where gt.group_id = $1`, [gid]);
    teamsByGroup.set(gid, tr);
    const { rows: mr } = await et.query(`
      select m.id, m.matchday, m.home_team_id, m.away_team_id,
             ch.canonical_name as home_name, ca.canonical_name as away_name
        from matches m
        join teams th on th.id = m.home_team_id join clubs ch on ch.id = th.club_id
        join teams ta on ta.id = m.away_team_id join clubs ca on ca.id = ta.club_id
       where m.group_id = $1`, [gid]);
    matchesByGroup.set(gid, mr);
  }

  let updated = 0, notFoundGroup = 0, notFoundMatch = 0, ambiguous = 0;
  const misses = [];
  const sqlByMatch = new Map();
  const esc = (s) => (s == null ? null : String(s).replace(/'/g, "''"));

  for (const gara of gare) {
    const gid = resolveGroup(gara.categoria, remapGirone(gara));
    if (!gid) { notFoundGroup++; continue; }
    const matches = matchesByGroup.get(gid) || [];
    // candidati: stessa giornata e squadre che combaciano (casa/ospite)
    let cand = matches.filter((m) =>
      m.matchday === gara.giornata &&
      sameTeam(m.home_name, gara.casa) && sameTeam(m.away_name, gara.ospite));
    // fallback: ignora la giornata (a volte rinumerata), match solo su squadre
    if (cand.length === 0) {
      cand = matches.filter((m) =>
        sameTeam(m.home_name, gara.casa) && sameTeam(m.away_name, gara.ospite));
    }
    if (cand.length === 0) { notFoundMatch++; misses.push(gara); continue; }
    if (cand.length > 1) { ambiguous++; }
    const target = cand[0];
    const kickoff = `${gara.dataIso} ${gara.ora}:00+02`;
    if (!DRY) {
      await et.query(
        `update matches set kickoff_at = $1, venue = coalesce($2, venue), updated_at = now() where id = $3`,
        [kickoff, gara.campo, target.id],
      );
    }
    if (SQL_OUT) {
      const venueSql = gara.campo ? `'${esc(gara.campo)}'` : "venue";
      // Mappa per id: l'ultima occorrenza (comunicato più recente) vince.
      sqlByMatch.set(
        target.id,
        `update matches set kickoff_at = '${kickoff}', venue = ${venueSql} where id = '${target.id}';`,
      );
    }
    updated++;
  }

  const sqlLines = [...sqlByMatch.values()];
  if (SQL_OUT && sqlLines.length) {
    const header = [
      "-- EXTRA TIME — Aggiornamento orari/date reali dai 'programma gare' LND",
      "-- Generato da scripts/import-sgs/apply-programma-gare.mjs — NON modificare a mano.",
      "-- Idempotente: UPDATE per id partita. Rieseguibile.",
      "",
      "begin;",
      "",
    ];
    fs.writeFileSync(SQL_OUT, header.concat(sqlLines, ["", "commit;", ""]).join("\n"));
    console.log(`SQL scritto: ${SQL_OUT} (${sqlLines.length} update)`);
  }

  console.log(`Gare in input: ${gare.length}`);
  console.log(`✓ aggiornate: ${updated}${DRY ? " (DRY: nessuna scrittura)" : ""}`);
  console.log(`  girone non trovato: ${notFoundGroup}`);
  console.log(`  partita non trovata: ${notFoundMatch}`);
  console.log(`  match ambigui (usato il primo): ${ambiguous}`);
  if (misses.length) {
    console.log("\nEsempi partita non trovata (prime 15):");
    misses.slice(0, 15).forEach((m) => console.log(`  ${m.categoria} G${m.girone} g${m.giornata}: ${m.casa} - ${m.ospite}`));
    fs.writeFileSync("/tmp/pg-misses.json", JSON.stringify(misses, null, 2));
    console.log(`  (report completo: /tmp/pg-misses.json)`);
  }
  await et.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
