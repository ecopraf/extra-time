"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PortalMatchRow } from "@extra-time/database";
import { formatKickoff, slugify } from "@/lib/format";
import { TeamBadge } from "@/components/TeamBadge";

/**
 * Carosello delle prossime partite raggruppate per "slot" (girone + data + ora).
 * Ogni slot ha un badge unico in testa (es. "U16 Elite · Girone A · 19/09/2026,
 * 15:00") e le sue partite sotto. Le frecce < > scorrono gli slot. Alleggerisce
 * la card: nessuna etichetta ripetuta su ogni riga.
 */

interface Slot {
  key: string;
  category: string;
  groupName: string;
  provinceCode: string | null;
  kickoffAt: string | null;
  href: string | null;
  matches: PortalMatchRow[];
}

function groupHref(m: PortalMatchRow): string | null {
  if (!m.regionCode || !m.provinceCode || !m.category) return null;
  return `/${m.regionCode.toLowerCase()}/${m.provinceCode.toLowerCase()}/${slugify(
    m.category,
  )}/${(m.groupCode ?? "a").toLowerCase()}`;
}

/**
 * Rank per ordinare le categorie: prima l'età più grande (U19 -> U14), poi il
 * livello secondo la gerarchia federale: Nazionale > Elite > Regionale >
 * Provinciale.
 */
function levelRank(category: string): number {
  const c = category.toLowerCase();
  if (c.includes("nazional")) return 0;
  if (c.includes("elite")) return 1;
  if (c.includes("regional")) return 2;
  if (c.includes("provincial")) return 3;
  return 4;
}

function categoryRank(category: string): number {
  const m = category.match(/U(\d{2})/);
  const age = m && m[1] ? parseInt(m[1], 10) : 0;
  // età decrescente (U19 prima), poi livello secondo la gerarchia federale.
  return (99 - age) * 10 + levelRank(category);
}

export function UpcomingCarousel({ matches }: { matches: PortalMatchRow[] }) {
  const slots = useMemo<Slot[]>(() => {
    const map = new Map<string, Slot>();
    for (const m of matches) {
      const key = `${m.category}|${m.groupName}|${m.kickoffAt ?? ""}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          category: m.category,
          groupName: m.groupName,
          provinceCode: m.provinceCode,
          kickoffAt: m.kickoffAt,
          href: groupHref(m),
          matches: [],
        });
      }
      map.get(key)!.matches.push(m);
    }
    return [...map.values()].sort((a, b) => {
      // 1) data/ora crescente (prossime prima)
      const da = a.kickoffAt ?? "";
      const db = b.kickoffAt ?? "";
      if (da !== db) return da < db ? -1 : 1;
      // 2) categoria U19 -> U14 (Elite prima di Regionale)
      const ra = categoryRank(a.category);
      const rb = categoryRank(b.category);
      if (ra !== rb) return ra - rb;
      // 3) girone A -> Z
      return a.groupName.localeCompare(b.groupName, "it");
    });
  }, [matches]);

  const [index, setIndex] = useState(0);

  if (slots.length === 0) {
    return <p className="empty">Nessuna partita in programma.</p>;
  }

  const slot = slots[Math.min(index, slots.length - 1)]!;
  const prev = () => setIndex((i) => (i - 1 + slots.length) % slots.length);
  const next = () => setIndex((i) => (i + 1) % slots.length);

  const badge = (
    <>
      {slot.category} · {slot.groupName}
      {slot.provinceCode ? ` · ${slot.provinceCode}` : ""}
      {slot.kickoffAt ? ` · ${formatKickoff(slot.kickoffAt)}` : ""}
    </>
  );

  return (
    <div className="portal-card portal-carousel">
      <div className="portal-carousel-head">
        <button
          type="button"
          className="portal-carousel-arrow"
          onClick={prev}
          aria-label="Slot precedente"
          disabled={slots.length < 2}
        >
          &lsaquo;
        </button>
        <div className="portal-carousel-badge">
          {slot.href ? <Link href={slot.href}>{badge}</Link> : badge}
        </div>
        <button
          type="button"
          className="portal-carousel-arrow"
          onClick={next}
          aria-label="Slot successivo"
          disabled={slots.length < 2}
        >
          &rsaquo;
        </button>
      </div>

      <div className="portal-carousel-body">
        {slot.matches.map((m) => (
          <div key={m.id} className="portal-match">
            <span className="home"><TeamBadge name={m.homeName} logo={m.homeLogo} nameFirst /></span>
            <span className="score next">{formatKickoff(m.kickoffAt).split(", ")[1] ?? ""}</span>
            <span className="away"><TeamBadge name={m.awayName} logo={m.awayLogo} /></span>
          </div>
        ))}
      </div>

      <div className="portal-carousel-foot">
        {index + 1} / {slots.length}
      </div>
    </div>
  );
}
