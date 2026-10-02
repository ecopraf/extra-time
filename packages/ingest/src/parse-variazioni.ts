/**
 * Parser delle "VARIAZIONI AL PROGRAMMA GARE" dei comunicati LND.
 *
 * A differenza del programma gare "pieno" (parse-programma-gare.ts), le
 * variazioni riguardano SINGOLE partite già calendarizzate di cui cambia
 * data, orario e/o campo. Il formato tabellare tipico è:
 *
 *   VARIAZIONI AL PROGRAMMA GARE DEL 3 e 4 OTTOBRE 2026
 *   ECCELLENZA
 *   GIRONE  A                          CAMPO            DATA    ORA
 *   TIVOLI CALCIO 1919   FREGENE 1948   RIPOLI (SINTEX)  4/10/26 11:30  5A TIVOLI   VIALE PICCHIONI 9
 *
 * Differenze dal programma gare: niente prefisso "N)", header girone senza
 * "GIORNATA N ANDATA", e la giornata ("5A") compare DOPO l'orario.
 * Alcune righe terminano con "da definire" (data/ora non ancora fissate).
 *
 * Logica pura (nessun I/O). Non gestisce il formato discorsivo delle
 * "VARIAZIONI DEFINITIVE" (cambio campo interno permanente di una società):
 * quello è un cambio di sede valido per tutte le gare casalinghe future, con
 * semantica diversa, e viene ignorato qui.
 */
import { classifyCategoria, normalizeTeamName, toIso } from "./parse-programma-gare";

export interface Variazione {
  categoria: string;
  girone: string;
  /** Giornata di campionato (dal suffisso "5A" dopo l'orario), se presente. */
  giornata: number | null;
  casa: string;
  ospite: string;
  /** Nuova data ISO (YYYY-MM-DD) o null se "da definire". */
  dataIso: string | null;
  /** Nuovo orario HH:MM o null se "da definire". */
  ora: string | null;
  /** Nuovo campo/impianto, se indicato. */
  campo: string | null;
  /** La gara è stata rinviata "a data da definire". */
  daDefinire: boolean;
}

// Intestazione di sezione che attiva il parsing delle variazioni tabellari.
const SECTION_RE = /VARIAZIONI\s+AL\s+PROGRAMMA\s+GARE|PROGRAMMA\s+GARE\s+DI\s+RECUPERO/i;
// Riga categoria piena LND (denominazione in maiuscolo).
const CAT_RE =
  /^(ECCELLENZA|PROMOZIONE|PRIMA CATEGORIA|SECONDA CATEGORIA|JUNIORES[^\n]*|(?:CAMPIONATO\s+)?UNDER\s*\d{2}[^\n]*|ALLIEVI[^\n]*|GIOVANISSIMI[^\n]*)\s*$/i;
// Header girone (senza "GIORNATA N ANDATA"): "GIRONE  A" eventualmente seguito
// dall'intestazione colonne CAMPO/DATA/ORA.
const GIRONE_RE = /^GIRONE\s+([A-Z0-9]+)\b/i;
// Blocco data+ora+giornata: "4/10/26 11:30  5A".
const DATE_RE = /(\d{1,2}\/\d{1,2}\/\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2})[AR]\b/;

/** Estrae le variazioni di singola gara dal testo di un comunicato. */
export function parseVariazioni(text: string): Variazione[] {
  const rows: Variazione[] = [];
  const lines = text.split("\n");
  let inSection = false;
  let categoria: string | null = null;
  let girone: string | null = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, "");
    const t = line.trim();
    if (!t) continue;

    if (SECTION_RE.test(t)) {
      inSection = true;
      categoria = null;
      girone = null;
      continue;
    }
    if (!inSection) continue;

    // Fuori sezione: giustizia sportiva / altre parti → stop.
    if (/giustizia sportiva|provvedimenti disciplinari|^avviso\b|^il presidente\b/i.test(t)) {
      inSection = false;
      continue;
    }

    // Coppa Italia/Trofei: categoria non applicabile al campionato → neutralizza.
    if (/COPPA ITALIA|TROFEO/i.test(t)) {
      categoria = null;
      girone = null;
      continue;
    }

    if (CAT_RE.test(t)) {
      const cat = classifyCategoria(t.replace(/^CAMPIONATO\s+/i, ""));
      if (cat) {
        categoria = cat;
        girone = null;
      }
      continue;
    }

    const gM = t.match(GIRONE_RE);
    if (gM) {
      girone = gM[1]!.toUpperCase();
      continue;
    }

    if (!categoria || !girone) continue;

    // Riga gara "da definire": "CASA   OSPITE   da definire".
    if (/\bda definire\b/i.test(t)) {
      const beforeDef = t.replace(/\s+da definire.*$/i, "");
      const cols = beforeDef.split(/\s{2,}/).map((x) => x.trim()).filter(Boolean);
      if (cols.length >= 2) {
        const casa = normalizeTeamName(cols[0]!);
        const ospite = normalizeTeamName(cols[1]!);
        if (casa.length >= 2 && ospite.length >= 2) {
          rows.push({ categoria, girone, giornata: null, casa, ospite, dataIso: null, ora: null, campo: null, daDefinire: true });
        }
      }
      continue;
    }

    // Riga gara con data/ora/giornata.
    const dM = line.match(DATE_RE);
    if (!dM) continue;
    const dataIso = toIso(dM[1]!);
    const ora = dM[2]!.padStart(5, "0");
    const giornata = parseInt(dM[3]!, 10);

    // La parte prima della data contiene: CASA  OSPITE  CAMPO(+impianto).
    const beforeDate = line.slice(0, dM.index).trim();
    const cols = beforeDate.split(/\s{2,}/).map((x) => x.trim()).filter(Boolean);
    if (cols.length < 2) continue;
    const casa = normalizeTeamName(cols[0]!);
    const ospite = normalizeTeamName(cols[1]!);
    if (casa.length < 2 || ospite.length < 2) continue;
    // Campo: terza colonna, ripulita dal tipo fondo in coda, anche troncato dal
    // PDF ("(SINTEX", "(SINTE", "(ERBA", "(TERRA").
    let campo: string | null = null;
    if (cols[2]) campo = cols[2].replace(/\s*\(?\b(SINTEX?|SINTE|ERBA|TERRA)\b.*$/i, "").trim() || null;

    rows.push({ categoria, girone, giornata, casa, ospite, dataIso, ora, campo, daDefinire: false });
  }
  return rows;
}
