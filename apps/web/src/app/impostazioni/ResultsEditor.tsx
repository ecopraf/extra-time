"use client";

import { useMemo, useState } from "react";
import { TeamBadge } from "@/components/TeamBadge";
import { recordResultAction } from "./actions";

/**
 * Editor risultati stile "prossime partite": una giornata alla volta,
 * navigabile con le frecce ‹ ›, stesso layout allineato (logo · nome ·
 * punteggio · nome · logo). Ogni riga salva il risultato in autonomia.
 */
export interface EditorMatch {
  id: string;
  matchday: number | null;
  homeName: string;
  awayName: string;
  homeLogo: string | null;
  awayLogo: string | null;
  homeScore: number | null;
  awayScore: number | null;
  finished: boolean;
  dateLabel: string | null; // data della partita (già formattata gg/mm/aaaa)
}

function byMatchday(matches: EditorMatch[]) {
  const map = new Map<number, EditorMatch[]>();
  for (const m of matches) {
    const md = m.matchday ?? 0;
    if (!map.has(md)) map.set(md, []);
    map.get(md)!.push(m);
  }
  return [...map.keys()].sort((a, b) => a - b).map((md) => ({ matchday: md, matches: map.get(md)! }));
}

function Row({ m, showDate }: { m: EditorMatch; showDate: boolean }) {
  const [home, setHome] = useState(m.homeScore?.toString() ?? "");
  const [away, setAway] = useState(m.awayScore?.toString() ?? "");
  const [state, setState] = useState<"idle" | "saving" | "ok" | "error">(m.finished ? "ok" : "idle");
  const [msg, setMsg] = useState("");

  async function save() {
    if (home === "" || away === "") { setState("error"); setMsg("Inserisci entrambi i gol."); return; }
    setState("saving"); setMsg("");
    const fd = new FormData();
    fd.set("matchId", m.id);
    fd.set("homeScore", home);
    fd.set("awayScore", away);
    const res = await recordResultAction(fd);
    if (res.ok) { setState("ok"); setMsg(""); }
    else { setState("error"); setMsg(res.message); }
  }

  return (
    <div className={`bo-result-row ${state === "ok" ? "is-saved" : ""}`}>
      <span className="home"><TeamBadge name={m.homeName} logo={m.homeLogo} nameFirst /></span>
      <span className="bo-score-box">
        <input className="score" type="number" min="0" value={home}
          onChange={(e) => { setHome(e.target.value); setState("idle"); }} aria-label={`Gol ${m.homeName}`} />
        <span className="bo-score-sep">-</span>
        <input className="score" type="number" min="0" value={away}
          onChange={(e) => { setAway(e.target.value); setState("idle"); }} aria-label={`Gol ${m.awayName}`} />
      </span>
      <span className="away"><TeamBadge name={m.awayName} logo={m.awayLogo} /></span>
      <button type="button" className="bo-save" onClick={save} disabled={state === "saving"}>
        {state === "saving" ? "…" : state === "ok" ? "✓" : "Salva"}
      </button>
      {showDate && m.dateLabel ? <span className="bo-row-date">{m.dateLabel}</span> : null}
      {msg ? <span className="bo-save-msg error">{msg}</span> : null}
    </div>
  );
}

export function ResultsEditor({ matches }: { matches: EditorMatch[] }) {
  const rounds = useMemo(() => byMatchday(matches), [matches]);
  // Parti dalla prima giornata con partite non ancora refertate, se esiste.
  const firstOpen = Math.max(0, rounds.findIndex((r) => r.matches.some((m) => !m.finished)));
  const [idx, setIdx] = useState(firstOpen);

  if (rounds.length === 0) return <p className="empty">Nessuna partita in questo girone.</p>;
  const round = rounds[Math.min(idx, rounds.length - 1)]!;
  // Data della giornata: mostrata se tutte le partite sono lo stesso giorno.
  const dates = [...new Set(round.matches.map((m) => m.dateLabel).filter(Boolean))];
  const roundDate = dates.length === 1 ? dates[0] : null;

  return (
    <div>
      <div className="portal-round-nav">
        <button className="portal-carousel-arrow" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} aria-label="Giornata precedente">&lsaquo;</button>
        <span className="portal-round-label">
          Giornata {round.matchday || "?"}{roundDate ? ` · ${roundDate}` : ""}
        </span>
        <button className="portal-carousel-arrow" onClick={() => setIdx((i) => Math.min(rounds.length - 1, i + 1))} disabled={idx >= rounds.length - 1} aria-label="Giornata successiva">&rsaquo;</button>
      </div>
      <div className="bo-results">
        {round.matches.map((m) => (<Row key={m.id} m={m} showDate={!roundDate} />))}
      </div>
    </div>
  );
}
