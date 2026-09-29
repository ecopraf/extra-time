import Link from "next/link";
import { Logo, TimeLine } from "@extra-time/ui";

export const metadata = {
  title: "EXTRA TIME — prototipo navigabile",
  description:
    "Rifacimento nel design system EXTRA TIME della proposta dei collaboratori (risultati, scout, news, live).",
};

/**
 * Prototipo navigabile: riprende la struttura della proposta dei collaboratori
 * (Risultati Match / Scout Platform / News / Live) e la rende con il design system
 * di EXTRA TIME. Dati dimostrativi, nessuna lettura dal Football Data Core.
 */

type Match = { home: string; away: string; hs: number; as: number; live?: boolean };

const matches: Match[] = [
  { home: "Lodigiani", away: "Vis Artena", hs: 2, as: 1 },
  { home: "Vicovaro", away: "Palocco", hs: 0, as: 0, live: true },
  { home: "Fondi", away: "Boreale", hs: 3, as: 2 },
  { home: "Anzio", away: "Nettuno", hs: 1, as: 1 },
];

type Row = {
  team: string;
  pts: number;
  pg: number;
  v: number;
  n: number;
  p: number;
  gf: number;
  gs: number;
};

const standings: Row[] = [
  { team: "Lodigiani", pts: 42, pg: 18, v: 13, n: 3, p: 2, gf: 38, gs: 15 },
  { team: "Vis Artena", pts: 39, pg: 18, v: 12, n: 3, p: 3, gf: 34, gs: 18 },
  { team: "Fondi", pts: 33, pg: 18, v: 10, n: 3, p: 5, gf: 29, gs: 21 },
  { team: "Vicovaro", pts: 26, pg: 18, v: 7, n: 5, p: 6, gf: 24, gs: 23 },
  { team: "Palocco", pts: 21, pg: 18, v: 6, n: 3, p: 9, gf: 20, gs: 27 },
  { team: "Boreale", pts: 12, pg: 18, v: 3, n: 3, p: 12, gf: 14, gs: 35 },
];

function zone(pos: number, total: number): string {
  if (pos <= 1) return "zone-win";
  if (pos <= 2) return "zone-play";
  if (pos >= total) return "zone-out";
  return "";
}

const news = [
  {
    date: "20 set 2026",
    title: "Al via la nuova stagione dilettanti",
    excerpt:
      "Ufficializzati i gironi di Eccellenza e Promozione: composizione, date e formula della stagione in corso.",
  },
  {
    date: "18 set 2026",
    title: "Juniores: i talenti da seguire",
    excerpt:
      "La redazione segnala i giovani più interessanti del weekend, con schede tecniche e minutaggi.",
  },
  {
    date: "15 set 2026",
    title: "Coppa Italia: il tabellone",
    excerpt: "Sorteggi, accoppiamenti e calendario completo della fase regionale.",
  },
];

const live = [
  { title: "Eccellenza — Lodigiani vs Vis Artena", status: "in diretta" },
  { title: "Promozione — Ardea vs Pomezia", status: "in diretta" },
  { title: "Juniores — Lazio Giovani vs Roma Youth", status: "18:00" },
];

const tabs = [
  { id: "risultati", label: "Risultati" },
  { id: "scout", label: "Scout" },
  { id: "news", label: "News" },
  { id: "live", label: "Live" },
];

export default function PrototipoPage() {
  return (
    <main className="pres">
      <div className="proto-nav">
        {tabs.map((t, i) => (
          <Link
            key={t.id}
            href="#"
            className={i === 0 ? "active" : undefined}
            aria-current={i === 0 ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="proto-head">
        <Logo markSize={34} wordmarkSize={24} />
      </div>
      <p className="proto-sub">
        Rifacimento nel design system EXTRA TIME della proposta dei collaboratori. Stessa
        struttura (risultati, scout, news, live), nostra identità e grammatica di colore.
        Dati dimostrativi.
      </p>

      <section>
        <h1>Risultati Match</h1>
        <p className="proto-sub">
          Tutto il calcio dilettantistico e giovanile: regioni, campionati, gironi,
          risultati e classifiche.
        </p>

        <div className="proto-selectors">
          <select defaultValue="Lazio" aria-label="Regione">
            <option>Lazio</option>
            <option>Lombardia</option>
            <option>Campania</option>
          </select>
          <select defaultValue="Eccellenza" aria-label="Campionato">
            <option>Eccellenza</option>
            <option>Promozione</option>
            <option>Juniores Regionale</option>
          </select>
          <select defaultValue="Girone A" aria-label="Girone">
            <option>Girone A</option>
            <option>Girone B</option>
          </select>
        </div>

        <div className="proto-grid">
          <div className="proto-card">
            <h3>Partite — Giornata 19</h3>
            {matches.map((m) => (
              <div
                key={`${m.home}-${m.away}`}
                className={`proto-match${m.live ? " is-live" : ""}`}
              >
                <span className="home">
                  {m.live && <span className="proto-live-dot" aria-hidden />}
                  {m.home}
                </span>
                <span className="score">
                  {m.hs} - {m.as}
                </span>
                <span className="away">{m.away}</span>
              </div>
            ))}
          </div>

          <div className="proto-card">
            <h3>Classifica</h3>
            <table className="proto-table">
              <thead>
                <tr>
                  <th className="team">Squadra</th>
                  <th>Pt</th>
                  <th>PG</th>
                  <th>V</th>
                  <th>N</th>
                  <th>P</th>
                  <th>GF</th>
                  <th>GS</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((r, i) => (
                  <tr key={r.team} className={zone(i + 1, standings.length)}>
                    <td className="team">
                      <span className="pos">{i + 1}</span>
                      {r.team}
                    </td>
                    <td>
                      <strong>{r.pts}</strong>
                    </td>
                    <td>{r.pg}</td>
                    <td>{r.v}</td>
                    <td>{r.n}</td>
                    <td>{r.p}</td>
                    <td>{r.gf}</td>
                    <td>{r.gs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="proto-scout" style={{ marginTop: 32 }}>
        <h2>Scout Platform</h2>
        <p>
          La piattaforma di segnalazione talenti sotto il marchio EXTRA TIME: schede
          giocatore, osservazioni, designazioni. È un modulo con backend proprio — da
          collegare come area dedicata o da ricostruire dentro il portale.
        </p>
        <Link href="#" className="proto-cta">
          Accedi alla Scout Platform
        </Link>
      </section>

      <section style={{ marginTop: 40 }}>
        <h1>News</h1>
        <p className="proto-sub">Le notizie della redazione, collegate ai dati del core.</p>
        <div className="proto-news">
          {news.map((n) => (
            <article key={n.title}>
              <span className="date">{n.date}</span>
              <h3>{n.title}</h3>
              <p>{n.excerpt}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 40 }}>
        <h1>Live</h1>
        <p className="proto-sub">
          Le dirette: cronaca testuale per partire, video più avanti.
        </p>
        <div className="proto-news">
          {live.map((l) => {
            const on = l.status === "in diretta";
            return (
              <article key={l.title}>
                <span className={`proto-live-badge${on ? "" : " is-off"}`}>
                  {on && <span className="proto-live-dot" aria-hidden />}
                  {l.status}
                </span>
                <h3>{l.title}</h3>
              </article>
            );
          })}
        </div>
      </section>

      <div className="proto-note">
        <TimeLine width={220} />
        <p style={{ marginTop: 12 }}>
          Prototipo dimostrativo, ispirato alla proposta dei collaboratori e reso con il
          design system di EXTRA TIME (palette Navy/Blue/Orange/Green, simbolo X + punto
          live). La struttura è quella proposta; l&apos;identità visiva è la nostra.
        </p>
        <p>
          <Link href="/presentazione">← Identità visiva e percorso</Link>
        </p>
      </div>
    </main>
  );
}
