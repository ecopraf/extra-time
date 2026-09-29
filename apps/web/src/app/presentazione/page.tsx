import Link from "next/link";
import { Logo, TimeLine, Mark, palette, semantic } from "@extra-time/ui";

export const metadata = {
  title: "EXTRA TIME — presentazione",
  description:
    "Anteprima di identità visiva e percorso di EXTRA TIME, da condividere con Vittorio.",
};

const swatches: { name: string; hex: string; usage: string }[] = [
  { name: "Extra Navy", hex: palette.extraNavy, usage: "header, testo forte, footer" },
  { name: "Electric Blue", hex: palette.electricBlue, usage: "brand principale, link, CTA" },
  { name: "Live Orange", hex: palette.liveOrange, usage: "LIVE, breaking news, dinamica" },
  { name: "Pitch Green", hex: palette.pitchGreen, usage: "calcio, risultati positivi" },
  { name: "White", hex: palette.white, usage: "superfici, contenuto" },
  { name: "Light Gray", hex: palette.lightGray, usage: "background" },
];

const grammar: { tone: string; label: string; color: string }[] = [
  { tone: "Blu", label: "informazioni / navigazione", color: semantic.info },
  { tone: "Arancio", label: "LIVE / breaking", color: semantic.live },
  { tone: "Verde", label: "risultato positivo / vittoria", color: semantic.positive },
  { tone: "Rosso", label: "espulsione / errore / alert", color: semantic.negative },
  { tone: "Navy", label: "brand / contenuti principali", color: palette.extraNavy },
  { tone: "Bianco", label: "contenuto", color: palette.white },
];

const phases: { n: string; title: string; state: "fatto" | "in-corso" | "dopo" }[] = [
  { n: "0", title: "Modello + Architettura", state: "fatto" },
  { n: "1", title: "MVP informativo (campionati e risultati)", state: "fatto" },
  { n: "2", title: "Squadre e Giocatori", state: "in-corso" },
  { n: "3", title: "News collegate ai dati", state: "dopo" },
  { n: "4", title: "LIVE (per livelli)", state: "dopo" },
  { n: "5", title: "Player Profile", state: "dopo" },
  { n: "6", title: "Scout", state: "dopo" },
  { n: "7", title: "Video / Media Platform", state: "dopo" },
  { n: "8", title: "Integrazione YFM", state: "dopo" },
];

const stateLabel: Record<string, string> = {
  fatto: "fatto",
  "in-corso": "in corso",
  dopo: "dopo",
};

export default function PresentazionePage() {
  return (
    <main className="pres">
      <p className="pres-note">
        Bozza di identità visiva e percorso — da condividere. Non è il prodotto finale.
      </p>

      <section className="pres-hero">
        <div className="pres-hero-mark">
          <Mark size={120} />
        </div>
        <Logo markSize={52} wordmarkSize={38} payoff="Il calcio oltre il 90'" />
        <p className="pres-claim">
          EXTRA TIME racconta il calcio dilettantistico e giovanile che di solito non
          trova spazio: calendari, risultati, classifiche, storie e — quando conta —
          il live del momento decisivo.
        </p>
        <TimeLine minute="+4'" />
      </section>

      <section>
        <h2 className="section">Perché non è un altro YFM</h2>
        <div className="pres-compare">
          <div className="pres-card">
            <h3>YFM</h3>
            <p>Comunica gestione e organizzazione. Strumento per chi amministra.</p>
          </div>
          <div className="pres-card pres-card-accent">
            <h3>EXTRA TIME</h3>
            <p>
              Comunica calcio, ritmo, informazione, visibilità e live. Pubblico e tifosi.
            </p>
          </div>
        </div>
        <p className="muted">
          Restano separati (EXTRA TIME = pubblico, YFM = B2B) ma integrati sullo stesso
          Football Data Core, con identificativi condivisi di Club, Team, Player e Match.
        </p>
      </section>

      <section>
        <h2 className="section">Il simbolo: la X più il tempo di gioco</h2>
        <div className="pres-symbols">
          <figure>
            <Mark size={72} />
            <figcaption>Marchio</figcaption>
          </figure>
          <figure>
            <Mark size={72} framed={false} />
            <figcaption>Su chiaro</figcaption>
          </figure>
          <figure>
            <Mark size={72} arrow />
            <figcaption>Variante dinamica</figcaption>
          </figure>
          <figure>
            <svg width="72" height="72" viewBox="0 0 64 64" aria-hidden="true">
              <circle cx="32" cy="32" r="30" fill="none" stroke={palette.navyLine} strokeWidth="2" />
              <text x="32" y="41" textAnchor="middle" fontSize="26" fontWeight="800" fill={palette.white}>X</text>
              <circle cx="32" cy="32" r="3.5" fill={palette.liveOrange} />
            </svg>
            <figcaption>Cerchio (favicon)</figcaption>
          </figure>
        </div>
        <ul className="pres-points">
          <li>La <strong>X</strong> di EXTRA è il segno distintivo.</li>
          <li>Una delle aste può richiamare <strong>freccia/movimento</strong>.</li>
          <li>Il <strong>punto arancione</strong> ricorda pallone / punto live / cronometro.</li>
          <li>Niente pallone realistico, scudetto o silhouette: sarebbe un portale generico.</li>
          <li>A 32×32 deve riconoscersi subito: solo simbolo, nessuna scritta dentro.</li>
        </ul>
        <p className="pres-timeline-sample">
          <TimeLine minute="90' +4'" width={280} />
        </p>
      </section>

      <section>
        <h2 className="section">Palette</h2>
        <div className="pres-palette">
          {swatches.map((s) => (
            <div className="pres-swatch" key={s.name}>
              <span className="pres-chip" style={{ background: s.hex }} />
              <div>
                <strong>{s.name}</strong>
                <div className="pres-hex">{s.hex}</div>
                <div className="muted">{s.usage}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="muted">
          Combinazione dominante <strong>Navy + Electric Blue</strong>, con{" "}
          <strong>Orange</strong> come colore caratteristico. Il verde resta secondario:
          se diventa dominante, l&apos;estetica scivola nel &quot;sito di calcio classico&quot;.
        </p>
      </section>

      <section>
        <h2 className="section">Il colore come grammatica</h2>
        <ul className="pres-grammar">
          {grammar.map((g) => (
            <li key={g.tone}>
              <span className="pres-dot" style={{ background: g.color }} />
              <strong>{g.tone}</strong>
              <span className="muted">→ {g.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="section">Il percorso</h2>
        <ol className="pres-phases">
          {phases.map((p) => (
            <li key={p.n}>
              <span className={`pres-badge pres-badge-${p.state}`}>
                {stateLabel[p.state]}
              </span>
              <strong>Fase {p.n}</strong> — {p.title}
            </li>
          ))}
        </ol>
        <p className="muted">
          Ogni fase ha valore da sola. Le fasi successive (espansione regionale, nazionale)
          dipendono dalla validazione del pilota.
        </p>
      </section>

      <section>
        <h2 className="section">Le domande aperte per te</h2>
        <ol className="pres-questions">
          <li>Cosa intendi esattamente per &quot;LIVE&quot;?</li>
          <li>Fonti dati: quali, con che diritti e con che formato?</li>
          <li>Chi inserisce e aggiorna i dati sui campi?</li>
          <li>Confermiamo gli ID condivisi YFM ↔ EXTRA TIME?</li>
          <li>YFM resta separato ma collegato allo stesso Core?</li>
        </ol>
        <p className="muted">
          Dettaglio completo in <code>docs/open-questions.md</code>.
        </p>
      </section>

      <p className="pres-back">
        <Link href="/">← Torna al portale</Link>
      </p>
    </main>
  );
}
