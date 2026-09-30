"use client";

import { useState, type ReactNode } from "react";

/**
 * Tab della pagina girone: Panoramica / Calendario / Squadre.
 * Riceve i contenuti già renderizzati dal server (nessuna fetch client):
 * cambiare tab è pura presentazione, istantaneo, senza reload.
 * "Risultati" non è un tab a sé: le partite giocate sono nel Calendario
 * (col punteggio) e nella Panoramica (ultima giornata).
 */

export interface GroupTabsProps {
  overview: ReactNode;
  calendar: ReactNode;
  teams: ReactNode;
}

const TABS = [
  { id: "overview", label: "Panoramica" },
  { id: "calendar", label: "Calendario" },
  { id: "teams", label: "Squadre" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function GroupTabs(props: GroupTabsProps) {
  const [active, setActive] = useState<TabId>("overview");

  return (
    <div>
      <div className="portal-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            className={active === t.id ? "active" : ""}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {active === "overview" && props.overview}
        {active === "calendar" && props.calendar}
        {active === "teams" && props.teams}
      </div>
    </div>
  );
}
