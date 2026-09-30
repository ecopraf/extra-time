"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { signIn } from "@/lib/session";

export interface LoginResult {
  ok: boolean;
  message: string;
}

/** Login dell'Hub Impostazioni. In caso di successo reindirizza a /impostazioni. */
export async function loginAction(_prev: LoginResult, form: FormData): Promise<LoginResult> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) {
    return { ok: false, message: "Inserisci email e password." };
  }
  const ua = (await headers()).get("user-agent") ?? undefined;
  const user = await signIn(email, password, ua);
  if (!user) {
    return { ok: false, message: "Credenziali non valide." };
  }
  redirect("/impostazioni");
}
