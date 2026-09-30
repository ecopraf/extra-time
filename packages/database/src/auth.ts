/**
 * Autenticazione custom leggera per l'Hub Impostazioni.
 *
 * - Password: hash con scrypt (node:crypto), formato "scrypt$N$r$p$salt$hash"
 *   (niente dipendenze esterne; scrypt è raccomandato da OWASP).
 * - Sessioni: token server-side in tabella user_sessions. Il cookie porta solo
 *   l'id di sessione (opaco); il logout revoca la riga → invalidazione reale.
 * - RBAC: ruoli via tabelle roles / user_roles.
 *
 * Usa lo stesso pool Neon di index.ts (getPool).
 */
import crypto from "node:crypto";
import { getPool } from "./index";

// ── Password hashing (scrypt) ────────────────────────────────────────────────
const SCRYPT_N = 16384;
const SCRYPT_r = 8;
const SCRYPT_p = 1;
const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_r, p: SCRYPT_p });
  return `scrypt$${SCRYPT_N}$${SCRYPT_r}$${SCRYPT_p}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, nStr, rStr, pStr, saltHex, hashHex] = parts as [string, string, string, string, string, string];
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, salt, expected.length, {
    N: Number(nStr), r: Number(rStr), p: Number(pStr),
  });
  // confronto a tempo costante
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

// ── Utenti ────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  isActive: boolean;
  roles: string[];
}

export async function getUserByEmail(email: string): Promise<(AuthUser & { passwordHash: string | null }) | null> {
  const { rows } = await getPool().query(
    `select u.id, u.email, u.display_name as "displayName", u.is_active as "isActive",
            u.password_hash as "passwordHash",
            coalesce(array_agg(r.code) filter (where r.code is not null), '{}') as roles
       from users u
       left join user_roles ur on ur.user_id = u.id
       left join roles r on r.id = ur.role_id
      where lower(u.email) = lower($1)
      group by u.id`,
    [email],
  );
  return rows[0] ?? null;
}

/** Crea (o aggiorna) un utente con password e ruoli. Idempotente per email. */
export async function upsertUser(opts: {
  email: string;
  password: string;
  displayName?: string;
  roles?: string[];
}): Promise<string> {
  const pool = getPool();
  const passwordHash = hashPassword(opts.password);
  const { rows } = await pool.query(
    `insert into users (email, display_name, password_hash, is_active)
     values ($1, $2, $3, true)
     on conflict (email) do update
       set password_hash = excluded.password_hash,
           display_name = coalesce(excluded.display_name, users.display_name),
           is_active = true,
           updated_at = now()
     returning id`,
    [opts.email, opts.displayName ?? null, passwordHash],
  );
  const userId = rows[0].id as string;
  for (const code of opts.roles ?? []) {
    await pool.query(
      `insert into user_roles (user_id, role_id)
         select $1, r.id from roles r where r.code = $2
       on conflict (user_id, role_id, club_id) do nothing`,
      [userId, code],
    );
  }
  return userId;
}

// ── Sessioni ──────────────────────────────────────────────────────────────────
const SESSION_DAYS = 30;

/** Verifica le credenziali e crea una sessione. Ritorna l'id sessione (opaco). */
export async function login(
  email: string,
  password: string,
  userAgent?: string,
): Promise<{ sessionId: string; user: AuthUser } | null> {
  const u = await getUserByEmail(email);
  if (!u || !u.isActive) return null;
  if (!verifyPassword(password, u.passwordHash)) return null;
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  const { rows } = await getPool().query(
    `insert into user_sessions (user_id, expires_at, user_agent) values ($1, $2, $3) returning id`,
    [u.id, expires, userAgent ?? null],
  );
  await getPool().query(`update users set last_login_at = now() where id = $1`, [u.id]);
  const { passwordHash: _omit, ...user } = u;
  return { sessionId: rows[0].id as string, user };
}

/** Risolve una sessione valida (non scaduta, non revocata) in utente + ruoli. */
export async function getSessionUser(sessionId: string | undefined | null): Promise<AuthUser | null> {
  if (!sessionId) return null;
  const { rows } = await getPool().query(
    `select u.id, u.email, u.display_name as "displayName", u.is_active as "isActive",
            coalesce(array_agg(r.code) filter (where r.code is not null), '{}') as roles
       from user_sessions s
       join users u on u.id = s.user_id
       left join user_roles ur on ur.user_id = u.id
       left join roles r on r.id = ur.role_id
      where s.id = $1 and s.revoked_at is null and s.expires_at > now() and u.is_active
      group by u.id`,
    [sessionId],
  );
  return rows[0] ?? null;
}

/** Revoca una sessione (logout). */
export async function logout(sessionId: string | undefined | null): Promise<void> {
  if (!sessionId) return;
  await getPool().query(`update user_sessions set revoked_at = now() where id = $1`, [sessionId]);
}

export function hasRole(user: AuthUser | null, ...codes: string[]): boolean {
  if (!user) return false;
  return codes.some((c) => user.roles.includes(c));
}
