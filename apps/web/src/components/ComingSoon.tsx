import type { ReactNode } from "react";

/**
 * Sezione "In arrivo": banner onesto per le aree del prodotto non ancora
 * sviluppate (News = Fase 3, Scout = Fase 6). Comunica la visione senza
 * mostrare dati finti.
 */
export function ComingSoon({
  title,
  lead,
  phase,
  children,
}: {
  title: string;
  lead: string;
  phase: string;
  children?: ReactNode;
}) {
  return (
    <main className="portal">
      <section className="portal-hero">
        <span className="portal-badge">{phase}</span>
        <h1>{title}</h1>
        <p className="lead">{lead}</p>
      </section>

      <section className="portal-section">
        <div className="portal-card portal-soon">
          <h3>In costruzione</h3>
          {children}
        </div>
      </section>
    </main>
  );
}
