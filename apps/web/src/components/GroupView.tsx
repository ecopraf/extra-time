import type { Match } from "@extra-time/types";
import type { StandingRow } from "@extra-time/football-domain";
import { formatKickoff, formatDateOnly, formatTimeOnly, sameDay } from "@/lib/format";
import { GroupTabs } from "@/components/GroupTabs";
import { TeamBadge } from "@/components/TeamBadge";
import { OverviewMatches, type OverviewMatch } from "@/components/OverviewMatches";

/**
 * Vista di un girone: Panoramica (ultima giornata + classifica affiancate) +
 * tab Calendario e Squadre + capocannonieri. Server component che costruisce
 * le viste e le passa al client GroupTabs. Riusata da /campionati e dalla
 * pagina girone territoriale.
 */

interface Scorer {
  playerId: string | null;
  playerName: string;
  teamId: string | null;
  goals: number;
}

export function GroupView({
  title,
  matches,
  teamNames,
  teamIds,
  logos,
  standings,
  scorers,
}: {
  title: string;
  matches: Match[];
  teamNames: Record<string, string>;
  teamIds: string[];
  logos?: Record<string, string>;
  standings: StandingRow[];
  scorers: Scorer[];
}) {
  const nameOf = (id: string) => teamNames[id] ?? id;
  const logoOf = (id: string) => logos?.[id] ?? null;

  const nowIso = new Date().toISOString();
  const played = matches
    .filter((m) => m.status === "finished" && m.homeScore !== null)
    .sort((a, b) => (b.kickoffAt ?? "").localeCompare(a.kickoffAt ?? ""));
  // Prossime: non concluse e con calcio d'inizio da oggi in avanti (o senza data).
  const upcoming = matches
    .filter(
      (m) =>
        m.status !== "finished" &&
        m.status !== "cancelled" &&
        (m.kickoffAt === null || m.kickoffAt >= nowIso),
    )
    .sort((a, b) => (a.kickoffAt ?? "").localeCompare(b.kickoffAt ?? ""));

  const byMatchday = new Map<number, Match[]>();
  for (const m of matches) {
    const md = m.matchday ?? 0;
    if (!byMatchday.has(md)) byMatchday.set(md, []);
    byMatchday.get(md)!.push(m);
  }
  const matchdays = [...byMatchday.keys()].sort((a, b) => a - b);

  const standingsTable = (
    <table className="portal-table">
      <thead>
        <tr>
          <th>#</th>
          <th className="team">Squadra</th>
          <th>PG</th>
          <th className="hide-xs">V</th>
          <th className="hide-xs">N</th>
          <th className="hide-xs">P</th>
          <th className="hide-xs">GF</th>
          <th className="hide-xs">GS</th>
          <th>DR</th>
          <th>Punti</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((row) => (
          <tr key={row.teamId}>
            <td className="pos">{row.position}</td>
            <td className="team"><TeamBadge name={nameOf(row.teamId)} logo={logoOf(row.teamId)} /></td>
            <td>{row.played}</td>
            <td className="hide-xs">{row.won}</td>
            <td className="hide-xs">{row.drawn}</td>
            <td className="hide-xs">{row.lost}</td>
            <td className="hide-xs">{row.goalsFor}</td>
            <td className="hide-xs">{row.goalsAgainst}</td>
            <td>{row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}</td>
            <td className="pos">{row.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  // Prepara i dati per la card Panoramica (pill Risultati/Prossime + frecce).
  const toOverview = (list: Match[]): OverviewMatch[] =>
    list.map((m) => ({
      id: m.id,
      matchday: m.matchday,
      homeName: nameOf(m.homeTeamId),
      awayName: nameOf(m.awayTeamId),
      homeLogo: logoOf(m.homeTeamId),
      awayLogo: logoOf(m.awayTeamId),
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      timeLabel: formatTimeOnly(m.kickoffAt),
      dateLabel: formatDateOnly(m.kickoffAt),
      sameDay: false,
    }));

  // Per semplicita' usiamo lo stesso flag sameDay per riga (il componente
  // raggruppa per giornata; il flag e' calcolato per l'intera lista qui,
  // ma il label data viene comunque dalla giornata mostrata).
  const playedOv: OverviewMatch[] = toOverview(played);
  const upcomingOv: OverviewMatch[] = toOverview(upcoming);

  const overview = (
    <div className="portal-overview-grid">
      <OverviewMatches played={playedOv} upcoming={upcomingOv} />
            <div className="portal-card">
        <h3>Classifica</h3>
        {standings.length === 0 ? (
          <p className="empty">Classifica non ancora disponibile.</p>
        ) : (
          standingsTable
        )}
      </div>
    </div>
  );

  const calendar = (
    <div className="portal-card">
      {matchdays.length === 0 ? (
        <p className="empty">Calendario non disponibile.</p>
      ) : (
        matchdays.map((md) => {
          const round = byMatchday.get(md)!;
          const roundSameDay = sameDay(round.map((m) => m.kickoffAt));
          const roundDate = round[0] ? formatDateOnly(round[0].kickoffAt) : "";
          return (
            <div key={md}>
              <div className="portal-round-head">
                Giornata {md || "?"}
                {roundSameDay ? ` · ${roundDate}` : ""}
              </div>
              {round.map((m) => (
                <div key={m.id} className="portal-match">
                  <span className="home"><TeamBadge name={nameOf(m.homeTeamId)} logo={logoOf(m.homeTeamId)} nameFirst /></span>
                  <span className="score">
                    {m.status === "finished" && m.homeScore !== null
                      ? `${m.homeScore} - ${m.awayScore}`
                      : roundSameDay
                        ? formatTimeOnly(m.kickoffAt)
                        : formatKickoff(m.kickoffAt)}
                  </span>
                  <span className="away"><TeamBadge name={nameOf(m.awayTeamId)} logo={logoOf(m.awayTeamId)} /></span>
                </div>
              ))}
            </div>
          );
        })
      )}
    </div>
  );

  const teamsView = (
    <div className="portal-card">
      {teamIds.length === 0 ? (
        <p className="empty">Nessuna squadra iscritta.</p>
      ) : (
        <ul className="portal-links portal-links-plain">
          {teamIds
            .map((id) => ({ id, name: nameOf(id) }))
            .sort((a, b) => a.name.localeCompare(b.name, "it"))
            .map(({ id, name }) => (
              <li key={id}>
                <span className="portal-team-item">
                  <TeamBadge name={name} logo={logoOf(id)} />
                </span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );

  return (
    <section className="portal-section">
      {title ? <h2 className="portal-group-title">{title}</h2> : null}
      <GroupTabs overview={overview} calendar={calendar} teams={teamsView} />

      {scorers.length > 0 && (
        <div className="portal-section">
          <h3 className="portal-scorers-title">Capocannonieri</h3>
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
        </div>
      )}
    </section>
  );
}
