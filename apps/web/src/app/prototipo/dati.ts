/**
 * Dati dimostrativi del prototipo: replica esatta dei contenuti presenti nella
 * proposta dei collaboratori (`docs/riferimenti/collaboratori/index-originale.html`),
 * così il confronto è a parità di informazione.
 */

export type Riga = {
  team: string;
  pg: number;
  v: number;
  n: number;
  p: number;
  gf: number;
  gs: number;
  pts: number;
};

export type Partita = { home: string; away: string; hs: number; as: number };

export type Girone = { standings: Riga[]; matches: Partita[] };

/** Stessa formula di `demoGirone` dell'originale, resa deterministica. */
function girone(teams: string[]): Girone {
  const standings: Riga[] = teams
    .map((t, i) => ({
      team: t,
      pg: 5,
      v: 5 - (i % 4),
      n: i % 2,
      p: i % 3,
      gf: 12 - i,
      gs: 4 + i,
      pts: (5 - (i % 4)) * 3 + (i % 2),
    }))
    .sort((a, b) => b.pts - a.pts);

  const matches: Partita[] = [];
  for (let i = 0; i < teams.length - 1; i += 2) {
    matches.push({
      home: teams[i]!,
      away: teams[i + 1]!,
      hs: i % 4,
      as: (i + 1) % 3,
    });
  }
  return { standings, matches };
}

export const regions = {
  Lazio: {
    Eccellenza: {
      "Girone A": girone(["Lodigiani", "Vis Artena", "Vicovaro", "Palocco", "Fondi", "Boreale"]),
      "Girone B": girone(["Anzio", "Nettuno", "Aprilia", "Anagni", "Ostiantica", "Tivoli"]),
    },
    Promozione: {
      "Girone A": girone(["Ardea", "Pomezia", "Genzano", "Velletri"]),
    },
    "Juniores Regionale": {
      "Girone Unico": girone(["Lazio Giovani", "Roma Youth", "Ciampino", "Marino"]),
    },
  },
  Lombardia: {
    Eccellenza: {
      "Girone A": girone(["Brianza", "Sesto", "Varese", "Como"]),
    },
  },
  Campania: {
    Promozione: {
      "Girone A": girone(["Vesuvio", "Agro", "Sannio", "Irpinia"]),
    },
  },
} satisfies Record<string, Record<string, Record<string, Girone>>>;

export const news = [
  {
    id: 1,
    title: "Al via la nuova stagione dilettanti",
    date: "2026-09-20",
    excerpt:
      "Presentati i gironi di Eccellenza e Promozione per la stagione in corso.",
    body: "Il comitato regionale ha ufficializzato i calendari.",
  },
  {
    id: 2,
    title: "Juniores: talenti emergenti da tenere d'occhio",
    date: "2026-09-18",
    excerpt:
      "La nostra redazione segnala i giovani più interessanti del weekend.",
    body: "Dettagli e schede tecniche in arrivo.",
  },
];

export const live = [
  { id: 1, title: "Eccellenza Girone A - Diretta", status: "Live ora" },
  { id: 2, title: "Finale Juniores Regionale", status: "Sabato 15:00" },
];

export const clubs = [
  { id: 1, name: "Lodigiani" },
  { id: 2, name: "Vis Artena" },
];

export const players = [
  { id: 1, name: "M. Rossi", clubId: 1, role: "Attaccante" },
  { id: 2, name: "L. Bianchi", clubId: 2, role: "Centrocampista" },
];

export const staff = [
  {
    id: 1,
    name: "Admin Principale",
    email: "extratime.italia@gmail.com",
    role: "Amministratore",
  },
];

export const CONTATTO = "extratime.italia@gmail.com";

export const tabsAdmin: [string, string][] = [
  ["news", "News"],
  ["support", "Assistenza"],
  ["staff", "Staff"],
  ["championships", "Campionati & Risultati"],
  ["clubs", "Società"],
  ["players", "Calciatori"],
  ["users", "Profili"],
];
