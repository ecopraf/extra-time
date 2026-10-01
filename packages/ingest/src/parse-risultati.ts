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
/**
 * Nei comunicati estratti da .docx una partita è spesso spezzata su 3 righe:
 *   CASA
 *   - OSPITE
 *   N - N
 * Qui le ricompattiamo nella forma a riga unica "CASA - OSPITE N - N" che il
 * parser principale già gestisce (come nei PDF). Idempotente sulle righe già
 * unite.
 */
function coalesceSplitRows(lines: string[]): string[] {
  const out: string[] = [];
  const isScoreOnly = (s: string) => /^\d{1,2}\s*-\s*\d{1,2}$/.test(s);
  const startsWithDash = (s: string) => /^-\s+\S/.test(s);
  const hasScoreTail = (s: string) => /\d{1,2}\s*-\s*\d{1,2}\s*$/.test(s);
  for (let i = 0; i < lines.length; i++) {
    const a = lines[i]!.trim();
    const b = (lines[i + 1] ?? "").trim();
    const c = (lines[i + 2] ?? "").trim();
    // CASA / - OSPITE / N - N  → "CASA - OSPITE N - N"
    if (a && !hasScoreTail(a) && !startsWithDash(a) && startsWithDash(b) && isScoreOnly(c)) {
      out.push(`${a} ${b} ${c}`);
      i += 2;
      continue;
    }
    out.push(a);
  }
  return out;
}

export function parseRisultati(text: string): Risultato[] {
  const rows: Risultato[] = [];
  const lines = coalesceSplitRows(text.split("\n"));
  let categoria: string | null = null;
  let girone: string | null = null;
  let giornata: number | null = null;
  let inResults = false;

  // Alcuni comunicati (SGS a colonne) annunciano DUE categorie di fila, poi i
  // gironi di entrambe in sequenza (es. U17+U16, poi GIR A/B di U17, GIR A/B di
  // U16). Teniamo una coda delle categorie annunciate consecutivamente e
  // avanziamo alla successiva quando il codice girone "riparte" (torna indietro).
  let pendingCats: string[] = [];
  let catIdx = 0;
  let lastGironeRank = -1;
  const gironeRank = (code: string) => {
    const c = code.toUpperCase();
    return /^\d+$/.test(c) ? parseInt(c, 10) : (c.charCodeAt(0) - 64); // A=1, B=2…
  };

  for (const rawLine of lines) {
    const t = rawLine.trim();
    if (!t) continue;

    if (/RISULTATI UFFICIALI/i.test(t)) {
      // Primo ingresso in modalità risultati: se una categoria è stata annunciata
      // appena prima (fuori dalla sezione), è la prima della coppia → accodala.
      if (!inResults && categoria && pendingCats.length === 0) {
        pendingCats.push(categoria);
      }
      inResults = true;
      continue;
    }
    if (!inResults) {
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
      pendingCats = [];
      catIdx = 0;
      continue;
    }

    // Riga categoria. Se arriva PRIMA di qualsiasi girone del blocco corrente,
    // è una categoria "accoppiata": accodala. Se invece arriva dopo dei gironi,
    // inizia un nuovo blocco: resetta la coda.
    if (CAT_LINE.test(t)) {
      const cat = classifyCategoria(t);
      if (cat) {
        if (girone === null) {
          // ancora nessun girone visto per questo blocco: accoda
          pendingCats.push(cat);
        } else {
          // nuovo blocco di categorie
          pendingCats = [cat];
          catIdx = 0;
          girone = null;
          lastGironeRank = -1;
        }
        categoria = pendingCats[catIdx] ?? cat;
      }
      continue;
    }

    // Header girone + giornata: "GIRONE A - 2 Giornata - A".
    const gM = t.match(/^GIRONE\s+([A-Z0-9]+)\b.*?(\d{1,2})\s*Giornata/i)
      ?? t.match(/^GIRONE\s+([A-Z0-9]+)\s+GIORNATA\s+(\d{1,2})/i);
    if (gM) {
      const code = gM[1]!.toUpperCase();
      const rank = gironeRank(code);
      // Se il codice girone "riparte" (<= dell'ultimo) e ci sono altre categorie
      // in coda, passa alla categoria successiva della coppia.
      if (girone !== null && rank <= lastGironeRank && catIdx + 1 < pendingCats.length) {
        catIdx++;
        categoria = pendingCats[catIdx]!;
      }
      girone = code;
      giornata = parseInt(gM[2]!, 10);
      lastGironeRank = rank;
      continue;
    }

    // Riga risultato: "CASA - OSPITE  golCasa - golOspite" (punteggio in coda).
    const rM = t.match(/^(.+?)\s+(\d{1,2})\s*-\s*(\d{1,2})\s*$/);
    if (rM && categoria && girone && giornata) {
      const teamsPart = rM[1]!.trim();
      // Separa casa/ospite sul trattino separatore. Lo spazio attorno al "-" è
      // incostante nei PDF LND. Preferiamo il separatore canonico " - " (spazi su
      // entrambi i lati); se assente, ripieghiamo su spazio da UN solo lato
      // ("CASA -OSPITE" / "CASA- OSPITE"). In entrambi i casi usiamo la PRIMA
      // occorrenza, per non spezzare trattini interni ai nomi.
      const sepRe = teamsPart.match(/\s+-\s+/) ? /\s+-\s+/ : /\s-\S|\S-\s/;
      const sepMatch = teamsPart.match(sepRe);
      if (!sepMatch || sepMatch.index === undefined) continue;
      let casaStr, ospiteStr;
      if (sepRe.source === "\\s+-\\s+") {
        casaStr = teamsPart.slice(0, sepMatch.index);
        ospiteStr = teamsPart.slice(sepMatch.index + sepMatch[0].length);
      } else {
        // match tipo " -X" o "X- ": il trattino è l'ancora, teniamo i nomi interi.
        const dash = teamsPart.indexOf("-", sepMatch.index);
        casaStr = teamsPart.slice(0, dash);
        ospiteStr = teamsPart.slice(dash + 1);
      }
      const casa = normalizeTeamName(casaStr);
      const ospite = normalizeTeamName(ospiteStr);
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
