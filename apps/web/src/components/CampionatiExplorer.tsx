"use client";

import { useRouter } from "next/navigation";
import { slugify } from "@/lib/format";

/**
 * Dropdown a cascata Regione → Campionato → Girone per la pagina /campionati.
 * Sono il PUNTO DI INGRESSO: cambiando selezione si aggiorna l'URL con query
 * param (?regione=&comp=&girone=) e il server ricarica solo il girone scelto.
 */

export interface ExplorerGroup {
  regionCode: string;
  regionName: string;
  category: string;
  competitionName: string;
  level: string;
  groupCode: string;
  groupName: string;
}

/** Settore di appartenenza del campionato, per raggruppare il dropdown. */
function sectorOf(level: string): "dilettanti" | "giovanili" {
  return level.toLowerCase().includes("dilettant") ? "dilettanti" : "giovanili";
}

/** Ordina i campionati: eta' decrescente (U19->U14), poi livello federale
 *  (Nazionale > Elite > Regionale > Provinciale). */
function levelRank(cat: string): number {
  const c = cat.toLowerCase();
  if (c.includes("nazional")) return 0;
  if (c.includes("elite")) return 1;
  if (c.includes("regional")) return 2;
  if (c.includes("provincial")) return 3;
  return 4;
}

// I campionati dilettanti (prime squadre) vanno DOPO i giovanili, in ordine
// gerarchico: Eccellenza > Promozione > Prima > Seconda > Terza Categoria.
const DILETTANTI_ORDER = [
  "eccellenza",
  "promozione",
  "prima categoria",
  "seconda categoria",
  "terza categoria",
];
function dilettantiRank(cat: string): number {
  const i = DILETTANTI_ORDER.indexOf(cat.toLowerCase());
  return i >= 0 ? i : DILETTANTI_ORDER.length;
}

function categoryRank(cat: string): number {
  // I dilettanti non hanno pattern "U\d{2}": li collochiamo in una banda a parte,
  // dopo tutti i giovanili (che occupano rank < 1000).
  if (dilettantiRank(cat) < DILETTANTI_ORDER.length) {
    return 1000 + dilettantiRank(cat);
  }
  const m = cat.match(/U(\d{2})/);
  const age = m && m[1] ? parseInt(m[1], 10) : 0;
  return (99 - age) * 10 + levelRank(cat);
}

export function CampionatiExplorer({
  groups,
  currentRegion,
  currentComp,
  currentGirone,
}: {
  groups: ExplorerGroup[];
  currentRegion: string;
  currentComp: string;
  currentGirone: string;
}) {
  const router = useRouter();

  const uniq = <T,>(arr: T[], key: (t: T) => string) => {
    const seen = new Set<string>();
    return arr.filter((x) => {
      const k = key(x);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  // Regioni distinte.
  const regions = uniq(
    groups.map((g) => ({ code: g.regionCode.toLowerCase(), name: g.regionName })),
    (r) => r.code,
  );

  const inRegion = groups.filter(
    (g) => g.regionCode.toLowerCase() === currentRegion,
  );

  // Campionati della regione corrente, ordinati U19 -> U14 (poi per livello),
  // con il settore (giovanili/dilettanti) per raggrupparli nel dropdown.
  const competitions = uniq(
    inRegion.map((g) => ({
      slug: slugify(g.category),
      name: g.competitionName,
      category: g.category,
      sector: sectorOf(g.level),
    })),
    (c) => c.slug,
  ).sort((a, b) => categoryRank(a.category) - categoryRank(b.category));

  const giovanili = competitions.filter((c) => c.sector === "giovanili");
  const dilettanti = competitions.filter((c) => c.sector === "dilettanti");

  // Gironi del campionato corrente.
  const gironi = uniq(
    inRegion
      .filter((g) => slugify(g.category) === currentComp)
      .map((g) => ({ code: g.groupCode.toLowerCase(), name: g.groupName })),
    (g) => g.code,
  ).sort((a, b) => a.code.localeCompare(b.code));

  const nav = (region: string, comp: string, girone: string) =>
    router.push(`/campionati?regione=${region}&comp=${comp}&girone=${girone}`);

  const goRegion = (region: string) => {
    const g = groups.filter((x) => x.regionCode.toLowerCase() === region);
    const comp = g[0] ? slugify(g[0].category) : currentComp;
    const firstGirone =
      g
        .filter((x) => slugify(x.category) === comp)
        .map((x) => x.groupCode.toLowerCase())
        .sort()[0] ?? "a";
    nav(region, comp, firstGirone);
  };

  const goComp = (comp: string) => {
    const firstGirone =
      inRegion
        .filter((g) => slugify(g.category) === comp)
        .map((g) => g.groupCode.toLowerCase())
        .sort()[0] ?? "a";
    nav(currentRegion, comp, firstGirone);
  };

  const goGirone = (girone: string) => nav(currentRegion, currentComp, girone);

  return (
    <div className="portal-selrow">
      <div className="portal-select">
        <label htmlFor="c-region">Regione</label>
        <select
          id="c-region"
          value={currentRegion}
          onChange={(e) => goRegion(e.target.value)}
        >
          {regions.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div className="portal-select">
        <label htmlFor="c-comp">Campionato</label>
        <select
          id="c-comp"
          value={currentComp}
          onChange={(e) => goComp(e.target.value)}
        >
          {giovanili.length > 0 && (
            <optgroup label="Giovanili">
              {giovanili.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          )}
          {dilettanti.length > 0 && (
            <optgroup label="Dilettanti">
              {dilettanti.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>
      <div className="portal-select">
        <label htmlFor="c-girone">Girone</label>
        <select
          id="c-girone"
          value={currentGirone}
          onChange={(e) => goGirone(e.target.value)}
        >
          {gironi.map((g) => (
            <option key={g.code} value={g.code}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
