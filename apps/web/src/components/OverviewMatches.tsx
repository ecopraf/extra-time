"use client";

import { useMemo, useState } from "react";
import { TeamBadge } from "@/components/TeamBadge";
import { formatRoundDate, formatMatchCell } from "@/lib/format";

/**
 * Card della Panoramica girone con due pill: "Ultimi risultati" e "Prossime
 * partite". Ogni pill mostra una giornata alla volta, navigabile con le frecce
 * ‹ ›. Default: "Prossime partite". Dati (già pronti dal server) passati come props.
 *
 * La data della giornata è derivata dalle partite mostrate: se la giornata è
 * tutta lo stesso giorno mostra la data piena, se copre più giorni mostra un
 * intervallo (es. "06/09 – 07/09") e ogni riga porta la propria data.
 */

export interface OverviewMatch {
  id: string;
  matchday: number | null;
  homeName: string;
  awayName: string;
  homeLogo: string | null;
  awayLogo: string | null;
  homeScore: number | null;
  awayScore: number | null;
  kickoffAt: string | null; // ISO calcio d'inizio (null = da definire)
}

type Tab = "results" | "upcoming";

/** Raggruppa le partite per giornata, ordinate. */
function byMatchday(matches: OverviewMatch[], asc: boolean) {
  const map = new Map<number, OverviewMatch[]>();
  for (const m of matches) {
    const md = m.matchday ?? 0;
    if (!map.has(md)) map.set(md, []);
    map.get(md)!.push(m);
  }
  const days = [...map.keys()].sort((a, b) => (asc ? a - b : b - a));
  return days.map((md) => ({ matchday: md, matches: map.get(md)! }));
}

export function OverviewMatches({
  played,
  upcoming,
}: {
  played: OverviewMatch[];
  upcoming: OverviewMatch[];
}) {
  const hasResults = played.length > 0;
  // Default: se ci sono risultati parti da lì (si vede subito l'ultima giornata
  // giocata), altrimenti dalle prossime partite.
  const [tab, setTab] = useState<Tab>(hasResults ? "results" : "upcoming");

  // Entrambi i tab ordinati per giornata CRESCENTE (1 → N): così le frecce sono
  // coerenti (‹ = giornata precedente, › = successiva) in entrambe le viste.
  const resultRounds = useMemo(() => byMatchday(played, true), [played]);
  const upcomingRounds = useMemo(() => byMatchday(upcoming, true), [upcoming]);

  const rounds = tab === "results" ? resultRounds : upcomingRounds;
  // Indice iniziale: per i risultati l'ultima giornata giocata (la più recente),
  // per le prossime la prima in programma.
  const initialIdx = (t: Tab, rs: typeof rounds) => (t === "results" ? Math.max(0, rs.length - 1) : 0);
  const [idx, setIdx] = useState(() => initialIdx(hasResults ? "results" : "upcoming", hasResults ? resultRounds : upcomingRounds));

  // reset indice quando cambio tab (risultati → ultima, prossime → prima)
  const switchTab = (t: Tab) => {
    setTab(t);
    setIdx(initialIdx(t, t === "results" ? resultRounds : upcomingRounds));
  };

  const round = rounds[Math.min(idx, Math.max(0, rounds.length - 1))];
  const prev = () => setIdx((i) => Math.max(0, i - 1));
  const next = () => setIdx((i) => Math.min(rounds.length - 1, i + 1));

  // Data della giornata: piena se un solo giorno, intervallo se più giorni.
  const roundIsos = round ? round.matches.map((m) => m.kickoffAt) : [];
  const roundDate = formatRoundDate(roundIsos);
  const roundDays = new Set(
    roundIsos.filter((x): x is string => !!x).map((x) => x.slice(0, 10)),
  );
  const roundMultiDay = roundDays.size > 1;

  return (
    <div className="portal-card portal-overview-card">
      <div className="portal-pill-row">
        <button
          className={`portal-pill ${tab === "results" ? "active" : ""}`}
          onClick={() => switchTab("results")}
          disabled={!hasResults}
          title={hasResults ? "" : "Nessun risultato ancora"}
        >
          Ultimi risultati
        </button>
        <button
          className={`portal-pill ${tab === "upcoming" ? "active" : ""}`}
          onClick={() => switchTab("upcoming")}
          disabled={upcoming.length === 0}
        >
          Prossime partite
        </button>
      </div>

      {!round ? (
        <p className="empty">
          {tab === "results" ? "Nessun risultato disponibile." : "Nessuna partita in programma."}
        </p>
      ) : (
        <>
          <div className="portal-round-nav">
            <button
              className="portal-carousel-arrow"
              onClick={prev}
              disabled={idx === 0}
              aria-label="Giornata precedente"
            >
              &lsaquo;
            </button>
            <span className="portal-round-label">
              Giornata {round.matchday || "?"}
              {roundDate ? ` · ${roundDate}` : ""}
            </span>
            <button
              className="portal-carousel-arrow"
              onClick={next}
              disabled={idx >= rounds.length - 1}
              aria-label="Giornata successiva"
            >
              &rsaquo;
            </button>
          </div>

          <div>
            {round.matches.map((m) => (
              <div key={m.id} className="portal-match">
                <span className="home">
                  <TeamBadge name={m.homeName} logo={m.homeLogo} nameFirst />
                </span>
                <span className={`score${tab === "upcoming" ? " next" : ""}`}>
                  {tab === "results"
                    ? `${m.homeScore} - ${m.awayScore}`
                    : formatMatchCell(m.kickoffAt, roundMultiDay)}
                </span>
                <span className="away">
                  <TeamBadge name={m.awayName} logo={m.awayLogo} />
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
