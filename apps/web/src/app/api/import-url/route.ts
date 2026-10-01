/**
 * Import "da URL" di un comunicato LND (PDF o ZIP/DOCX) incollando il link.
 *
 * Scarica il testo UNA volta, poi auto-rileva il contenuto:
 *  - se contiene un programma gare → applica orari/date (applyProgrammaGare)
 *  - se contiene risultati ufficiali → registra i punteggi (applyRisultati)
 * Un comunicato può contenere entrambi: in tal caso applica entrambi.
 *
 * Due modalità: dry = true (anteprima) / dry = false (applica).
 * Auth: sessione + ruolo ADMIN.
 */
import { NextResponse } from "next/server";
import { getPool } from "@extra-time/database";
import { hasRole } from "@extra-time/database/auth";
import {
  fetchComunicatoText,
  parseProgrammaGare,
  applyProgrammaGare,
  parseRisultati,
  applyRisultati,
} from "@extra-time/ingest";
import { currentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Body {
  url?: unknown;
  dry?: unknown;
}

interface SectionResult {
  tipo: "programma-gare" | "risultati";
  parsed: number;
  updated: number;
  unchanged?: number;
  notFoundGroup: number;
  notFoundMatch: number;
  ambiguous: number;
}

interface ImportResponse {
  ok: boolean;
  dry: boolean;
  url: string;
  sezioni: SectionResult[];
  message: string;
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sessione scaduta." }, { status: 401 });
  if (!hasRole(user, "ADMIN")) return NextResponse.json({ ok: false, error: "Permessi insufficienti." }, { status: 403 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Corpo della richiesta non valido." }, { status: 400 });
  }
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const dry = body.dry !== false;

  if (!/^https:\/\/[^\s]+\.(pdf|zip)$/i.test(url)) {
    return NextResponse.json({ ok: false, error: "URL non valido (atteso un link .pdf o .zip)." }, { status: 400 });
  }

  try {
    const text = await fetchComunicatoText(url);
    const gare = parseProgrammaGare(text);
    const risultati = parseRisultati(text);

    if (gare.length === 0 && risultati.length === 0) {
      return NextResponse.json({
        ok: false,
        error: "Nel comunicato non ho riconosciuto né un programma gare né risultati ufficiali.",
      }, { status: 422 });
    }

    const sezioni: SectionResult[] = [];

    if (gare.length > 0) {
      const r = await applyProgrammaGare(getPool(), gare, { dry });
      sezioni.push({
        tipo: "programma-gare",
        parsed: gare.length,
        updated: r.updated,
        notFoundGroup: r.notFoundGroup,
        notFoundMatch: r.notFoundMatch,
        ambiguous: r.ambiguous,
      });
    }
    if (risultati.length > 0) {
      const r = await applyRisultati(getPool(), risultati, { dry });
      sezioni.push({
        tipo: "risultati",
        parsed: risultati.length,
        updated: r.updated,
        unchanged: r.unchanged,
        notFoundGroup: r.notFoundGroup,
        notFoundMatch: r.notFoundMatch,
        ambiguous: r.ambiguous,
      });
    }

    const parts = sezioni.map((s) =>
      `${s.tipo === "risultati" ? "risultati" : "programma gare"}: ${s.updated}/${s.parsed}`,
    );
    const verb = dry ? "Anteprima" : "Applicato";
    const payload: ImportResponse = {
      ok: true,
      dry,
      url,
      sezioni,
      message: `${verb} — ${parts.join(" · ")}`,
    };
    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore durante l'import.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
