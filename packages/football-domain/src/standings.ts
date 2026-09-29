import type { Match, Standing, UUID } from "@extra-time/types";

export interface StandingRow {
  teamId: UUID;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  pointsPenalty: number;
}

/**
 * Calcola la classifica di un girone a partire dai risultati.
 * La classifica salvata a DB è un valore derivato: questa funzione è la fonte di verità.
 *
 * Regole (calcio italiano, semplificate):
 *  - vittoria 3 punti, pareggio 1, sconfitta 0
 *  - ordinamento: punti, differenza reti, gol fatti, nome squadra (criterio stabile)
 *  - le partite non `finished` senza risultato non contano
 */
export function computeStandings(
  matches: Match[],
  options: {
    teamIds?: UUID[];
    penalties?: Record<UUID, number>;
  } = {},
): StandingRow[] {
  const rows = new Map<UUID, StandingRow>();

  const ensure = (teamId: UUID): StandingRow => {
    let row = rows.get(teamId);
    if (!row) {
      row = {
        teamId,
        position: 0,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0,
        pointsPenalty: 0,
      };
      rows.set(teamId, row);
    }
    return row;
  };

  for (const teamId of options.teamIds ?? []) ensure(teamId);

  for (const match of matches) {
    const { homeScore, awayScore, homeTeamId, awayTeamId, status } = match;
    if (status !== "finished" || homeScore === null || awayScore === null) continue;

    const home = ensure(homeTeamId);
    const away = ensure(awayTeamId);

    home.played += 1;
    away.played += 1;
    home.goalsFor += homeScore;
    home.goalsAgainst += awayScore;
    away.goalsFor += awayScore;
    away.goalsAgainst += homeScore;

    if (homeScore > awayScore) {
      home.won += 1;
      away.lost += 1;
      home.points += 3;
    } else if (homeScore < awayScore) {
      away.won += 1;
      home.lost += 1;
      away.points += 3;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  const penalties = options.penalties ?? {};
  for (const row of rows.values()) {
    row.pointsPenalty = penalties[row.teamId] ?? 0;
    row.points -= row.pointsPenalty;
    row.goalDiff = row.goalsFor - row.goalsAgainst;
  }

  const ordered = [...rows.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor ||
      a.teamId.localeCompare(b.teamId),
  );

  ordered.forEach((row, index) => {
    row.position = index + 1;
  });

  return ordered;
}

/** Converte le righe di classifica nel formato persistito (`standings`). */
export function toStandingsRows(
  groupId: UUID,
  rows: StandingRow[],
): Array<Omit<Standing, "id">> {
  return rows.map((row) => ({
    groupId,
    teamId: row.teamId,
    position: row.position,
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDiff: row.goalDiff,
    points: row.points,
    pointsPenalty: row.pointsPenalty,
  }));
}
