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

function firstOrThrow<T>(rows: T[], message: string): T {
  const row = rows[0];
  if (!row) throw new Error(message);
  return row;
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
        and trim(both '-' from regexp_replace(lower(c.category), '[^a-z0-9]+', '-', 'g')) = lower($3)
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
      where g.province_id = $1
        and trim(both '-' from regexp_replace(lower(c.category), '[^a-z0-9]+', '-', 'g')) = lower($2)
      order by g.code nulls last, g.name`,
    [provinceId, category],
  );
  return rows;
}

// --- Scritture (backoffice) ------------------------------------------------

export interface NewGroup {
  competitionId: string;
  seasonId: string;
  provinceId: string | null;
  code: string | null;
  name: string;
}

export async function createGroup(input: NewGroup): Promise<string> {
  const { rows } = await getPool().query<{ id: string }>(
    `insert into competition_groups (competition_id, season_id, province_id, code, name)
     values ($1, $2, $3, $4, $5)
     returning id`,
    [
      input.competitionId,
      input.seasonId,
      input.provinceId,
      input.code,
      input.name,
    ],
  );
  return firstOrThrow(rows, "Creazione girone non riuscita.").id;
}

export interface NewClub {
  canonicalName: string;
  provinceId: string | null;
  city: string | null;
}

export async function createClub(input: NewClub): Promise<string> {
  const { rows } = await getPool().query<{ id: string }>(
    `insert into clubs (canonical_name, province_id, city)
     values ($1, $2, $3) returning id`,
    [input.canonicalName, input.provinceId, input.city],
  );
  return firstOrThrow(rows, "Creazione club non riuscita.").id;
}

export interface NewTeam {
  clubId: string;
  name: string;
  category: string;
}

export async function createTeam(input: NewTeam): Promise<string> {
  const { rows } = await getPool().query<{ id: string }>(
    `insert into teams (club_id, name, category) values ($1, $2, $3) returning id`,
    [input.clubId, input.name, input.category],
  );
  return firstOrThrow(rows, "Creazione squadra non riuscita.").id;
}

export async function enrollTeam(groupId: string, teamId: string): Promise<void> {
  await getPool().query(
    `insert into group_teams (group_id, team_id) values ($1, $2)
     on conflict do nothing`,
    [groupId, teamId],
  );
}

export interface NewMatch {
  groupId: string;
  seasonId: string | null;
  matchday: number | null;
  homeTeamId: string;
  awayTeamId: string;
  kickoffAt: string | null;
  venue: string | null;
}

export async function createMatch(input: NewMatch): Promise<string> {
  const { rows } = await getPool().query<{ id: string }>(
    `insert into matches
       (group_id, season_id, matchday, home_team_id, away_team_id, kickoff_at, venue, status)
     values ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
     returning id`,
    [
      input.groupId,
      input.seasonId,
      input.matchday,
      input.homeTeamId,
      input.awayTeamId,
      input.kickoffAt,
      input.venue,
    ],
  );
  return firstOrThrow(rows, "Creazione partita non riuscita.").id;
}

/** Registra il risultato finale di una partita e la marca come `finished`. */
export async function recordResult(
  matchId: string,
  homeScore: number,
  awayScore: number,
): Promise<void> {
  await getPool().query(
    `update matches
        set home_score = $2, away_score = $3, status = 'finished', updated_at = now()
      where id = $1`,
    [matchId, homeScore, awayScore],
  );
}

export interface CompetitionOption {
  id: string;
  name: string;
  category: string;
}

export async function listCompetitions(): Promise<CompetitionOption[]> {
  const { rows } = await getPool().query<CompetitionOption>(
    `select id, name, category from competitions order by category, name`,
  );
  return rows;
}

export interface TeamOption {
  id: string;
  name: string;
}

export async function listTeams(): Promise<TeamOption[]> {
  const { rows } = await getPool().query<TeamOption>(
    `select t.id, t.name from teams t order by t.name`,
  );
  return rows;
}

export async function getCurrentSeasonId(): Promise<string | null> {
  const { rows } = await getPool().query<{ id: string }>(
    `select id from seasons where is_current order by start_date desc limit 1`,
  );
  return rows[0]?.id ?? null;
}

export interface AdminGroupRow {
  id: string;
  name: string;
  code: string | null;
  competitionName: string;
  category: string;
  provinceName: string | null;
}

/** Tutti i gironi della stagione corrente, per le select del backoffice. */
export async function listAllGroupsCurrentSeason(): Promise<AdminGroupRow[]> {
  const { rows } = await getPool().query<AdminGroupRow>(
    `select g.id, g.name, g.code,
            c.name as "competitionName", c.category,
            p.name as "provinceName"
       from competition_groups g
       join competitions c on c.id = g.competition_id
       join seasons s on s.id = g.season_id and s.is_current
       left join provinces p on p.id = g.province_id
      order by c.category, p.name nulls last, g.name`,
  );
  return rows;
}

export async function listAllProvinces(): Promise<
  Array<Province & { regionName: string }>
> {
  const { rows } = await getPool().query<Province & { regionName: string }>(
    `select p.id, p.code, p.name, r.name as "regionName"
       from provinces p join regions r on r.id = p.region_id
      order by r.name, p.name`,
  );
  return rows;
}

export interface AdminMatchRow {
  id: string;
  matchday: number | null;
  kickoffAt: string | null;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeName: string;
  awayName: string;
  groupName: string;
}

/** Partite non concluse della stagione corrente, da programmare o refertare. */
export async function listOpenMatchesCurrentSeason(): Promise<AdminMatchRow[]> {
  const { rows } = await getPool().query<
    Omit<AdminMatchRow, "kickoffAt" | "homeScore" | "awayScore"> & {
      kickoffAt: Date | null;
      homeScore: number | null;
      awayScore: number | null;
    }
  >(
    `select m.id, m.matchday,
            m.kickoff_at as "kickoffAt", m.status,
            m.home_score as "homeScore", m.away_score as "awayScore",
            ch.canonical_name as "homeName",
            ca.canonical_name as "awayName",
            g.name as "groupName"
       from matches m
       join competition_groups g on g.id = m.group_id
       join seasons s on s.id = g.season_id and s.is_current
       join teams th on th.id = m.home_team_id
       join clubs ch on ch.id = th.club_id
       join teams ta on ta.id = m.away_team_id
       join clubs ca on ca.id = ta.club_id
      where m.status <> 'finished'
      order by m.matchday nulls last, m.kickoff_at nulls last`,
  );
  return rows.map((row) => ({
    ...row,
    kickoffAt: row.kickoffAt ? row.kickoffAt.toISOString() : null,
  }));
}


export interface PortalGroupRow {
  groupId: string;
  groupCode: string | null;
  groupName: string;
  competitionName: string;
  category: string;
  provinceCode: string | null;
  provinceName: string | null;
  regionCode: string | null;
  regionName: string | null;
}

/** Tutti i gironi della stagione corrente con il percorso territoriale completo. */
export async function listGroupsForPortal(): Promise<PortalGroupRow[]> {
  const { rows } = await getPool().query<PortalGroupRow>(
    `select g.id as "groupId", g.code as "groupCode", g.name as "groupName",
            c.name as "competitionName", c.category,
            p.code as "provinceCode", p.name as "provinceName",
            r.code as "regionCode", r.name as "regionName"
       from competition_groups g
       join competitions c on c.id = g.competition_id
       join seasons s on s.id = g.season_id and s.is_current
       left join provinces p on p.id = g.province_id
       left join regions r on r.id = p.region_id
      order by c.category, r.name nulls last, p.name nulls last,
               g.code nulls last, g.name`,
  );
  return rows;
}

export interface PortalMatchRow {
  id: string;
  matchday: number | null;
  kickoffAt: string | null;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeName: string;
  awayName: string;
  groupCode: string | null;
  groupName: string;
  category: string;
  provinceCode: string | null;
  regionCode: string | null;
}

const PORTAL_MATCH_SELECT = `
  select m.id, m.matchday, m.kickoff_at as "kickoffAt", m.status,
         m.home_score as "homeScore", m.away_score as "awayScore",
         ch.canonical_name as "homeName", ca.canonical_name as "awayName",
         g.code as "groupCode", g.name as "groupName",
         c.category, p.code as "provinceCode", r.code as "regionCode"
    from matches m
    join competition_groups g on g.id = m.group_id
    join competitions c on c.id = g.competition_id
    join seasons s on s.id = g.season_id and s.is_current
    left join provinces p on p.id = g.province_id
    left join regions r on r.id = p.region_id
    join teams th on th.id = m.home_team_id
    join clubs ch on ch.id = th.club_id
    join teams ta on ta.id = m.away_team_id
    join clubs ca on ca.id = ta.club_id`;

function toPortalMatches(
  rows: Array<Omit<PortalMatchRow, "kickoffAt"> & { kickoffAt: Date | null }>,
): PortalMatchRow[] {
  return rows.map((row) => ({
    ...row,
    kickoffAt: row.kickoffAt ? row.kickoffAt.toISOString() : null,
  }));
}

/** Ultimi risultati della stagione corrente, dal più recente. */
export async function listRecentResults(limit = 12): Promise<PortalMatchRow[]> {
  const { rows } = await getPool().query<
    Omit<PortalMatchRow, "kickoffAt"> & { kickoffAt: Date | null }
  >(
    `${PORTAL_MATCH_SELECT}
      where m.status = 'finished'
      order by m.kickoff_at desc nulls last, m.matchday desc nulls last
      limit $1`,
    [limit],
  );
  return toPortalMatches(rows);
}

/** Partite in corso: alimentano la sezione LIVE. */
export async function listLiveMatches(): Promise<PortalMatchRow[]> {
  const { rows } = await getPool().query<
    Omit<PortalMatchRow, "kickoffAt"> & { kickoffAt: Date | null }
  >(
    `${PORTAL_MATCH_SELECT}
      where m.status = 'live'
      order by m.kickoff_at asc nulls last`,
  );
  return toPortalMatches(rows);
}

/** Prossime partite in programma della stagione corrente. */
export async function listUpcomingMatches(limit = 12): Promise<PortalMatchRow[]> {
  const { rows } = await getPool().query<
    Omit<PortalMatchRow, "kickoffAt"> & { kickoffAt: Date | null }
  >(
    `${PORTAL_MATCH_SELECT}
      where m.status = 'scheduled'
        and (m.kickoff_at is null or m.kickoff_at >= now())
      order by m.kickoff_at asc nulls last,
               coalesce(nullif(regexp_replace(c.category, '\\D', '', 'g'), '')::int, 0) desc,
               case
                 when c.category ilike '%nazional%' then 0
                 when c.category ilike '%elite%' then 1
                 when c.category ilike '%regional%' then 2
                 when c.category ilike '%provincial%' then 3
                 else 4
               end asc,
               g.code asc nulls last,
               m.matchday asc nulls last
      limit $1`,
    [limit],
  );
  return toPortalMatches(rows);
}

export interface PortalCounts {
  regions: number;
  groups: number;
  teams: number;
  matches: number;
}

/** Contatori per la testata del portale. */
export async function getPortalCounts(): Promise<PortalCounts> {
  const { rows } = await getPool().query<PortalCounts>(
    `select
       (select count(*)::int from regions) as regions,
       (select count(*)::int from competition_groups g
          join seasons s on s.id = g.season_id and s.is_current) as groups,
       (select count(*)::int from teams) as teams,
       (select count(*)::int from matches m
          join competition_groups g on g.id = m.group_id
          join seasons s on s.id = g.season_id and s.is_current) as matches`,
  );
  return rows[0] ?? { regions: 0, groups: 0, teams: 0, matches: 0 };
}

export async function closePool(): Promise<void> {
  await pool?.end();
  pool = undefined;
}