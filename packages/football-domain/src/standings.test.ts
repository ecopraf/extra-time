import assert from "node:assert/strict";
import { test } from "node:test";
import type { Match } from "@extra-time/types";
import { computeStandings } from "./standings.js";

const teamA = "aaaaaaaa-0000-0000-0000-000000000001";
const teamB = "bbbbbbbb-0000-0000-0000-000000000002";
const teamC = "cccccccc-0000-0000-0000-000000000003";

function match(partial: Partial<Match>): Match {
  return {
    id: crypto.randomUUID(),
    groupId: null,
    seasonId: null,
    matchday: null,
    homeTeamId: teamA,
    awayTeamId: teamB,
    kickoffAt: null,
    venue: null,
    status: "finished",
    homeScore: 0,
    awayScore: 0,
    homeScoreHt: null,
    awayScoreHt: null,
    ...partial,
  };
}

test("vittoria e sconfitta: 3 e 0 punti, differenza reti", () => {
  const rows = computeStandings(
    [match({ homeTeamId: teamA, awayTeamId: teamB, homeScore: 3, awayScore: 1 })],
    { teamIds: [teamA, teamB] },
  );

  assert.equal(rows[0]!.teamId, teamA);
  assert.equal(rows[0]!.points, 3);
  assert.equal(rows[0]!.goalDiff, 2);
  assert.equal(rows[1]!.teamId, teamB);
  assert.equal(rows[1]!.points, 0);
  assert.equal(rows[1]!.goalDiff, -2);
});

test("pareggio: 1 punto a testa", () => {
  const rows = computeStandings(
    [match({ homeTeamId: teamA, awayTeamId: teamB, homeScore: 2, awayScore: 2 })],
    { teamIds: [teamA, teamB] },
  );
  assert.equal(rows[0]!.points, 1);
  assert.equal(rows[1]!.points, 1);
});

test("le partite non finite non contano", () => {
  const rows = computeStandings(
    [
      match({ status: "scheduled", homeScore: null, awayScore: null }),
      match({ status: "live", homeScore: 1, awayScore: 0 }),
    ],
    { teamIds: [teamA, teamB] },
  );
  assert.equal(rows[0]!.played, 0);
  assert.equal(rows[0]!.points, 0);
});

test("ordinamento per punti, poi differenza reti, poi gol fatti", () => {
  const rows = computeStandings(
    [
      // A batte B 2-0, A pareggia con C 1-1, B batte C 3-0
      match({ homeTeamId: teamA, awayTeamId: teamB, homeScore: 2, awayScore: 0 }),
      match({ homeTeamId: teamA, awayTeamId: teamC, homeScore: 1, awayScore: 1 }),
      match({ homeTeamId: teamB, awayTeamId: teamC, homeScore: 3, awayScore: 0 }),
    ],
    { teamIds: [teamA, teamB, teamC] },
  );

  // A: 4 pt (GF3 GS1 +2) | B: 3 pt (GF3 GS2 +1) | C: 1 pt (GF1 GS4 -3)
  assert.deepEqual(
    rows.map((r) => [r.teamId, r.points, r.goalDiff]),
    [
      [teamA, 4, 2],
      [teamB, 3, 1],
      [teamC, 1, -3],
    ],
  );
  assert.deepEqual(
    rows.map((r) => r.position),
    [1, 2, 3],
  );
});

test("penalizzazioni sottratte ai punti", () => {
  const rows = computeStandings(
    [match({ homeTeamId: teamA, awayTeamId: teamB, homeScore: 1, awayScore: 0 })],
    { teamIds: [teamA, teamB], penalties: { [teamA]: 2 } },
  );
  const a = rows.find((r) => r.teamId === teamA)!;
  assert.equal(a.points, 1); // 3 - 2
  assert.equal(a.pointsPenalty, 2);
});

test("una squadra senza partite compare con zero", () => {
  const rows = computeStandings([], { teamIds: [teamA, teamB, teamC] });
  assert.equal(rows.length, 3);
  assert.ok(rows.every((r) => r.played === 0 && r.points === 0));
});
