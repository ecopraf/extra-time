"use client";

/**
 * Import "da URL": incolla il link di un comunicato LND (PDF o ZIP/DOCX) e
 * applicalo, utile per i comunicati non presenti nella lista (vecchi o non
 * ancora caricati nell'HTML server-side). Auto-rileva programma gare / risultati.
 * Flusso a due passi: anteprima (dry) → conferma.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";

interface SectionResult {
  tipo: "programma-gare" | "risultati" | "variazioni";
  parsed: number;
  updated: number;
  unchanged?: number;
  notFoundGroup: number;
  notFoundMatch: number;
  ambiguous: number;
}
interface ImportResponse {
  ok: boolean;
  error?: string;
  dry: boolean;
  url: string;
  sezioni: SectionResult[];
  message: string;
}

type Phase = "idle" | "loading" | "preview" | "applying" | "done" | "error";

const TIPO_LABEL: Record<string, string> = {
  "programma-gare": "Programma gare (orari/date)",
  risultati: "Risultati (punteggi)",
  variazioni: "Variazioni (campo/orario/data)",
};

export function ImportFromUrl() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [data, setData] = useState<ImportResponse | null>(null);

  async function call(dry: boolean): Promise<ImportResponse> {
    const res = await fetch("/api/import-url", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: url.trim(), dry }),
    });
    const json = (await res.json()) as ImportResponse;
    if (!res.ok || !json.ok) throw new Error(json.error || `Errore HTTP ${res.status}`);
    return json;
  }

  async function onPreview() {
    if (!url.trim()) return;
    setPhase("loading"); setError("");
    try { setData(await call(true)); setPhase("preview"); }
    catch (e) { setError(e instanceof Error ? e.message : "Errore sconosciuto."); setPhase("error"); }
  }
  async function onApply() {
    setPhase("applying"); setError("");
    try { setData(await call(false)); setPhase("done"); router.refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Errore sconosciuto."); setPhase("error"); }
  }
  function reset() { setPhase("idle"); setData(null); setError(""); }

  return (
    <div className="portal-card import-url-card">
      <h3>Importa da URL</h3>
      <p className="muted import-url-hint">
        Per un comunicato non in elenco: incolla il link del PDF o dello ZIP del
        comunicato LND. Riconosce da solo se contiene orari (programma gare),
        risultati o variazioni (cambi di campo/orario/data), mostra
        un&apos;anteprima e poi applichi.
      </p>
      <div className="import-url-row">
        <input
          type="url"
          className="import-url-input"
          placeholder="https://comunicatilazio.it/storage/…/COMUNICATO_UFFICIALE_NN.pdf"
          value={url}
          onChange={(e) => { setUrl(e.target.value); if (phase !== "idle") reset(); }}
          disabled={phase === "loading" || phase === "applying"}
        />
        <button
          type="button"
          className="import-btn-primary"
          onClick={onPreview}
          disabled={!url.trim() || phase === "loading" || phase === "applying"}
        >
          {phase === "loading" ? "Analisi…" : "Analizza"}
        </button>
      </div>

      {phase === "error" && <p className="error import-url-msg">{error}</p>}

      {(phase === "preview" || phase === "applying" || phase === "done") && data && (
        <div className="import-url-result">
          <ul className="import-url-sections">
            {data.sezioni.map((s) => (
              <li key={s.tipo}>
                <strong>{TIPO_LABEL[s.tipo] ?? s.tipo}</strong>:{" "}
                <span className="import-ok">{s.updated}</span> / {s.parsed}
                {typeof s.unchanged === "number" && s.unchanged > 0 ? ` (già ${s.unchanged})` : ""}
                {s.notFoundMatch > 0 ? ` · ${s.notFoundMatch} senza corrispondenza` : ""}
              </li>
            ))}
          </ul>
          {phase === "preview" && (
            <div className="import-url-actions">
              <button type="button" className="import-btn-secondary" onClick={reset}>Annulla</button>
              <button type="button" className="import-btn-primary" onClick={onApply}>Applica</button>
            </div>
          )}
          {phase === "applying" && <span className="muted">Applicazione in corso…</span>}
          {phase === "done" && (
            <div className="import-url-actions">
              <span className="import-ok">✓ {data.message}</span>
              <button type="button" className="import-btn-secondary" onClick={reset}>Nuovo</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
