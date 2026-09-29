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

/** Classifiche: indice dei gironi, ognuno con classifica e marcatori. */
export default async function ClassifichePage() {
  const groups = await listGroupsForPortal();

  return (
    <main className="portal">
      <section className="portal-hero">
        <h1>Classifiche</h1>
        <p className="lead">
          Le classifiche di tutti i gironi della stagione corrente.
        </p>
        <div className="portal-chips">
          <span className="portal-chip">{groups.length} Gironi</span>
        </div>
      </section>

      <section className="portal-section">
        {groups.length === 0 ? (
          <p className="empty">
            Nessun girone nella stagione corrente. Popola il core con{" "}
            <code>pnpm db:setup</code>.
          </p>
        ) : (
          <ul className="portal-links">
            {groups.map((group) => {
              const href = groupHref(group);
              return (
                <li key={group.groupId}>
                  {href ? (
                    <Link href={href}>
                      {group.groupName}
                      <span className="count">
                        {group.category} · {group.competitionName}
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
        )}
      </section>
    </main>
  );
}
