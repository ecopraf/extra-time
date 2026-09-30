import Link from "next/link";
import { redirect } from "next/navigation";
import { hasRole } from "@extra-time/database/auth";
import { currentUser } from "@/lib/session";
import { getComunicatiMonitor } from "@/lib/lnd-monitor";
import { ImportButton } from "./ImportButton";

export const dynamic = "force-dynamic";

const TIPO_LABEL: Record<string, string> = {
  "nuovo-calendario": "Nuovo calendario",
  variazione: "Variazione",
  "programma-gare": "Programma gare",
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
                      <td>
                        {c.seen ? (
                          <span className="monitor-badge monitor-seen">Importato</span>
                        ) : (
                          <span className="monitor-badge monitor-todo">Da rivedere</span>
                        )}
                      </td>
                      <td className="pos">{c.numero}</td>
                      <td>{c.area}<br />{c.tipo}</td>
                      <td className="monitor-title">{c.titolo}</td>
                      <td>{TIPO_LABEL[c.tipoAggiornamento] ?? c.tipoAggiornamento}</td>
                      <td>{c.data}</td>
                      <td><a href={c.pdfUrl} target="_blank" rel="noopener" className="monitor-pdf">apri PDF ↗</a></td>
                      {isAdmin && (
                        <td>
                          {c.tipoAggiornamento === "programma-gare" ? (
                            <ImportButton pdfUrl={c.pdfUrl} source={`CU${c.numero}`} />
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
            Per i comunicati <em>Programma gare</em> puoi applicare gli orari
            direttamente da qui con <strong>Applica</strong>: prima vedi
            un&apos;anteprima (quante partite verrebbero aggiornate) e poi
            confermi. Aggiorna date, orari e campi delle partite già presenti
            &mdash; non ne crea di nuove. Il batch completo di tutti i comunicati
            resta allo script di import.
          </p>
        </>
      )}
    </main>
  );
}
