# AGENTS.md — EXTRA TIME

Contesto per agenti AI che lavorano su questo repository.

## Lingua

Tutta la documentazione e le comunicazioni con il committente sono in **italiano**.

## Cos'è EXTRA TIME

Piattaforma digitale per dare visibilità al **calcio dilettantistico e giovanile italiano**.
Vedi `docs/product-vision.md` per vision, target, perimetro, roadmap e KPI.

## Approccio: docs-first, fasi a valore autonomo

- **La Fase 0 non produce codice.** Produce visione, modello dati e architettura.
- Non partire da homepage/index o dalla tecnologia: parti dal **modello editoriale/prodotto**
  e dalla **sequenza di valore**.
- Ogni fase della roadmap deve essere **utilizzabile senza aspettare la successiva**.
- Prima: **Audience → Utilità → Network → Monetizzazione**. Non costruire funzionalità solo
  perché potenzialmente monetizzabili.

## Principi architetturali

- Il **Football Data Core** è l'asset centrale: le aree (Match, Stats, News, Live, Scout) sono
  viste sullo stesso core, non moduli separati. Vedi `docs/football-data-core.md`.
- **Modular monolith**, non microservizi (almeno all'inizio).
- **ID univoci condivisi** di Club, Team, Player, Match tra YFM ed EXTRA TIME sono una
  decisione da prendere prima di sviluppare.
- **Data ingestion** centralizzata con validation + normalization; nessuna schermata legge
  direttamente dalle fonti originali.
- Stack di riferimento in `docs/architecture.md` (Next.js + TypeScript + Supabase + Vercel).

## Relazione con Youth Football Manager (YFM)

- YFM **non va rinominato**: resta il "Club Operating System" (B2B).
- EXTRA TIME è il portale pubblico (B2C/media).
- I due si integrano e condividono il Football Data Core.

## Convenzioni commit

```
feat: nuova funzionalità
fix: correzione bug
style: stili CSS
refactor: refactoring
docs: documentazione
```

## Cosa NON fare

- Non replicare lo stack YFM pedissequamente.
- Non fare Live video / Scout marketplace / AI prima delle fasi precedenti.
- Non permettere accesso diretto ai dati dalle fonti esterne nelle viste applicative.
- Non committare artefatti di build (`node_modules/`, `dist/`, `.next/`, `.turbo/`).

## Repository e flusso di lavoro

- Repo GitHub: `ecopraf/extra-time` (**privato**, branch di default `main`).
- Il token della GitHub App di OpenHands **non può creare repository**: la creazione va
  fatta a mano dal proprietario. Può però creare branch, PR, label, issue e workflow.
- Flusso: normalmente branch `fase-N-...` e **pull request verso `main`**.
  **Eccezione temporanea (concordata)**: finché il committente è l'unico a lavorare sul
  repo, si committa direttamente su `main`. Quando arriveranno i collaboratori, si torna
  alle PR.

## Tooling

- Monorepo **pnpm + Turborepo**. `pnpm` si attiva con `sudo corepack enable`.
  Node 20+; in questo ambiente è disponibile Node 24.
- Workspace: `apps/*`, `packages/*`.
- Se una modifica riguarda il package di dominio, eseguire:
  `pnpm --filter @extra-time/football-domain test`.

## Lint e formattazione

- Lint: `pnpm lint` (ESLint, config in `apps/web/.eslintrc.cjs`). È eseguito in CI.
  Aggiungere le regole ESLint qui quando servono, non usare `next lint` (deprecato in Next 16).
- Non è ancora configurato un formatter: introdurre Prettier/Biome è un lavoro a sé.

## Design system (`packages/ui`)

- `src/tokens.ts` è la **fonte di verità** di palette e tipografia: Navy + Electric Blue
  dominanti, Orange come colore caratteristico (LIVE / tempo aggiuntivo). Il colore è
  semantico (blu=info, arancio=live, verde=positivo, rosso=alert), non decorativo.
- `src/Logo.tsx` espone `Mark` (simbolo X + punto live), `Wordmark`, `Logo` e `TimeLine`.
- I valori CSS in `apps/web/src/app/globals.css` rispecchiano i token: se cambi la palette
  in `tokens.ts`, aggiorna anche lì.
- **Tipografia (via di mezzo concordata)**: Inter per l'interfaccia (testo, form, admin),
  Barlow Condensed per numeri e titoli (punteggi, colonne numeriche delle classifiche,
  intestazioni). Caricati con `next/font` in `apps/web/src/app/layout.tsx` (self-hosted,
  nessuna richiesta a Google a runtime). Variabili CSS: `--font-ui`, `--font-numeric`.
- Nessun pallone realistico/scudetto/silhouette nell'identità: il simbolo deve restare
  riconoscibile anche a 32×32.
- Anteprima condivisibile: `/presentazione` (pagina di presentazione, non prodotto finale).

## Backoffice

- Pannello minimo su `/admin`, protetto da token condiviso `ADMIN_TOKEN` via query string.
  Se la variabile non è impostata il pannello è disabilitato.
- Le scritture passano da **Server Actions** in `apps/web/src/app/admin/actions.ts`, che
  chiamano le funzioni di scrittura di `@extra-time/database`. Non creare API route separate
  per ora.
- L'autenticazione vera (Supabase Auth, ruoli) sostituirà il token in una fase successiva.

## Database

- Il database è **versionato a migrazioni**: `db/migrations/*.sql`, applicate da
  `scripts/migrate.mjs` (tabella di controllo `schema_migrations`). Non modificare una
  migrazione già applicata: aggiungine una nuova.
- Seed dati: `db/seeds/*.sql`, applicati da `scripts/seed.mjs` (idempotenti, `ON CONFLICT`).
- Comandi: `pnpm db:setup` (migrazioni + seed), `pnpm db:migrate`, `pnpm db:seed`,
  `pnpm db:migrate:status`.
- Connessione: `DATABASE_URL`, oppure `PGHOST`/`PGPORT`/`PGUSER`/`PGDATABASE`/`PGPASSWORD`.
- Gli script DB **leggono `.env.local`** (poi `.env`) da `scripts/load-env.mjs`: non serve
  esportare `DATABASE_URL` a mano per `pnpm db:setup`.
- In locale senza Docker: il container può avere un Postgres temporaneo su `PGHOST=/tmp`, `PGPORT=5433`.
  In alternativa, senza Docker: `sudo pg_ctlcluster 17 main start` e poi creare utente e
  database come in `.env.example`.
- `db/smoke_test.sql` verifica lo schema su DB appena migrato e termina con `rollback`
  (non lascia dati). In CI è eseguito con `psql -f` tra migrazioni e seed.
- **Non usare meta-comandi psql (`\gset`, ecc.) dentro script passati con `-c`**:
  vanno eseguiti da file con `-f`.
- La classifica salvata in `standings` è un **valore derivato**: la fonte di verità è la
  logica in `packages/football-domain` (`computeStandings`).

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
