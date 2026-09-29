import { listRecentResults, listUpcomingMatches } from "@extra-time/database";
import { MatchRow } from "@/components/MatchRow";

export const revalidate = 120;

/** Risultati: ultime partite concluse e prossime in programma. */
export default async function RisultatiPage() {
  const [results, upcoming] = await Promise.all([
    listRecentResults(30),
    listUpcomingMatches(20),
  ]);

  return (
    <main className="portal">
      <section className="portal-hero">
        <h1>Risultati</h1>
        <p className="lead">
          Gli ultimi risultati e le prossime partite della stagione corrente.
        </p>
      </section>

      <section className="portal-section">
        <h2>Ultimi risultati</h2>
        {results.length === 0 ? (
          <p className="empty">Nessun risultato disponibile.</p>
        ) : (
          <div className="portal-card">
            {results.map((match) => (
              <MatchRow key={match.id} match={match} showMeta />
            ))}
          </div>
        )}
      </section>

      <section className="portal-section">
        <h2>Prossime partite</h2>
        {upcoming.length === 0 ? (
          <p className="empty">Nessuna partita in programma.</p>
        ) : (
          <div className="portal-card">
            {upcoming.map((match) => (
              <MatchRow key={match.id} match={match} showMeta />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
