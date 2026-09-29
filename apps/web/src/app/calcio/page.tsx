import Link from "next/link";
import { listGroupsForPortal } from "@extra-time/database";

export const revalidate = 300;

function groupHref(group: {
  regionCode: string | null;
  provinceCode: string | null;
  category: string;
  groupCode: string | null;
}): string | null {
  if (!group.regionCode || !group.provinceCode) return null;
  const segments = [
    group.regionCode,
    group.provinceCode,
    group.category,
    group.groupCode ?? "a",
  ];
  return `/${segments.map((s) => s.toLowerCase()).join("/")}`;
}

/** Panoramica del calcio: gironi raggruppati per categoria. */
export default async function CalcioPage() {
  const groups = await listGroupsForPortal();

  const byCategory = new Map<string, typeof groups>();
  for (const group of groups) {
    const list = byCategory.get(group.category) ?? [];
    list.push(group);
    byCategory.set(group.category, list);
  }

  return (
    <main className="portal">
      <section className="portal-hero">
        <h1>Calcio</h1>
        <p className="lead">
          Tutte le competizioni della stagione corrente, raggruppate per categoria.
        </p>
        <div className="portal-chips">
          <span className="portal-chip">{byCategory.size} Categorie</span>
          <span className="portal-chip">{groups.length} Gironi</span>
        </div>
      </section>

      {groups.length === 0 ? (
        <p className="empty">
          Nessun girone nella stagione corrente. Popola il core con{" "}
          <code>pnpm db:setup</code>.
        </p>
      ) : (
        [...byCategory.entries()].map(([category, list]) => (
          <section key={category} className="portal-section">
            <h2>{category}</h2>
            <ul className="portal-links">
              {list.map((group) => {
                const href = groupHref(group);
                return (
                  <li key={group.groupId}>
                    {href ? (
                      <Link href={href}>
                        {group.groupName}
                        <span className="count">
                          {group.competitionName}
                          {group.provinceName ? ` · ${group.provinceName}` : ""}
                        </span>
                      </Link>
                    ) : (
                      <span>
                        {group.groupName}
                        <span className="count">{group.competitionName}</span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}
