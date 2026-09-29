import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");

/**
 * Le variabili stanno in `.env.local` nella radice del monorepo, ma Next.js le
 * cerca nella propria cartella (`apps/web`). Senza questo caricamento, build e
 * dev del portale non vedrebbero `DATABASE_URL` e le pagine che leggono dal
 * Football Data Core fallirebbero in fase di prerender.
 *
 * Le variabili già presenti nell'ambiente (CI, Vercel) hanno la precedenza.
 */
function loadRootEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = join(repoRoot, file);
    if (!existsSync(path)) continue;

    for (const line of readFileSync(path, "utf8").split("\n")) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
      if (!match) continue;

      const key = match[1];
      const raw = match[2] ?? "";
      if (key === undefined) continue;
      if (process.env[key] !== undefined) continue;

      process.env[key] = raw.trim().replace(/^["']|["']$/g, "");
    }
  }
}

loadRootEnv();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@extra-time/database",
    "@extra-time/football-domain",
    "@extra-time/types",
    "@extra-time/ui",
  ],
};

export default nextConfig;
