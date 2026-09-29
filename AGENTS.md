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
- Flusso: lavorare su un branch `fase-N-...`, poi **pull request verso `main`**.
  Non committare direttamente su `main`.

## Tooling

- Monorepo **pnpm + Turborepo**. `pnpm` si attiva con `sudo corepack enable`.
  Node 20+; in questo ambiente è disponibile Node 24.
- Workspace: `apps/*`, `packages/*`.
- Se una modifica riguarda il package di dominio, eseguire:
  `pnpm --filter @extra-time/football-domain test`.

## Database

- Il database è **versionato a migrazioni**: `db/migrations/*.sql`, applicate da
  `scripts/migrate.mjs` (tabella di controllo `schema_migrations`). Non modificare una
  migrazione già applicata: aggiungine una nuova.
- Seed dati: `db/seeds/*.sql`, applicati da `scripts/seed.mjs` (idempotenti, `ON CONFLICT`).
- Comandi: `pnpm db:setup` (migrazioni + seed), `pnpm db:migrate`, `pnpm db:seed`,
  `pnpm db:migrate:status`.
- Connessione: `DATABASE_URL`, oppure `PGHOST`/`PGPORT`/`PGUSER`/`PGDATABASE`/`PGPASSWORD`.
- In locale senza Docker: il container può avere un Postgres temporaneo su `PGHOST=/tmp`, `PGPORT=5433`.
- `db/smoke_test.sql` resta la verifica manuale del modello con `psql -f`.
- **Non usare meta-comandi psql (`\gset`, ecc.) dentro script passati con `-c`**:
  vanno eseguiti da file con `-f`.
- La classifica salvata in `standings` è un **valore derivato**: la fonte di verità è la
  logica in `packages/football-domain` (`computeStandings`).
