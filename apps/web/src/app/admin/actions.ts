"use server";

/**
 * Server Actions del backoffice minimo.
 *
 * Autenticazione: in Fase 1 il pannello è protetto da un token condiviso
 * (variabile `ADMIN_TOKEN`). Se la variabile non è impostata il pannello è
 * disabilitato. L'autenticazione vera arriverà con Supabase Auth.
 */

import { revalidatePath } from "next/cache";
import {
  createClub,
  createGroup,
  createMatch,
  createTeam,
  enrollTeam,
  recordResult,
} from "@extra-time/database";

export interface ActionResult {
  ok: boolean;
  message: string;
}

function adminToken(): string | null {
  return process.env.ADMIN_TOKEN || null;
}

function assertToken(submitted: string): void {
  const expected = adminToken();
  if (!expected) throw new Error("Backoffice disabilitato: ADMIN_TOKEN non impostato.");
  if (submitted !== expected) throw new Error("Token non valido.");
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
  return {
    ok: false,
    message: error instanceof Error ? error.message : "Errore sconosciuto.",
  };
}

export async function createGroupAction(form: FormData): Promise<ActionResult> {
  try {
    assertToken(str(form, "token"));
    const name = str(form, "name");
    const competitionId = str(form, "competitionId");
    const seasonId = str(form, "seasonId");
    if (!name || !competitionId || !seasonId) {
      throw new Error("Nome, competizione e stagione sono obbligatori.");
    }
    await createGroup({
      competitionId,
      seasonId,
      provinceId: optional(form, "provinceId"),
      code: optional(form, "code"),
      name,
    });
    revalidatePath("/admin");
    return { ok: true, message: `Girone "${name}" creato.` };
  } catch (error) {
    return fail(error);
  }
}

export async function createTeamAction(form: FormData): Promise<ActionResult> {
  try {
    assertToken(str(form, "token"));
    const name = str(form, "name");
    const clubId = str(form, "clubId");
    const category = str(form, "category");
    if (!name || !clubId || !category) {
      throw new Error("Nome, club e categoria sono obbligatori.");
    }
    const teamId = await createTeam({ clubId, name, category });
    const groupId = optional(form, "groupId");
    if (groupId) await enrollTeam(groupId, teamId);
    revalidatePath("/admin");
    return {
      ok: true,
      message: groupId
        ? `Squadra "${name}" creata e iscritta al girone.`
        : `Squadra "${name}" creata.`,
    };
  } catch (error) {
    return fail(error);
  }
}

export async function createClubAction(form: FormData): Promise<ActionResult> {
  try {
    assertToken(str(form, "token"));
    const canonicalName = str(form, "canonicalName");
    if (!canonicalName) throw new Error("Il nome del club è obbligatorio.");
    await createClub({
      canonicalName,
      provinceId: optional(form, "provinceId"),
      city: optional(form, "city"),
    });
    revalidatePath("/admin");
    return { ok: true, message: `Club "${canonicalName}" creato.` };
  } catch (error) {
    return fail(error);
  }
}

export async function createMatchAction(form: FormData): Promise<ActionResult> {
  try {
    assertToken(str(form, "token"));
    const groupId = str(form, "groupId");
    const homeTeamId = str(form, "homeTeamId");
    const awayTeamId = str(form, "awayTeamId");
    if (!groupId || !homeTeamId || !awayTeamId) {
      throw new Error("Girone, squadra di casa e ospite sono obbligatori.");
    }
    if (homeTeamId === awayTeamId) {
      throw new Error("Casa e ospite devono essere squadre diverse.");
    }
    const matchdayRaw = optional(form, "matchday");
    const matchday = matchdayRaw === null ? null : Number(matchdayRaw);
    if (matchday !== null && !Number.isInteger(matchday)) {
      throw new Error("La giornata deve essere un numero intero.");
    }
    await createMatch({
      groupId,
      seasonId: optional(form, "seasonId"),
      matchday,
      homeTeamId,
      awayTeamId,
      kickoffAt: optional(form, "kickoffAt"),
      venue: optional(form, "venue"),
    });
    revalidatePath("/admin");
    return { ok: true, message: "Partita programmata." };
  } catch (error) {
    return fail(error);
  }
}

export async function recordResultAction(form: FormData): Promise<ActionResult> {
  try {
    assertToken(str(form, "token"));
    const matchId = str(form, "matchId");
    const homeScore = Number(str(form, "homeScore"));
    const awayScore = Number(str(form, "awayScore"));
    if (!matchId) throw new Error("Partita mancante.");
    if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
      throw new Error("I gol devono essere numeri interi.");
    }
    if (homeScore < 0 || awayScore < 0) {
      throw new Error("I gol non possono essere negativi.");
    }
    await recordResult(matchId, homeScore, awayScore);
    revalidatePath("/admin");
    return { ok: true, message: "Risultato registrato." };
  } catch (error) {
    return fail(error);
  }
}
