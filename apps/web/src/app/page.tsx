import type { Match } from "@extra-time/types";
import { computeStandings } from "@extra-time/football-domain";

// Dati dimostrativi: la classifica mostrata è calcolata dalla logica del core,
// non hardcoded. Stessa logica di db/smoke_test.sql.
const teams = {
  albalonga: "00000000-0000-0000-0000-000000000021",
  frascati: "00000000-0000-0000-0000-000000000022",
} as const;

const names: Record<string, string> = {
  [teams.albalonga]: "Albalonga U15",
  [teams.frascati]: "LVPA Frascati U15",
};

const matches: Match[] = [
  {
    id: "00000000-0000-0000-0000-000000000041",
    groupId: "00000000-0000-0000-0000-000000000005",
    seasonId: "00000000-0000-0000-0000-000000000004",
    matchday: 1,
    homeTeamId: teams.albalonga,
    awayTeamId: teams.frascati,
    kickoffAt: "2025-09-20T15:00:00+02:00",
    venue: null,
    status: "finished",
    homeScore: 3,
    awayScore: 1,
    homeScoreHt: null,
    awayScoreHt: null,
  },
];

export default function Home() {
  const standings = computeStandings(matches, {
    teamIds: [teams.albalonga, teams.frascati],
  });

  return (
    <main>
      <h1>EXTRA TIME</h1>
      <p className="lead">
        Football Data Core — Fase 0. Classifica calcolata dai risultati dal package
        <code> @extra-time/football-domain</code>.
      </p>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Squadra</th>
            <th>PG</th>
            <th>V</th>
            <th>N</th>
            <th>P</th>
            <th>GF</th>
            <th>GS</th>
            <th>DR</th>
            <th>Punti</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => (
            <tr key={row.teamId}>
              <td className="pos">{row.position}</td>
              <td>{names[row.teamId] ?? row.teamId}</td>
              <td>{row.played}</td>
              <td>{row.won}</td>
              <td>{row.drawn}</td>
              <td>{row.lost}</td>
              <td>{row.goalsFor}</td>
              <td>{row.goalsAgainst}</td>
              <td>{row.goalDiff}</td>
              <td className="pos">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
