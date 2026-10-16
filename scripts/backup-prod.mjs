/**
 * Backup logico del database (pg_dump) — rete di sicurezza indipendente dal
 * "restore window" di Neon.
 *
 * Esegue pg_dump in formato custom compresso (-Fc) del DB puntato da
 * DATABASE_URL (o dall'argomento --url), salvando un file con timestamp in
 * backups/. Il formato custom è ripristinabile selettivamente con pg_restore.
 *
 * NON è distruttivo: solo lettura dal DB, scrittura di un file locale.
 *
 * Uso:
 *   node scripts/backup-prod.mjs                      # usa $DATABASE_URL
 *   node scripts/backup-prod.mjs --url "postgres://…" # URL esplicito
 *   node scripts/backup-prod.mjs --out-dir backups    # cartella di destinazione
 *   node scripts/backup-prod.mjs --label pre-import   # suffisso nel nome file
 *
 * Richiede `pg_dump` nel PATH (client PostgreSQL). In CI: installare
 * postgresql-client della stessa major del server (Neon = PostgreSQL 17).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const url = arg("url", process.env.DATABASE_URL || process.env.DB);
if (!url) {
  console.error("Manca la connection string: passa --url o imposta DATABASE_URL.");
  process.exit(1);
}

const outDir = arg("out-dir", "backups");
const label = arg("label", "");
fs.mkdirSync(outDir, { recursive: true });

// Individua pg_dump: prima nel PATH, poi nei percorsi noti (Homebrew libpq/
// postgresql, Postgres.app). Il server Neon è PostgreSQL 18: serve un pg_dump
// con major >= quella del server.
function resolvePgDump() {
  const candidates = [
    "/usr/lib/postgresql/18/bin/pg_dump", // Linux/CI (postgresql-client-18)
    "pg_dump",
    "/usr/local/Cellar/libpq/18.6/bin/pg_dump",
    "/opt/homebrew/opt/libpq/bin/pg_dump",
    "/opt/homebrew/opt/postgresql@18/bin/pg_dump",
    "/usr/local/opt/libpq/bin/pg_dump",
    "/Applications/Postgres.app/Contents/Versions/latest/bin/pg_dump",
  ];
  for (const bin of candidates) {
    const p = spawnSync(bin, ["--version"], { encoding: "utf8" });
    if (p.status === 0) return { bin, version: p.stdout.trim() };
  }
  return null;
}

const pgDump = resolvePgDump();
if (!pgDump) {
  console.error("pg_dump non trovato. Installa il client PostgreSQL 18 (es. `brew install libpq`).");
  process.exit(1);
}
console.error(pgDump.version);

const stamp = new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
const safeLabel = label ? `_${label.replace(/[^a-zA-Z0-9._-]/g, "-")}` : "";
const outFile = path.join(outDir, `extra-time_${stamp}${safeLabel}.dump`);

console.error(`Backup in corso → ${outFile}`);
// -Fc: formato custom compresso; --no-owner/--no-privileges: dump portabile.
const res = spawnSync(
  pgDump.bin,
  [url, "-Fc", "--no-owner", "--no-privileges", "-f", outFile],
  { stdio: ["ignore", "inherit", "inherit"] },
);

if (res.status !== 0) {
  console.error(`pg_dump fallito (exit ${res.status}).`);
  process.exit(res.status ?? 1);
}

const bytes = fs.statSync(outFile).size;
console.error(`OK: ${outFile} (${(bytes / 1024 / 1024).toFixed(2)} MB)`);
