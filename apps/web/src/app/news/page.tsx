import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "News — EXTRA TIME" };

export default function NewsPage() {
  return (
    <ComingSoon
      title="News"
      phase="In arrivo · Fase 3"
      lead="L'area editoriale di EXTRA TIME: notizie sul calcio dilettantistico e giovanile."
    >
      <p>
        Le News non saranno articoli isolati, ma contenuti <strong>collegati ai
        dati</strong>: competizioni, squadre, partite, giocatori, marcatori e
        classifiche. Questo permetterà di generare automaticamente approfondimenti
        come &laquo;Le ultime 5 partite dell&apos;Albalonga&raquo; o &laquo;I
        capocannonieri del girone&raquo;.
      </p>
      <p>
        Arriverà nella <strong>Fase 3</strong> della roadmap, dopo il completamento
        del database di campionati e squadre.
      </p>
    </ComingSoon>
  );
}
