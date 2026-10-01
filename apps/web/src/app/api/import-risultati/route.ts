/**
 * Import dei RISULTATI UFFICIALI di un comunicato LND dall'UI dell'Hub.
 *
 * Flusso: scarica il PDF → parsa i risultati → registra i punteggi sulle
 * partite già presenti nel Core (le porta a 'finished'). NON crea partite.
 *
 * Due modalità:
 *  - dry = true  → anteprima (quante partite verrebbero aggiornate, miss)
 *  - dry = false → applica realmente i punteggi
 *
 * Vincolo serverless: adatto a UN comunicato. Auth: sessione + ruolo ADMIN.
 */
import { NextResponse } from "next/server";
import { getPool, markComunicatoSeen } from "@extra-time/database";
import { hasRole } from "@extra-time/database/auth";
import {
  fetchPdfText,
  parseRisultati,
  applyRisultati,
  type Risultato,
} from "@extra-time/ingest";
import { currentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface ImportBody {
  pdfUrl?: unknown;
  source?: unknown;
  dry?: unknown;
  comunicatoId?: unknown;
  numero?: unknown;
  area?: unknown;
  tipo?: unknown;
  titolo?: unknown;
}

interface CategoriaBreakdown {
  categoria: string;
  risultati: number;
}

interface ImportResponse {
  ok: boolean;
  dry: boolean;
  source: string;
  parsed: number;
  byCategoria: CategoriaBreakdown[];
  updated: number;
  unchanged: number;
  notFoundGroup: number;
  notFoundMatch: number;
  ambiguous: number;
  misses: { categoria: string; girone: string; giornata: number; casa: string; ospite: string }[];
}

function breakdown(risultati: Risultato[]): CategoriaBreakdown[] {
  const counts = new Map<string, number>();
  for (const r of risultati) counts.set(r.categoria, (counts.get(r.categoria) ?? 0) + 1);
  return [...counts.entries()]
    .map(([categoria, n]) => ({ categoria, risultati: n }))
    .sort((a, b) => a.categoria.localeCompare(b.categoria));
}

export async function POST(request: Request) {
  // 1) Autorizzazione.
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sessione scaduta." }, { status: 401 });
  }
  if (!hasRole(user, "ADMIN")) {
    return NextResponse.json({ ok: false, error: "Permessi insufficienti." }, { status: 403 });
  }

  // 2) Parametri.
  let body: ImportBody;
  try {
    body = (await request.json()) as ImportBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Corpo della richiesta non valido." }, { status: 400 });
  }
  const pdfUrl = typeof body.pdfUrl === "string" ? body.pdfUrl.trim() : "";
  const source = typeof body.source === "string" && body.source.trim() ? body.source.trim() : "";
  const dry = body.dry !== false;
  const comunicatoId = typeof body.comunicatoId === "string" ? body.comunicatoId.trim() : "";
  const numero = typeof body.numero === "number" ? body.numero : null;
  const area = typeof body.area === "string" ? body.area.trim() : null;
  const tipo = typeof body.tipo === "string" ? body.tipo.trim() : null;
  const titolo = typeof body.titolo === "string" ? body.titolo.trim() : null;

  if (!/^https:\/\/[^\s]+\.pdf$/i.test(pdfUrl)) {
    return NextResponse.json({ ok: false, error: "URL del PDF non valido." }, { status: 400 });
  }

  try {
    // 3) Scarica + parsa.
    const text = await fetchPdfText(pdfUrl);
    const risultati = parseRisultati(text);
    if (risultati.length === 0) {
      return NextResponse.json({
        ok: false,
        error: "Nessun risultato riconosciuto nel comunicato (non contiene 'Risultati Ufficiali'?).",
      }, { status: 422 });
    }

    // 4) Applica (o simula con dry).
    const result = await applyRisultati(getPool(), risultati, { dry });

    // 5) Dopo un'applicazione reale riuscita, marca il comunicato come visto.
    if (!dry && comunicatoId) {
      try {
        await markComunicatoSeen({
          id: comunicatoId, numero, area, tipo, titolo,
          source: source || null, appliedBy: user.id,
        });
      } catch {
        // best-effort
      }
    }

    const payload: ImportResponse = {
      ok: true,
      dry,
      source: source || pdfUrl,
      parsed: risultati.length,
      byCategoria: breakdown(risultati),
      updated: result.updated,
      unchanged: result.unchanged,
      notFoundGroup: result.notFoundGroup,
      notFoundMatch: result.notFoundMatch,
      ambiguous: result.ambiguous,
      misses: result.misses.slice(0, 50).map((m) => ({
        categoria: m.categoria, girone: m.girone, giornata: m.giornata,
        casa: m.casa, ospite: m.ospite,
      })),
    };
    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore durante l'import.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
