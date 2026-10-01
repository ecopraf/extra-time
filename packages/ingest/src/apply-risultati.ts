/**
 * Applica i risultati ufficiali dei comunicati LND alle partite già presenti
 * nel Core, individuandole per (categoria → girone → giornata → squadre) con
 * la stessa logica di matching tollerante di applyProgrammaGare.
 *
 * NON crea partite: aggiorna home_score/away_score e porta la gara a 'finished'.
 * Logica DB via interfaccia Queryable (pg Pool/Client). Idempotente.
 */
import type { Risultato } from "./parse-risultati";
import { sameTeam, type Queryable } from "./apply-programma-gare";

// Alias categoria: il comunicato può usare denominazioni diverse dall'import.
const CAT_ALIAS: Record<string, string[]> = {
  "U18 Regionale": ["U18 Elite"],
  "U19 Elite": ["U19 Regionale"],
};

export interface ApplyRisultatiResult {
  input: number;
  updated: number;
  notFoundGroup: number;
  notFoundMatch: number;
  ambiguous: number;
  /** già a 'finished' con lo stesso punteggio: nessun cambiamento. */
  unchanged: number;
  misses: Risultato[];
}

/**
 * Applica i risultati al DB. Con `dry: true` calcola solo cosa cambierebbe.
 */
/**
 * Decide se una categoria è ammessa per il settore del comunicato.
 * - "giovanili" (comunicati SGS): U14..U19 (Regionale/Elite)
 * - "dilettanti" (comunicati Dilettanti): Eccellenza/Promozione/Prima/Seconda
 * Serve a evitare che il matching per solo codice-girone scriva in una categoria
 * del settore sbagliato quando le stesse squadre esistono in più campionati.
 */
function categoryAllowed(category: string, settore: "giovanili" | "dilettanti" | undefined): boolean {
  if (!settore) return true;
  const isYouth = /^U\d{2}\b/i.test(category) || /allievi|giovanissimi|juniores/i.test(category);
  return settore === "giovanili" ? isYouth : !isYouth;
}

export async function applyRisultati(
  db: Queryable,
  risultati: Risultato[],
  opts: { dry?: boolean; settore?: "giovanili" | "dilettanti" } = {},
): Promise<ApplyRisultatiResult> {
  const dry = opts.dry ?? false;
  const settore = opts.settore;

  const { rows: allGroups } = await db.query<{ group_id: string; girone: string | null; category: string }>(
    `select g.id as group_id, g.code as girone, c.category
       from competition_groups g
       join competitions c on c.id = g.competition_id
       join seasons s on s.id = g.season_id and s.is_current`,
  );
  // Limita i gironi candidati alle categorie compatibili con il settore del comunicato.
  const groups = allGroups.filter((g) => categoryAllowed(g.category, settore));
  const groupIdByKey = new Map<string, string>();
  for (const g of groups) groupIdByKey.set(`${g.category}|${(g.girone || "").toUpperCase()}`, g.group_id);

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

  // Candidati-girone per (categoria, girone). La categoria del PDF a volte è
  // ambigua (header categoria consecutivi nel layout a colonne), quindi
  // consideriamo ANCHE tutti i gironi con lo stesso codice: il match finale è
  // comunque vincolato a casa+ospite, quindi resta sicuro.
  type MatchRow = {
    id: string; matchday: number | null; home_name: string; away_name: string;
    home_score: number | null; away_score: number | null; status: string;
  };
  const groupsByCode = new Map<string, string[]>();
  for (const g of groups) {
    const code = (g.girone || "").toUpperCase();
    if (!groupsByCode.has(code)) groupsByCode.set(code, []);
    groupsByCode.get(code)!.push(g.group_id);
  }

  const neededGroupIds = new Set<string>();
  for (const r of risultati) {
    const gid = resolveGroup(r.categoria, r.girone);
    if (gid) neededGroupIds.add(gid);
    for (const alt of groupsByCode.get((r.girone || "").toUpperCase()) || []) neededGroupIds.add(alt);
  }
  const matchesByGroup = new Map<string, MatchRow[]>();
  for (const gid of neededGroupIds) {
    const { rows } = await db.query<MatchRow>(
      `select m.id, m.matchday, m.status, m.home_score, m.away_score,
              ch.canonical_name as home_name, ca.canonical_name as away_name
         from matches m
         join teams th on th.id = m.home_team_id join clubs ch on ch.id = th.club_id
         join teams ta on ta.id = m.away_team_id join clubs ca on ca.id = ta.club_id
        where m.group_id = $1`,
      [gid],
    );
    matchesByGroup.set(gid, rows);
  }

  const res: ApplyRisultatiResult = {
    input: risultati.length, updated: 0, notFoundGroup: 0, notFoundMatch: 0,
    ambiguous: 0, unchanged: 0, misses: [],
  };

  for (const r of risultati) {
    // Gironi da provare: prima quello della categoria dichiarata, poi tutti i
    // gironi con lo stesso codice (per coprire la categoria ambigua dal PDF).
    const direct = resolveGroup(r.categoria, r.girone);
    const codeGroups = groupsByCode.get((r.girone || "").toUpperCase()) || [];
    const tryGroups = [...new Set([direct, ...codeGroups].filter((x): x is string => !!x))];
    if (tryGroups.length === 0) { res.notFoundGroup++; continue; }

    // Cerca la partita (giornata + squadre, poi solo squadre) nei gironi candidati.
    let cand: MatchRow[] = [];
    for (const gid of tryGroups) {
      const matches = matchesByGroup.get(gid) || [];
      const withDay = matches.filter((m) =>
        m.matchday === r.giornata && sameTeam(m.home_name, r.casa) && sameTeam(m.away_name, r.ospite));
      if (withDay.length > 0) { cand = withDay; break; }
    }
    if (cand.length === 0) {
      for (const gid of tryGroups) {
        const matches = matchesByGroup.get(gid) || [];
        const anyDay = matches.filter((m) => sameTeam(m.home_name, r.casa) && sameTeam(m.away_name, r.ospite));
        if (anyDay.length > 0) { cand = anyDay; break; }
      }
    }
    if (cand.length === 0) { res.notFoundMatch++; res.misses.push(r); continue; }
    if (cand.length > 1) res.ambiguous++;
    const target = cand[0]!;

    // Già refertata con lo stesso punteggio? niente da fare (idempotenza).
    if (target.status === "finished" && target.home_score === r.golCasa && target.away_score === r.golOspite) {
      res.unchanged++;
      continue;
    }
    if (!dry) {
      await db.query(
        `update matches set home_score = $2, away_score = $3, status = 'finished', updated_at = now()
          where id = $1`,
        [target.id, r.golCasa, r.golOspite],
      );
    }
    res.updated++;
  }
  return res;
}
