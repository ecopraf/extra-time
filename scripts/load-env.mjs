/**
 * Caricamento delle variabili d'ambiente per gli script Node.
 *
 * I runner di migrazioni e seed non passano da Next.js, quindi non leggono
 * `.env.local` da soli: senza questo, `pnpm db:setup` documentato nel README
 * cadrebbe sui default (porta 5433) invece di usare la DATABASE_URL locale.
 *
 * Legge `.env.local` e `.env` dalla radice del repository, senza sovrascrivere
 * le variabili già presenti nell'ambiente (che hanno la precedenza).
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = join(root, file);
    if (!existsSync(path)) continue;

    for (const line of readFileSync(path, "utf8").split("\n")) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
      if (!match) continue;

      const [, key, raw] = match;
      if (process.env[key] !== undefined) continue;

      const value = raw.trim().replace(/^["']|["']$/g, "");
      process.env[key] = value;
    }
  }
}
