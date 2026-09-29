/**
 * Accesso al Football Data Core (PostgreSQL).
 *
 * Solo query e mapping verso i tipi di @extra-time/types.
 * La logica di business sta in @extra-time/football-domain.
 * Lo schema è versionato in db/migrations (vedi scripts/migrate.mjs).
 */

import { Pool, type PoolConfig } from "pg";
import type { Match } from "@extra-time/types";

export const MIGRATIONS_DIR = "db/migrations";
export const SEEDS_DIR = "db/seeds";
export const SMOKE_TEST_PATH = "db/smoke_test.sql";

let pool: Pool | undefined;

function configFromEnv(): PoolConfig {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) return { connectionString };
  return {
    host: process.env.PGHOST ?? "/tmp",
    port: Number(process.env.PGPORT ?? 5433),
    user: process.env.PGUSER ?? "postgres",
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE ?? "postgres",
  };
}

export function getPool(): Pool {
  pool ??= new Pool(configFromEnv());
  return pool;
}

// --- Territorio ------------------------------------------------------------

export interface Region {
  id: string;
  code: string;
  name: string;
}

export interface Province {
  id: string;
  code: string;
  name: string;
}

export async function listRegions(): Promise<Region[]> {
  const { rows } = await getPool().query<Region>(
    `select id, code, name from regions order by name`,
  );
  return rows;
}

export async function getRegionByCode(code: string): Promise<Region | null> {
  const { rows } = await getPool().query<Region>(
    `select id, code, name from regions where code = $1`,
    [code],
  );
  return rows[0] ?? null;
}

export async function listProvincesByRegion(regionId: string): Promise<Province[]> {
  const { rows } = await getPool().query<Province>(
    `select id, code, name from provinces where region_id = $1 order by name`,
    [regionId],
  );
  return rows;
}

export async function getProvinceByCode(code: string): Promise<Province | null> {
  const { rows } = await getPool().query<Province>(
    `select id, code, name from provinces where code = $1`,
    [code],
  );
  return rows[0] ?? null;
}

// --- Competizioni e gironi -------------------------------------------------

export interface Competition {
  id: string;
  code: string | null;
  name: string;
  category: string;
  level: string | null;
}

/** Competizioni che hanno almeno un girone nella stagione corrente della provincia. */
export async function listCompetitionsForProvince(
  provinceId: string,
): Promise<Competition[]> {
  const { rows } = await getPool().query<Competition>(
    `select distinct c.id, c.code, c.name, c.category, c.level
       from competitions c
       join competition_groups g on g.competition_id = c.id
       join seasons s on s.id = g.season_id and s.is_current
      where g.province_id = $1
      order by c.category, c.name`,
    [provinceId],
  );
  return rows;
}

export interface GroupSummary {
  groupId: string;
  groupCode: string | null;
  groupName: string;
  competitionId: string;
  competitionName: string;
  competitionCategory: string;
  seasonLabel: string;
  provinceId: string | null;
  provinceCode: string | null;
  provinceName: string | null;
  regionCode: string | null;
  regionName: string | null;
}

export async function getGroup(groupId: string): Promise<GroupSummary | null> {
  const { rows } = await getPool().query<GroupSummary>(
    `select g.id as "groupId", g.code as "groupCode", g.name as "groupName",
            c.id as "competitionId", c.name as "competitionName",
            c.category as "competitionCategory",
            s.label as "seasonLabel",
            p.id as "provinceId", p.code as "provinceCode", p.name as "provinceName",
            r.code as "regionCode", r.name as "regionName"
       from competition_groups g
       join competitions c on c.id = g.competition_id
       join seasons s on s.id = g.season_id
       left join provinces p on p.id = g.province_id
       left join regions r on r.id = p.region_id
      where g.id = $1`,
    [groupId],
  );
  return rows[0] ?? null;
}

export interface GroupListItem {
  id: string;
  name: string;
  code: string | null;
}

export async function listGroupsForCompetition(
  competitionId: string,
): Promise<GroupListItem[]> {
  const { rows } = await getPool().query<GroupListItem>(
    `select g.id, g.name, g.code
       from competition_groups g
       join seasons s on s.id = g.season_id and s.is_current
      where g.competition_id = $1
      order by g.code nulls last, g.name`,
    [competitionId],
  );
  return rows;
}

// --- Squadre e partite -----------------------------------------------------

export interface ClubBasic {
  id: string;
  name: string;
}

export async function listClubsInGroup(groupId: string): Promise<ClubBasic[]> {
  const { rows } = await getPool().query<ClubBasic>(
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

/** Mappa teamId -> nome del club, per etichette e ordinamenti. */
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

export interface GroupTeams {
  teamIds: string[];
  names: Record<string, string>;
}

/** Squadre iscritte al girone con i nomi, nell'ordine alfabetico. */
export async function getGroupTeams(groupId: string): Promise<GroupTeams> {
  const { rows } = await getPool().query<{ id: string; name: string }>(
    `select t.id, c.canonical_name as name
       from group_teams gt
       join teams t on t.id = gt.team_id
       join clubs c on c.id = t.club_id
      where gt.group_id = $1
      order by c.canonical_name`,
    [groupId],
  );
  return {
    teamIds: rows.map((r) => r.id),
    names: Object.fromEntries(rows.map((r) => [r.id, r.name])),
  };
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
      order by matchday nulls last, kickoff_at nulls last`,
    [groupId],
  );
  return rows.map(toMatch);
}

export async function getMatch(id: string): Promise<Match | null> {
  const { rows } = await getPool().query<MatchRow>(
    `select id, group_id, season_id, matchday, home_team_id, away_team_id,
            kickoff_at, venue, status, home_score, away_score,
            home_score_ht, away_score_ht
       from matches where id = $1`,
    [id],
  );
  return rows[0] ? toMatch(rows[0]) : null;
}

export interface ScorerStat {
  playerId: string | null;
  playerName: string;
  teamId: string | null;
  goals: number;
}

/** Capocannonieri del girone: gol contati dagli eventi delle partite concluse. */
export async function listTopScorersByGroup(
  groupId: string,
  limit = 10,
): Promise<ScorerStat[]> {
  const { rows } = await getPool().query<ScorerStat>(
    `select e.player_id as "playerId",
            coalesce(p.first_name || ' ' || p.last_name, 'Sconosciuto') as "playerName",
            e.team_id as "teamId",
            count(*)::int as goals
       from match_events e
       join matches m on m.id = e.match_id
       left join players p on p.id = e.player_id
      where m.group_id = $1
        and m.status = 'finished'
        and e.type in ('goal', 'penalty_goal')
      group by e.player_id, p.first_name, p.last_name, e.team_id
      order by goals desc, "playerName"
      limit $2`,
    [groupId, limit],
  );
  return rows;
}


// --- Risoluzione per URL leggibili ----------------------------------------

/**
 * Trova il girone della stagione corrente a partire da:
 * regione (codice), provincia (codice), categoria e codice girone.
 * Usato dalle rotte pubbliche tipo /lazio/roma/u15/a.
 */
export async function resolveGroup(params: {
  regionCode: string;
  provinceCode: string;
  category: string;
  groupCode: string;
}): Promise<GroupSummary | null> {
  const { rows } = await getPool().query<{ id: string }>(
    `select g.id
       from competition_groups g
       join competitions c on c.id = g.competition_id
       join seasons s on s.id = g.season_id and s.is_current
       join provinces p on p.id = g.province_id
       join regions r on r.id = p.region_id
      where r.code = $1 and p.code = $2
        and lower(replace(c.category, ' ', '-')) = lower($3)
        and lower(coalesce(g.code, '')) = lower($4)
      order by g.name
      limit 1`,
    [params.regionCode, params.provinceCode, params.category, params.groupCode],
  );
  return rows[0] ? getGroup(rows[0].id) : null;
}

/** Elenco gironi della stagione corrente per provincia e categoria. */
export async function listGroupsByProvinceCategory(
  provinceId: string,
  category: string,
): Promise<Array<GroupListItem & { competitionName: string }>> {
  const { rows } = await getPool().query<
    GroupListItem & { competitionName: string }
  >(
    `select g.id, g.name, g.code, c.name as "competitionName"
       from competition_groups g
       join competitions c on c.id = g.competition_id
       join seasons s on s.id = g.season_id and s.is_current
      where g.province_id = $1 and lower(c.category) = lower($2)
      order by g.code nulls last, g.name`,
    [provinceId, category],
  );
  return rows;
}

export async function closePool(): Promise<void> {
  await pool?.end();
  pool = undefined;
}