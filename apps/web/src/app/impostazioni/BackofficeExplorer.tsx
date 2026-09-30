"use client";

import { useRouter } from "next/navigation";
import { slugify } from "@/lib/format";

/**
 * Selettore di contesto del backoffice: Settore (Giovanili/Dilettanti) →
 * Campionato → Girone. Stessa logica del portale pubblico (CampionatiExplorer),
 * ma qui serve a scegliere il GIRONE su cui operare (risultati, partite).
 * Naviga aggiornando ?comp=&girone= sulla pagina /impostazioni.
 */

export interface BoGroup {
  category: string;
  competitionName: string;
  level: string;
  groupId: string;
  groupCode: string | null;
  groupName: string;
}

function sectorOf(level: string): "dilettanti" | "giovanili" {
  return level.toLowerCase().includes("dilettant") ? "dilettanti" : "giovanili";
}
function levelRank(cat: string): number {
  const c = cat.toLowerCase();
  if (c.includes("elite")) return 1;
  if (c.includes("regional")) return 2;
  return 4;
}
const DIL_ORDER = ["eccellenza", "promozione", "prima categoria", "seconda categoria", "terza categoria"];
function categoryRank(cat: string): number {
  const i = DIL_ORDER.indexOf(cat.toLowerCase());
  if (i >= 0) return 1000 + i;
  const m = cat.match(/U(\d{2})/);
  const age = m && m[1] ? parseInt(m[1], 10) : 0;
  return (99 - age) * 10 + levelRank(cat);
}

export function BackofficeExplorer({
  groups,
  currentComp,
  currentGirone,
}: {
  groups: BoGroup[];
  currentComp: string;
  currentGirone: string;
}) {
  const router = useRouter();
  const uniq = <T,>(arr: T[], key: (t: T) => string) => {
    const seen = new Set<string>();
    return arr.filter((x) => { const k = key(x); if (seen.has(k)) return false; seen.add(k); return true; });
  };

  const competitions = uniq(
    groups.map((g) => ({ slug: slugify(g.category), name: g.competitionName, category: g.category, sector: sectorOf(g.level) })),
    (c) => c.slug,
  ).sort((a, b) => categoryRank(a.category) - categoryRank(b.category));

  const giovanili = competitions.filter((c) => c.sector === "giovanili");
  const dilettanti = competitions.filter((c) => c.sector === "dilettanti");
  const currentCompObj = competitions.find((c) => c.slug === currentComp);
  const currentSector: "giovanili" | "dilettanti" =
    currentCompObj?.sector ?? (giovanili.length > 0 ? "giovanili" : "dilettanti");
  const compsInSector = currentSector === "giovanili" ? giovanili : dilettanti;
  const sectors = ([
    { id: "giovanili", label: "Giovanili", count: giovanili.length },
    { id: "dilettanti", label: "Dilettanti", count: dilettanti.length },
  ] as const).filter((s) => s.count > 0);

  const gironi = uniq(
    groups.filter((g) => slugify(g.category) === currentComp).map((g) => ({
      code: (g.groupCode ?? "a").toLowerCase(), name: g.groupName,
    })),
    (g) => g.code,
  ).sort((a, b) => a.code.localeCompare(b.code));

  const nav = (comp: string, girone: string) => router.push(`/impostazioni?comp=${comp}&girone=${girone}`);

  const goSector = (sector: "giovanili" | "dilettanti") => {
    if (sector === currentSector) return;
    const list = sector === "giovanili" ? giovanili : dilettanti;
    const comp = list[0]?.slug ?? currentComp;
    const firstGirone = groups.filter((g) => slugify(g.category) === comp).map((g) => (g.groupCode ?? "a").toLowerCase()).sort()[0] ?? "a";
    nav(comp, firstGirone);
  };
  const goComp = (comp: string) => {
    const firstGirone = groups.filter((g) => slugify(g.category) === comp).map((g) => (g.groupCode ?? "a").toLowerCase()).sort()[0] ?? "a";
    nav(comp, firstGirone);
  };
  const goGirone = (girone: string) => nav(currentComp, girone);

  return (
    <div className="portal-explorer">
      {sectors.length > 1 && (
        <div className="portal-pill-row portal-sector-pills" role="tablist" aria-label="Settore">
          {sectors.map((s) => (
            <button key={s.id} type="button" role="tab" aria-selected={currentSector === s.id}
              className={`portal-pill ${currentSector === s.id ? "active" : ""}`} onClick={() => goSector(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      )}
      <div className="portal-selrow">
        <div className="portal-select">
          <label htmlFor="bo-comp">Campionato</label>
          <select id="bo-comp" value={currentComp} onChange={(e) => goComp(e.target.value)}>
            {compsInSector.map((c) => (<option key={c.slug} value={c.slug}>{c.name}</option>))}
          </select>
        </div>
        <div className="portal-select">
          <label htmlFor="bo-girone">Girone</label>
          <select id="bo-girone" value={currentGirone} onChange={(e) => goGirone(e.target.value)}>
            {gironi.map((g) => (<option key={g.code} value={g.code}>{g.name}</option>))}
          </select>
        </div>
      </div>
    </div>
  );
}
