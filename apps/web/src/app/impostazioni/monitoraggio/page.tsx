import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { getComunicatiMonitor } from "@/lib/lnd-monitor";

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

  const mon = await getComunicatiMonitor();
  const fetched = new Date(mon.fetchedAt).toLocaleString("it-IT", { timeZone: "Europe/Rome" });

  return (
    <main className="portal">
      <section className="portal-hero settings-hero">
        <div>
          <h1>Monitoraggio calendari</h1>
          <p className="lead">Comunicati ufficiali LND Lazio che toccano i calendari. Sola lettura.</p>
        </div>
        <Link href="/impostazioni" className="settings-logout">← Impostazioni</Link>
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
                <thead>
                  <tr>
                    <th>Stato</th>
                    <th>C.U.</th>
                    <th>Area / Tipo</th>
                    <th className="team">Titolo</th>
                    <th>Aggiornamento</th>
                    <th>Data</th>
                    <th>PDF</th>
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
                      <td>{c.area} / {c.tipo}</td>
                      <td className="team">{c.titolo}</td>
                      <td>{TIPO_LABEL[c.tipoAggiornamento] ?? c.tipoAggiornamento}</td>
                      <td>{c.data}</td>
                      <td><a href={c.pdfUrl} target="_blank" rel="noopener noreferrer">apri</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <p className="muted monitor-note">
            L&apos;applicazione degli aggiornamenti resta manuale (script di import),
            con revisione. Questa vista serve a sapere <em>cosa</em> è uscito e cosa
            manca.
          </p>
        </>
      )}
    </main>
  );
}
