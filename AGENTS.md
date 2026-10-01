# AGENTS.md — EXTRA TIME

Contesto per agenti AI che lavorano su questo repository.

## Lingua

Tutta la documentazione e le comunicazioni con il committente sono in **italiano**.

## Cos'è EXTRA TIME

Piattaforma digitale per dare visibilità al **calcio dilettantistico e giovanile italiano**.
Vedi `docs/product-vision.md` per vision, target, perimetro, roadmap e KPI.

## Stato attuale

**Fine Fase 1 / inizio Fase 2.** Il pilota Lazio è live su Vercel
(`extra-time-fawn.vercel.app`): portale pubblico, backoffice (Hub Impostazioni) con auth,
pipeline di import calendari dai comunicati LND. La Fase 0 (docs-first) è conclusa da tempo.

## Approccio: docs-first, fasi a valore autonomo

- La **Fase 0 non produce codice** (principio di metodo, ormai superato): produsse visione,
  modello dati e architettura.
- Non partire da homepage/index o dalla tecnologia: parti dal **modello editoriale/prodotto**
  e dalla **sequenza di valore**.
- Ogni fase della roadmap deve essere **utilizzabile senza aspettare la successiva**.
- Prima: **Audience → Utilità → Network → Monetizzazione**. Non costruire funzionalità solo
  perché potenzialmente monetizzabili.

## Principi architetturali

- Il **Football Data Core** è l'asset centrale: le aree (Match, Stats, News, Live, Scout) sono
  viste sullo stesso core, non moduli separati. Vedi `docs/football-data-core.md`.
- **Modular monolith**, non microservizi (almeno all'inizio).
- **ID univoci condivisi** di Club, Team, Player, Match tra YFM ed EXTRA TIME: decisione
  **chiusa** (vedi `docs/yfm-mapping.md`), implementata con il campo `yfm_id` (migrazione
  `0002_yfm_id_links`), flusso unidirezionale YFM → ET.
- **Data ingestion** centralizzata con validation + normalization; nessuna schermata legge
  direttamente dalle fonti originali. L'import dei comunicati LND vive in
  `packages/ingest` + `scripts/import-sgs/*`.
- Stack: **Next.js (App Router) + TypeScript + Neon Postgres + Vercel**. Auth custom
  (scrypt + sessioni), **non** Supabase. Dettagli in `docs/architecture.md`.

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

## Hub Impostazioni / backoffice (`/impostazioni`)

- Hub riservato con **autenticazione custom** (hashing `scrypt` + sessioni server-side,
  tabella `user_sessions`, cookie `et_session`, `middleware.ts`, 7 ruoli RBAC — migrazione
  `0003_auth_users`). Login a `/impostazioni/login`; crea un admin con
  `node scripts/create-admin.mjs`. **Non è Supabase/NextAuth.**
- Navigazione gerarchica **Settore → Campionato → Girone**. Sotto-pagine: `monitoraggio`
  (comunicati LND), `anagrafica` (creazioni), editor risultati per girone.
- Le scritture di base passano da **Server Actions** (`apps/web/src/app/impostazioni/actions.ts`).
- **API route** quando serve runtime Node o lavoro non banale: `/api/import-comunicato`
  (admin) applica un singolo "programma gare" (fetch PDF → parse → apply, anteprima +
  conferma) e marca il comunicato come visto (`comunicati_seen`, migrazione `0004`).
- Il vecchio `/admin` con `ADMIN_TOKEN` è stato **rimosso**.

## Portale pubblico (`apps/web/src/app`)

- Route territoriali annidate: `/[region]/[province]/[category]/[group]`. I codici sono
  brevi (`LAZ`, `RM`), non i nomi estesi: `/laz/rm/u15/a`.
- Route indice: `/` (home), `/campionati`, `/risultati`, `/classifiche`, `/live`, `/news`,
  `/scout`. Hub riservato: `/impostazioni`.
- Lo stile del portale usa classi `.portal-*` in `globals.css` (nav, hero, card, tabella,
  riga partita). Non riusare `.proto-*` (prototipo) né `.pres-*` (presentazione): sono
  prefissi separati per non interferire.
- La riga partita è il componente condiviso `apps/web/src/components/MatchRow.tsx`.
- Classifiche: sempre `computeStandings` di `packages/football-domain`, mai la tabella
  `standings` salvata (valore derivato).
- `revalidate`: 300s per gli indici, 120s per risultati/gironi, 30s per `/live`.
- Nota: con Turbo, dopo modifiche alle pagine può servire `rm -rf apps/web/.next` — la cache
  può servire output vecchio e far sembrare le modifiche non applicate.

## Database

- Il database è **versionato a migrazioni**: `db/migrations/*.sql`, applicate da
  `scripts/migrate.mjs` (tabella di controllo `schema_migrations`). Non modificare una
  migrazione già applicata: aggiungine una nuova.
- Seed dati: `db/seeds/*.sql`, applicati da `scripts/seed.mjs` (idempotenti, `ON CONFLICT`).
- Migrazioni attuali: `0001_initial_schema`, `0002_yfm_id_links`, `0003_auth_users`
  (auth/sessioni/ruoli), `0004_comunicati_seen` (stato comunicati visti).
- Comandi: `pnpm db:setup` (migrazioni + seed), `pnpm db:migrate`, `pnpm db:seed`,
  `pnpm db:migrate:status`.
- **DB Neon condiviso tra locale e produzione** (nessun branch di dev dedicato ancora): le
  modifiche in locale toccano i dati di produzione. Vedi `.kiro/steering/neon.md`.
- Connessione: `DATABASE_URL`, oppure `PGHOST`/`PGPORT`/`PGUSER`/`PGDATABASE`/`PGPASSWORD`.
- Gli script DB **leggono `.env.local`** (poi `.env`) da `scripts/load-env.mjs`: non serve
  esportare `DATABASE_URL` a mano per `pnpm db:setup`.
- **Anche `apps/web/next.config.ts` carica `.env.local` dalla radice**, perché Next.js di
  default cerca l'env solo in `apps/web`: senza, il prerender delle pagine ISR fallisce con
  `ENOENT /tmp/.s.PGSQL.5433`. Le variabili già presenti nell'ambiente hanno la precedenza.
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
