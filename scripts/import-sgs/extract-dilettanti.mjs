/**
 * Estrazione dei calendari DILETTANTI del Lazio 2026/27 dalle brochure PDF LND.
 *
 * A differenza dei calendari SGS (extract-all.mjs), le brochure dilettanti hanno
 * un layout "da stampa" senza le date inline accanto a ogni partita. La struttura
 * è POSIZIONALE: le partite scorrono in blocchi di N per giornata, e le date sono
 * elencate a parte (header giornate). Esistono tre varianti di layout:
 *
 *  1) ECCELLENZA / PROMOZIONE / UNDER 19  (file CALENDARI_STAMPA-compresso.pdf)
 *     - "CAMPIONATO DI <X> 2026-2027" + "GIRONE <lettera>"
 *     - date giornate in testa alla sezione: "GIORNATA N" + "dd.mm.yy - dd.mm.yy"
 *     - partite: "CASA - OSPITE" (separatore spazio-trattino-spazio), in blocchi
 *       posizionali (una giornata = N partite consecutive, N = squadre/2).
 *
 *  2) PRIMA CATEGORIA  (Calendari_Prima_Categoria.pdf)
 *     - "CALENDARIO PRIMA CATEGORIA" + "G I R O N E X" (spaziato) — 8 gironi A..H
 *     - marcatore giornata esplicito "Nª GIORNATA"
 *     - partite: "CASA–OSPITE" (en-dash)
 *     - date in coda: "And. dd/mm/yy · Rit. dd/mm/yy" (posizionali, 3 per riga)
 *
 *  3) SECONDA CATEGORIA  (Calendari_Seconda_Categoria.pdf)
 *     - come Prima ma 10 gironi A..I,L; gironi da 15 squadre => voce "RIPOSA".
 *
 * Uso:
 *   node scripts/import-sgs/extract-dilettanti.mjs <out.json> \
 *     --format=ecc  --cat="Eccellenza"        eccellenza_promozione_u19.pdf
 *   node scripts/import-sgs/extract-dilettanti.mjs <out.json> \
 *     --format=cat  --cat="Prima Categoria"   prima_categoria.pdf
 *
 * Il parser è volutamente prudente: valida i conteggi (squadre pari per girone,
 * partite = squadre/2 per giornata) e stampa WARNING per ogni anomalia, senza
 * inventare dati. La correzione OCR dei nomi avviene per girone via canonical map.
 */
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const YFM_BACKEND =
  "/Users/Raffaele/Documents/Youth-Foorball-Manager/youth-football-manager/backend";
const pdfParse = require(`${YFM_BACKEND}/node_modules/pdf-parse`);

// ── Normalizzazione nomi ────────────────────────────────────────────────────
const ACCENT_MAP = { Citta: "Città", Universita: "Università" };

function stripLegalSuffix(name) {
  return name
    .replace(/\s*\bSSD\s+A\s+R\.?L\.?\s*$/gi, "")
    .replace(/\s*\bA\s+R\.?L\.?\s*$/gi, "")
    .replace(
      /\s*\b(S\.?S\.?D\.?|S\.?R\.?L\.?|A\.?S\.?D\.?|A\.?R\.?L\.?|S\.?S\.?|A\.?C\.?|F\.?C\.?)\s*\.?\s*$/gi,
      "",
    )
    .trim();
}

function normalizeTeamName(name) {
  let clean = name.replace(/\s+/g, " ").trim();
  clean = stripLegalSuffix(clean);
  // Uniforma apostrofi e punti.
  clean = clean.replace(/[’`´]/g, "'");
  const LOWERCASE_WORDS = new Set([
    "di", "del", "dei", "della", "delle", "da", "de", "il", "la", "le", "lo", "gli", "e", "ed",
  ]);
  clean = clean
    .split(" ")
    .map((w, i) => {
      const wl = w.toLowerCase();
      if (i > 0 && LOWERCASE_WORDS.has(wl)) return wl;
      // sigle e parole cortissime -> maiuscolo
      if (w.length <= 2) return w.toUpperCase();
      // token con punto interno (es. "M.P.") -> maiuscolo
      if (/\./.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
  for (const [plain, accented] of Object.entries(ACCENT_MAP)) {
    clean = clean.replace(new RegExp(`\\b${plain}\\b`, "g"), accented);
  }
  return clean.replace(/\s+/g, " ").trim();
}

/** Chiave di canonicalizzazione: nome ridotto a lettere+cifre maiuscole senza
 *  spazi/punteggiatura. Serve a fondere varianti OCR ("GRIFONE GALLOVERDE" e
 *  "GRIFONE GIALLOVERDE" restano diverse -> le gestiamo con alias espliciti). */
function canonKey(name) {
  return name.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// Correzioni OCR note (chiave canonica errata -> nome corretto). Popolata dopo
// aver visto l'output; qui elenchiamo le varianti riscontrate nelle brochure.
const OCR_FIX = {
  GRIFONEGALLOVERDE: "Grifone Gialloverde",
  FREGENE1948: "Fregene Calcio",
  REALMONTEROTONDO: "Real Monterotondo",
  RMONTEROTONDO: "Real Monterotondo", // "R. MONTEROTONDO" abbreviato
  NDEROSSI: "Polisportiva De Rossi", // "N.DE ROSSI"
  POLISPDEROSSI: "Polisportiva De Rossi", // "POLISP. DE ROSSI"
};

function applyOcrFix(name) {
  const k = canonKey(name);
  return OCR_FIX[k] ?? name;
}

// Righe di intestazione/piè di pagina ripetute nelle brochure: NON sono partite.
const BOILERPLATE_RE =
  /(CALENDARIO|COMITATO|FEDERAZIONE|NAZIONALE\s+DILETTANTI|STAGIONE\s+SPORTIVA|GIUOCO\s+CALCIO|^C\s*A\s*L\s*E\s*N\s*D\s*A\s*R|GIRONI\b|PLAY\s*-?\s*OFF|PLAY\s*-?\s*OUT)/i;

/** Una riga è una partita plausibile se, tolto il separatore, entrambi i lati
 *  sono nomi squadra brevi e non contengono parole di boilerplate. */
function looksLikeMatchLine(t) {
  if (!t || BOILERPLATE_RE.test(t)) return false;
  if (/\d{2}[./]\d{2}[./]\d{2}/.test(t)) return false; // riga di date
  if (/GIORNATA|GIRONE|^LAZIO$|^UNDER/i.test(t)) return false;
  return true;
}

// ── Date ────────────────────────────────────────────────────────────────────
/** "dd.mm.yy" o "dd/mm/yy" -> ISO "yyyy-mm-dd" (2000+). */
function toIso(dmy) {
  const m = dmy.trim().match(/(\d{1,2})[./](\d{1,2})[./](\d{2})/);
  if (!m) return null;
  const [, d, mo, y] = m;
  return `20${y.padStart(2, "0")}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

// ═════════════════════════════════════════════════════════════════════════════
// FORMATO 1: Eccellenza / Promozione / Under 19
// ═════════════════════════════════════════════════════════════════════════════
function parseEccellenza(text, catFilter) {
  // catFilter: es. "Eccellenza" | "Promozione" | "Under 19".
  // Sezioni delimitate da "CAMPIONATO DI <X> 2026-2027" o "CAMPIONATO <X> 2026-2027".
  const headerRe =
    /CAMPIONATO\s+(?:DI\s+)?(ECCELLENZA|PROMOZIONE|UNDER\s+19[^\n]*?)\s*2026-2027/gi;
  const headers = [];
  let m;
  while ((m = headerRe.exec(text)) !== null) {
    headers.push({ idx: m.index, raw: m[1].replace(/\s+/g, " ").trim() });
  }
  const competitions = new Map(); // catName -> { groups: Map<girone, {teams,matches}> }

  for (let i = 0; i < headers.length; i++) {
    const start = headers[i].idx;
    const end = i + 1 < headers.length ? headers[i + 1].idx : text.length;
    const section = text.slice(start, end);
    const rawCat = headers[i].raw.toUpperCase();
    let catName;
    if (/ECCELLENZA/.test(rawCat)) catName = "Eccellenza";
    else if (/PROMOZIONE/.test(rawCat)) catName = "Promozione";
    else if (/UNDER\s+19/.test(rawCat)) catName = "Under 19 Elite";
    else continue;
    if (catFilter && catName !== catFilter) continue;

    // Girone: prima riga "GIRONE X" nella sezione.
    const gm = section.match(/\bGIRONE\s+([A-Z])\b/);
    const girone = gm ? gm[1].toUpperCase() : "A";

    // Date giornate: coppie "GIORNATA N" seguite da "dd.mm.yy - dd.mm.yy".
    const giornateDate = [];
    const gdRe = /GIORNATA\s+(\d+)/g;
    // Raccogliamo tutte le date "dd.mm.yy - dd.mm.yy" o "dd.mm.yy -dd.mm.yy".
    const dateRe = /(\d{2}\.\d{2}\.\d{2})\s*-\s*(\d{2}\.\d{2}\.\d{2})/g;
    let dm;
    const dateList = [];
    while ((dm = dateRe.exec(section)) !== null) {
      dateList.push({ and: toIso(dm[1]), rit: toIso(dm[2]) });
    }

    // Partite: righe "CASA - OSPITE" (evita "GIORNATA", header, date).
    const teams = new Set();
    const rawMatches = [];
    for (const line of section.split("\n")) {
      const t = line.trim();
      if (!t || /GIORNATA|CAMPIONATO|GIRONE|LAZIO|CALENDAR/i.test(t)) continue;
      if (/\d{2}\.\d{2}\.\d{2}/.test(t)) continue; // riga di date
      const mm = t.match(/^(.+?)\s+-\s+(.+?)$/);
      if (!mm) continue;
      const home = applyOcrFix(normalizeTeamName(mm[1]));
      const away = applyOcrFix(normalizeTeamName(mm[2]));
      if (home.length < 2 || away.length < 2) continue;
      if (home === away) continue;
      teams.add(home);
      teams.add(away);
      rawMatches.push({ home, away });
    }

    // CANONICALIZZAZIONE per girone: le brochure Eccellenza/Promozione usano
    // nomi incoerenti tra giornate (es. "Cassino Calcio" vs "Cassino C.1924").
    // Usiamo la PRIMA GIORNATA come lista canonica: sono i nomi più completi.
    // Ogni nome successivo viene ricondotto al canonico più simile.
    const nTeamsRaw = teams.size;
    // perDay stimato dalla prima "ondata" di partite prima che una squadra si ripeta.
    let perDay = 0;
    const seenFirst = new Set();
    for (const rm of rawMatches) {
      if (seenFirst.has(rm.home) || seenFirst.has(rm.away)) break;
      seenFirst.add(rm.home);
      seenFirst.add(rm.away);
      perDay++;
    }
    if (perDay === 0) perDay = Math.floor(nTeamsRaw / 2);

    // Lista canonica: squadre della giornata 1 (i primi `perDay` match).
    const canonicalList = [];
    for (let k = 0; k < perDay && k < rawMatches.length; k++) {
      canonicalList.push(rawMatches[k].home, rawMatches[k].away);
    }
    const canonSet = [...new Set(canonicalList)];

    // Riconduci un nome al canonico: match esatto, poi per token iniziale
    // condiviso più lungo, poi invariato (con avviso).
    const tokenKey = (n) => n.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    const canonByToken = new Map();
    for (const c of canonSet) {
      const t = tokenKey(c);
      if (!canonByToken.has(t)) canonByToken.set(t, c);
    }
    const unmatched = new Set();
    const toCanonical = (name) => {
      if (canonSet.includes(name)) return name;
      const t = tokenKey(name);
      if (canonByToken.has(t)) return canonByToken.get(t);
      // prova prefisso progressivo (min 4 char)
      for (let len = t.length; len >= 4; len--) {
        const pref = t.slice(0, len);
        const hit = canonSet.find((c) => tokenKey(c).startsWith(pref) || pref.startsWith(tokenKey(c).slice(0, len)));
        if (hit) return hit;
      }
      unmatched.add(name);
      return name;
    };

    // Canonicalizza prima tutte le partite, poi determina perDay definitivo dal
    // numero di squadre canoniche (più affidabile della stima posizionale, che
    // fallisce se una partita è impaginata fuori giornata).
    const canonMatches = rawMatches.map((rm) => ({
      home: toCanonical(rm.home),
      away: toCanonical(rm.away),
    }));
    const teamsCanon = new Set();
    for (const cm of canonMatches) {
      teamsCanon.add(cm.home);
      teamsCanon.add(cm.away);
    }
    // perDay definitivo: se squadre pari, è nTeams/2; altrimenti tieni la stima.
    if (teamsCanon.size % 2 === 0) perDay = teamsCanon.size / 2;

    // Assegna giornate posizionalmente: ogni blocco di `perDay` partite = 1 giornata.
    const matches = [];
    for (let k = 0; k < canonMatches.length; k++) {
      const matchday = Math.floor(k / perDay) + 1;
      const d = giornateDate[matchday - 1] ?? dateList[matchday - 1] ?? null;
      matches.push({
        matchday,
        date: d ? d.and : null,
        time: null,
        home: canonMatches[k].home,
        away: canonMatches[k].away,
      });
    }
    // Sostituisce l'insieme squadre con quello canonico.
    teams.clear();
    teamsCanon.forEach((t) => teams.add(t));
    if (unmatched.size > 0) {
      console.error(
        `    · nomi non ricondotti a canonico (${unmatched.size}): ${[...unmatched].join(", ")}`,
      );
    }

    if (!competitions.has(catName))
      competitions.set(catName, { category: catName, level: "dilettantistico", groups: new Map() });
    const comp = competitions.get(catName);
    if (!comp.groups.has(girone))
      comp.groups.set(girone, { code: girone, teams: new Set(), matches: [] });
    const g = comp.groups.get(girone);
    teams.forEach((t) => g.teams.add(t));
    g.matches.push(...matches);

    const nTeams = teams.size;
    console.error(
      `  [${catName}] girone ${girone}: ${nTeams} squadre canoniche (raw ${nTeamsRaw}), ` +
        `${rawMatches.length} partite, ${perDay}/giornata, ~${Math.ceil(rawMatches.length / perDay)} giornate`,
    );
    if (nTeams % 2 !== 0)
      console.error(`    ! WARNING girone ${girone}: numero squadre dispari (${nTeams})`);
    if (rawMatches.length % perDay !== 0)
      console.error(`    ! WARNING girone ${girone}: partite non multiple di ${perDay}`);
  }
  return competitions;
}

// ═════════════════════════════════════════════════════════════════════════════
// FORMATO 2/3: Prima / Seconda Categoria ("Nª GIORNATA" + en-dash)
// ═════════════════════════════════════════════════════════════════════════════
function parseCategoria(text, catName) {
  // I gironi sono introdotti da "CALENDARIO <CAT>" e/o "G I R O N E X".
  // Usiamo "CALENDARIO <CAT>" come delimitatore di girone e leggiamo la lettera
  // dalla riga "G I R O N E X" successiva (spaziata).
  const catUp = catName.toUpperCase();
  const delimRe = new RegExp(`CALENDARIO\\s+${catUp.replace(/\s+/g, "\\s+")}`, "g");
  const bounds = [];
  let m;
  while ((m = delimRe.exec(text)) !== null) bounds.push(m.index);
  if (bounds.length === 0) {
    console.error(`  ! nessuna sezione "CALENDARIO ${catName}" trovata`);
    return new Map();
  }

  const comp = { category: catName, level: "dilettantistico", groups: new Map() };
  const competitions = new Map([[catName, comp]]);

  for (let i = 0; i < bounds.length; i++) {
    const start = bounds[i];
    const end = i + 1 < bounds.length ? bounds[i + 1] : text.length;
    const section = text.slice(start, end);

    // Lettera girone dalla riga spaziata "G I R O N E X".
    const gm = section.match(/G\s*I\s*R\s*O\s*N\s*E\s+([A-Z])/);
    const girone = gm ? gm[1].toUpperCase() : String.fromCharCode(65 + i);

    // Blocchi giornata: "Nª GIORNATA" seguito da righe "CASA–OSPITE".
    const teams = new Set();
    const matches = [];
    const lines = section.split("\n");
    let curDay = null;
    const dayCounts = new Map();
    for (const line of lines) {
      const t = line.trim();
      const dayM = t.match(/^(\d+)ª\s*GIORNATA/);
      if (dayM) {
        curDay = parseInt(dayM[1], 10);
        continue;
      }
      if (curDay == null) continue;
      if (!looksLikeMatchLine(t)) continue;
      // Il separatore tra le due squadre è SEMPRE l'en-dash "–". Il trattino
      // ASCII "-" fa parte del nome (es. "SORATTE-CAPENA") e non va usato per
      // lo split. Split solo sul PRIMO en-dash.
      const dashIdx = t.indexOf("–");
      if (dashIdx < 0) continue;
      const mm = [null, t.slice(0, dashIdx), t.slice(dashIdx + 1)];
      let home = mm[1].trim();
      let away = mm[2].trim();
      if (/^RIPOSA$/i.test(home) || /^RIPOSA$/i.test(away)) continue; // turno di riposo
      home = applyOcrFix(normalizeTeamName(home));
      away = applyOcrFix(normalizeTeamName(away));
      if (home.length < 2 || away.length < 2 || home === away) continue;
      // scarta se un lato è ancora boilerplate dopo la normalizzazione
      if (BOILERPLATE_RE.test(home) || BOILERPLATE_RE.test(away)) continue;
      teams.add(home);
      teams.add(away);
      matches.push({ matchday: curDay, date: null, time: null, home, away });
      dayCounts.set(curDay, (dayCounts.get(curDay) ?? 0) + 1);
    }

    if (matches.length === 0) continue;

    // Date giornate: "And. dd/mm/yy · Rit. dd/mm/yy" in ordine di giornata (andata).
    const andRe = /And\.\s*(\d{2}\/\d{2}\/\d{2})/g;
    const andate = [];
    let am;
    while ((am = andRe.exec(section)) !== null) andate.push(toIso(am[1]));
    // Assegna la data d'andata per giornata (posizionale).
    for (const mt of matches) {
      const d = andate[mt.matchday - 1];
      if (d) mt.date = d;
    }

    const g = { code: girone, teams: new Set(teams), matches };
    comp.groups.set(girone, g);

    const nTeams = teams.size;
    const maxDay = Math.max(...matches.map((x) => x.matchday));
    console.error(
      `  [${catName}] girone ${girone}: ${nTeams} squadre, ${matches.length} partite, ${maxDay} giornate, ${andate.length} date`,
    );
    // Validazione: partite per giornata dovrebbero essere floor(nTeams/2).
    const perDay = Math.floor(nTeams / 2);
    for (const [day, cnt] of [...dayCounts.entries()].sort((a, b) => a[0] - b[0])) {
      if (cnt !== perDay)
        console.error(`    ! WARNING g.${girone} giornata ${day}: ${cnt} partite (atteso ${perDay})`);
    }
  }
  return competitions;
}

// ── Merge di più mappe competizione ──────────────────────────────────────────
function mergeCompetitions(target, src) {
  for (const [cat, comp] of src.entries()) {
    if (!target.has(cat)) {
      target.set(cat, { category: comp.category, level: comp.level, groups: new Map() });
    }
    const tc = target.get(cat);
    for (const [gc, g] of comp.groups.entries()) {
      if (!tc.groups.has(gc)) tc.groups.set(gc, { code: gc, teams: new Set(), matches: [] });
      const tg = tc.groups.get(gc);
      g.teams.forEach((t) => tg.teams.add(t));
      const seen = new Set(tg.matches.map((x) => `${x.home}|${x.away}|${x.matchday}`));
      for (const mt of g.matches) {
        const k = `${mt.home}|${mt.away}|${mt.matchday}`;
        if (!seen.has(k)) {
          seen.add(k);
          tg.matches.push(mt);
        }
      }
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const outPath = args.shift();
  if (!outPath) {
    console.error(
      'Uso: node extract-dilettanti.mjs <out.json> --format=ecc|cat --cat="Nome" <pdf> [--format=... --cat=... <pdf> ...]',
    );
    process.exit(1);
  }

  // Parsing degli argomenti: sequenze (--format, --cat, pdf).
  const jobs = [];
  let curFormat = null;
  let curCat = null;
  for (const a of args) {
    if (a.startsWith("--format=")) curFormat = a.slice(9);
    else if (a.startsWith("--cat=")) curCat = a.slice(6);
    else jobs.push({ format: curFormat, cat: curCat, pdf: a });
  }

  const all = new Map();
  for (const job of jobs) {
    const buf = fs.readFileSync(job.pdf);
    const data = await pdfParse(buf);
    console.error(`\n[${job.pdf.split("/").pop()}] format=${job.format} cat=${job.cat}`);
    let res;
    if (job.format === "ecc") res = parseEccellenza(data.text, job.cat);
    else if (job.format === "cat") res = parseCategoria(data.text, job.cat);
    else {
      console.error(`  ! formato sconosciuto: ${job.format}`);
      continue;
    }
    mergeCompetitions(all, res);
  }

  const out = {
    season: "2026/2027",
    competitions: [...all.values()].map((c) => ({
      category: c.category,
      name: c.category,
      level: c.level,
      groups: [...c.groups.values()].map((g) => ({
        code: g.code,
        teams: [...g.teams].sort(),
        matches: g.matches.sort((a, b) =>
          a.matchday !== b.matchday ? a.matchday - b.matchday : a.home < b.home ? -1 : 1,
        ),
      })),
    })),
  };
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

  let totG = 0, totT = 0, totM = 0;
  console.error("\n════════ RIEPILOGO ════════");
  for (const c of out.competitions) {
    let ct = 0, cm = 0, cg = 0;
    for (const g of c.groups) {
      cg++; ct += g.teams.length; cm += g.matches.length;
    }
    totG += cg; totT += ct; totM += cm;
    console.error(`${c.category}: ${cg} gironi, ${ct} squadre (somma), ${cm} partite`);
  }
  console.error(`\nTotali: ${out.competitions.length} competizioni, ${totG} gironi, ${totT} squadre, ${totM} partite`);
  console.error(`Scritto: ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
