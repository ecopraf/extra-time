import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Scout — EXTRA TIME" };

export default function ScoutPage() {
  return (
    <ComingSoon
      title="Scout Platform"
      phase="In arrivo · Fase 6"
      lead="La piattaforma per dare visibilità ai talenti del calcio dilettantistico e giovanile."
    >
      <p>
        Lo Scout non sarà subito un &laquo;marketplace dei giocatori&raquo;, ma
        prima un <strong>database di scouting</strong> con filtri (categoria, anno,
        regione, ruolo, piede, presenze, gol, assist, minuti) e tracciamento delle
        segnalazioni. Poi il profilo scouting: dati oggettivi &rarr; statistiche
        &rarr; video &rarr; report dell&apos;osservatore.
      </p>
      <p>
        Arriverà nella <strong>Fase 6</strong>, costruita sui profili giocatore
        della Fase 5.
      </p>
    </ComingSoon>
  );
}
