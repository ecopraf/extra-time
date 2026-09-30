#!/usr/bin/env node
/**
 * Crea (o aggiorna) un utente amministratore dell'Hub Impostazioni.
 *
 * Autonomo: replica l'hashing scrypt di packages/database/src/auth.ts e scrive
 * su Neon con pg, così gira con `node` puro (il package @extra-time/database è
 * TypeScript e non è importabile direttamente senza build).
 *
 * Credenziali via env (NON come argomenti): ADMIN_EMAIL e ADMIN_PASSWORD.
 * Se ADMIN_PASSWORD manca, ne genera una casuale e la stampa UNA SOLA VOLTA.
 *
 * Uso:
 *   ADMIN_EMAIL=tuo@email.it node --env-file=.env.local scripts/create-admin.mjs
 */
import crypto from "node:crypto";
import pg from "pg";

const SCRYPT_N = 16384, SCRYPT_r = 8, SCRYPT_p = 1, KEYLEN = 64;
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_r, p: SCRYPT_p });
  return `scrypt$${SCRYPT_N}$${SCRYPT_r}$${SCRYPT_p}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

const email = process.env.ADMIN_EMAIL;
if (!email) {
  console.error("Manca ADMIN_EMAIL. Esempio: ADMIN_EMAIL=tuo@email.it node --env-file=.env.local scripts/create-admin.mjs");
  process.exit(1);
}
let password = process.env.ADMIN_PASSWORD;
let generated = false;
if (!password) { password = crypto.randomBytes(18).toString("base64url"); generated = true; }
const displayName = process.env.ADMIN_NAME ?? "Amministratore";

const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  const passwordHash = hashPassword(password);
  const { rows } = await c.query(
    `insert into users (email, display_name, password_hash, is_active)
     values ($1, $2, $3, true)
     on conflict (email) do update
       set password_hash = excluded.password_hash,
           display_name = coalesce(excluded.display_name, users.display_name),
           is_active = true, updated_at = now()
     returning id`,
    [email, displayName, passwordHash],
  );
  const userId = rows[0].id;
  await c.query(
    `insert into user_roles (user_id, role_id)
       select $1, r.id from roles r where r.code = 'ADMIN'
     on conflict (user_id, role_id, club_id) do nothing`,
    [userId],
  );
  console.log(`✅ Utente admin pronto: ${email} (id ${userId})`);
  if (generated) {
    console.log("\n🔑 Password generata (salvala ora, non verrà più mostrata):");
    console.log("   " + password + "\n");
  }
} finally {
  await c.end();
}
