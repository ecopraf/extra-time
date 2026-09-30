/**
 * Matching loghi società: associa i club di EXTRA TIME (Neon) ai loghi Lazio
 * della tabella team_logo di YFM (letta in sola lettura).
 *
 * Strategia di match (in ordine di priorità):
 *   1. nome normalizzato esatto (club ET vs team_logo.nome_normalizzato)
 *   2. match su uno degli alias (team_logo.aliases)
 *   3. match "contenimento" forte (uno contiene l'altro, lunghezza minima)
 * Produce un report JSON in /tmp/loghi_match.json con: sicuri, dubbi, mancanti.
 * NON scrive nulla: né su ET, né su YFM.
 *
 * Env: DATABASE_URL (Neon, da .env.local), YFM_DATABASE_URL (da .yfm-source)
 * Uso: node --env-file=.env.local --env-file=.yfm-source scripts/loghi/match-loghi.mjs
 */
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { Client } = require("pg");

/** Normalizzazione nomi coerente con quella di YFM (lower, no accenti, no simboli). */
function norm(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
/** Rimuove suffissi/abbreviazioni societarie comuni per un confronto più tollerante. */
function stripNoise(s) {
  return norm(s)
    .replace(/\b(ssd|srl|asd|acd|ac|fc|us|usd|ssdarl|arl|ss|pol|polisportiva|scsrl|calcio|sportiva|societa|s c|a r l)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const et = new Client({ connectionString: process.env.DATABASE_URL });
  const yfm = new Client({ connectionString: process.env.YFM_DATABASE_URL });
  await et.connect();
  await yfm.connect();

  const clubs = (await et.query("select id, canonical_name from clubs order by canonical_name")).rows;
  const logos = (
    await yfm.query(
      "select nome, nome_normalizzato, logo_path, aliases from team_logo where lower(regione) = 'lazio'",
    )
  ).rows;

  // Indici per match veloce.
  const byNorm = new Map();
  const byStrip = new Map();
  for (const l of logos) {
    const n = l.nome_normalizzato || norm(l.nome);
    if (!byNorm.has(n)) byNorm.set(n, l);
    const s = stripNoise(l.nome);
    if (s && !byStrip.has(s)) byStrip.set(s, l);
    // aliases: possono essere array o stringa separata
    const aliases = Array.isArray(l.aliases)
      ? l.aliases
      : typeof l.aliases === "string"
        ? l.aliases.split(/[;,|]/)
        : [];
    for (const a of aliases) {
      const an = norm(a);
      if (an && !byNorm.has(an)) byNorm.set(an, l);
      const as = stripNoise(a);
      if (as && !byStrip.has(as)) byStrip.set(as, l);
    }
  }

  const sicuri = [];
  const dubbi = [];
  const mancanti = [];

  for (const club of clubs) {
    const cn = norm(club.canonical_name);
    const cs = stripNoise(club.canonical_name);

    // 1. match esatto su nome normalizzato / alias
    let hit = byNorm.get(cn);
    let metodo = "nome_normalizzato";

    // 2. match su nome "ripulito" dai suffissi
    if (!hit && cs) {
      hit = byStrip.get(cs);
      metodo = "strip_suffissi";
    }

    // 3. contenimento forte (evita match spurii: richiede lunghezza >= 5)
    if (!hit && cs.length >= 5) {
      const cand = logos.find((l) => {
        const ls = stripNoise(l.nome);
        return ls.length >= 5 && (ls.includes(cs) || cs.includes(ls));
      });
      if (cand) { hit = cand; metodo = "contenimento"; }
    }

    if (!hit) {
      mancanti.push({ club: club.canonical_name, clubId: club.id });
    } else if (metodo === "nome_normalizzato" || metodo === "strip_suffissi") {
      sicuri.push({ club: club.canonical_name, clubId: club.id, logo: hit.nome, logo_path: hit.logo_path, metodo });
    } else {
      dubbi.push({ club: club.canonical_name, clubId: club.id, logo: hit.nome, logo_path: hit.logo_path, metodo });
    }
  }

  const report = {
    clubTotali: clubs.length,
    loghiLazio: logos.length,
    sicuri: sicuri.length,
    dubbi: dubbi.length,
    mancanti: mancanti.length,
    dettaglio: { sicuri, dubbi, mancanti },
  };
  fs.writeFileSync("/tmp/loghi_match.json", JSON.stringify(report, null, 2));

  console.log(`Club ET: ${clubs.length} | loghi Lazio: ${logos.length}`);
  console.log(`✓ sicuri:   ${sicuri.length} (${Math.round(sicuri.length / clubs.length * 100)}%)`);
  console.log(`? dubbi:    ${dubbi.length}`);
  console.log(`✗ mancanti: ${mancanti.length}`);
  console.log("\nEsempi dubbi (da rivedere):");
  dubbi.slice(0, 8).forEach((d) => console.log(`  ${d.club}  ->  ${d.logo}`));
  console.log("\nEsempi mancanti:");
  mancanti.slice(0, 8).forEach((m) => console.log(`  ${m.club}`));
  console.log("\nReport completo: /tmp/loghi_match.json");

  await et.end();
  await yfm.end();
}

main().catch((e) => { console.error("Errore:", e.message); process.exit(1); });
