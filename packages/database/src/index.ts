/**
 * Accesso al Football Data Core (PostgreSQL).
 *
 * Contiene solo query e mapping verso i tipi di @extra-time/types.
 * La logica di business sta in @extra-time/football-domain.
 * Lo schema di riferimento è db/schema.sql.
 */

import { Pool, type PoolConfig } from "pg";
import type { Match } from "@extra-time/types";

export const SCHEMA_PATH = "db/schema.sql";
export const SMOKE_TEST_PATH = "db/smoke_test.sql";

let pool: Pool | undefined;

function configFromEnv(): PoolConfig {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) return { connectionString };
  return {
    host: process.env.PGHOST ?? "/tmp",
    port: Number(process.env.PGPORT ?? 5433),
    user: process.env.PGUSER ?? "postgres",
    database: process.env.PGDATABASE ?? "postgres",
  };
}

export function getPool(): Pool {
  pool ??= new Pool(configFromEnv());
  return pool;
}

interface MatchRow {
  id: string;
  group_id: string | null;
  season_id: string | null;
  matchday: number | null;
  home_team_id: string;
  away_team_id: string;
  kickoff_at: Date | null;
  venue: string | null;
  status: Match["status"];
  home_score: number | null;
  away_score: number | null;
  home_score_ht: number | null;
  away_score_ht: number | null;
}

function toMatch(row: MatchRow): Match {
  return {
    id: row.id,
    groupId: row.group_id,
    seasonId: row.season_id,
    matchday: row.matchday,
    homeTeamId: row.home_team_id,
    awayTeamId: row.away_team_id,
    kickoffAt: row.kickoff_at ? row.kickoff_at.toISOString() : null,
    venue: row.venue,
    status: row.status,
    homeScore: row.home_score,
    awayScore: row.away_score,
    homeScoreHt: row.home_score_ht,
    awayScoreHt: row.away_score_ht,
  };
}

export async function listMatchesByGroup(groupId: string): Promise<Match[]> {
  const { rows } = await getPool().query<MatchRow>(
    `select id, group_id, season_id, matchday, home_team_id, away_team_id,
            kickoff_at, venue, status, home_score, away_score,
            home_score_ht, away_score_ht
       from matches
      where group_id = $1
      order by kickoff_at nulls last, matchday nulls last`,
    [groupId],
  );
  return rows.map(toMatch);
}

export interface GroupSummary {
  groupId: string;
  groupName: string;
  competitionName: string;
  seasonLabel: string;
}

export async function getGroupSummary(
  groupId: string,
): Promise<GroupSummary | null> {
  const { rows } = await getPool().query<{
    group_id: string;
    group_name: string;
    competition_name: string;
    season_label: string;
  }>(
    `select g.id as group_id, g.name as group_name,
            c.name as competition_name, s.label as season_label
       from competition_groups g
       join competitions c on c.id = g.competition_id
       join seasons s on s.id = g.season_id
      where g.id = $1`,
    [groupId],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    groupId: row.group_id,
    groupName: row.group_name,
    competitionName: row.competition_name,
    seasonLabel: row.season_label,
  };
}

export interface ClubBasic {
  id: string;
  name: string;
}

export async function listClubsInGroup(groupId: string): Promise<ClubBasic[]> {
  const { rows } = await getPool().query<{ id: string; name: string }>(
    `select distinct c.id, c.canonical_name as name
       from group_teams gt
       join teams t on t.id = gt.team_id
       join clubs c on c.id = t.club_id
      where gt.group_id = $1
      order by c.canonical_name`,
    [groupId],
  );
  return rows;
}

/** Mappa teamId → nome del club, utile per etichette e ordinamenti. */
export async function getTeamNames(
  teamIds: string[],
): Promise<Record<string, string>> {
  if (teamIds.length === 0) return {};
  const { rows } = await getPool().query<{ id: string; name: string }>(
    `select t.id, c.canonical_name as name
       from teams t join clubs c on c.id = t.club_id
      where t.id = any($1::uuid[])`,
    [teamIds],
  );
  return Object.fromEntries(rows.map((r) => [r.id, r.name]));
}

export async function closePool(): Promise<void> {
  await pool?.end();
  pool = undefined;
}
