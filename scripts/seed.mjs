#!/usr/bin/env node
/**
 * Applica i seed del Football Data Core (db/seeds/*.sql) in ordine alfabetico.
 * I seed sono idempotenti (ON CONFLICT DO NOTHING), quindi rieseguirli è sicuro.
 *
 * Uso: node scripts/seed.mjs [nome-file.sql]
 * Senza argomenti applica tutti i seed.
 */

import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const seedsDir = join(root, "db", "seeds");

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

async function main() {
  const only = process.argv[2];
  const files = (await readdir(seedsDir))
    .filter((f) => f.endsWith(".sql"))
    .filter((f) => !only || f === only)
    .sort();

  if (files.length === 0) {
    console.log("Nessun seed da applicare.");
    return;
  }

  const pool = new pg.Pool(poolConfig());
  const client = await pool.connect();
  try {
    for (const name of files) {
      const sql = await readFile(join(seedsDir, name), "utf8");
      process.stdout.write(`applico seed ${name} ... `);
      try {
        await client.query("begin");
        await client.query(sql);
        await client.query("commit");
        console.log("ok");
      } catch (err) {
        await client.query("rollback");
        console.error("FALLITO");
        throw err;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
