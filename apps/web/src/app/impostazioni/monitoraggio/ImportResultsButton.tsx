"use client";

/**
 * Bottone "Importa risultati" per un comunicato LND che contiene i risultati
 * ufficiali. Flusso a due passi: anteprima (dry-run) → conferma.
 * Gemello di ImportButton (programma gare), ma registra i punteggi e porta le
 * partite a 'finished'.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Miss {
  categoria: string;
  girone: string;
  giornata: number;
  casa: string;
  ospite: string;
}
interface CategoriaBreakdown {
  categoria: string;
  risultati: number;
}
interface ImportResponse {
  ok: boolean;
  error?: string;
  dry: boolean;
  source: string;
  parsed: number;
  byCategoria: CategoriaBreakdown[];
  updated: number;
  unchanged: number;
  notFoundGroup: number;
  notFoundMatch: number;
  ambiguous: number;
  misses: Miss[];
}

type Phase = "idle" | "loading" | "preview" | "applying" | "done" | "error";

export function ImportResultsButton({
  pdfUrl,
  source,
  comunicatoId,
  numero,
  area,
  tipo,
  titolo,
}: {
  pdfUrl: string;
  source: string;
  comunicatoId?: string;
  numero?: number;
  area?: string;
  tipo?: string;
  titolo?: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<ImportResponse | null>(null);

  async function call(dry: boolean): Promise<ImportResponse> {
    const res = await fetch("/api/import-risultati", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pdfUrl, source, dry, comunicatoId, numero, area, tipo, titolo }),
    });
    const json = (await res.json()) as ImportResponse;
    if (!res.ok || !json.ok) throw new Error(json.error || `Errore HTTP ${res.status}`);
    return json;
  }

  async function onPreview() {
    setPhase("loading"); setError("");
    try { setData(await call(true)); setPhase("preview"); }
    catch (e) { setError(e instanceof Error ? e.message : "Errore sconosciuto."); setPhase("error"); }
  }
  async function onApply() {
    setPhase("applying"); setError("");
    try { setData(await call(false)); setPhase("done"); router.refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Errore sconosciuto."); setPhase("error"); }
  }
  function onClose() { setPhase("idle"); setData(null); setError(""); }

  return (
    <>
      <button
        type="button"
        className="monitor-apply-btn"
        onClick={onPreview}
        disabled={phase === "loading" || phase === "applying"}
      >
        {phase === "loading" ? "Analisi…" : "Importa risultati"}
      </button>

      {(phase === "preview" || phase === "applying" || phase === "done" || phase === "error") && (
        <div className="import-overlay" role="dialog" aria-modal="true">
          <div className="import-dialog">
            <header className="import-dialog-head">
              <h3>{phase === "done" ? "Risultati importati" : "Anteprima risultati"}</h3>
              <button type="button" className="import-close" onClick={onClose} aria-label="Chiudi">×</button>
            </header>

            <div className="import-dialog-body">
              <p className="muted import-source">{source}</p>

              {phase === "error" ? (
                <p className="error">{error}</p>
              ) : data ? (
                <>
                  <div className="import-stats">
                    <span>Risultati letti: <strong>{data.parsed}</strong></span>
                    <span>
                      {phase === "done" ? "Registrati" : "Da registrare"}:{" "}
                      <strong className="import-ok">{data.updated}</strong>
                    </span>
                    {data.unchanged > 0 && (
                      <span>Già presenti: <strong>{data.unchanged}</strong></span>
                    )}
                    {data.notFoundMatch > 0 && (
                      <span>Senza corrispondenza: <strong className="import-warn">{data.notFoundMatch}</strong></span>
                    )}
                    {data.notFoundGroup > 0 && (
                      <span>Girone non trovato: <strong className="import-warn">{data.notFoundGroup}</strong></span>
                    )}
                  </div>

                  {data.byCategoria.length > 0 && (
                    <ul className="import-cats">
                      {data.byCategoria.map((b) => (
                        <li key={b.categoria}>{b.categoria}<span>{b.risultati}</span></li>
                      ))}
                    </ul>
                  )}

                  {data.misses.length > 0 && (
                    <details className="import-misses">
                      <summary>Risultati senza corrispondenza ({data.misses.length})</summary>
                      <ul>
                        {data.misses.map((m, i) => (
                          <li key={i}>
                            <span className="import-miss-cat">{m.categoria} · Gir. {m.girone} · G{m.giornata}</span>
                            {m.casa} – {m.ospite}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </>
              ) : null}
            </div>

            <footer className="import-dialog-foot">
              {phase === "preview" && (
                <>
                  <button type="button" className="import-btn-secondary" onClick={onClose}>Annulla</button>
                  <button type="button" className="import-btn-primary" onClick={onApply}>
                    Registra {data?.updated ?? 0} risultati
                  </button>
                </>
              )}
              {phase === "applying" && <span className="muted">Registrazione in corso…</span>}
              {(phase === "done" || phase === "error") && (
                <button type="button" className="import-btn-primary" onClick={onClose}>Chiudi</button>
              )}
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
