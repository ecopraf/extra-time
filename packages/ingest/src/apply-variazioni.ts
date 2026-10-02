/**
 * Applica le "variazioni al programma gare" alle partite del Core: aggiorna
 * kickoff_at (nuova data/ora) e venue (nuovo campo) della gara individuata per
 * (categoria → girone → squadre). Opzionalmente usa anche la giornata quando
 * disponibile, per disambiguare se la stessa coppia ricorre più volte.
 *
 * NON cambia lo status della gara e NON crea partite. Idempotente: se la gara
 * ha già quei valori, non viene contata come aggiornata. Le gare "da definire"
 * azzerano kickoff_at (gara rinviata senza nuova data).
 *
 * Riusa gli helper di matching di apply-programma-gare (sameTeam) e la stessa
 * risoluzione di gruppo tollerante usata altrove.
 */
import type { Variazione } from "./parse-variazioni";
import { sameTeam, type Queryable } from "./apply-programma-gare";

// Alias categoria coerenti col resto dell'ingest.
const CAT_ALIAS: Record<string, string[]> = {
  "U18 Regionale": ["U18 Elite"],
  "U19 Elite": ["U19 Regionale"],
  "U19 Regionale": ["U19 Elite"],
};

export interface ApplyVariazioniResult {
  input: number;
  updated: number;
  unchanged: number;
  notFoundGroup: number;
  notFoundMatch: number;
  ambiguous: number;
  misses: Variazione[];
}

export async function applyVariazioni(
  db: Queryable,
  variazioni: Variazione[],
  opts: { dry?: boolean } = {},
): Promise<ApplyVariazioniResult> {
  const dry = opts.dry ?? false;

  const { rows: groups } = await db.query<{ group_id: string; girone: string | null; category: string }>(
    `select g.id as group_id, g.code as girone, c.category
       from competition_groups g
       join competitions c on c.id = g.competition_id
       join seasons s on s.id = g.season_id and s.is_current`,
  );
  const groupIdByKey = new Map<string, string>();
  const groupsByCode = new Map<string, string[]>();
  for (const g of groups) {
    const code = (g.girone || "").toUpperCase();
    groupIdByKey.set(`${g.category}|${code}`, g.group_id);
    if (!groupsByCode.has(code)) groupsByCode.set(code, []);
    groupsByCode.get(code)!.push(g.group_id);
  }
  const resolveGroups = (categoria: string, girone: string): string[] => {
    const code = (girone || "").toUpperCase();
    const out = new Set<string>();
    const direct = groupIdByKey.get(`${categoria}|${code}`);
    if (direct) out.add(direct);
    for (const alt of CAT_ALIAS[categoria] || []) {
      const hit = groupIdByKey.get(`${alt}|${code}`);
      if (hit) out.add(hit);
    }
    return [...out];
  };

  type MatchRow = {
    id: string; matchday: number | null; home_name: string; away_name: string;
    kickoff_at: Date | string | null; venue: string | null;
  };
  const neededGroupIds = new Set<string>();
  for (const v of variazioni) for (const gid of resolveGroups(v.categoria, v.girone)) neededGroupIds.add(gid);
  const matchesByGroup = new Map<string, MatchRow[]>();
  for (const gid of neededGroupIds) {
    const { rows } = await db.query<MatchRow>(
      `select m.id, m.matchday, m.kickoff_at, m.venue,
              ch.canonical_name as home_name, ca.canonical_name as away_name
         from matches m
         join teams th on th.id = m.home_team_id join clubs ch on ch.id = th.club_id
         join teams ta on ta.id = m.away_team_id join clubs ca on ca.id = ta.club_id
        where m.group_id = $1`,
      [gid],
    );
    matchesByGroup.set(gid, rows);
  }

  const res: ApplyVariazioniResult = {
    input: variazioni.length, updated: 0, unchanged: 0, notFoundGroup: 0, notFoundMatch: 0, ambiguous: 0, misses: [],
  };

  for (const v of variazioni) {
    const gids = resolveGroups(v.categoria, v.girone);
    if (gids.length === 0) { res.notFoundGroup++; continue; }

    // Match: prima con giornata (se nota) + squadre, poi solo squadre.
    let cand: MatchRow[] = [];
    for (const gid of gids) {
      const matches = matchesByGroup.get(gid) || [];
      if (v.giornata != null) {
        const withDay = matches.filter((m) =>
          m.matchday === v.giornata && sameTeam(m.home_name, v.casa) && sameTeam(m.away_name, v.ospite));
        if (withDay.length) { cand = withDay; break; }
      }
    }
    if (cand.length === 0) {
      for (const gid of gids) {
        const matches = matchesByGroup.get(gid) || [];
        const any = matches.filter((m) => sameTeam(m.home_name, v.casa) && sameTeam(m.away_name, v.ospite));
        if (any.length) { cand = any; break; }
      }
    }
    if (cand.length === 0) { res.notFoundMatch++; res.misses.push(v); continue; }
    if (cand.length > 1) res.ambiguous++;
    const target = cand[0]!;

    // Calcola i nuovi valori.
    const newKickoff = v.daDefinire ? null : (v.dataIso ? `${v.dataIso} ${v.ora ?? "00:00"}:00+02` : undefined);
    const newVenue = v.campo ?? undefined;

    // Idempotenza: se nulla cambia, non aggiornare.
    const curKickoffIso = target.kickoff_at
      ? new Date(target.kickoff_at).toISOString()
      : null;
    const nextKickoffIso = newKickoff === undefined
      ? curKickoffIso
      : (newKickoff === null ? null : new Date(newKickoff).toISOString());
    const venueChanges = newVenue !== undefined && (target.venue ?? null) !== newVenue;
    const kickoffChanges = nextKickoffIso !== curKickoffIso;
    if (!venueChanges && !kickoffChanges) { res.unchanged++; continue; }

    if (!dry) {
      // Aggiorna solo i campi effettivamente forniti dalla variazione.
      if (newKickoff !== undefined && newVenue !== undefined) {
        await db.query(
          `update matches set kickoff_at = $2, venue = $3, updated_at = now() where id = $1`,
          [target.id, newKickoff, newVenue],
        );
      } else if (newKickoff !== undefined) {
        await db.query(
          `update matches set kickoff_at = $2, updated_at = now() where id = $1`,
          [target.id, newKickoff],
        );
      } else if (newVenue !== undefined) {
        await db.query(
          `update matches set venue = $2, updated_at = now() where id = $1`,
          [target.id, newVenue],
        );
      }
    }
    res.updated++;
  }
  return res;
}
