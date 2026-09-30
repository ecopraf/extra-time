/**
 * Parser dei comunicati "PROGRAMMA GARE" LND (SGS + Dilettanti).
 * Logica pura (nessun I/O): riceve il testo estratto dal PDF e restituisce
 * le partite strutturate. Condiviso tra gli script e il web.
 *
 * Porting 1:1 da scripts/import-sgs/parse-programma-gare.mjs.
 */

export interface Gara {
  categoria: string;
  girone: string;
  giornata: number;
  casa: string;
  ospite: string;
  dataIso: string | null;
  ora: string;
  campo: string | null;
}

/** Categoria PDF → category EXTRA TIME (come nel DB). ECCELLENZA giovanile = Elite. */
export function classifyCategoria(raw: string): string | null {
  const c = raw.toUpperCase().replace(/\s+/g, " ").trim();
  if (/\bECCELLENZA\b/.test(c) && !/UNDER/.test(c)) return "Eccellenza";
  if (/\bPROMOZIONE\b/.test(c) && !/UNDER/.test(c)) return "Promozione";
  if (/PRIMA CATEGORIA/.test(c)) return "Prima Categoria";
  if (/SECONDA CATEGORIA/.test(c)) return "Seconda Categoria";
  const under = c.match(/UNDER\s*(\d{2})/);
  const isElite = /ELITE/.test(c) || /ECCELLENZA/.test(c);
  const isReg = /REGIONAL/.test(c) && !/ECCELLENZA/.test(c);

  if ((under && under[1] === "19") || /JUNIORES/.test(c)) {
    if (/ECCELLENZA/.test(c)) return "U19 Elite";
    if (/REGIONALE\s*B|UNDER\s*19\s*B|\b19\s*B\b/.test(c)) return "U19 Regionale";
    if (/REGIONALE\s*A|UNDER\s*19\s*A|\b19\s*A\b/.test(c)) return "U19 Elite";
    return "U19 Elite";
  }
  if (under) {
    const code = `U${under[1]}`;
    if (isElite) return `${code} Elite`;
    if (isReg) return `${code} Regionale`;
    if (under[1] === "18") return "U18 Elite";
    return `${code} Regionale`;
  }
  if (/ALLIEVI/.test(c)) return "U17 Regionale";
  if (/GIOVANISSIMI/.test(c)) return "U15 Regionale";
  return null;
}

const ACCENT_MAP: Record<string, string> = { Citta: "Città", Universita: "Università" };

// Alias canonici: varianti OCR/denominazione della STESSA società.
const CLUB_CANONICAL: Record<string, string> = {
  mprenestinicavese1919: "Monti Prenestini 1919",
  prenestinicavese1919: "Monti Prenestini 1919",
  montiprenestini1919: "Monti Prenestini 1919",
};
export function canonicalizeClub(name: string): string {
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return CLUB_CANONICAL[key] ?? name;
}

export function normalizeTeamName(name: string): string {
  let clean = name.replace(/\s+/g, " ").trim();
  clean = clean
    .replace(/\s*\bSSD\s+A\s+R\.?L\.?\s*$/gi, "")
    .replace(/\s*\bS\.?S\.?D\.?\s*A\s*R\.?L\.?\s*$/gi, "")
    .replace(/\s*\bA\s+R\.?L\.?\s*$/gi, "")
    .replace(/\s*\bS\.?R\.?L\.?\s*$/gi, "")
    .replace(/\s*\bA\.?S\.?D\.?\s*$/gi, "")
    .replace(/\s*\b(S\.?S\.?D\.?|A\.?S\.?D\.?|A\.?C\.?|F\.?C\.?)\s*\.?\s*$/gi, "")
    .trim();
  clean = clean.replace(/[’`´]/g, "'");
  const LOWER = new Set(["di", "del", "dei", "della", "delle", "da", "de", "il", "la", "le", "lo", "gli", "e", "ed"]);
  clean = clean
    .split(" ")
    .map((w, i) => {
      const wl = w.toLowerCase();
      if (i > 0 && LOWER.has(wl)) return wl;
      if (w.length <= 2) return w.toUpperCase();
      if (/\./.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
  for (const [p, a] of Object.entries(ACCENT_MAP)) clean = clean.replace(new RegExp(`\\b${p}\\b`, "g"), a);
  clean = clean.replace(/\s+/g, " ").trim();
  return canonicalizeClub(clean);
}

export function toIso(dmy: string): string | null {
  const m = dmy.match(/(\d{1,2})\/(\d{1,2})\/(\d{2})/);
  if (!m) return null;
  const dd = m[1]!.padStart(2, "0");
  const mm = m[2]!.padStart(2, "0");
  return `20${m[3]}-${mm}-${dd}`;
}

/** Estrae tutte le partite dal testo di un programma gare. */
export function parseProgrammaGare(text: string): Gara[] {
  const rows: Gara[] = [];
  const lines = text.split("\n");
  let categoria: string | null = null;
  let girone: string | null = null;
  let giornata: number | null = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, "");
    const t = line.trim();
    if (!t) continue;

    const catM = t.match(/^CAMPIONATO\s+(.+)$/i);
    if (catM && !/GIRONE/i.test(t)) {
      const cat = classifyCategoria(catM[1]!);
      if (cat) categoria = cat;
      continue;
    }
    const gM = t.match(/GIRONE\s+([A-Z0-9]+)\s+GIORNATA\s+(\d+)\s+ANDATA/i);
    if (gM) {
      girone = gM[1]!.toUpperCase();
      giornata = parseInt(gM[2]!, 10);
      continue;
    }
    if (/^Campionato .+giornata/i.test(t)) continue;
    if (/COPPA ITALIA|TROFEO|AVVISO|PROGRAMMA GARE|VARIAZIONI/i.test(t)) {
      if (/COPPA ITALIA|TROFEO/i.test(t)) { categoria = null; girone = null; }
      continue;
    }

    const mM = line.match(/^\s*\d+\)\s+(.+?)\s+(\d{1,2}\/\d{1,2}\/\d{2})\s+(\d{1,2}:\d{2})\s*$/);
    if (mM && categoria && girone && giornata) {
      const dataIso = toIso(mM[2]!);
      const ora = mM[3]!.padStart(5, "0");
      const afterNum = line.replace(/^\s*\d+\)\s+/, "");
      const cols = afterNum.split(/\s{2,}/).map((x) => x.trim()).filter(Boolean);
      if (cols.length < 2) continue;
      const casa = normalizeTeamName(cols[0]!);
      const ospite = normalizeTeamName(cols[1]!);
      let campoRaw: string | null = null;
      for (let ci = 2; ci < cols.length; ci++) {
        if (/^\d{1,4}$/.test(cols[ci]!)) continue;
        campoRaw = cols[ci]!;
        break;
      }
      if (casa.length < 2 || ospite.length < 2) continue;
      rows.push({ categoria, girone, giornata, casa, ospite, dataIso, ora, campo: campoRaw });
    }
  }
  return rows;
}
