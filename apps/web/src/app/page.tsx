import Link from "next/link";
import {
  getPortalCounts,
  listLiveMatches,
  listRecentResults,
  listRegions,
  listUpcomingMatches,
} from "@extra-time/database";
import { formatKickoff } from "@/lib/format";

export const revalidate = 300;

export default async function Home() {
  const [counts, regions, live, results, upcoming] = await Promise.all([
    getPortalCounts(),
    listRegions(),
    listLiveMatches(),
    listRecentResults(6),
    listUpcomingMatches(6),
  ]);

  return (
    <main className="portal">
      <section className="portal-hero">
        <h1>Calcio dilettantistico e giovanile</h1>
        <p className="lead">
          Calendari, risultati, classifiche e live di tutto il calcio italiano. Scegli una
          regione per esplorare campionati e gironi.
        </p>
        <div className="portal-chips">
          <span className="portal-chip">{counts.regions} Regioni</span>
          <span className="portal-chip">{counts.groups} Gironi</span>
          <span className="portal-chip">{counts.teams} Squadre</span>
          <span className="portal-chip">{counts.matches} Partite</span>
          {live.length > 0 && (
            <span className="portal-chip is-live">
              <span className="live-dot" aria-hidden />
              {live.length} in corso
            </span>
          )}
        </div>
      </section>

      {live.length > 0 && (
        <section className="portal-section">
          <h2>
            <span className="live-dot" aria-hidden />
            Live
          </h2>
          <div className="portal-grid">
            <div className="portal-card">
              {live.map((match) => (
                <div key={match.id} className="portal-match is-live">
                  <span className="home">{match.homeName}</span>
                  <span className="score">
                    {match.homeScore ?? 0} - {match.awayScore ?? 0}
                  </span>
                  <span className="away">{match.awayName}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="portal-section">
        <h2>Ultimi risultati</h2>
        {results.length === 0 ? (
          <p className="empty">Nessun risultato disponibile.</p>
        ) : (
          <div className="portal-grid">
            <div className="portal-card">
              {results.map((match) => (
                <div key={match.id} className="portal-match">
                  <span className="home">{match.homeName}</span>
                  <span className="score">
                    {match.homeScore} - {match.awayScore}
                  </span>
                  <span className="away">{match.awayName}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="portal-section">
        <h2>Prossime partite</h2>
        {upcoming.length === 0 ? (
          <p className="empty">Nessuna partita in programma.</p>
        ) : (
          <div className="portal-grid">
            <div className="portal-card">
              {upcoming.map((match) => (
                <div key={match.id} className="portal-match">
                  <span className="home">{match.homeName}</span>
                  <span className="score">{formatKickoff(match.kickoffAt)}</span>
                  <span className="away">{match.awayName}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="portal-section">
        <h2>Regioni</h2>
        {regions.length === 0 ? (
          <p className="empty">
            Nessuna regione disponibile. Popola il core con <code>pnpm db:setup</code>.
          </p>
        ) : (
          <ul className="portal-links">
            {regions.map((region) => (
              <li key={region.id}>
                <Link href={`/${region.code.toLowerCase()}`}>
                  {region.name}
                  <span className="count">Campionati e gironi</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="pres-back">
        <Link href="/presentazione">Identità visiva e percorso →</Link>
        <br />
        <Link href="/prototipo">Prototipo navigabile (proposta collaboratori) →</Link>
      </p>
    </main>
  );
}
