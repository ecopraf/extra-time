"use client";

import { useMemo, useState } from "react";
import { TeamBadge } from "@/components/TeamBadge";

/**
 * Card della Panoramica girone con due pill: "Ultimi risultati" e "Prossime
 * partite". Ogni pill mostra una giornata alla volta, navigabile con le frecce
 * ‹ ›. Default: "Prossime partite". Dati (già pronti dal server) passati come props.
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
  timeLabel: string; // orario/data già formattato per le prossime
  dateLabel: string; // data della giornata (per l'intestazione)
  sameDay: boolean; // true se la giornata è tutta lo stesso giorno
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
  const [tab, setTab] = useState<Tab>(hasResults ? "upcoming" : "upcoming");

  // giornate: risultati dal più recente, prossime dal più imminente
  const resultRounds = useMemo(() => byMatchday(played, false), [played]);
  const upcomingRounds = useMemo(() => byMatchday(upcoming, true), [upcoming]);

  const rounds = tab === "results" ? resultRounds : upcomingRounds;
  const [idx, setIdx] = useState(0);

  // reset indice quando cambio tab
  const switchTab = (t: Tab) => {
    setTab(t);
    setIdx(0);
  };

  const round = rounds[Math.min(idx, Math.max(0, rounds.length - 1))];
  const prev = () => setIdx((i) => Math.max(0, i - 1));
  const next = () => setIdx((i) => Math.min(rounds.length - 1, i + 1));

  // La giornata mostra la data in testa se tutte le sue partite sono lo stesso giorno.
  const dates = round ? [...new Set(round.matches.map((m) => m.dateLabel))] : [];
  const roundSameDay = dates.length === 1;
  const roundDate = roundSameDay ? dates[0] : "";

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
                    : m.timeLabel}
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
