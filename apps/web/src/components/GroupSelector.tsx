"use client";

import { useRouter } from "next/navigation";
import { slugify } from "@/lib/format";

/**
 * Riga di dropdown a cascata (Regione → Campionato → Girone) in stile template.
 * Navigano via URL server-rendered (SEO + condivisibilità): a ogni selezione
 * si fa router.push verso /{region}/{province}/{categorySlug}/{groupCode}.
 *
 * I dati arrivano dal server come lista piatta di gironi della stagione corrente.
 */

export interface SelectorGroup {
  regionCode: string;
  regionName: string;
  provinceCode: string;
  category: string; // etichetta categoria, es. "U17 Elite"
  competitionName: string; // es. "Under 17 Elite"
  groupCode: string;
  groupName: string;
}

export interface GroupSelectorProps {
  groups: SelectorGroup[];
  currentRegion: string; // code lowercase
  currentProvince: string; // code lowercase
  currentCategorySlug: string;
  currentGroupCode: string; // lowercase
}

export function GroupSelector({
  groups,
  currentRegion,
  currentProvince,
  currentCategorySlug,
  currentGroupCode,
}: GroupSelectorProps) {
  const router = useRouter();

  // Regioni distinte.
  const regions = dedupe(
    groups.map((g) => ({ code: g.regionCode.toLowerCase(), name: g.regionName })),
    (r) => r.code,
  );

  // Competizioni della regione corrente (per il dropdown Campionato).
  const inRegion = groups.filter(
    (g) => g.regionCode.toLowerCase() === currentRegion,
  );
  const competitions = dedupe(
    inRegion.map((g) => ({
      slug: slugify(g.category),
      name: g.competitionName,
      province: g.provinceCode.toLowerCase(),
    })),
    (c) => c.slug,
  );

  // Gironi della competizione corrente (per il dropdown Girone).
  const inCategory = inRegion.filter(
    (g) => slugify(g.category) === currentCategorySlug,
  );
  const groupsForCat = dedupe(
    inCategory.map((g) => ({
      code: g.groupCode.toLowerCase(),
      name: g.groupName,
    })),
    (g) => g.code,
  );

  const go = (region: string, categorySlug: string, groupCode: string) => {
    const province =
      competitions.find((c) => c.slug === categorySlug)?.province ??
      currentProvince;
    router.push(`/${region}/${province}/${categorySlug}/${groupCode}`);
  };

  const onRegion = (region: string) => {
    // Prima competizione e primo girone di quella regione.
    const first = groups.find((g) => g.regionCode.toLowerCase() === region);
    if (!first) return;
    const catSlug = slugify(first.category);
    const firstGroup = groups
      .filter(
        (g) =>
          g.regionCode.toLowerCase() === region &&
          slugify(g.category) === catSlug,
      )
      .sort((a, b) => a.groupCode.localeCompare(b.groupCode))[0];
    go(region, catSlug, (firstGroup?.groupCode ?? "a").toLowerCase());
  };

  const onCategory = (categorySlug: string) => {
    const firstGroup = inRegion
      .filter((g) => slugify(g.category) === categorySlug)
      .sort((a, b) => a.groupCode.localeCompare(b.groupCode))[0];
    go(currentRegion, categorySlug, (firstGroup?.groupCode ?? "a").toLowerCase());
  };

  const onGroup = (groupCode: string) => {
    go(currentRegion, currentCategorySlug, groupCode);
  };

  return (
    <div className="portal-selrow">
      <div className="portal-select">
        <label htmlFor="sel-region">Regione</label>
        <select
          id="sel-region"
          value={currentRegion}
          onChange={(e) => onRegion(e.target.value)}
        >
          {regions.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div className="portal-select">
        <label htmlFor="sel-comp">Campionato</label>
        <select
          id="sel-comp"
          value={currentCategorySlug}
          onChange={(e) => onCategory(e.target.value)}
        >
          {competitions.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="portal-select">
        <label htmlFor="sel-group">Girone</label>
        <select
          id="sel-group"
          value={currentGroupCode}
          onChange={(e) => onGroup(e.target.value)}
        >
          {groupsForCat.map((g) => (
            <option key={g.code} value={g.code}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function dedupe<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const k = key(item);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}
