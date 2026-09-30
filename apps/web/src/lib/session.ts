/**
 * Sessione lato server per l'Hub Impostazioni.
 *
 * Il cookie "et_session" porta solo l'id di sessione (UUID opaco), validato
 * contro il DB (user_sessions). HttpOnly + Secure (in prod) + SameSite=Lax.
 */
import "server-only";
import { cookies } from "next/headers";
import {
  login as authLogin,
  logout as authLogout,
  getSessionUser,
  type AuthUser,
} from "@extra-time/database/auth";

export const SESSION_COOKIE = "et_session";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 giorni, allineato a SESSION_DAYS

/** Utente della sessione corrente, o null se non autenticato. */
export async function currentUser(): Promise<AuthUser | null> {
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  return getSessionUser(sid);
}

/** Effettua il login: verifica credenziali e imposta il cookie di sessione. */
export async function signIn(
  email: string,
  password: string,
  userAgent?: string,
): Promise<AuthUser | null> {
  const res = await authLogin(email, password, userAgent);
  if (!res) return null;
  const jar = await cookies();
  jar.set(SESSION_COOKIE, res.sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return res.user;
}

/** Logout: revoca la sessione sul DB e rimuove il cookie. */
export async function signOut(): Promise<void> {
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  await authLogout(sid);
  jar.delete(SESSION_COOKIE);
}
