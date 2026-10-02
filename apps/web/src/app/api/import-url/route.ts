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
import { getPool, markComunicatoSeen } from "@extra-time/database";
import { hasRole } from "@extra-time/database/auth";
import {
  fetchComunicatoText,
  parseProgrammaGare,
  applyProgrammaGare,
  parseRisultati,
  applyRisultati,
  parseVariazioni,
  applyVariazioni,
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
    const variazioni = parseVariazioni(text);

    if (gare.length === 0 && risultati.length === 0 && variazioni.length === 0) {
      return NextResponse.json({
        ok: false,
        error: "Nel comunicato non ho riconosciuto né un programma gare, né risultati ufficiali, né variazioni.",
      }, { status: 422 });
    }

    const sezioni: SectionResult[] = [];
    // Settore dal path dell'URL: .../Regionali/SGS/... → giovanili, altrimenti dilettanti.
    const settore: "giovanili" | "dilettanti" = /\/SGS\//i.test(url) ? "giovanili" : "dilettanti";

    if (gare.length > 0) {
      const r = await applyProgrammaGare(getPool(), gare, { dry });
      sezioni.push({
        tipo: "programma-gare",
        parsed: gare.length,
        updated: r.updated,
        unchanged: r.unchanged,
        notFoundGroup: r.notFoundGroup,
        notFoundMatch: r.notFoundMatch,
        ambiguous: r.ambiguous,
      });
    }
    if (risultati.length > 0) {
      const r = await applyRisultati(getPool(), risultati, { dry, settore });
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
    if (variazioni.length > 0) {
      const r = await applyVariazioni(getPool(), variazioni, { dry });
      sezioni.push({
        tipo: "variazioni",
        parsed: variazioni.length,
        updated: r.updated,
        unchanged: r.unchanged,
        notFoundGroup: r.notFoundGroup,
        notFoundMatch: r.notFoundMatch,
        ambiguous: r.ambiguous,
      });
    }

    // Dopo un'applicazione reale, marca il comunicato come visto. L'id si
    // ricava dall'URL storage: .../<AREA>/<TIPO>/<N>/COMUNICATO_UFFICIALE_<N>.<ext>
    if (!dry) {
      const m = url.match(/\/storage\/comunicati\/\d{4}\/\d{4}\/([^/]+)\/([^/]+)\/(\d+)\//i);
      if (m) {
        const area = decodeURIComponent(m[1]!);
        const tipo = decodeURIComponent(m[2]!);
        const numero = parseInt(m[3]!, 10);
        try {
          await markComunicatoSeen({
            id: `${area}/${tipo}/${numero}`,
            numero, area, tipo,
            source: `CU${numero}`,
            appliedBy: user.id,
          });
        } catch {
          // best-effort
        }
      }
    }

    const label: Record<SectionResult["tipo"], string> = {
      "programma-gare": "programma gare",
      risultati: "risultati",
      variazioni: "variazioni",
    };
    const parts = sezioni.map((s) => `${label[s.tipo]}: ${s.updated}/${s.parsed}`);
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
