import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getGroup,
  listAllGroupsCurrentSeason,
  listGroupsForPortal,
  listTeamsByGroup,
  listMatchesByGroupAdmin,
  getCurrentSeasonId,
} from "@extra-time/database";
import { slugify, formatDateOnly } from "@/lib/format";
import { currentUser } from "@/lib/session";
import { BackofficeExplorer, type BoGroup } from "./BackofficeExplorer";
import { ActionForm } from "./action-form";
import { ResultsEditor, type EditorMatch } from "./ResultsEditor";
import { createMatchAction, logoutAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ImpostazioniPage({
  searchParams,
}: {
  searchParams: Promise<{ comp?: string; girone?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/impostazioni/login");
  const sp = await searchParams;

  // Gironi della stagione corrente (con settore/categoria) per il selettore.
  const portalGroups = await listGroupsForPortal();
  const boGroups: BoGroup[] = portalGroups.map((g) => ({
    category: g.category,
    competitionName: g.competitionName,
    level: g.level ?? "",
    groupId: g.groupId,
    groupCode: g.groupCode,
    groupName: g.groupName,
  }));

  // Selezione corrente (default: primo campionato/girone).
  const first = boGroups[0];
  const compSlug = sp.comp ?? (first ? slugify(first.category) : "");
  const inComp = boGroups.filter((g) => slugify(g.category) === compSlug);
  const pool = inComp.length > 0 ? inComp : boGroups;
  const gironeCode = (sp.girone ?? pool[0]?.groupCode ?? "a").toLowerCase();
  const selected = pool.find((g) => (g.groupCode ?? "a").toLowerCase() === gironeCode) ?? pool[0];

  // Dati del girone selezionato.
  const [summary, teams, matches, seasonId] = selected
    ? await Promise.all([
        getGroup(selected.groupId),
        listTeamsByGroup(selected.groupId),
        listMatchesByGroupAdmin(selected.groupId),
        getCurrentSeasonId(),
      ])
    : [null, [], [], await getCurrentSeasonId()];

  // Partite del girone per l'editor risultati (tutte, navigabili per giornata).
  const editorMatches: EditorMatch[] = matches.map((m) => ({
    id: m.id,
    matchday: m.matchday,
    homeName: m.homeName,
    awayName: m.awayName,
    homeLogo: m.homeLogo,
    awayLogo: m.awayLogo,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    finished: m.status === "finished" && m.homeScore !== null,
    dateLabel: m.kickoffAt ? formatDateOnly(m.kickoffAt) : null,
  }));

  return (
    <main className="portal">
      <section className="portal-hero settings-hero">
        <div>
          <h1>Impostazioni</h1>
          <p className="lead">Gestione dati del portale. Scegli il girone su cui lavorare.</p>
        </div>
        <div className="settings-user">
          <span className="settings-user-name">{user.displayName ?? user.email}</span>
          <form action={logoutAction}><button type="submit" className="settings-logout">Esci</button></form>
        </div>
      </section>

      <nav className="settings-nav">
        <Link href="/impostazioni/monitoraggio" className="settings-nav-card">
          <span className="settings-nav-title">📡 Monitoraggio calendari</span>
          <span className="settings-nav-desc">Comunicati LND che toccano i calendari</span>
        </Link>
        <Link href="/impostazioni/anagrafica" className="settings-nav-card">
          <span className="settings-nav-title">🗂️ Anagrafica</span>
          <span className="settings-nav-desc">Crea club, squadre e gironi</span>
        </Link>
      </nav>

      <BackofficeExplorer groups={boGroups} currentComp={compSlug} currentGirone={gironeCode} />

      {!selected ? (
        <div className="portal-card"><p className="empty">Nessun girone nella stagione corrente.</p></div>
      ) : (
        <>
          <h2 className="settings-context-title">
            {summary ? `${summary.competitionName} — ${summary.groupName}` : selected.groupName}
            <span className="settings-context-meta">{teams.length} squadre</span>
          </h2>

          {/* Registra risultati: layout "prossime partite" con frecce per giornata */}
          <section className="portal-card">
            <h3 className="section">Registra risultati</h3>
            <ResultsEditor matches={editorMatches} />
          </section>

          {/* Programma nuova partita: squadre SOLO di questo girone */}
          <section className="portal-card">
            <h3 className="section">Programma partita in questo girone</h3>
            <ActionForm action={createMatchAction} submitLabel="Crea partita">
              <input type="hidden" name="groupId" value={selected.groupId} />
              {seasonId && <input type="hidden" name="seasonId" value={seasonId} />}
              <label>Casa
                <select name="homeTeamId" required defaultValue="">
                  <option value="" disabled>Scegli</option>
                  {teams.map((t) => (<option key={t.id} value={t.id}>{t.clubName}</option>))}
                </select>
              </label>
              <label>Ospite
                <select name="awayTeamId" required defaultValue="">
                  <option value="" disabled>Scegli</option>
                  {teams.map((t) => (<option key={t.id} value={t.id}>{t.clubName}</option>))}
                </select>
              </label>
              <label>Giornata<input name="matchday" type="number" min="1" /></label>
              <label>Calcio d&apos;inizio<input name="kickoffAt" type="datetime-local" /></label>
              <label>Campo<input name="venue" /></label>
            </ActionForm>
          </section>
        </>
      )}
    </main>
  );
}
