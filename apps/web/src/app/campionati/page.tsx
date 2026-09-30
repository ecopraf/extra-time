import {
  getGroupTeams,
  listGroupsForPortal,
  listMatchesByGroup,
  listTopScorersByGroup,
  getGroup,
} from "@extra-time/database";
import { computeStandings } from "@extra-time/football-domain";
import { slugify } from "@/lib/format";
import { CampionatiExplorer } from "@/components/CampionatiExplorer";
import { GroupView } from "@/components/GroupView";

export const revalidate = 120;

export default async function CampionatiPage({
  searchParams,
}: {
  searchParams: Promise<{ regione?: string; comp?: string; girone?: string }>;
}) {
  const sp = await searchParams;
  const groups = await listGroupsForPortal();

  if (groups.length === 0) {
    return (
      <main className="portal">
        <section className="portal-hero">
          <h1>Campionati</h1>
          <p className="lead">Nessun campionato nella stagione corrente.</p>
        </section>
      </main>
    );
  }

  // Selezione corrente: dai query param, altrimenti prima regione/campionato/girone.
  const first = groups[0]!;
  const regionCode = (sp.regione ?? first.regionCode ?? "").toLowerCase();
  const inRegion = groups.filter(
    (g) => (g.regionCode ?? "").toLowerCase() === regionCode,
  );
  const regionPool = inRegion.length > 0 ? inRegion : groups;
  const regionFirst = regionPool[0]!;
  const compSlug = sp.comp ?? slugify(regionFirst.category);
  const inComp = regionPool.filter((g) => slugify(g.category) === compSlug);
  const pool = inComp.length > 0 ? inComp : regionPool;
  const poolFirst = pool[0]!;
  const gironeCode = (sp.girone ?? poolFirst.groupCode ?? "a").toLowerCase();
  const selected =
    pool.find((g) => (g.groupCode ?? "a").toLowerCase() === gironeCode) ?? poolFirst;

  // Dati del girone selezionato.
  const [summary, matches, teams, scorers] = await Promise.all([
    getGroup(selected.groupId),
    listMatchesByGroup(selected.groupId),
    getGroupTeams(selected.groupId),
    listTopScorersByGroup(selected.groupId, 5),
  ]);
  const standings = computeStandings(matches, { teamIds: teams.teamIds });

  return (
    <main className="portal">
      <section className="portal-hero">
        <h1>Campionati</h1>
        <p className="lead">
          Scegli campionato e girone: risultati, calendario e classifica in
          un&apos;unica pagina.
        </p>
      </section>

      <CampionatiExplorer
        groups={groups.map((g) => ({
          regionCode: g.regionCode ?? "",
          regionName: g.regionName ?? "",
          category: g.category,
          competitionName: g.competitionName,
          groupCode: g.groupCode ?? "a",
          groupName: g.groupName,
        }))}
        currentRegion={regionCode}
        currentComp={compSlug}
        currentGirone={gironeCode}
      />

      <GroupView
        title={summary ? `${summary.competitionName} — ${summary.groupName}` : selected.groupName}
        matches={matches}
        teamNames={teams.names}
        teamIds={teams.teamIds}
        logos={teams.logos}
        standings={standings}
        scorers={scorers}
      />
    </main>
  );
}
