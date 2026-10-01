/**
 * Parser della sezione "RISULTATI UFFICIALI" dei comunicati LND.
 * Logica pura (nessun I/O): riceve il testo del PDF e restituisce i risultati
 * strutturati. Riusa gli helper del parser programma gare (classificazione
 * categoria, normalizzazione nomi).
 *
 * Formato tipico:
 *   Eccellenza                         ← categoria
 *   RISULTATI UFFICIALI GARE DEL ...
 *   GIRONE A - 4 Giornata - A          ← girone + giornata
 *   ASTREA - CIVITAVECCHIA CALCIO 1920 0 - 2
 *   BOREALE - SORIANESE 1 - 0
 */
import { classifyCategoria, normalizeTeamName } from "./parse-programma-gare";

export interface Risultato {
  categoria: string;
  girone: string;
  giornata: number;
  casa: string;
  ospite: string;
  golCasa: number;
  golOspite: number;
}

// Righe che indicano la categoria del blocco risultati (denominazione piena LND).
const CAT_LINE =
  /^(Eccellenza|Promozione|Prima Categoria|Seconda Categoria|Juniores[^\n]*|Under\s*\d{2}[^\n]*|Allievi[^\n]*|Giovanissimi[^\n]*)\s*$/i;

/** Estrae tutti i risultati dal testo di un comunicato. */
export function parseRisultati(text: string): Risultato[] {
  const rows: Risultato[] = [];
  const lines = text.split("\n");
  let categoria: string | null = null;
  let girone: string | null = null;
  let giornata: number | null = null;
  // Entriamo in "modalità risultati" solo dopo il primo "RISULTATI UFFICIALI",
  // per non confondere la sezione con il programma gare / altre parti.
  let inResults = false;

  for (const rawLine of lines) {
    const t = rawLine.trim();
    if (!t) continue;

    if (/RISULTATI UFFICIALI/i.test(t)) {
      inResults = true;
      continue;
    }
    if (!inResults) {
      // Prima della sezione risultati: ci serve solo intercettare la categoria
      // che spesso precede di una riga il "RISULTATI UFFICIALI".
      if (CAT_LINE.test(t)) {
        const cat = classifyCategoria(t);
        if (cat) categoria = cat;
      }
      continue;
    }

    // Uscita dalla sezione risultati: la parte di Giustizia Sportiva/altro.
    if (/giustizia sportiva|provvedimenti disciplinari|errata corrige|variazioni/i.test(t)) {
      inResults = false;
      girone = null;
      continue;
    }

    // Riga categoria (nuovo blocco campionato dentro la sezione risultati).
    if (CAT_LINE.test(t)) {
      const cat = classifyCategoria(t);
      if (cat) categoria = cat;
      girone = null;
      continue;
    }

    // Header girone + giornata: "GIRONE A - 4 Giornata - A" (o "GIRONE A GIORNATA 4").
    const gM = t.match(/^GIRONE\s+([A-Z0-9]+)\b.*?(\d{1,2})\s*Giornata/i)
      ?? t.match(/^GIRONE\s+([A-Z0-9]+)\s+GIORNATA\s+(\d{1,2})/i);
    if (gM) {
      girone = gM[1]!.toUpperCase();
      giornata = parseInt(gM[2]!, 10);
      continue;
    }

    // Riga risultato: "CASA - OSPITE  golCasa - golOspite" (punteggio in coda).
    const rM = t.match(/^(.+?)\s+(\d{1,2})\s*-\s*(\d{1,2})\s*$/);
    if (rM && categoria && girone && giornata) {
      const teamsPart = rM[1]!.trim();
      // separa casa/ospite sul primo " - " (il separatore ha spazi attorno).
      const sep = teamsPart.split(/\s+-\s+/);
      if (sep.length < 2) continue;
      const casa = normalizeTeamName(sep[0]!);
      const ospite = normalizeTeamName(sep.slice(1).join(" - ")); // nomi con '-' interni restano
      if (casa.length < 2 || ospite.length < 2) continue;
      rows.push({
        categoria,
        girone,
        giornata,
        casa,
        ospite,
        golCasa: parseInt(rM[2]!, 10),
        golOspite: parseInt(rM[3]!, 10),
      });
    }
  }
  return rows;
}
