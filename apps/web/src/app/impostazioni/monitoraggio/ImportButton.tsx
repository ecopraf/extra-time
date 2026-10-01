"use client";

/**
 * Bottone "Applica" per un comunicato programma gare del monitoraggio.
 *
 * Flusso a due passi (sicuro):
 *  1) Anteprima (dry-run): chiama /api/import-comunicato con dry=true e mostra
 *     quante partite verrebbero aggiornate e quali non trovano corrispondenza.
 *  2) Conferma: richiama con dry=false per applicare davvero gli orari/date.
 *
 * Adatto a UN comunicato (poche decine di gare): resta nei limiti serverless.
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
  gare: number;
}
interface ImportResponse {
  ok: boolean;
  error?: string;
  dry: boolean;
  source: string;
  parsed: number;
  byCategoria: CategoriaBreakdown[];
  updated: number;
  notFoundGroup: number;
  notFoundMatch: number;
  ambiguous: number;
  misses: Miss[];
}

type Phase = "idle" | "loading" | "preview" | "applying" | "done" | "error";

export function ImportButton({
  pdfUrl,
  source,
  comunicatoId,
  numero,
  area,
  tipo,
  titolo,
  seen = false,
}: {
  pdfUrl: string;
  source: string;
  comunicatoId?: string;
  numero?: number;
  area?: string;
  tipo?: string;
  titolo?: string;
  seen?: boolean;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<ImportResponse | null>(null);
  // Mostra lo stato "applicato" se il comunicato è già stato importato
  // (dal DB, c.seen) oppure appena applicato in questa sessione.
  const [justApplied, setJustApplied] = useState(false);
  const applied = seen || justApplied;

  async function call(dry: boolean): Promise<ImportResponse> {
    const res = await fetch("/api/import-comunicato", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pdfUrl, source, dry, comunicatoId, numero, area, tipo, titolo }),
    });
    const json = (await res.json()) as ImportResponse;
    if (!res.ok || !json.ok) {
      throw new Error(json.error || `Errore HTTP ${res.status}`);
    }
    return json;
  }

  async function onPreview() {
    setPhase("loading");
    setError("");
    try {
      setData(await call(true));
      setPhase("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore sconosciuto.");
      setPhase("error");
    }
  }

  async function onApply() {
    setPhase("applying");
    setError("");
    try {
      setData(await call(false));
      setPhase("done");
      setJustApplied(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore sconosciuto.");
      setPhase("error");
    }
  }

  function onClose() {
    setPhase("idle");
    setData(null);
    setError("");
  }

  return (
    <>
      <button
        type="button"
        className={`monitor-apply-btn${applied ? " is-applied" : ""}`}
        onClick={onPreview}
        disabled={phase === "loading" || phase === "applying"}
        title={applied ? "Già applicato — puoi riapplicare" : "Applica orari/date"}
      >
        {phase === "loading" ? "Analisi…" : applied ? "✓ Riapplica" : "Applica"}
      </button>

      {(phase === "preview" || phase === "applying" || phase === "done" || phase === "error") && (
        <div className="import-overlay" role="dialog" aria-modal="true">
          <div className="import-dialog">
            <header className="import-dialog-head">
              <h3>{phase === "done" ? "Import completato" : "Anteprima import"}</h3>
              <button type="button" className="import-close" onClick={onClose} aria-label="Chiudi">×</button>
            </header>

            <div className="import-dialog-body">
              <p className="muted import-source">{source}</p>

              {phase === "error" ? (
                <p className="error">{error}</p>
              ) : data ? (
                <>
                  <div className="import-stats">
                    <span>Gare lette: <strong>{data.parsed}</strong></span>
                    <span>
                      {phase === "done" ? "Aggiornate" : "Da aggiornare"}:{" "}
                      <strong className="import-ok">{data.updated}</strong>
                    </span>
                    {data.notFoundMatch > 0 && (
                      <span>Senza corrispondenza: <strong className="import-warn">{data.notFoundMatch}</strong></span>
                    )}
                    {data.notFoundGroup > 0 && (
                      <span>Girone non trovato: <strong className="import-warn">{data.notFoundGroup}</strong></span>
                    )}
                    {data.ambiguous > 0 && (
                      <span>Ambigue: <strong className="import-warn">{data.ambiguous}</strong></span>
                    )}
                  </div>

                  {data.byCategoria.length > 0 && (
                    <ul className="import-cats">
                      {data.byCategoria.map((b) => (
                        <li key={b.categoria}>{b.categoria}<span>{b.gare}</span></li>
                      ))}
                    </ul>
                  )}

                  {data.misses.length > 0 && (
                    <details className="import-misses">
                      <summary>Partite senza corrispondenza ({data.misses.length})</summary>
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
                    Applica {data?.updated ?? 0} aggiornamenti
                  </button>
                </>
              )}
              {phase === "applying" && <span className="muted">Applicazione in corso…</span>}
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
