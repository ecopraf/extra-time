import {
  getCurrentSeasonId,
  listAllGroupsCurrentSeason,
  listAllProvinces,
  listCompetitions,
  listOpenMatchesCurrentSeason,
  listTeams,
} from "@extra-time/database";
import { formatKickoff } from "@/lib/format";
import { ActionForm } from "./action-form";
import {
  createClubAction,
  createGroupAction,
  createMatchAction,
  createTeamAction,
  recordResultAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const expected = process.env.ADMIN_TOKEN || null;

  if (!expected) {
    return (
      <main>
        <h1>Backoffice</h1>
        <p className="error">
          Pannello disabilitato: imposta la variabile <code>ADMIN_TOKEN</code>.
        </p>
      </main>
    );
  }

  if (token !== expected) {
    return (
      <main>
        <h1>Backoffice</h1>
        <p className="lead">
          Inserisci il token di amministrazione per usare il pannello.
        </p>
        <form method="get" className="admin-form">
          <label>
            Token
            <input type="password" name="token" autoComplete="off" required />
          </label>
          <button type="submit">Accedi</button>
        </form>
      </main>
    );
  }

  const [competitions, provinces, groups, teams, seasonId, openMatches] =
    await Promise.all([
      listCompetitions(),
      listAllProvinces(),
      listAllGroupsCurrentSeason(),
      listTeams(),
      getCurrentSeasonId(),
      listOpenMatchesCurrentSeason(),
    ]);

  const hidden = <input type="hidden" name="token" value={token} />;

  return (
    <main>
      <h1>Backoffice</h1>
      <p className="lead">
        Gestione dati del Football Data Core. Le modifiche sono subito visibili
        sul portale.
      </p>

      <h2 className="section">Nuovo club</h2>
      <ActionForm action={createClubAction} submitLabel="Crea club">
        {hidden}
        <label>
          Nome canonico
          <input name="canonicalName" required />
        </label>
        <label>
          Città
          <input name="city" />
        </label>
        <label>
          Provincia
          <select name="provinceId" defaultValue="">
            <option value="">—</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.regionName} / {p.name}
              </option>
            ))}
          </select>
        </label>
      </ActionForm>

      <h2 className="section">Nuova squadra</h2>
      <ActionForm action={createTeamAction} submitLabel="Crea squadra">
        {hidden}
        <label>
          Nome
          <input name="name" required placeholder="Albalonga U15" />
        </label>
        <label>
          Categoria
          <input name="category" required placeholder="U15" />
        </label>
        <label>
          Club
          <select name="clubId" required defaultValue="">
            <option value="" disabled>
              Scegli un club
            </option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Iscrivi al girone (opzionale)
          <select name="groupId" defaultValue="">
            <option value="">—</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.category} · {g.provinceName ?? "—"} · {g.name}
              </option>
            ))}
          </select>
        </label>
      </ActionForm>

      <h2 className="section">Nuovo girone</h2>
      <ActionForm action={createGroupAction} submitLabel="Crea girone">
        {hidden}
        <label>
          Nome
          <input name="name" required placeholder="Girone B" />
        </label>
        <label>
          Codice
          <input name="code" placeholder="B" />
        </label>
        <label>
          Competizione
          <select name="competitionId" required defaultValue="">
            <option value="" disabled>
              Scegli una competizione
            </option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.category} · {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Provincia
          <select name="provinceId" defaultValue="">
            <option value="">—</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.regionName} / {p.name}
              </option>
            ))}
          </select>
        </label>
        {seasonId ? (
          <input type="hidden" name="seasonId" value={seasonId} />
        ) : (
          <p className="error">
            Nessuna stagione corrente: imposta <code>is_current</code> su una
            stagione.
          </p>
        )}
      </ActionForm>

      <h2 className="section">Programma partita</h2>
      <ActionForm action={createMatchAction} submitLabel="Crea partita">
        {hidden}
        <label>
          Girone
          <select name="groupId" required defaultValue="">
            <option value="" disabled>
              Scegli un girone
            </option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.category} · {g.provinceName ?? "—"} · {g.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Squadra di casa
          <select name="homeTeamId" required defaultValue="">
            <option value="" disabled>
              Scegli
            </option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Squadra ospite
          <select name="awayTeamId" required defaultValue="">
            <option value="" disabled>
              Scegli
            </option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Giornata
          <input name="matchday" type="number" min="1" />
        </label>
        <label>
          Calcio d&apos;inizio
          <input name="kickoffAt" type="datetime-local" />
        </label>
        <label>
          Campo
          <input name="venue" />
        </label>
        {seasonId && <input type="hidden" name="seasonId" value={seasonId} />}
      </ActionForm>

      <h2 className="section">Registra risultato</h2>
      {openMatches.length === 0 ? (
        <p className="empty">Nessuna partita in attesa di risultato.</p>
      ) : (
        <ul className="list-plain">
          {openMatches.map((m) => (
            <li key={m.id}>
              <div className="muted">
                {m.groupName} · Giornata {m.matchday ?? "?"} ·{" "}
                {formatKickoff(m.kickoffAt)}
              </div>
              <ActionForm action={recordResultAction} submitLabel="Salva">
                {hidden}
                <input type="hidden" name="matchId" value={m.id} />
                <span className="match-line">
                  {m.homeName}{" "}
                  <input
                    name="homeScore"
                    type="number"
                    min="0"
                    required
                    className="score"
                    aria-label={`Gol ${m.homeName}`}
                  />{" "}
                  -{" "}
                  <input
                    name="awayScore"
                    type="number"
                    min="0"
                    required
                    className="score"
                    aria-label={`Gol ${m.awayName}`}
                  />{" "}
                  {m.awayName}
                </span>
              </ActionForm>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
