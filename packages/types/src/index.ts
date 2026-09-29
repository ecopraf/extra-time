/**
 * Tipi del Football Data Core di EXTRA TIME.
 * Allineati allo schema PostgreSQL (db/schema.sql) e a docs/data-model.md.
 *
 * Gli `id` di Club, Team, Player e Match sono identificativi UUID condivisi con YFM.
 */

export type UUID = string;

export type Gender = "M" | "F" | "X";

export type MatchStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "postponed"
  | "suspended"
  | "cancelled";

export type MatchEventType =
  | "goal"
  | "own_goal"
  | "penalty_goal"
  | "penalty_missed"
  | "yellow_card"
  | "red_card"
  | "substitution"
  | "assist"
  | "other";

export type Foot = "destro" | "sinistro" | "entrambi";

export type NewsStatus = "draft" | "review" | "published" | "archived";

export type EntityType = "competition" | "group" | "team" | "player" | "match";

export type ScoutingSourceKind = "osservatore" | "societa" | "allenatore";

export interface Federation {
  id: UUID;
  code: string;
  name: string;
  level: string | null;
  parentId: UUID | null;
}

export interface Region {
  id: UUID;
  code: string;
  name: string;
  federationId: UUID | null;
}

export interface Province {
  id: UUID;
  regionId: UUID;
  code: string;
  name: string;
}

export interface Competition {
  id: UUID;
  federationId: UUID | null;
  regionId: UUID | null;
  code: string | null;
  name: string;
  category: string;
  level: string | null;
  gender: Gender;
}

export interface Season {
  id: UUID;
  label: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
}

export interface CompetitionGroup {
  id: UUID;
  competitionId: UUID;
  seasonId: UUID;
  provinceId: UUID | null;
  code: string | null;
  name: string;
}

export interface Club {
  id: UUID;
  canonicalName: string;
  legalName: string | null;
  provinceId: UUID | null;
  city: string | null;
  foundedYear: number | null;
  colors: string | null;
  isActive: boolean;
}

export interface ClubAlias {
  id: UUID;
  clubId: UUID;
  source: string;
  externalName: string;
  externalId: string | null;
}

export interface Team {
  id: UUID;
  clubId: UUID;
  name: string;
  category: string | null;
  gender: Gender;
}

export interface Player {
  id: UUID;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  birthYear: number | null;
  nationality: string | null;
  position: string | null;
  foot: Foot | null;
  heightCm: number | null;
}

export interface Match {
  id: UUID;
  groupId: UUID | null;
  seasonId: UUID | null;
  matchday: number | null;
  homeTeamId: UUID;
  awayTeamId: UUID;
  kickoffAt: string | null;
  venue: string | null;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  homeScoreHt: number | null;
  awayScoreHt: number | null;
}

export interface MatchEvent {
  id: UUID;
  matchId: UUID;
  teamId: UUID | null;
  playerId: UUID | null;
  relatedPlayerId: UUID | null;
  minute: number | null;
  extraMinute: number | null;
  type: MatchEventType;
  detail: string | null;
}

export interface Standing {
  id: UUID;
  groupId: UUID;
  teamId: UUID;
  position: number | null;
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
