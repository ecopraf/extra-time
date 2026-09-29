import { listLiveMatches } from "@extra-time/database";
import { MatchRow } from "@/components/MatchRow";

export const revalidate = 30;

/** LIVE: partite in corso, aggiornate con cadenza breve. */
export default async function LivePage() {
  const live = await listLiveMatches();

  return (
    <main className="portal">
      <section className="portal-hero">
        <h1>
          <span className="live-dot" aria-hidden />
          Live
        </h1>
        <p className="lead">Le partite in corso in tutta Italia.</p>
        {live.length > 0 && (
          <div className="portal-chips">
            <span className="portal-chip is-live">{live.length} in corso</span>
          </div>
        )}
      </section>

      <section className="portal-section">
        {live.length === 0 ? (
          <p className="empty">Nessuna partita in corso in questo momento.</p>
        ) : (
          <div className="portal-card">
            {live.map((match) => (
              <MatchRow key={match.id} match={match} showMeta />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
