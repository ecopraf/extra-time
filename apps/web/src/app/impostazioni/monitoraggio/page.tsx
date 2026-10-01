import Link from "next/link";
import { redirect } from "next/navigation";
import { hasRole } from "@extra-time/database/auth";
import { currentUser } from "@/lib/session";
import { getComunicatiMonitor } from "@/lib/lnd-monitor";
import { ImportButton } from "./ImportButton";
import { ImportResultsButton } from "./ImportResultsButton";
import { ImportFromUrl } from "./ImportFromUrl";

export const dynamic = "force-dynamic";

const TIPO_LABEL: Record<string, string> = {
  "nuovo-calendario": "Nuovo calendario",
  variazione: "Variazione",
  "programma-gare": "Programma gare",
  risultati: "Risultati",
  altro: "Altro",
};

export default async function MonitoraggioPage() {
  const user = await currentUser();
  if (!user) redirect("/impostazioni/login");

  const isAdmin = hasRole(user, "ADMIN");
  const mon = await getComunicatiMonitor();
  const fetched = new Date(mon.fetchedAt).toLocaleString("it-IT", { timeZone: "Europe/Rome" });

  return (
    <main className="portal">
      <section className="portal-hero settings-hero">
        <div>
          <h1>Monitoraggio calendari</h1>
          <p className="lead">Comunicati ufficiali LND Lazio che toccano i calendari. Sola lettura.</p>
        </div>
        <Link href="/impostazioni" className="settings-back">← Torna alle Impostazioni</Link>
      </section>

      {!mon.ok ? (
        <div className="portal-card">
          <p className="error">Impossibile leggere i comunicati LND: {mon.error}</p>
        </div>
      ) : (
        <>
          <div className="portal-card monitor-summary">
            <span>Comunicati in pagina: <strong>{mon.totale}</strong></span>
            <span>Rilevanti (calendari): <strong>{mon.rilevanti.length}</strong></span>
            <span>Da rivedere: <strong className={mon.nuovi > 0 ? "monitor-new" : ""}>{mon.nuovi}</strong></span>
            <span className="muted">Aggiornato: {fetched}</span>
          </div>

          {isAdmin && <ImportFromUrl />}

          <div className="portal-card">
            {mon.rilevanti.length === 0 ? (
              <p className="empty">Nessun comunicato rilevante al momento.</p>
            ) : (
              <table className="portal-table monitor-table">
                <colgroup>
                  <col className="c-stato" />
                  <col className="c-cu" />
                  <col className="c-area" />
                  <col />
                  <col className="c-tipo" />
                  <col className="c-data" />
                  <col className="c-pdf" />
                  {isAdmin && <col className="c-azioni" />}
                </colgroup>
                <thead>
                  <tr>
                    <th>Stato</th>
                    <th>C.U.</th>
                    <th>Area / Tipo</th>
                    <th>Titolo</th>
                    <th>Aggiornamento</th>
                    <th>Data</th>
                    <th>PDF</th>
                    {isAdmin && <th>Azioni</th>}
                  </tr>
                </thead>
                <tbody>
                  {mon.rilevanti.map((c) => (
                    <tr key={c.id}>
                      <td data-label="Stato">
                        {c.seen ? (
                          <span className="monitor-badge monitor-seen">Importato</span>
                        ) : (
                          <span className="monitor-badge monitor-todo">Da rivedere</span>
                        )}
                      </td>
                      <td className="pos" data-label="C.U.">{c.numero}</td>
                      <td data-label="Area / Tipo">{c.area}<br />{c.tipo}</td>
                      <td className="monitor-title" data-label="Titolo">{c.titolo}</td>
                      <td data-label="Aggiornamento">{TIPO_LABEL[c.tipoAggiornamento] ?? c.tipoAggiornamento}</td>
                      <td data-label="Data">{c.data}</td>
                      <td data-label="PDF"><a href={c.pdfUrl} target="_blank" rel="noopener" className="monitor-pdf">apri PDF ↗</a></td>
                      {isAdmin && (
                        <td data-label="Azioni">
                          {c.tipoAggiornamento === "programma-gare" ? (
                            <ImportButton
                              pdfUrl={c.pdfUrl}
                              source={`CU${c.numero}`}
                              comunicatoId={c.id}
                              numero={c.numero}
                              area={c.area}
                              tipo={c.tipo}
                              titolo={c.titolo}
                              seen={c.seen}
                            />
                          ) : c.tipoAggiornamento === "risultati" ? (
                            <ImportResultsButton
                              pdfUrl={c.pdfUrl}
                              source={`CU${c.numero}`}
                              comunicatoId={c.id}
                              numero={c.numero}
                              area={c.area}
                              tipo={c.tipo}
                              titolo={c.titolo}
                              seen={c.seen}
                            />
                          ) : (
                            <span className="muted import-na">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <p className="muted monitor-note">
            Per i comunicati <em>Programma gare</em> usa <strong>Applica</strong>
            per aggiornare orari, date e campi delle partite esistenti; per i
            comunicati <em>Risultati</em> usa <strong>Importa risultati</strong>
            per registrare i punteggi (porta le partite a &laquo;finita&raquo; e
            aggiorna le classifiche). In entrambi i casi vedi prima
            un&apos;anteprima e poi confermi; nessuna partita viene creata. Il
            batch completo resta allo script di import.
          </p>
        </>
      )}
    </main>
  );
}
