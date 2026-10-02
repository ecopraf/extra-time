/**
 * Seed del campionato "Under 18 Regionale" Lazio 2026/2027 (6 gironi A-F).
 *
 * Nella gerarchia LND Lazio l'Under 18 ha due livelli:
 *  - "Under 18 Elite"      → 2 gironi (A, B), gia' presente nel Core.
 *  - "Under 18 Regionale"  → livello inferiore, 6 gironi (A-F), 80 squadre.
 *    Nei comunicati e' denominato "Campionato Under 18 Regionale Fascia B".
 *
 * La COMPOSIZIONE dei gironi e' presa dal CU65 Dilettanti (sezione
 * "composizione dei gironi del Campionato Under 18 Regionale Fascia B").
 * Il CALENDARIO (date/accoppiamenti) non era ancora pubblicato al momento del
 * seed: questo script crea competizione + gironi + squadre, SENZA partite. Le
 * partite si aggiungeranno applicando il programma gare quando uscira'.
 *
 * Idempotente: UUID deterministici md5 + ON CONFLICT DO NOTHING. I club gia'
 * presenti nel Core vengono riusati (match su canonical_name normalizzato +
 * alias espliciti per i duplicati OCR); solo le societa' nuove vengono create.
 *
 * Uso:
 *   DB="$DATABASE_URL" node scripts/import-sgs/seed-u18-regionale.mjs        # dry-run
 *   APPLY=1 DB="$DATABASE_URL" node scripts/import-sgs/seed-u18-regionale.mjs # applica
 */
import { createRequire } from "node:module";
import crypto from "node:crypto";

const require = createRequire(import.meta.url);
const { Pool } = require("pg");

const DB = process.env.DB || process.env.DATABASE_URL;
if (!DB) {
  console.error("Manca DB (o DATABASE_URL) con la connection string Postgres.");
  process.exit(1);
}
const pool = new Pool({ connectionString: DB });
const dry = process.env.APPLY !== "1";

// Riferimenti anagrafici del Core (stagione corrente, regione Lazio, FIGC-LND).
const FEDERATION = "f0000000-0000-4000-8000-000000000002";
const REGION = "e0000000-0000-4000-8000-000000000001";
const PROVINCE = "d0000000-0000-4000-8000-000000000001";
const SEASON = "a45f5ed9-90be-498a-8f0b-479bc3d57dd5"; // 2026/2027 is_current

function uuid(ns, key) {
  const h = crypto.createHash("md5").update(`${ns}:${key}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
const norm = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

// Composizione ufficiale dei 6 gironi (CU65 Dilettanti 2026/2027).
const GIRONI = {
  A: ["Borgo Palidoro", "Bracciano Calcio", "Circolo Canottieri Roma", "Club Olimpico Romano",
      "Cortina Sporting Club", "Evergreen Civitavecchia", "Fortitudo Nepi Calcio", "Grifone Calcio",
      "Montefiascone", "Montespaccato", "Nuova Valle Aurelia", "Romaria", "Tolfa Calcio"],
  B: ["A Ferraris Villanova 1956", "Aniene Calcio", "Capitolina Calcio Roma", "Castel San Pietro Romano",
      "Città di Fiano", "F.C. Rieti 1936", "Gdc Ponte di Nona", "Ledesma Academy",
      "Pro Calcio Tor Sapienza", "San Lorenzo Calcio", "Santa Lucia Calcio", "Vicovaro", "Vigor Rignano Flaminio"],
  C: ["Accademia Calcio Frascati", "Accademy Giovannicastello", "Albalonga", "Atletico Monteporzio",
      "Borghesiana", "Città di Anagni Calcio", "Città di Olevano Calcio", "Colonna", "Consalvo",
      "Cynthia 1920", "Pol.Canarini 1926 Rdp", "Semprevisa", "Vis Artena", "Stelaudia"],
  D: ["Atletico Veroli", "Boville Ernica Calcio", "Cassino Calcio 1924", "Ceccano Calcio 1920",
      "Deportivo", "La Cantera", "Latina Scalo 2020", "Minturno Calcio 1936", "Montello Calcio",
      "Polisportiva Valcomino", "Real Sanvittorese", "Roccasecca T.San Tommaso", "Sporting Pontecorvo"],
  E: ["Academy Mundial F.C.", "Achillea 2002", "Atletico Torrenova 1986", "Autentica Roma",
      "Cvn Casal Bernocchi", "Football Jus", "Mysp", "Next Gen Lodigiani", "Pescatori Ostia",
      "Roma Team Sport Queens", "Saxa Flaminia Labaro", "Valle Martella Calcio", "Virtus Torre Maura",
      "Vis S. Maria delle Mole"],
  F: ["Academy Savio", "Academy T.T.T. Pro", "Accademia Torrenova", "Akkademy Aprilia", "Atletico Ardea",
      "G. Castello", "Garbatella 1920", "Nuova Tor Tre Teste", "O.M.C. Roma", "Polisportiva de Rossi Arl",
      "Stella Polare de la Salle", "Tevere Roma 1959", "Trigoria"],
};

// Duplicati OCR: nome-comunicato -> club_id esistente nel Core (riuso, niente nuovo club).
const CLUB_ALIAS = {
  "A Ferraris Villanova 1956": "e4a27a2f-b176-4627-83c8-81e359f82cb8", // A.F. Villanova
  "Saxa Flaminia Labaro": "1c734fa9-2543-4f2b-88fc-1b6a2f504247", // Saxa FLAM.LABARO
  "Vis S. Maria delle Mole": "51646aab-ade1-451e-8420-5c4dbae7ebe2", // Vis S.MARIA Mole
};

const compId = uuid("competition", "LAZ_U18_REGIONALE");

async function main() {
  const { rows: clubs } = await pool.query(`select id, canonical_name from clubs`);
  const byId = new Map(clubs.map((c) => [c.id, c]));
  const byNorm = new Map();
  for (const c of clubs) byNorm.set(norm(c.canonical_name), c);
  const findClub = (name) => {
    if (CLUB_ALIAS[name]) return byId.get(CLUB_ALIAS[name]) ?? { id: CLUB_ALIAS[name], canonical_name: name };
    const n = norm(name);
    const hit = byNorm.get(n);
    if (hit) return hit;
    for (const [k, c] of byNorm) if (k.length >= 6 && (k.includes(n) || n.includes(k))) return c;
    return null;
  };

  const plan = {
    competition: { id: compId, code: "U18_REGIONALE", name: "Under 18 Regionale", category: "U18 Regionale", level: "giovanile" },
    groups: [], newClubs: [], teams: [],
  };
  for (const [code, teams] of Object.entries(GIRONI)) {
    plan.groups.push({ id: uuid("cgroup", `U18_REGIONALE|${code}`), code, name: `Girone ${code}` });
    for (const tn of teams) {
      const club = findClub(tn);
      let clubId;
      if (club) clubId = club.id;
      else {
        clubId = uuid("club", norm(tn));
        if (!plan.newClubs.find((c) => c.id === clubId)) plan.newClubs.push({ id: clubId, name: tn });
      }
      plan.teams.push({ id: uuid("team", `${clubId}|U18_REGIONALE`), clubId, name: `${tn} U18 Regionale`, girone: code });
    }
  }

  console.log("=== Seed U18 Regionale ===");
  console.log(`Competizione: ${plan.competition.name} (${plan.competition.code})`);
  console.log(`Gironi: ${plan.groups.length} | Team: ${plan.teams.length} | Club nuovi: ${plan.newClubs.length}`);
  for (const c of plan.newClubs) console.log("   + " + c.name);

  if (dry) {
    console.log("\n[DRY-RUN] nessuna scrittura. APPLY=1 per applicare.");
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `insert into competitions (id, federation_id, region_id, code, name, category, level, gender)
       values ($1,$2,$3,$4,$5,$6,$7,'M') on conflict (id) do nothing`,
      [plan.competition.id, FEDERATION, REGION, plan.competition.code, plan.competition.name, plan.competition.category, plan.competition.level],
    );
    for (const g of plan.groups)
      await client.query(
        `insert into competition_groups (id, competition_id, season_id, province_id, code, name)
         values ($1,$2,$3,$4,$5,$6) on conflict (id) do nothing`,
        [g.id, plan.competition.id, SEASON, PROVINCE, g.code, g.name],
      );
    for (const c of plan.newClubs)
      await client.query(
        `insert into clubs (id, canonical_name, province_id, is_active) values ($1,$2,$3,true) on conflict (id) do nothing`,
        [c.id, c.name, PROVINCE],
      );
    for (const t of plan.teams)
      await client.query(
        `insert into teams (id, club_id, name, category, gender) values ($1,$2,$3,'U18','M') on conflict (id) do nothing`,
        [t.id, t.clubId, t.name],
      );
    for (const t of plan.teams) {
      const gid = plan.groups.find((g) => g.code === t.girone).id;
      await client.query(
        `insert into group_teams (id, group_id, team_id) values ($1,$2,$3) on conflict (group_id, team_id) do nothing`,
        [uuid("gteam", `${gid}|${t.id}`), gid, t.id],
      );
    }
    await client.query("commit");
    console.log("\nAPPLY OK: competizione, gironi, club, team e group_teams creati.");
  } catch (e) {
    await client.query("rollback");
    console.error("ROLLBACK:", e.message);
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

main().then(() => pool.end());
