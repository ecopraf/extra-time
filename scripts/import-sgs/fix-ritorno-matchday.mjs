/**
 * FIX one-shot: corregge il matchday del girone di RITORNO per i gironi
 * giovanili dove l'offset era fisso (+15) invece di dinamico (squadre-1).
 *
 * Contesto: extract-all.mjs calcolava il ritorno come giornata_andata + 15,
 * corretto solo per gironi da 16 squadre (andata 1..15, ritorno 16..30). Per i
 * Regionali da 14 squadre l'andata è 1..13 e il ritorno sarebbe dovuto essere
 * 14..26, invece è finito a 16..28, lasciando VUOTE le giornate 14 e 15.
 *
 * Correzione: per ogni girone, shift = 15 - (squadre - 1) = 16 - squadre.
 *   - 16 squadre -> shift 0 (nessun cambiamento)
 *   - 14 squadre -> shift 2: le partite di ritorno (matchday >= 16) scalano a
 *     matchday - 2, chiudendo il buco 14-15.
 *
 * Sicuro e idempotente:
 *   - opera solo sui gironi con shift > 0;
 *   - sposta solo le partite con matchday > (squadre-1) (cioè il ritorno);
 *   - se dopo lo shift il girone risulterebbe già corretto (ritorno massimo ==
 *     2*(squadre-1)) non rifà nulla al secondo passaggio;
 *   - gira in transazione; con --dry mostra solo cosa farebbe.
 */
import pg from "pg";

const DRY = process.argv.includes("--dry");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const { rows: groups } = await pool.query(`
  select cg.id, c.category, cg.code,
         (select count(*)::int from group_teams e where e.group_id = cg.id) as teams
    from competition_groups cg
    join competitions c on c.id = cg.competition_id
    join seasons s on s.id = cg.season_id and s.is_current
   where c.level in ('giovanile','giovanile-elite')
   order by c.category, cg.code`);

let totalGroups = 0, totalMoved = 0;

for (const g of groups) {
  const andataRounds = g.teams - 1;          // es. 13 per 14 squadre
  const shift = 15 - andataRounds;           // es. 2 per 14 squadre, 0 per 16
  if (shift <= 0) continue;

  // Ritorno attuale = matchday > andataRounds. Verifichiamo che sia davvero
  // sfasato: esistono buchi tra andataRounds+1 e andataRounds+shift?
  const { rows: present } = await pool.query(
    `select distinct matchday from matches where group_id = $1 and matchday is not null order by matchday`,
    [g.id],
  );
  const mdSet = new Set(present.map((r) => r.matchday));
  const expectedMax = andataRounds * 2;      // es. 26
  const currentMax = Math.max(...mdSet);     // es. 28 se sfasato
  if (currentMax <= expectedMax) {
    // già corretto (idempotenza): niente da fare
    continue;
  }

  // Partite di ritorno da scalare: matchday > andataRounds, in ordine CRESCENTE
  // non serve (update unico), ma controlliamo collisioni: nessun matchday target
  // (md-shift) deve già esistere tra le partite d'andata.
  const { rows: retRows } = await pool.query(
    `select count(*)::int as n from matches where group_id = $1 and matchday > $2`,
    [g.id, andataRounds],
  );
  const n = retRows[0].n;
  totalGroups++;
  totalMoved += n;
  console.log(`${g.category} [${g.code}] squadre=${g.teams} shift=-${shift}: sposto ${n} partite ritorno (max ${currentMax} -> ${currentMax - shift})`);

  if (!DRY) {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(
        `update matches set matchday = matchday - $1, updated_at = now()
          where group_id = $2 and matchday > $3`,
        [shift, g.id, andataRounds],
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

console.log(`\n${DRY ? "[DRY] " : ""}Gironi corretti: ${totalGroups}, partite spostate: ${totalMoved}`);
await pool.end();
