import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getGroupTeams,
  listGroupsForPortal,
  listMatchesByGroup,
  listTopScorersByGroup,
  resolveGroup,
} from "@extra-time/database";
import { computeStandings } from "@extra-time/football-domain";
import { slugify } from "@/lib/format";
import { GroupSelector, type SelectorGroup } from "@/components/GroupSelector";
import { GroupView } from "@/components/GroupView";

export const revalidate = 120;

export default async function GroupPage({
  params,
}: {
  params: Promise<{
    region: string;
    province: string;
    category: string;
    group: string;
  }>;
}) {
  const { region, province, category, group } = await params;
  const summary = await resolveGroup({
    regionCode: region.toUpperCase(),
    provinceCode: province.toUpperCase(),
    category,
    groupCode: group,
  });
  if (!summary) notFound();

  const [matches, teams, scorers, portalGroups] = await Promise.all([
    listMatchesByGroup(summary.groupId),
    getGroupTeams(summary.groupId),
    listTopScorersByGroup(summary.groupId, 5),
    listGroupsForPortal(),
  ]);

  const standings = computeStandings(matches, { teamIds: teams.teamIds });

  const selectorGroups: SelectorGroup[] = portalGroups.map((g) => ({
    regionCode: g.regionCode ?? "",
    regionName: g.regionName ?? "",
    provinceCode: g.provinceCode ?? "",
    category: g.category,
    competitionName: g.competitionName,
    groupCode: g.groupCode ?? "",
    groupName: g.groupName,
  }));

  return (
    <main className="portal">
      <section className="portal-hero">
        <nav className="breadcrumb">
          <Link href="/">Italia</Link> /{" "}
          <Link href={`/${region}`}>{summary.regionName ?? region}</Link> /{" "}
          <Link href={`/${region}/${province}`}>
            {summary.provinceName ?? province}
          </Link>{" "}
          /{" "}
          <Link href={`/${region}/${province}/${category}`}>
            {summary.competitionCategory}
          </Link>{" "}
          / {summary.groupName}
        </nav>
        <h1>
          {summary.competitionName} — {summary.groupName}
        </h1>
        <p className="lead">Stagione {summary.seasonLabel}</p>
      </section>

      <GroupSelector
        groups={selectorGroups}
        currentRegion={region.toLowerCase()}
        currentProvince={province.toLowerCase()}
        currentCategorySlug={slugify(summary.competitionCategory)}
        currentGroupCode={group.toLowerCase()}
      />

      <GroupView
        title=""
        matches={matches}
        teamNames={teams.names}
        teamIds={teams.teamIds}
        standings={standings}
        scorers={scorers}
      />
    </main>
  );
}
