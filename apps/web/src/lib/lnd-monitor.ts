/**
 * Monitoraggio comunicati LND Lazio (sola lettura) per la dashboard dell'Hub.
 *
 * Interroga la pagina comunicati, estrae i comunicati che toccano i calendari
 * (stessa logica del watcher scripts/import-sgs/watch-comunicati.mjs) e li
 * confronta con lo stato salvato (state.json) per marcare i "già importati".
 * NON scarica PDF né scrive nulla: è puro read-only per la UI.
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import { listSeenComunicati } from "@extra-time/database";

const LIST_URL = "https://lazio.lnd.it/comunicati/";
const UA = "Mozilla/5.0 (EXTRA TIME dashboard)";
// state.json del watcher: elenco dei comunicati già importati.
const STATE_PATH = path.join(process.cwd(), "..", "..", "scripts", "import-sgs", "state.json");

export interface Comunicato {
  id: string;
  numero: number;
  area: string;
  tipo: string;
  titolo: string;
  data: string;
  pdfUrl: string;
  tipoAggiornamento: string;
  seen: boolean;
}

export interface MonitorResult {
  ok: boolean;
  error?: string;
  fetchedAt: string;
  totale: number;
  rilevanti: Comunicato[];
  nuovi: number;
}

function classify(titolo: string): string {
  const t = titolo.toLowerCase();
  if (/riformulazione|nuovo calendario/.test(t)) return "nuovo-calendario";
  if (/variazion/.test(t)) return "variazione";
  if (/programma gare/.test(t)) return "programma-gare";
  return "altro";
}

/** Rilevante = SGS/Dilettanti/Provinciali con titolo che tocca i calendari. */
function isRelevant(tipo: string, titolo: string): boolean {
  if (!/^(SGS|Dilettanti|Provinciali)$/i.test(tipo)) return false;
  return /calendar|riformulazione|variazion|programma gare|nuovo/i.test(titolo);
}

function parseList(html: string): Omit<Comunicato, "seen">[] {
  const items: Omit<Comunicato, "seen">[] = [];
  const blocks = html.split("cu-box color--lnd").slice(1);
  for (const b of blocks) {
    const numbers = [...b.matchAll(/cu-box--number">([^<]+)</g)].map((m) => m[1]!.trim());
    const titles = [...b.matchAll(/cu-box--title">([^<]+)</g)].map((m) => m[1]!.trim());
    const dateM = b.match(/cu-box--data">([^<]+)</);
    const pdfM = b.match(/href="(https:\/\/comunicatilazio\.it\/storage\/[^"]+\.pdf)"/);
    if (numbers.length < 2 || !pdfM) continue;
    const numAreaM = numbers[0]!.match(/C\.U\.\s*(\d+)\s*-\s*(.+)/i);
    const numero = numAreaM ? parseInt(numAreaM[1]!, 10) : null;
    if (numero === null) continue;
    const area = numAreaM ? numAreaM[2]!.trim() : "";
    const tipo = numbers[1] ?? "";
    const titolo = titles[1] ?? titles[0] ?? "";
    const data = dateM ? dateM[1]!.trim() : "";
    items.push({
      id: `${area}/${tipo}/${numero}`,
      numero, area, tipo, titolo, data,
      pdfUrl: pdfM[1]!,
      tipoAggiornamento: classify(titolo),
    });
  }
  return items;
}

/** state.json storico (comunicati importati prima della migrazione DB). */
function loadSeenFromFile(): Set<string> {
  try {
    const raw = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
    return new Set<string>(raw.seen ?? []);
  } catch {
    return new Set();
  }
}

/**
 * Insieme dei comunicati "visti": unione di quelli marcati via UI (tabella
 * comunicati_seen, scrivibile anche in produzione) e dello storico in
 * state.json. Degrada in sicurezza se il DB non è raggiungibile.
 */
async function loadSeen(): Promise<Set<string>> {
  const fromFile = loadSeenFromFile();
  try {
    const fromDb = await listSeenComunicati();
    for (const id of fromDb) fromFile.add(id);
  } catch {
    // se il DB non risponde, usiamo solo lo storico su file
  }
  return fromFile;
}

/** Recupera e classifica i comunicati LND rilevanti per i calendari. */
export async function getComunicatiMonitor(): Promise<MonitorResult> {
  const fetchedAt = new Date().toISOString();
  try {
    const res = await fetch(LIST_URL, {
      headers: { "User-Agent": UA },
      // la pagina cambia spesso: niente cache aggressiva
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const all = parseList(html);
    const seen = await loadSeen();
    const rilevanti = all
      .filter((c) => isRelevant(c.tipo, c.titolo))
      .map((c) => ({ ...c, seen: seen.has(c.id) }));
    return {
      ok: true,
      fetchedAt,
      totale: all.length,
      rilevanti,
      nuovi: rilevanti.filter((c) => !c.seen).length,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Errore sconosciuto",
      fetchedAt,
      totale: 0,
      rilevanti: [],
      nuovi: 0,
    };
  }
}
