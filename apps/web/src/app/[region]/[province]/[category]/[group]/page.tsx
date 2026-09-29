import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getGroupTeams,
  listMatchesByGroup,
  listTopScorersByGroup,
  resolveGroup,
} from "@extra-time/database";
import { computeStandings } from "@extra-time/football-domain";
import { formatKickoff } from "@/lib/format";

export const revalidate = 120;

export default async function GroupPage({
  params,
}: {
  params: Promise<{
    region: string;
    province: string;
    category: string;
    group: string;
  }>;
}) {
  const { region, province, category, group } = await params;
  const summary = await resolveGroup({
    regionCode: region.toUpperCase(),
    provinceCode: province.toUpperCase(),
    category,
    groupCode: group,
  });
  if (!summary) notFound();

  const [matches, teams, scorers] = await Promise.all([
    listMatchesByGroup(summary.groupId),
    getGroupTeams(summary.groupId),
    listTopScorersByGroup(summary.groupId, 5),
  ]);

  const standings = computeStandings(matches, { teamIds: teams.teamIds });
  const nameOf = (teamId: string) => teams.names[teamId] ?? teamId;

  const played = matches.filter(
    (m) => m.status === "finished" && m.homeScore !== null,
  );
  const upcoming = matches.filter(
    (m) => m.status !== "finished" && m.status !== "cancelled",
  );

  return (
    <main className="portal">
      <section className="portal-hero">
        <nav className="breadcrumb">
          <Link href="/">Italia</Link> /{" "}
          <Link href={`/${region}`}>{summary.regionName ?? region}</Link> /{" "}
          <Link href={`/${region}/${province}`}>
            {summary.provinceName ?? province}
          </Link>{" "}
          /{" "}
          <Link href={`/${region}/${province}/${category}`}>
            {summary.competitionCategory}
          </Link>{" "}
          / {summary.groupName}
        </nav>
        <h1>
          {summary.competitionName} — {summary.groupName}
        </h1>
        <p className="lead">Stagione {summary.seasonLabel}</p>
      </section>

      <section className="portal-section">
        <h2>Classifica</h2>
        {standings.length === 0 ? (
          <p className="empty">Classifica non ancora disponibile.</p>
        ) : (
          <table className="portal-table">
            <thead>
              <tr>
                <th>#</th>
                <th className="team">Squadra</th>
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
                  <td className="team">{nameOf(row.teamId)}</td>
                  <td>{row.played}</td>
                  <td>{row.won}</td>
                  <td>{row.drawn}</td>
                  <td>{row.lost}</td>
                  <td>{row.goalsFor}</td>
                  <td>{row.goalsAgainst}</td>
                  <td>{row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}</td>
                  <td className="pos">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="portal-section">
        <h2>Risultati</h2>
        {played.length === 0 ? (
          <p className="empty">Nessuna partita ancora giocata.</p>
        ) : (
          <table className="portal-table">
            <thead>
              <tr>
                <th>Giornata</th>
                <th className="team">Casa</th>
                <th>Risultato</th>
                <th className="team">Ospite</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {played.map((m) => (
                <tr key={m.id}>
                  <td>{m.matchday ?? "-"}</td>
                  <td className="team">{nameOf(m.homeTeamId)}</td>
                  <td className="pos">
                    {m.homeScore}-{m.awayScore}
                  </td>
                  <td className="team">{nameOf(m.awayTeamId)}</td>
                  <td>{formatKickoff(m.kickoffAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="portal-section">
        <h2>Prossime partite</h2>
        {upcoming.length === 0 ? (
          <p className="empty">Nessuna partita programmata.</p>
        ) : (
          <ul className="list-plain">
            {upcoming.map((m) => (
              <li key={m.id}>
                <span className="tag">Giornata {m.matchday ?? "?"}</span>{" "}
                {nameOf(m.homeTeamId)} — {nameOf(m.awayTeamId)}{" "}
                <span className="muted">({formatKickoff(m.kickoffAt)})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {scorers.length > 0 && (
        <section className="portal-section">
          <h2>Capocannonieri</h2>
          <table className="portal-table">
            <thead>
              <tr>
                <th>#</th>
                <th className="team">Giocatore</th>
                <th className="team">Squadra</th>
                <th>Gol</th>
              </tr>
            </thead>
            <tbody>
              {scorers.map((s, i) => (
                <tr key={`${s.playerId}-${i}`}>
                  <td className="pos">{i + 1}</td>
                  <td className="team">{s.playerName}</td>
                  <td className="team">{s.teamId ? nameOf(s.teamId) : "-"}</td>
                  <td className="pos">{s.goals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
