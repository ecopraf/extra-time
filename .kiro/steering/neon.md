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

- Endpoint di produzione in uso (da `DATABASE_URL`): `ep-noisy-math-b19jbljg` (pooler,
  regione `eu-central-1`, database `neondb`).
- **Lo stesso DB è usato sia in locale (`.env.local`) sia da Vercel in produzione.** Non
  c'è ancora un branch Neon separato per lo sviluppo: attenzione, le modifiche fatte in
  locale toccano i dati di produzione. Un branch di dev dedicato è un miglioramento aperto.
- Project ID storicamente annotato: `wispy-math-49040720` (branch `production`) — **da
  riverificare**: non combacia con l'endpoint attuale `noisy-math`. Confermare con
  `neon projects list` quando il CLI è disponibile.

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
