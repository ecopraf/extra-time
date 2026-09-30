"use server";

/**
 * Server Actions dell'Hub Impostazioni (backoffice dati).
 *
 * Autenticazione: sessione utente (cookie et_session) + ruolo ADMIN.
 * Sostituisce il vecchio ADMIN_TOKEN in query string.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createClub,
  createGroup,
  createMatch,
  createTeam,
  enrollTeam,
  recordResult,
} from "@extra-time/database";
import { hasRole } from "@extra-time/database/auth";
import { currentUser, signOut } from "@/lib/session";

export interface ActionResult {
  ok: boolean;
  message: string;
}

/** Garantisce sessione valida con ruolo ADMIN. Lancia se non autorizzato. */
async function requireAdmin(): Promise<void> {
  const user = await currentUser();
  if (!user) throw new Error("Sessione scaduta: effettua di nuovo l'accesso.");
  if (!hasRole(user, "ADMIN")) throw new Error("Permessi insufficienti.");
}

function str(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}
function optional(form: FormData, key: string): string | null {
  const value = str(form, key);
  return value === "" ? null : value;
}
function fail(error: unknown): ActionResult {
  return { ok: false, message: error instanceof Error ? error.message : "Errore sconosciuto." };
}

export async function logoutAction(): Promise<void> {
  await signOut();
  redirect("/impostazioni/login");
}

export async function createGroupAction(form: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const name = str(form, "name");
    const competitionId = str(form, "competitionId");
    const seasonId = str(form, "seasonId");
    if (!name || !competitionId || !seasonId) throw new Error("Nome, competizione e stagione sono obbligatori.");
    await createGroup({
      competitionId, seasonId,
      provinceId: optional(form, "provinceId"),
      code: optional(form, "code"),
      name,
    });
    revalidatePath("/impostazioni");
    return { ok: true, message: `Girone "${name}" creato.` };
  } catch (error) { return fail(error); }
}

export async function createTeamAction(form: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const name = str(form, "name");
    const clubId = str(form, "clubId");
    const category = str(form, "category");
    if (!name || !clubId || !category) throw new Error("Nome, club e categoria sono obbligatori.");
    const teamId = await createTeam({ clubId, name, category });
    const groupId = optional(form, "groupId");
    if (groupId) await enrollTeam(groupId, teamId);
    revalidatePath("/impostazioni");
    return {
      ok: true,
      message: groupId ? `Squadra "${name}" creata e iscritta al girone.` : `Squadra "${name}" creata.`,
    };
  } catch (error) { return fail(error); }
}

export async function createClubAction(form: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const canonicalName = str(form, "canonicalName");
    if (!canonicalName) throw new Error("Il nome del club è obbligatorio.");
    await createClub({
      canonicalName,
      provinceId: optional(form, "provinceId"),
      city: optional(form, "city"),
    });
    revalidatePath("/impostazioni");
    return { ok: true, message: `Club "${canonicalName}" creato.` };
  } catch (error) { return fail(error); }
}

export async function createMatchAction(form: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const groupId = str(form, "groupId");
    const homeTeamId = str(form, "homeTeamId");
    const awayTeamId = str(form, "awayTeamId");
    if (!groupId || !homeTeamId || !awayTeamId) throw new Error("Girone, squadra di casa e ospite sono obbligatori.");
    if (homeTeamId === awayTeamId) throw new Error("Casa e ospite devono essere squadre diverse.");
    const matchdayRaw = optional(form, "matchday");
    const matchday = matchdayRaw === null ? null : Number(matchdayRaw);
    if (matchday !== null && !Number.isInteger(matchday)) throw new Error("La giornata deve essere un numero intero.");
    await createMatch({
      groupId,
      seasonId: optional(form, "seasonId"),
      matchday,
      homeTeamId, awayTeamId,
      kickoffAt: optional(form, "kickoffAt"),
      venue: optional(form, "venue"),
    });
    revalidatePath("/impostazioni");
    return { ok: true, message: "Partita programmata." };
  } catch (error) { return fail(error); }
}

export async function recordResultAction(form: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const matchId = str(form, "matchId");
    const homeScore = Number(str(form, "homeScore"));
    const awayScore = Number(str(form, "awayScore"));
    if (!matchId) throw new Error("Partita mancante.");
    if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) throw new Error("I gol devono essere numeri interi.");
    if (homeScore < 0 || awayScore < 0) throw new Error("I gol non possono essere negativi.");
    await recordResult(matchId, homeScore, awayScore);
    revalidatePath("/impostazioni");
    return { ok: true, message: "Risultato registrato." };
  } catch (error) { return fail(error); }
}
