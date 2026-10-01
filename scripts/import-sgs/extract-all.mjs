/**
 * Estrazione COMPLETA dei calendari SGS/LND in JSON strutturato.
 *
 * Riusa la logica del parser di YFM (backend/api/pdfCalendarioParser.js):
 * stessi regex per header, stesso split a 3 colonne, stessa normalizzazione
 * nomi squadra e date. La differenza è che qui NON si filtra su una singola
 * squadra: si estraggono TUTTE le sezioni (categoria+girone) e TUTTE le partite,
 * per popolare il Football Data Core di EXTRA TIME.
 *
 * Uso: node scripts/import-sgs/extract-all.mjs <out.json> <pdf...>
 */
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// pdf-parse è installato nel backend di YFM; lo carichiamo da lì per non
// aggiungere dipendenze al monorepo EXTRA TIME solo per un import una tantum.
const YFM_BACKEND =
  "/Users/Raffaele/Documents/Youth-Foorball-Manager/youth-football-manager/backend";
const pdfParse = require(`${YFM_BACKEND}/node_modules/pdf-parse`);

// ── Regex header (copiate 1:1 dal parser YFM) ──────────────────────────────
const HEADER_REGEX =
  /\*\s+((?:NAZIONALE\s+JUNIORES|(?:REGIONALE\s+)?(?:JUNIORES\s+)?UNDER|GIOVANISSIMI|ALLIEVI)[^*]+?)\s+GIRONE:\s*([A-Z]{1,2})(?:\s+\w+)?\s*\*/g;
const HEADER_REGEX_CR =
  /^\s*((?:NAZIONALE\s+JUNIORES|(?:JUNIORES\s+)?(?:UNDER|GIOVANISSIMI|ALLIEVI))[^\n]+?)\s+GIRONE:\s*([A-Z]{1,2})\s*$/gm;

// Cattura anche il suffisso girone (es. "A BIS") oltre alla lettera base.
const HEADER_REGEX_SUFFIX =
  /\*\s+((?:NAZIONALE\s+JUNIORES|(?:REGIONALE\s+)?(?:JUNIORES\s+)?UNDER|GIOVANISSIMI|ALLIEVI)[^*]+?)\s+GIRONE:\s*([A-Z]{1,2}(?:\s+[A-Z]{2,4})?)\s*\*/g;

const ACCENT_MAP = { Citta: "Città", Universita: "Università" };

function stripLegalSuffix(name) {
  return name
    .replace(/\s*\bSSD\s+A\s+R\.?L\.?\s*$/gi, "")
    .replace(/\s*\bA\s+R\.?L\.?\s*$/gi, "")
    .replace(
      /\s*\b(S\.?S\.?D\.?|S\.?R\.?L\.?|A\.?S\.?D\.?|A\.?R\.?L\.?|S\.?S\.?|A\.?C\.?|F\.?C\.?)\s*\.?\s*$/gi,
      "",
    )
    .replace(/\s+A\s*$/i, "")
    .trim();
}

function normalizeTeamName(name) {
  let clean = stripLegalSuffix(name);
  clean = clean
    .replace(
      /\b(S\.?S\.?D\.?|S\.?R\.?L\.?|A\.?S\.?D\.?|A\.?R\.?L\.?|S\.?S\.?|A\.?C\.?|F\.?C\.?)\b\.?/gi,
      "",
    )
    .trim();
  clean = clean.replace(/\b([A-Z]{2,})\.(?=\s|$)/g, "$1");
  clean = clean.replace(/\s+/g, " ").trim();
  const LOWERCASE_WORDS = new Set([
    "di", "del", "dei", "della", "delle", "da", "de", "il", "la", "le", "lo", "gli", "e", "ed",
  ]);
  clean = clean
    .split(" ")
    .map((w, i) => {
      const wl = w.toLowerCase();
      if (i > 0 && LOWERCASE_WORDS.has(wl)) return wl;
      if (w.length <= 2) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
  for (const [plain, accented] of Object.entries(ACCENT_MAP)) {
    clean = clean.replace(new RegExp(`\\b${plain}\\b`, "g"), accented);
  }
  return clean;
}

/** Categoria PDF -> codice EXTRA TIME (U14/U15/U16/U17/U18/U19) + livello.
 * Il livello (elite/regionale) è determinato dal PDF di origine (levelHint),
 * non dal testo della sezione, che spesso non riporta "ELITE". */
function classifyCategory(rawCat, levelHint) {
  const c = rawCat.toUpperCase();
  let code = null;
  const under = c.match(/UNDER\s+(\d{2})/);
  if (under) code = `U${under[1]}`;
  else if (/JUNIORES/.test(c)) code = "U19";
  else if (/ALLIEVI/.test(c)) code = "U17";
  else if (/GIOVANISSIMI/.test(c)) code = "U15";
  const level = levelHint || (/ELITE/.test(c) ? "elite" : "regionale");
  return { code, level, name: rawCat.replace(/\s+/g, " ").trim() };
}


/** Normalizza il codice girone: "B BIS" -> "B", "A" -> "A". Il suffisso BIS/TER
 *  è una notazione di revisione LND, non un girone diverso. */
function normalizeGirone(raw) {
  const first = raw.trim().split(/\s+/)[0];
  return first.toUpperCase();
}

function extractHeaders(text) {
  const headers = [];
  let m;
  while ((m = HEADER_REGEX_SUFFIX.exec(text)) !== null) {
    headers.push({ idx: m.index, cat: m[1].trim().replace(/\s+/g, " "), girone: normalizeGirone(m[2]) });
  }
  HEADER_REGEX_SUFFIX.lastIndex = 0;
  if (headers.length > 0) return headers;
  while ((m = HEADER_REGEX.exec(text)) !== null) {
    headers.push({ idx: m.index, cat: m[1].trim().replace(/\s+/g, " "), girone: normalizeGirone(m[2]) });
  }
  HEADER_REGEX.lastIndex = 0;
  if (headers.length > 0) return headers;
  while ((m = HEADER_REGEX_CR.exec(text)) !== null) {
    headers.push({ idx: m.index, cat: m[1].trim().replace(/\s+/g, " "), girone: normalizeGirone(m[2]) });
  }
  HEADER_REGEX_CR.lastIndex = 0;
  return headers;
}

function parseDate(dateStr, timeStr) {
  const parts = dateStr.trim().split("/");
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = 2000 + parseInt(parts[2], 10);
  const d = String(day).padStart(2, "0");
  const mo = String(month).padStart(2, "0");
  const iso = `${year}-${mo}-${d}`;
  if (timeStr) {
    const [h, mi] = timeStr.split(":");
    return { date: iso, time: `${h.padStart(2, "0")}:${mi}` };
  }
  return { date: iso, time: null };
}

/**
 * Estrae TUTTE le partite di una sezione (3 colonne affiancate = 3 giornate),
 * senza filtrare su una squadra. Stessa meccanica del parseMatches di YFM.
 */
function parseAllMatches(sectionText) {
  const matches = [];
  const teams = new Set();
  const lines = sectionText.split("\n");
  let cols = [null, null, null];

  for (const line of lines) {
    const dateMatches = [
      ...line.matchAll(
        /ANDATA:\s+(\d{1,2}\/\d{1,2}\/\d{2})\s*[|!I][^|!I]*[|!I]\s*RITORNO:\s+(\d{1,2}\/\d{1,2}\/\d{2})/g,
      ),
    ];
    if (dateMatches.length > 0) {
      cols = [null, null, null];
      for (let c = 0; c < dateMatches.length; c++) {
        cols[c] = { dataAndata: dateMatches[c][1], dataRitorno: dateMatches[c][2] };
      }
      continue;
    }
    const oraMatches = [
      ...line.matchAll(
        /ORE[.]*:\s*(\d{1,2}:\d{2})\s*[|!I]\s*(\d+)\s*G\s*I\s*O\s*R\s*N\s*A\s*T\s*A\s*[|!I]\s*ORE[.]*:\s*(\d{1,2}:\d{2})/g,
      ),
    ];
    if (oraMatches.length > 0) {
      for (let c = 0; c < oraMatches.length; c++) {
        if (cols[c]) {
          cols[c].oraAndata = oraMatches[c][1];
          cols[c].giornata = parseInt(oraMatches[c][2], 10);
          cols[c].oraRitorno = oraMatches[c][3];
        }
      }
      continue;
    }
    const matchMatches = [
      ...line.matchAll(
        /[|I]\s*(?!I\s)([A-Z][A-Z0-9\s.''()\-/]{3,}?)\s{2,}-\s{1,2}([A-Z][A-Z0-9\s.''()\-/]{3,}?)\s{2,}[|I]/g,
      ),
    ];
    if (matchMatches.length > 0) {
      for (let c = 0; c < matchMatches.length; c++) {
        const block = cols[c];
        if (!block || !block.giornata) continue;
        const home = normalizeTeamName(matchMatches[c][1].trim());
        const away = normalizeTeamName(matchMatches[c][2].trim());
        if (!home || !away || home.length < 3 || away.length < 3) continue;
        teams.add(home);
        teams.add(away);
        const a = parseDate(block.dataAndata, block.oraAndata);
        matches.push({ matchday: block.giornata, leg: "andata", date: a.date, time: a.time, home, away });
        // Il matchday del RITORNO non è nel PDF: lo calcoliamo a girone completo
        // come giornata_andata + (numero squadre - 1). L'offset dipende dal
        // numero di squadre del girone (13 per i Regionali a 14 squadre, 15 per
        // gli Elite a 16), NON è il +15 fisso di prima (che lasciava buche le
        // giornate 14-15 nei gironi da 14). Qui conserviamo solo la giornata
        // d'andata; l'offset viene applicato in main() quando conosciamo N.
        const r = parseDate(block.dataRitorno, block.oraRitorno);
        matches.push({ matchday: null, leg: "ritorno", andataMatchday: block.giornata, date: r.date, time: r.time, home: away, away: home });
      }
    }
  }
  return { matches, teams: [...teams].sort() };
}

async function main() {
  const [outPath, ...rest] = process.argv.slice(2);
  if (!outPath || rest.length === 0) {
    console.error("Uso: node extract-all.mjs <out.json> [--elite|--regionale] <pdf> ...");
    process.exit(1);
  }
  // Ogni PDF può essere preceduto da --elite o --regionale per fissarne il livello.
  const pdfs = [];
  let currentLevel = "regionale";
  for (const arg of rest) {
    if (arg === "--elite") currentLevel = "elite";
    else if (arg === "--regionale") currentLevel = "regionale";
    else pdfs.push({ path: arg, level: currentLevel });
  }
  const competitions = new Map(); // key: code|level -> {category, name, level, groups: Map}

  for (const { path: pdf, level: levelHint } of pdfs) {
    const buf = fs.readFileSync(pdf);
    const data = await pdfParse(buf);
    const text = data.text;
    const headers = extractHeaders(text);
    console.error(`\n[${pdf.split("/").pop()}] livello=${levelHint}, ${headers.length} sezioni`);
    for (let i = 0; i < headers.length; i++) {
      const start = headers[i].idx;
      const end = i + 1 < headers.length ? headers[i + 1].idx : text.length;
      const section = text.substring(start, end);
      const { code, level, name } = classifyCategory(headers[i].cat, levelHint);
      if (!code) {
        console.error(`  ? categoria non classificata: "${headers[i].cat}"`);
        continue;
      }
      const { matches, teams } = parseAllMatches(section);
      if (matches.length === 0) continue;
      const compKey = `${code}|${level}`;
      if (!competitions.has(compKey)) {
        competitions.set(compKey, { category: code, name, level, groups: new Map() });
      }
      const comp = competitions.get(compKey);
      const gcode = headers[i].girone;
      if (!comp.groups.has(gcode)) comp.groups.set(gcode, { code: gcode, teams: new Set(), matches: [] });
      const g = comp.groups.get(gcode);
      teams.forEach((t) => g.teams.add(t));
      // dedup partite (chiave home|away|date)
      const seen = new Set(g.matches.map((m) => `${m.home}|${m.away}|${m.date}`));
      for (const mt of matches) {
        const k = `${mt.home}|${mt.away}|${mt.date}`;
        if (!seen.has(k)) { seen.add(k); g.matches.push(mt); }
      }
      console.error(`  ${code} ${level} girone ${gcode}: ${teams.length} squadre, ${matches.length} partite`);
    }
  }

  const out = {
    season: "2026/2027",
    competitions: [...competitions.values()].map((c) => ({
      category: c.category,
      name: c.name,
      level: c.level,
      groups: [...c.groups.values()].map((g) => {
        // Offset ritorno = (squadre - 1): andata 1..(N-1), ritorno N..2(N-1).
        const andataRounds = Math.max(0, g.teams.size - 1);
        const matches = g.matches.map((m) => {
          if (m.leg === "ritorno") {
            const md = (m.andataMatchday ?? 0) + andataRounds;
            const { andataMatchday: _drop, ...rest } = m;
            return { ...rest, matchday: md };
          }
          return m;
        });
        return {
          code: g.code,
          teams: [...g.teams].sort(),
          matches: matches.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)),
        };
      }),
    })),
  };
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

  // Riepilogo
  let totG = 0, totT = 0, totM = 0;
  console.error("\n════════ RIEPILOGO ════════");
  for (const c of out.competitions) {
    for (const g of c.groups) {
      totG++; totT += g.teams.length; totM += g.matches.length;
      console.error(`${c.category} ${c.level} / girone ${g.code}: ${g.teams.length} squadre, ${g.matches.length} partite`);
    }
  }
  console.error(`\nTotali: ${out.competitions.length} competizioni, ${totG} gironi, ${totT} squadre (somma), ${totM} partite`);
  console.error(`Scritto: ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
