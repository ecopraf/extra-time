import Link from "next/link";
import {
  getPortalCounts,
  listLiveMatches,
  listRecentResults,
  listRegions,
  listUpcomingMatches,
} from "@extra-time/database";
import { MatchRow } from "@/components/MatchRow";
import { UpcomingCarousel } from "@/components/UpcomingCarousel";

export const revalidate = 300;

export default async function Home() {
  const [counts, regions, live, results, upcoming] = await Promise.all([
    getPortalCounts(),
    listRegions(),
    listLiveMatches(),
    listRecentResults(6),
    listUpcomingMatches(60),
  ]);

  return (
    <main className="portal">
      <section className="portal-hero">
        <h1>Calcio dilettantistico e giovanile</h1>
        <p className="lead">
          Calendari, risultati, classifiche e live di tutto il calcio italiano.
          Scegli un campionato per esplorare gironi e squadre.
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
                <MatchRow key={match.id} match={match} showMeta />
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
                <MatchRow key={match.id} match={match} showMeta />
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="portal-section">
        <h2>Prossime partite</h2>
        <UpcomingCarousel matches={upcoming} />
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
    </main>
  );
}
