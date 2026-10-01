#!/usr/bin/env node
/**
 * Configura un branch Neon di SVILUPPO separato dalla produzione.
 *
 * Perché: oggi .env.local e Vercel puntano allo STESSO database Neon, quindi
 * ogni test in locale tocca i dati di produzione. Un branch Neon è una copia
 * istantanea e isolata: lo usiamo in locale, la produzione resta sul branch
 * principale.
 *
 * Prerequisiti (da fare UNA volta, manualmente — richiedono il browser):
 *   npm i -g neonctl           # installa il CLI (comando: neon oppure neonctl)
 *   neon auth                  # login via browser
 *
 * Poi:
 *   node scripts/neon-setup-dev-branch.mjs            # crea/riusa il branch 'dev'
 *   node scripts/neon-setup-dev-branch.mjs --name dev --parent production
 *
 * Lo script:
 *   1) individua il project Neon (da --project-id, o unico progetto dell'account);
 *   2) crea il branch dev se non esiste (altrimenti lo riusa);
 *   3) ricava la connection string del branch dev;
 *   4) aggiorna DATABASE_URL in .env.local, salvando il valore precedente
 *      (produzione) in .env.local come DATABASE_URL_PROD commentato + backup file.
 *
 * NON esegue il login e NON tocca Vercel: la produzione resta sul branch main.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..");
const ENV_PATH = path.join(REPO, ".env.local");

const args = process.argv.slice(2);
const argVal = (flag, def) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : def;
};
const BRANCH = argVal("--name", "dev");
const PARENT = argVal("--parent", null); // default: branch primario del progetto
let PROJECT_ID = argVal("--project-id", null);
let ORG_ID = argVal("--org-id", null); // necessario se l'account appartiene a un'organizzazione

// Flag org-id da aggiungere a ogni comando quando presente.
const orgFlags = () => (ORG_ID ? ["--org-id", ORG_ID] : []);

// Trova il binario del CLI Neon: "neon" o "neonctl".
function cliName() {
  for (const name of ["neon", "neonctl"]) {
    try { execFileSync(name, ["--version"], { stdio: "ignore" }); return name; }
    catch { /* prova il prossimo */ }
  }
  console.error(
    "CLI Neon non trovato. Installa e autenticati prima:\n" +
    "  npm i -g neonctl\n  neon auth\n");
  process.exit(1);
}
const NEON = cliName();

function neonJson(cmdArgs) {
  const out = execFileSync(NEON, [...cmdArgs, "--output", "json"], { encoding: "utf8" });
  return JSON.parse(out);
}

function resolveProjectId() {
  if (PROJECT_ID) return PROJECT_ID;
  const projects = neonJson(["projects", "list", ...orgFlags()]);
  const list = Array.isArray(projects) ? projects : projects.projects ?? [];
  if (list.length === 0) { console.error("Nessun progetto Neon trovato per questo account."); process.exit(1); }
  if (list.length > 1) {
    console.error("Più progetti Neon trovati: specifica --project-id <id>. Progetti:");
    for (const p of list) console.error(`  ${p.id}  ${p.name}`);
    process.exit(1);
  }
  return list[0].id;
}

function findBranch(projectId, name) {
  const data = neonJson(["branches", "list", "--project-id", projectId, ...orgFlags()]);
  const list = Array.isArray(data) ? data : data.branches ?? [];
  return list.find((b) => b.name === name) ?? null;
}

function main() {
  PROJECT_ID = resolveProjectId();
  console.error(`Progetto Neon: ${PROJECT_ID}`);

  let branch = findBranch(PROJECT_ID, BRANCH);
  if (branch) {
    console.error(`Branch "${BRANCH}" già esistente (${branch.id}): lo riuso.`);
  } else {
    console.error(`Creo il branch "${BRANCH}"${PARENT ? ` da "${PARENT}"` : ""}…`);
    const createArgs = ["branches", "create", "--project-id", PROJECT_ID, ...orgFlags(), "--name", BRANCH];
    if (PARENT) createArgs.push("--parent", PARENT);
    execFileSync(NEON, createArgs, { stdio: "inherit" });
    branch = findBranch(PROJECT_ID, BRANCH);
    if (!branch) { console.error("Branch creato ma non ritrovato: controlla con 'neon branches list'."); process.exit(1); }
  }

  // Connection string del branch dev (pooled, pronta per l'app).
  const connArgs = ["connection-string", BRANCH, "--project-id", PROJECT_ID, ...orgFlags(), "--pooled"];
  const connStr = execFileSync(NEON, connArgs, { encoding: "utf8" }).trim();
  if (!/^postgres/.test(connStr)) { console.error("Connection string non valida:", connStr); process.exit(1); }

  // Aggiorna .env.local conservando il valore attuale (produzione).
  let env = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : "";
  if (existsSync(ENV_PATH)) {
    copyFileSync(ENV_PATH, `${ENV_PATH}.bak`);
    console.error(`Backup di .env.local in .env.local.bak`);
  }
  const prevMatch = env.match(/^DATABASE_URL=(.*)$/m);
  const lines = env.split("\n");
  const idx = lines.findIndex((l) => /^DATABASE_URL=/.test(l));
  // Conserva il valore prod come commento, se non già presente.
  if (prevMatch && !/^#\s*DATABASE_URL_PROD=/m.test(env)) {
    lines.splice(idx >= 0 ? idx : lines.length, 0,
      `# DATABASE_URL_PROD=${prevMatch[1]}  # valore di produzione (branch main), tenuto per riferimento`);
  }
  const newLine = `DATABASE_URL=${connStr}`;
  const idx2 = lines.findIndex((l) => /^DATABASE_URL=/.test(l));
  if (idx2 >= 0) lines[idx2] = newLine; else lines.push(newLine);
  writeFileSync(ENV_PATH, lines.join("\n"));

  console.error("\n✓ .env.local ora punta al branch di sviluppo.");
  console.error("  Verifica: node --env-file=.env.local scripts/migrate.mjs --status");
  console.error("  Per tornare a produzione: ripristina .env.local.bak o scommenta DATABASE_URL_PROD.");
}

main();
