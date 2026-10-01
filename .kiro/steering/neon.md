---
inclusion: fileMatch
fileMatchPattern: 'neon.ts'
---

# EXTRA TIME — Neon (Postgres serverless + config)

Il progetto usa **Neon** come Postgres serverless e per la configurazione dichiarativa
via `neon.ts`. Riferimenti ufficiali: https://neon.com/docs/cli

## CLI

- Il CLI si invoca come **`neon`** (dopo la rev del pacchetto). `neonctl` è un **alias**
  dello stesso binario: entrambi funzionano.
- Installazione: `npm i -g neon@latest`. Autenticazione: `neon login` (apre il browser;
  richiede intervento umano, non è automatizzabile da un agente).
- Comandi reali del CLI usati in questo progetto:
  - `neon login` — autenticazione via browser (**eseguito manualmente dal committente**).
  - `neon link --project-id <id> --branch <branch> -y` — collega la directory al progetto/branch.
  - `neon config init` — inizializza la configurazione (`neon.ts`).
  - `neon skills -y` — installa le agent skills Neon nei coding agent.
  - `neon mcp -y` — configura il server MCP di Neon.
  - `neon deploy` — deploya le Neon Functions / applica la policy `neon.ts`.

## Progetto Neon di questo repo

- Endpoint di **produzione** (branch principale, usato da Vercel): `ep-noisy-math-b19jbljg`
  (pooler, regione `eu-central-1`, database `neondb`).
- **Sviluppo locale su branch dedicato.** Per non toccare i dati di produzione in locale si
  usa un **branch Neon "dev"**: `.env.local` punta al branch dev, Vercel resta sul main.
- Project ID: ricavarlo con `neon projects list` (il valore storico `wispy-math-49040720`
  è da riverificare — non combacia con l'endpoint `noisy-math`).

## Branch di sviluppo (separazione dati dev ↔ prod)

Prerequisiti (una volta, manuali — richiedono il browser):

```
npm i -g neonctl
neon auth
```

Poi, dalla radice del repo:

```
pnpm db:dev-branch        # crea/riusa il branch "dev" e aggiorna .env.local
```

Lo script `scripts/neon-setup-dev-branch.mjs`:
- individua il progetto (o `--project-id <id>` se ne hai più d'uno);
- crea il branch `dev` (o lo riusa), ne ricava la connection string pooled;
- riscrive `DATABASE_URL` in `.env.local` (backup in `.env.local.bak`, valore prod
  conservato come commento `DATABASE_URL_PROD`).

Dopo: `node --env-file=.env.local scripts/migrate.mjs --status` deve puntare al branch dev.
Per tornare a produzione in locale: ripristina `.env.local.bak`. **Vercel non va toccato.**

## Regole operative

- **Mai deployare a mano sul branch di produzione.** `neon deploy` diretto su `production`
  va evitato: ogni cambiamento dovrebbe passare da una PR esercitata in isolamento
  (best practice Neon per le Functions).
- `neon deploy` è un'azione ad **alto impatto** (tocca infrastruttura live): confermare con
  il committente prima di lanciarla.
- `neon login` richiede il browser: va eseguito dall'utente, non dall'agente.
- Il file di policy dichiarativo è **`neon.ts`** e usa `@neon/config` (runtime
  `@neon/config-runtime`, il pacchetto che il CLI usa per applicare la policy).
- Allineare `DATABASE_URL` (in `.env.local`) alle credenziali Neon quando si usa il DB
  serverless al posto del Postgres locale in Docker.
