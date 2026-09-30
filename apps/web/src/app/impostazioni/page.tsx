import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getCurrentSeasonId,
  listAllGroupsCurrentSeason,
  listAllProvinces,
  listCompetitions,
  listOpenMatchesCurrentSeason,
  listTeams,
} from "@extra-time/database";
import { formatKickoff } from "@/lib/format";
import { currentUser } from "@/lib/session";
import { ActionForm } from "./action-form";
import {
  createClubAction,
  createGroupAction,
  createMatchAction,
  createTeamAction,
  recordResultAction,
  logoutAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function ImpostazioniPage() {
  const user = await currentUser();
  if (!user) redirect("/impostazioni/login");

  const [competitions, provinces, groups, teams, seasonId, openMatches] = await Promise.all([
    listCompetitions(),
    listAllProvinces(),
    listAllGroupsCurrentSeason(),
    listTeams(),
    getCurrentSeasonId(),
    listOpenMatchesCurrentSeason(),
  ]);

  return (
    <main className="portal">
      <section className="portal-hero settings-hero">
        <div>
          <h1>Impostazioni</h1>
          <p className="lead">Gestione dati del Football Data Core. Le modifiche sono subito visibili sul portale.</p>
        </div>
        <div className="settings-user">
          <span className="settings-user-name">{user.displayName ?? user.email}</span>
          <form action={logoutAction}>
            <button type="submit" className="settings-logout">Esci</button>
          </form>
        </div>
      </section>

      <nav className="settings-nav">
        <Link href="/impostazioni/monitoraggio" className="settings-nav-card">
          <span className="settings-nav-title">📡 Monitoraggio calendari</span>
          <span className="settings-nav-desc">Comunicati LND che toccano i calendari</span>
        </Link>
      </nav>

      <div className="settings-grid">
        <section className="portal-card">
          <h2 className="section">Nuovo club</h2>
          <ActionForm action={createClubAction} submitLabel="Crea club">
            <label>Nome canonico<input name="canonicalName" required /></label>
            <label>Città<input name="city" /></label>
            <label>Provincia
              <select name="provinceId" defaultValue="">
                <option value="">—</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>{p.regionName} / {p.name}</option>
                ))}
              </select>
            </label>
          </ActionForm>
        </section>

        <section className="portal-card">
          <h2 className="section">Nuova squadra</h2>
          <ActionForm action={createTeamAction} submitLabel="Crea squadra">
            <label>Nome<input name="name" required placeholder="Albalonga U15" /></label>
            <label>Categoria<input name="category" required placeholder="U15" /></label>
            <label>Club
              <select name="clubId" required defaultValue="">
                <option value="" disabled>Scegli un club</option>
                {teams.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
              </select>
            </label>
            <label>Iscrivi al girone (opzionale)
              <select name="groupId" defaultValue="">
                <option value="">—</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.category} · {g.provinceName ?? "—"} · {g.name}</option>
                ))}
              </select>
            </label>
          </ActionForm>
        </section>

        <section className="portal-card">
          <h2 className="section">Nuovo girone</h2>
          <ActionForm action={createGroupAction} submitLabel="Crea girone">
            <label>Nome<input name="name" required placeholder="Girone B" /></label>
            <label>Codice<input name="code" placeholder="B" /></label>
            <label>Competizione
              <select name="competitionId" required defaultValue="">
                <option value="" disabled>Scegli una competizione</option>
                {competitions.map((c) => (<option key={c.id} value={c.id}>{c.category} · {c.name}</option>))}
              </select>
            </label>
            <label>Provincia
              <select name="provinceId" defaultValue="">
                <option value="">—</option>
                {provinces.map((p) => (<option key={p.id} value={p.id}>{p.regionName} / {p.name}</option>))}
              </select>
            </label>
            {seasonId ? (
              <input type="hidden" name="seasonId" value={seasonId} />
            ) : (
              <p className="error">Nessuna stagione corrente: imposta <code>is_current</code> su una stagione.</p>
            )}
          </ActionForm>
        </section>

        <section className="portal-card">
          <h2 className="section">Programma partita</h2>
          <ActionForm action={createMatchAction} submitLabel="Crea partita">
            <label>Girone
              <select name="groupId" required defaultValue="">
                <option value="" disabled>Scegli un girone</option>
                {groups.map((g) => (<option key={g.id} value={g.id}>{g.category} · {g.provinceName ?? "—"} · {g.name}</option>))}
              </select>
            </label>
            <label>Squadra di casa
              <select name="homeTeamId" required defaultValue="">
                <option value="" disabled>Scegli</option>
                {teams.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
              </select>
            </label>
            <label>Squadra ospite
              <select name="awayTeamId" required defaultValue="">
                <option value="" disabled>Scegli</option>
                {teams.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
              </select>
            </label>
            <label>Giornata<input name="matchday" type="number" min="1" /></label>
            <label>Calcio d&apos;inizio<input name="kickoffAt" type="datetime-local" /></label>
            <label>Campo<input name="venue" /></label>
            {seasonId && <input type="hidden" name="seasonId" value={seasonId} />}
          </ActionForm>
        </section>
      </div>

      <section className="portal-card">
        <h2 className="section">Registra risultato</h2>
        {openMatches.length === 0 ? (
          <p className="empty">Nessuna partita in attesa di risultato.</p>
        ) : (
          <ul className="list-plain">
            {openMatches.map((m) => (
              <li key={m.id}>
                <div className="muted">{m.groupName} · Giornata {m.matchday ?? "?"} · {formatKickoff(m.kickoffAt)}</div>
                <ActionForm action={recordResultAction} submitLabel="Salva">
                  <input type="hidden" name="matchId" value={m.id} />
                  <span className="match-line">
                    {m.homeName}{" "}
                    <input name="homeScore" type="number" min="0" required className="score" aria-label={`Gol ${m.homeName}`} />{" "}
                    -{" "}
                    <input name="awayScore" type="number" min="0" required className="score" aria-label={`Gol ${m.awayName}`} />{" "}
                    {m.awayName}
                  </span>
                </ActionForm>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
