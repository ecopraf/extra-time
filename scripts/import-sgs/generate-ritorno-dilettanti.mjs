/**
 * Genera il girone di RITORNO per i campionati DILETTANTI, che dalle brochure
 * LND arrivano con la sola ANDATA.
 *
 * Per ogni partita d'andata di un girone dilettantistico crea la gara di
 * ritorno a specchio:
 *   - squadre invertite (casa <-> ospite)
 *   - matchday = matchday_andata + (giornate d'andata del girone)
 *     dove "giornate d'andata" = max(matchday) attuale del girone (robusto sia
 *     per gironi pari sia dispari: 15 squadre -> 15 giornate d'andata).
 *   - kickoff_at = NULL (data da definire; verrà riempita dai programma gare)
 *   - status = 'scheduled'
 *
 * ID deterministico con namespace dedicato "match-ritorno" basato sull'id DB
 * dell'andata: idempotente (ON CONFLICT (id) DO NOTHING), non collide con
 * l'andata né con eventuali import futuri.
 *
 * Sicuro: non tocca le partite d'andata; opera solo sui gironi dilettanti che
 * NON hanno già un ritorno (max matchday <= giornate d'andata). Con --dry
 * mostra solo cosa farebbe.
 */
import pg from "pg";
import crypto from "node:crypto";

const DRY = process.argv.includes("--dry");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function uuidFrom(ns, key) {
  const h = crypto.createHash("md5").update(`${ns}:${key}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

const { rows: groups } = await pool.query(`
  select cg.id, c.category, cg.code, cg.season_id,
         (select count(*)::int from group_teams e where e.group_id = cg.id) as teams
    from competition_groups cg
    join competitions c on c.id = cg.competition_id
    join seasons s on s.id = cg.season_id and s.is_current
   where c.level = 'dilettantistico'
   order by c.category, cg.code`);

let totGroups = 0, totCreated = 0;

for (const g of groups) {
  // Carica TUTTE le partite esistenti del girone. L'andata è l'insieme delle
  // partite che NON sono generate come ritorno; identifichiamo i ritorni dal
  // loro id deterministico (namespace "match-ritorno"). Così la detection è
  // idempotente a prescindere dal max(matchday) corrente (che dopo la
  // generazione raddoppia).
  const { rows: all } = await pool.query(
    `select id, matchday, home_team_id, away_team_id
       from matches where group_id = $1 and matchday is not null
       order by matchday, id`,
    [g.id],
  );
  if (all.length === 0) continue;

  const existingIds = new Set(all.map((m) => m.id));
  // Andata = partite il cui id NON è un id-ritorno di un'altra partita del
  // girone. In pratica: una partita è "andata" se nessun'altra partita ha id
  // uuidFrom("match-ritorno", suo_id) presente — ma più semplicemente: le
  // partite d'andata sono quelle per cui uuidFrom("match-ritorno", id) NON è
  // esso stesso già un id esistente generato da un'altra. Identifichiamo
  // l'andata come le partite che non sono il ritorno di nessuna: cioè quelle
  // il cui id non compare come valore uuidFrom su un'altra. Dato che i ritorni
  // sono derivati dagli id d'andata, l'andata è il complemento dei ritorni.
  const retIdToSource = new Map();
  for (const m of all) retIdToSource.set(uuidFrom("match-ritorno", m.id), m.id);
  // un id è "di ritorno già generato" se è presente tra gli esistenti ED è
  // valore di uuidFrom di un'altra partita esistente.
  const alreadyReturnIds = new Set(
    [...existingIds].filter((id) => retIdToSource.has(id)),
  );
  // andata = esistenti che non sono ritorni già generati
  const andata = all.filter((m) => !alreadyReturnIds.has(m.id));
  // giornate d'andata = max matchday tra le sole partite d'andata
  const andataRounds = andata.reduce((mx, m) => Math.max(mx, m.matchday), 0);
  if (!andataRounds) continue;

  const values = [];
  for (const m of andata) {
    const id = uuidFrom("match-ritorno", m.id);
    if (existingIds.has(id)) continue; // ritorno già presente per questa gara
    const retMd = m.matchday + andataRounds;
    // specchio: casa<->ospite, nessuna data, nessun campo (verrà dai programma gare)
    values.push({ id, groupId: g.id, seasonId: g.season_id, md: retMd, home: m.away_team_id, away: m.home_team_id });
  }
  if (values.length === 0) continue; // tutto già generato: idempotenza

  totGroups++;
  totCreated += values.length;
  console.log(`${g.category} [${g.code}] squadre=${g.teams} andata=${andataRounds}gg: creo ${values.length} partite ritorno (MD ${andataRounds + 1}..${andataRounds * 2})`);

  if (!DRY) {
    const client = await pool.connect();
    try {
      await client.query("begin");
      // insert in blocco con unnest
      await client.query(
        `insert into matches (id, group_id, season_id, matchday, home_team_id, away_team_id, kickoff_at, status, home_score, away_score)
         select t.id, t.group_id, t.season_id, t.matchday, t.home_team_id, t.away_team_id,
                null::timestamptz, 'scheduled', null::int, null::int
           from unnest(
             $1::uuid[], $2::uuid[], $3::uuid[], $4::int[], $5::uuid[], $6::uuid[]
           ) as t(id, group_id, season_id, matchday, home_team_id, away_team_id)
         on conflict (id) do nothing`,
        [
          values.map((v) => v.id),
          values.map((v) => v.groupId),
          values.map((v) => v.seasonId),
          values.map((v) => v.md),
          values.map((v) => v.home),
          values.map((v) => v.away),
        ],
      );
      await client.query("commit");
    } catch (e) {
      await client.query("rollback");
      throw e;
    } finally {
      client.release();
    }
  }
}

console.log(`\n${DRY ? "[DRY] " : ""}Gironi dilettanti con ritorno generato: ${totGroups}, partite create: ${totCreated}`);
await pool.end();
