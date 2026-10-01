/**
 * Import di un SINGOLO comunicato "programma gare" LND dall'UI dell'Hub.
 *
 * Flusso: scarica il PDF → parsa le gare → applica orari/date/campi alle
 * partite già presenti nel Core (NON crea partite).
 *
 * Due modalità:
 *  - dry = true  → anteprima: calcola quante partite verrebbero aggiornate e
 *                  quali non trovano corrispondenza. Non scrive nulla.
 *  - dry = false → applica realmente gli aggiornamenti.
 *
 * Vincolo serverless: adatto a UN comunicato (poche decine di gare). Il batch
 * pesante di tutti i comunicati resta alla GitHub Action.
 *
 * Auth: sessione utente (cookie et_session) + ruolo ADMIN.
 */
import { NextResponse } from "next/server";
import { getPool, markComunicatoSeen } from "@extra-time/database";
import { hasRole } from "@extra-time/database/auth";
import {
  fetchComunicatoText,
  parseProgrammaGare,
  applyProgrammaGare,
  type Gara,
} from "@extra-time/ingest";
import { currentUser } from "@/lib/session";

// pdf-parse richiede il runtime Node (non Edge); l'import può essere lungo.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface ImportBody {
  pdfUrl?: unknown;
  source?: unknown;
  dry?: unknown;
  // Metadati del comunicato: usati per marcarlo "visto" dopo l'applicazione.
  comunicatoId?: unknown; // "<area>/<tipo>/<numero>"
  numero?: unknown;
  area?: unknown;
  tipo?: unknown;
  titolo?: unknown;
}

interface CategoriaBreakdown {
  categoria: string;
  gare: number;
}

interface ImportResponse {
  ok: boolean;
  dry: boolean;
  source: string;
  parsed: number;
  byCategoria: CategoriaBreakdown[];
  updated: number;
  notFoundGroup: number;
  notFoundMatch: number;
  ambiguous: number;
  misses: { categoria: string; girone: string; giornata: number; casa: string; ospite: string }[];
}

function breakdown(gare: Gara[]): CategoriaBreakdown[] {
  const counts = new Map<string, number>();
  for (const g of gare) counts.set(g.categoria, (counts.get(g.categoria) ?? 0) + 1);
  return [...counts.entries()]
    .map(([categoria, n]) => ({ categoria, gare: n }))
    .sort((a, b) => a.categoria.localeCompare(b.categoria));
}

export async function POST(request: Request) {
  // 1) Autorizzazione: sessione valida con ruolo ADMIN.
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
  const dry = body.dry !== false; // default: anteprima (sicuro)
  const comunicatoId = typeof body.comunicatoId === "string" ? body.comunicatoId.trim() : "";
  const numero = typeof body.numero === "number" ? body.numero : null;
  const area = typeof body.area === "string" ? body.area.trim() : null;
  const tipo = typeof body.tipo === "string" ? body.tipo.trim() : null;
  const titolo = typeof body.titolo === "string" ? body.titolo.trim() : null;

  if (!/^https:\/\/[^\s]+\.(pdf|zip)$/i.test(pdfUrl)) {
    return NextResponse.json({ ok: false, error: "URL del comunicato non valido (atteso .pdf o .zip)." }, { status: 400 });
  }

  try {
    // 3) Scarica + parsa (PDF o ZIP/DOCX).
    const text = await fetchComunicatoText(pdfUrl);
    const gare = parseProgrammaGare(text);
    if (gare.length === 0) {
      return NextResponse.json({
        ok: false,
        error: "Nessuna gara riconosciuta nel comunicato (formato non 'programma gare'?).",
      }, { status: 422 });
    }

    // 4) Applica (o simula con dry).
    const result = await applyProgrammaGare(getPool(), gare, {
      dry,
      source: source || undefined,
    });

    // 5) Dopo un'applicazione reale riuscita, marca il comunicato come "visto"
    //    (sul DB, scrivibile anche in produzione) così il badge e lo stato
    //    "Da rivedere" nel Monitoraggio si aggiornano. Non blocca la risposta
    //    se la marcatura fallisce.
    if (!dry && comunicatoId) {
      try {
        await markComunicatoSeen({
          id: comunicatoId,
          numero,
          area,
          tipo,
          titolo,
          source: source || null,
          appliedBy: user.id,
        });
      } catch {
        // best-effort: l'import è andato, la marcatura è secondaria
      }
    }

    const payload: ImportResponse = {
      ok: true,
      dry,
      source: source || pdfUrl,
      parsed: gare.length,
      byCategoria: breakdown(gare),
      updated: result.updated,
      notFoundGroup: result.notFoundGroup,
      notFoundMatch: result.notFoundMatch,
      ambiguous: result.ambiguous,
      misses: result.misses.slice(0, 50).map((m) => ({
        categoria: m.categoria,
        girone: m.girone,
        giornata: m.giornata,
        casa: m.casa,
        ospite: m.ospite,
      })),
    };
    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore durante l'import.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
