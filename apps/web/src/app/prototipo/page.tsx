import Link from "next/link";
import { Logo, TimeLine } from "@extra-time/ui";
import {
  regions,
  news,
  live,
  clubs,
  players,
  staff,
  tabsAdmin,
  CONTATTO,
} from "./dati";

export const metadata = {
  title: "EXTRA TIME — prototipo navigabile",
  description:
    "Rifacimento nel design system EXTRA TIME della proposta dei collaboratori (risultati, scout, news, live, admin).",
};

/**
 * Prototipo navigabile: riprende struttura e contenuti della proposta dei
 * collaboratori (`docs/riferimenti/collaboratori/index-originale.html`) e li rende
 * con il design system di EXTRA TIME. Dati dimostrativi, nessuna lettura dal Core.
 */

const tabs = [
  { id: "risultati", label: "Risultati Match" },
  { id: "scout", label: "Scout Platform" },
  { id: "news", label: "News" },
  { id: "live", label: "Live" },
];

function zone(pos: number, total: number): string {
  if (pos <= 1) return "zone-win";
  if (pos <= 2) return "zone-play";
  if (pos >= total) return "zone-out";
  return "";
}

const regione = "Lazio";
const campionato = "Eccellenza";
const gironeScelto = "Girone A";
const dati = regions[regione][campionato][gironeScelto];

export default function PrototipoPage() {
  const regioni = Object.keys(regions);
  const campionati = Object.keys(regions[regione]);

  return (
    <main className="proto">
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
        struttura e stessi contenuti (risultati, scout, news, live, admin), nostra identità
        e grammatica di colore. Dati dimostrativi.
      </p>

      {/* ---------------------------------------------------------- Risultati */}
      <section>
        <h1>Risultati Match</h1>
        <p className="proto-sub">
          Tutto il calcio dilettantistico e giovanile italiano: regioni, campionati,
          gironi, risultati e classifiche sempre aggiornati.
        </p>

        <div className="proto-chips">
          <span className="proto-chip">{regioni.length} Regioni</span>
          <span className="proto-chip">{campionati.length} Campionati</span>
          <span className="proto-chip">Aggiornato in tempo reale</span>
        </div>

        <div className="proto-selectors">
          <select defaultValue={regione} aria-label="Regione">
            {regioni.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select defaultValue={campionato} aria-label="Campionato">
            {campionati.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select defaultValue={gironeScelto} aria-label="Girone">
            {Object.keys(regions[regione][campionato]).map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="proto-grid">
          <div className="proto-card">
            <h3>Partite</h3>
            {dati.matches.map((m, i) => (
              <div
                key={`${m.home}-${m.away}`}
                className={`proto-match${i === 1 ? " is-live" : ""}`}
              >
                <span className="home">
                  {i === 1 && <span className="proto-live-dot" aria-hidden />}
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
                {dati.standings.map((r, i) => (
                  <tr key={r.team} className={zone(i + 1, dati.standings.length)}>
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

      {/* --------------------------------------------------------------- Scout */}
      <section className="proto-scout" style={{ marginTop: 36 }}>
        <div className="proto-scout-icon" aria-hidden>
          <TimeLine width={200} />
        </div>
        <h2>EXTRA TIME — Scout Platform</h2>
        <p>
          La piattaforma di segnalazione talenti, rinnovata sotto il marchio EXTRA TIME.
          Qui verrà integrata la piattaforma scout completa: login clienti, piani di
          abbonamento, richieste di osservazione, designazioni scout. È un modulo a sé con
          il proprio backend, da collegare come area dedicata o da ricostruire dentro il
          portale.
        </p>
        <Link href="#" className="proto-cta">
          Accedi alla Scout Platform
        </Link>
      </section>

      {/* ---------------------------------------------------------------- News */}
      <section style={{ marginTop: 44 }}>
        <h1>News</h1>
        <p className="proto-sub">
          Tutte le notizie pubblicate dalla redazione di EXTRA TIME.
        </p>
        <div className="proto-news">
          {news.map((n) => (
            <article key={n.id}>
              <span className="date">{n.date}</span>
              <h3>{n.title}</h3>
              <p>{n.excerpt}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- Live */}
      <section style={{ marginTop: 44 }}>
        <h1>Live</h1>
        <p className="proto-sub">
          Guarda le dirette delle partite in stile piattaforma video.
        </p>
        <div className="proto-news">
          {live.map((l) => {
            const on = l.status === "Live ora";
            return (
              <article key={l.id} className="proto-live-card">
                <div className="proto-live-thumb" aria-hidden>
                  <span className="proto-live-play">▶</span>
                </div>
                <div className="proto-live-info">
                  <span className={`proto-live-badge${on ? "" : " is-off"}`}>
                    {on && <span className="proto-live-dot" aria-hidden />}
                    {l.status}
                  </span>
                  <h3>{l.title}</h3>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* --------------------------------------------------------------- Admin */}
      <section style={{ marginTop: 52 }}>
        <h1>Pannello Amministratore</h1>
        <p className="proto-sub">Gestione completa del sito EXTRA TIME.</p>

        <div className="proto-admin">
          <nav className="proto-admin-nav proto-card">
            {tabsAdmin.map(([id, label], i) => (
              <span key={id} className={`proto-admin-tab${i === 0 ? " active" : ""}`}>
                {label}
              </span>
            ))}
          </nav>

          <div className="proto-card">
            <h3>Crea notizia</h3>
            <div className="proto-field">
              <label>Titolo</label>
              <input placeholder="Titolo della notizia" />
            </div>
            <div className="proto-field">
              <label>Estratto</label>
              <textarea rows={2} placeholder="Sommario" />
            </div>
            <button type="button" className="proto-btn">
              Pubblica
            </button>

            <hr className="proto-hr" />

            <table className="proto-table">
              <tbody>
                {news.map((n) => (
                  <tr key={n.id}>
                    <td className="team">{n.title}</td>
                    <td>{n.date}</td>
                    <td className="right">
                      <button type="button" className="proto-btn-danger">
                        Elimina
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <hr className="proto-hr" />

            <h3>Assistenza</h3>
            <p className="proto-hint">Invia una segnalazione al team EXTRA TIME.</p>
            <div className="proto-field">
              <label>Oggetto</label>
              <input placeholder="Descrivi il problema" />
            </div>
            <div className="proto-field">
              <label>Messaggio</label>
              <textarea rows={4} placeholder="Dettagli..." />
            </div>
            <a className="proto-btn" href={`mailto:${CONTATTO}`}>
              Apri email a {CONTATTO}
            </a>

            <hr className="proto-hr" />

            <h3>Credenziali Staff</h3>
            <div className="proto-field">
              <label>Nome</label>
              <input placeholder="Nome e cognome" />
            </div>
            <div className="proto-field">
              <label>Email</label>
              <input type="email" placeholder="nome@esempio.it" />
            </div>
            <div className="proto-field">
              <label>Ruolo</label>
              <select defaultValue="Amministratore">
                <option>Amministratore</option>
                <option>Redattore News</option>
                <option>Moderatore Risultati</option>
              </select>
            </div>
            <button type="button" className="proto-btn">
              Crea credenziale
            </button>

            <hr className="proto-hr" />

            <table className="proto-table">
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id}>
                    <td className="team">{s.name}</td>
                    <td>{s.email}</td>
                    <td>{s.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <hr className="proto-hr" />

            <h3>Nuovo campionato</h3>
            <div className="proto-field">
              <label>Regione (esistente o nuova)</label>
              <input placeholder="Es. Lazio" list="dl_regions" />
              <datalist id="dl_regions">
                {regioni.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </datalist>
            </div>
            <div className="proto-field">
              <label>Campionato</label>
              <input placeholder="Es. Eccellenza" />
            </div>
            <div className="proto-field">
              <label>Girone</label>
              <input placeholder="Es. Girone A" />
            </div>
            <div className="proto-field">
              <label>Squadre (separate da virgola)</label>
              <input placeholder="Squadra1, Squadra2, ..." />
            </div>
            <button type="button" className="proto-btn">
              Crea girone
            </button>

            <hr className="proto-hr" />

            <h3>Inserisci risultato</h3>
            <div className="proto-field">
              <label>Regione</label>
              <select defaultValue={regione}>
                {regioni.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="proto-field">
              <label>Campionato</label>
              <select defaultValue={campionato}>
                {campionati.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="proto-field">
              <label>Girone</label>
              <select defaultValue={gironeScelto}>
                {Object.keys(regions[regione][campionato]).map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="proto-field proto-row">
              <input placeholder="Squadra casa" />
              <input type="number" className="score" placeholder="0" />
              <input type="number" className="score" placeholder="0" />
              <input placeholder="Squadra ospite" />
            </div>
            <button type="button" className="proto-btn">
              Aggiungi risultato
            </button>

            <hr className="proto-hr" />

            <h3>Nuova società</h3>
            <div className="proto-field">
              <label>Nome società</label>
              <input placeholder="Nome della società" />
            </div>
            <button type="button" className="proto-btn">
              Aggiungi società
            </button>

            <hr className="proto-hr" />

            <table className="proto-table">
              <tbody>
                {clubs.map((c) => (
                  <tr key={c.id}>
                    <td className="team">{c.name}</td>
                    <td className="right">
                      <button type="button" className="proto-btn-danger">
                        Elimina
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <hr className="proto-hr" />

            <h3>Nuovo calciatore</h3>
            <div className="proto-field">
              <label>Nome</label>
              <input placeholder="Nome del calciatore" />
            </div>
            <div className="proto-field">
              <label>Ruolo</label>
              <input placeholder="Es. Attaccante" />
            </div>
            <div className="proto-field">
              <label>Società</label>
              <select defaultValue={clubs[0]?.name}>
                {clubs.map((c) => (
                  <option key={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button type="button" className="proto-btn">
              Aggiungi calciatore
            </button>

            <hr className="proto-hr" />

            <table className="proto-table">
              <tbody>
                {players.map((p) => (
                  <tr key={p.id}>
                    <td className="team">{p.name}</td>
                    <td>{p.role}</td>
                    <td>{clubs.find((c) => c.id === p.clubId)?.name ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <hr className="proto-hr" />

            <h3>Profili</h3>
            <p className="proto-hint">
              Gestione profili utente collegata al sistema di autenticazione (da agganciare
              a un backend, es. Supabase, come nel modulo Scout Platform).
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------- Assistenza / Profilo / Impostazioni */}
      <section style={{ marginTop: 44 }}>
        <h2 className="proto-h2">Finestre di servizio</h2>
        <p className="proto-sub">
          Assistenza, profilo e impostazioni: nell&apos;originale sono modali. Qui in linea,
          per mostrare gli stessi contenuti.
        </p>
        <div className="proto-grid3">
          <div className="proto-card">
            <h3>Assistenza EXTRA TIME</h3>
            <p className="proto-hint">
              Scrivici e ti risponderemo il prima possibile.
            </p>
            <div className="proto-field">
              <label>Oggetto</label>
              <input placeholder="Descrivi il problema o la segnalazione" />
            </div>
            <div className="proto-field">
              <label>Messaggio</label>
              <textarea rows={4} placeholder="Dettagli..." />
            </div>
            <a className="proto-btn" href={`mailto:${CONTATTO}`}>
              Invia a {CONTATTO}
            </a>
          </div>

          <div className="proto-card">
            <h3>Profilo</h3>
            <p className="proto-hint">
              Stato: <b>Amministratore</b>
            </p>
            <div className="proto-field">
              <label>Accedi come</label>
              <select defaultValue="admin">
                <option value="user">Utente</option>
                <option value="admin">Amministratore</option>
              </select>
            </div>
            <button type="button" className="proto-btn">
              Accedi
            </button>
          </div>

          <div className="proto-card">
            <h3>Impostazioni</h3>
            <div className="proto-field">
              <label>Tema</label>
              <select defaultValue="">
                <option value="">Automatico</option>
                <option value="light">Chiaro</option>
                <option value="dark">Scuro</option>
              </select>
            </div>
            <button type="button" className="proto-btn">
              Salva
            </button>
          </div>
        </div>
      </section>

      <div className="proto-note">
        <TimeLine width={220} />
        <p style={{ marginTop: 12 }}>
          Prototipo dimostrativo, ispirato alla proposta dei collaboratori e reso con il
          design system di EXTRA TIME (palette Navy/Blue/Orange/Green, simbolo X + punto
          live). Struttura e contenuti sono quelli proposti; l&apos;identità visiva è la
          nostra.
        </p>
        <p>
          <Link href="/presentazione">← Identità visiva e percorso</Link>
        </p>
      </div>
    </main>
  );
}
