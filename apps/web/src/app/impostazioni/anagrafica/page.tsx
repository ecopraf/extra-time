import Link from "next/link";
import { redirect } from "next/navigation";
import {
  listCompetitions,
  listAllProvinces,
  listAllGroupsCurrentSeason,
  listClubsBasic,
  getCurrentSeasonId,
} from "@extra-time/database";
import { currentUser } from "@/lib/session";
import { ActionForm } from "../action-form";
import { createClubAction, createTeamAction, createGroupAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AnagraficaPage() {
  const user = await currentUser();
  if (!user) redirect("/impostazioni/login");

  const [competitions, provinces, groups, clubs, seasonId] = await Promise.all([
    listCompetitions(),
    listAllProvinces(),
    listAllGroupsCurrentSeason(),
    listClubsBasic(),
    getCurrentSeasonId(),
  ]);

  return (
    <main className="portal">
      <section className="portal-hero settings-hero">
        <div>
          <h1>Anagrafica</h1>
          <p className="lead">Crea nuovi club, squadre e gironi. Operazioni meno frequenti.</p>
        </div>
        <Link href="/impostazioni" className="settings-back">← Torna alle Impostazioni</Link>
      </section>

      <div className="settings-grid">
        <section className="portal-card">
          <h2 className="section">Nuovo club</h2>
          <ActionForm action={createClubAction} submitLabel="Crea club">
            <label>Nome canonico<input name="canonicalName" required /></label>
            <label>Città<input name="city" /></label>
            <label>Provincia
              <select name="provinceId" defaultValue="">
                <option value="">—</option>
                {provinces.map((p) => (<option key={p.id} value={p.id}>{p.regionName} / {p.name}</option>))}
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
                {clubs.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </label>
            <label>Iscrivi al girone (opzionale)
              <select name="groupId" defaultValue="">
                <option value="">—</option>
                {groups.map((g) => (<option key={g.id} value={g.id}>{g.category} · {g.provinceName ?? "—"} · {g.name}</option>))}
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
              <p className="error">Nessuna stagione corrente.</p>
            )}
          </ActionForm>
        </section>
      </div>
    </main>
  );
}
