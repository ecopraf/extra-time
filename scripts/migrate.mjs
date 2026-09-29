#!/usr/bin/env node
/**
 * Runner di migrazioni del Football Data Core.
 *
 * Applica in ordine i file db/migrations/*.sql non ancora eseguiti e registra
 * l'esito in schema_migrations. Ogni migrazione gira in una transazione:
 * se fallisce, non lascia il database a metà.
 *
 * Uso:
 *   node scripts/migrate.mjs            # applica le migrazioni mancanti
 *   node scripts/migrate.mjs --status   # mostra stato senza applicare
 *
 * Connessione: DATABASE_URL, oppure PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE.
 */

import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "db", "migrations");

const statusOnly = process.argv.includes("--status");

function poolConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }
  return {
    host: process.env.PGHOST ?? "/tmp",
    port: Number(process.env.PGPORT ?? 5433),
    user: process.env.PGUSER ?? "postgres",
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE ?? "postgres",
  };
}

async function listMigrations() {
  const files = await readdir(migrationsDir);
  return files.filter((f) => f.endsWith(".sql")).sort();
}

async function ensureRegistry(client) {
  await client.query(`
    create table if not exists schema_migrations (
      name       text primary key,
      applied_at timestamptz not null default now()
    )
  `);
}

async function appliedMigrations(client) {
  const { rows } = await client.query("select name from schema_migrations");
  return new Set(rows.map((r) => r.name));
}

async function main() {
  const pool = new pg.Pool(poolConfig());
  const client = await pool.connect();
  try {
    await ensureRegistry(client);
    const applied = await appliedMigrations(client);
    const migrations = await listMigrations();
    const pending = migrations.filter((m) => !applied.has(m));

    if (statusOnly) {
      for (const m of migrations) {
        console.log(`${applied.has(m) ? "applied" : "pending"}  ${m}`);
      }
      return;
    }

    if (pending.length === 0) {
      console.log("Nessuna migrazione da applicare.");
      return;
    }

    for (const name of pending) {
      const sql = await readFile(join(migrationsDir, name), "utf8");
      process.stdout.write(`applico ${name} ... `);
      try {
        await client.query("begin");
        await client.query(sql);
        await client.query("insert into schema_migrations (name) values ($1)", [name]);
        await client.query("commit");
        console.log("ok");
      } catch (err) {
        await client.query("rollback");
        console.error("FALLITA");
        throw err;
      }
    }
    console.log(`Applicate ${pending.length} migrazioni.`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
