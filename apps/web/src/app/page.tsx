import {
  getGroupSummary,
  getTeamNames,
  listClubsInGroup,
  listMatchesByGroup,
} from "@extra-time/database";
import { computeStandings } from "@extra-time/football-domain";

// Girone di esempio creato da db/smoke_test.sql (Fase 0).
const DEMO_GROUP_ID = "00000000-0000-0000-0000-000000000005";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [summary, matches, clubs] = await Promise.all([
    getGroupSummary(DEMO_GROUP_ID),
    listMatchesByGroup(DEMO_GROUP_ID),
    listClubsInGroup(DEMO_GROUP_ID),
  ]);

  const teamNames = await getTeamNames(
    matches.flatMap((m) => [m.homeTeamId, m.awayTeamId]),
  );

  const standings = computeStandings(matches, {
    teamIds: clubs.map((c) => c.id),
  });

  return (
    <main>
      <h1>EXTRA TIME</h1>
      <p className="lead">
        Fase 0 — la pagina legge dal Football Data Core (PostgreSQL) e calcola la
        classifica con <code>@extra-time/football-domain</code>.
      </p>

      {summary && (
        <p className="lead">
          {summary.competitionName} · {summary.groupName} · {summary.seasonLabel}
        </p>
      )}

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
              <td>{teamNames[row.teamId] ?? row.teamId}</td>
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

      {matches.length > 0 && (
        <>
          <h2 style={{ marginTop: 40 }}>Risultati</h2>
          <table>
            <thead>
              <tr>
                <th>Casa</th>
                <th>Risultato</th>
                <th>Ospite</th>
                <th>Stato</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id}>
                  <td>{teamNames[m.homeTeamId] ?? m.homeTeamId}</td>
                  <td>
                    {m.homeScore ?? "-"}-{m.awayScore ?? "-"}
                  </td>
                  <td>{teamNames[m.awayTeamId] ?? m.awayTeamId}</td>
                  <td>{m.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}
