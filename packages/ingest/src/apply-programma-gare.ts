/**
 * Applica gli orari/date reali dei "programma gare" alle partite già presenti
 * nel Core, individuandole per (categoria → girone → giornata → squadre).
 * NON crea partite: aggiorna kickoff_at e venue delle gare esistenti.
 *
 * Logica pura sul matching; l'accesso al DB avviene via un oggetto con `.query`
 * (pg Pool o Client), così è usabile da script e dal web. Idempotente.
 *
 * Porting da scripts/import-sgs/apply-programma-gare.mjs.
 */
import type { Gara } from "./parse-programma-gare";

/** Minima interfaccia compatibile con pg Pool/Client. */
export interface Queryable {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

// ── Matching nomi squadra ─────────────────────────────────────────────────────
function norm(s: string): string {
  return (s || "")
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/j/g, "i")
    .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
const ABBR: Record<string, string> = {
  sport: "sporting", n: "nuova", atl: "atletico", pol: "polisportiva",
  acc: "accademia", camp: "campagnano", cvn: "", spqv: "", oir: "",
};
function tokens(s: string): string[] {
  const stop = new Set(["ssd","srl","asd","acd","ac","fc","us","usd","arl","ss","pol","polisportiva","calcio","sportiva","societa","a","r","l","di","del","della","citta","real","new","c","aps","atletico","sporting","virtus","academy","1919","1920","1926","1936","1948","1957","1949","2014","2020","2000","1986","1972","2004","2024","1932","1925","1946","1947","1960","1918"]);
  return norm(s).split(" ").map((w) => ABBR[w] ?? w).filter((w) => w && !stop.has(w) && !/^\d{4}$/.test(w));
}
const ALIAS_PAIRS: [string, string][] = [
  ["monti prenestini 1919", "m p cavese"],
  ["monti prenestini 1919", "mp cavese"],
];
const ALIAS_SET = new Set(ALIAS_PAIRS.map(([x, y]) => `${norm(x)}|${norm(y)}`));
function isAlias(a: string, b: string): boolean {
  const na = norm(a), nb = norm(b);
  return ALIAS_SET.has(`${na}|${nb}`) || ALIAS_SET.has(`${nb}|${na}`);
}
export function sameTeam(a: string, b: string): boolean {
  const na = norm(a), nb = norm(b);
  if (na === nb) return true;
  if (isAlias(a, b)) return true;
  if (na.length >= 5 && (na.includes(nb) || nb.includes(na))) return true;
  const ta = tokens(a), tb = tokens(b);
  if (ta.length === 0 || tb.length === 0) return false;
  const setB = new Set(tb);
  const shared = ta.filter((w) => setB.has(w));
  const longShared = ta.filter((w) => w.length >= 4).filter((w) => setB.has(w));
  if (shared.length >= 2) return true;
  if (longShared.length >= 1 && (ta.length <= 2 || tb.length <= 2)) return true;
  if (longShared.some((w) => w.length >= 6)) return true;
  return false;
}

// Alias categoria: il programma gare usa denominazioni diverse dall'import.
const CAT_ALIAS: Record<string, string[]> = {
  "U18 Regionale": ["U18 Elite"],
  "U19 Elite": ["U19 Regionale"],
};
// Rietichettatura gironi per comunicati di riformulazione (U15 CU31/32).
const GIRONE_REMAP: Record<string, string> = {
  "U15 Regionale|Regionali_SGS_31.pdf|A": "C",
  "U15 Regionale|Regionali_SGS_31.pdf|B": "F",
  "U15 Regionale|Regionali_SGS_32.pdf|A": "C",
  "U15 Regionale|Regionali_SGS_32.pdf|B": "F",
};

export interface ApplyResult {
  input: number;
  updated: number;
  notFoundGroup: number;
  notFoundMatch: number;
  ambiguous: number;
  misses: Gara[];
}

/**
 * Applica le gare al DB. Con `dry: true` calcola solo cosa cambierebbe.
 * `source` è il nome del file/comunicato sorgente (per la rimappatura gironi).
 */
export async function applyProgrammaGare(
  db: Queryable,
  gare: (Gara & { _src?: string })[],
  opts: { dry?: boolean; source?: string } = {},
): Promise<ApplyResult> {
  const dry = opts.dry ?? false;

  const { rows: groups } = await db.query<{ group_id: string; girone: string | null; category: string }>(
    `select g.id as group_id, g.code as girone, c.category
       from competition_groups g
       join competitions c on c.id = g.competition_id
       join seasons s on s.id = g.season_id and s.is_current`,
  );
  const groupIdByKey = new Map<string, string>();
  for (const g of groups) groupIdByKey.set(`${g.category}|${(g.girone || "").toUpperCase()}`, g.group_id);

  const srcOf = (gara: Gara & { _src?: string }) => gara._src ?? opts.source ?? "";
  const remapGirone = (gara: Gara & { _src?: string }): string => {
    const k = `${gara.categoria}|${srcOf(gara)}|${(gara.girone || "").toUpperCase()}`;
    return GIRONE_REMAP[k] ?? gara.girone;
  };
  const resolveGroup = (categoria: string, girone: string): string | null => {
    const g = (girone || "").toUpperCase();
    const direct = groupIdByKey.get(`${categoria}|${g}`);
    if (direct) return direct;
    for (const alt of CAT_ALIAS[categoria] || []) {
      const hit = groupIdByKey.get(`${alt}|${g}`);
      if (hit) return hit;
    }
    return null;
  };

  const neededGroupIds = new Set<string>();
  for (const gara of gare) {
    const gid = resolveGroup(gara.categoria, remapGirone(gara));
    if (gid) neededGroupIds.add(gid);
  }
  const matchesByGroup = new Map<string, {
    id: string; matchday: number | null; home_name: string; away_name: string;
  }[]>();
  for (const gid of neededGroupIds) {
    const { rows } = await db.query<{ id: string; matchday: number | null; home_name: string; away_name: string }>(
      `select m.id, m.matchday,
              ch.canonical_name as home_name, ca.canonical_name as away_name
         from matches m
         join teams th on th.id = m.home_team_id join clubs ch on ch.id = th.club_id
         join teams ta on ta.id = m.away_team_id join clubs ca on ca.id = ta.club_id
        where m.group_id = $1`,
      [gid],
    );
    matchesByGroup.set(gid, rows);
  }

  const res: ApplyResult = { input: gare.length, updated: 0, notFoundGroup: 0, notFoundMatch: 0, ambiguous: 0, misses: [] };

  for (const gara of gare) {
    const gid = resolveGroup(gara.categoria, remapGirone(gara));
    if (!gid) { res.notFoundGroup++; continue; }
    const matches = matchesByGroup.get(gid) || [];
    let cand = matches.filter((m) =>
      m.matchday === gara.giornata && sameTeam(m.home_name, gara.casa) && sameTeam(m.away_name, gara.ospite));
    if (cand.length === 0) {
      cand = matches.filter((m) => sameTeam(m.home_name, gara.casa) && sameTeam(m.away_name, gara.ospite));
    }
    if (cand.length === 0) { res.notFoundMatch++; res.misses.push(gara); continue; }
    if (cand.length > 1) res.ambiguous++;
    const target = cand[0]!;
    if (!dry) {
      const kickoff = `${gara.dataIso} ${gara.ora}:00+02`;
      await db.query(
        `update matches set kickoff_at = $1, venue = coalesce($2, venue), updated_at = now() where id = $3`,
        [kickoff, gara.campo, target.id],
      );
    }
    res.updated++;
  }
  return res;
}
