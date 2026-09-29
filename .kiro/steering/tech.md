---
inclusion: always
---

# EXTRA TIME — Stack, comandi e convenzioni tecniche

## Architettura

- **Modular monolith**, non microservizi (almeno all'inizio).
- Il **Football Data Core** è l'asset centrale: le aree (Match, Stats, News, Live, Scout)
  sono viste sullo stesso core, non moduli separati.
- La **partita** è l'oggetto centrale del modello dati.
- **Data ingestion** centralizzata con validation + normalization; nessuna schermata
  legge direttamente dalle fonti originali.
- **ID univoci condivisi** di Club/Team/Player/Match tra YFM ed ET tramite campo `yfm_id`.

## Stack

- Monorepo **pnpm + Turborepo**. Node **20+** (in questo ambiente è disponibile Node più recente).
- `pnpm` si attiva con corepack: `corepack enable && corepack prepare pnpm@9.15.0 --activate`.
- Workspace: `apps/*`, `packages/*`.
- Frontend: **Next.js (App Router)** + TypeScript + React Server Components.
- Stile: **CSS scritto a mano** in `apps/web/src/app/globals.css` (Tailwind/shadcn sono
  nello stack target ma NON ancora adottati — non introdurli senza accordo).
- Database: **PostgreSQL** via `pg`. Storage/serverless: **Neon** (vedi `neon.md`).

## Struttura del monorepo

```
extra-time/
├── apps/web/                    Next.js (portale pubblico)
├── packages/
│   ├── types/                   tipi del Football Data Core
│   ├── football-domain/         logica di dominio (classifiche) + test
│   ├── database/                accesso al core (schema in db/)
│   └── ui/                      design system (palette, token, componenti)
├── db/
│   ├── migrations/              migrazioni versionate (scripts/migrate.mjs)
│   ├── seeds/                   dati pilota (scripts/seed.mjs)
│   └── smoke_test.sql           smoke test dello schema (rollback, non lascia dati)
├── scripts/                     runner di migrazioni e seed
└── infrastructure/docker/       Postgres locale
```

## Comandi utili

```bash
pnpm install                                     # installa il workspace
pnpm --filter @extra-time/football-domain test   # test della logica di dominio
pnpm --filter @extra-time/web dev                # portale su porta 3000
pnpm build                                       # build di produzione
pnpm typecheck                                   # controllo dei tipi
pnpm lint                                        # lint (ESLint)
pnpm db:setup                                    # migrazioni + seed (idempotente)
pnpm db:migrate                                  # solo migrazioni
pnpm db:seed                                     # solo seed
pnpm db:migrate:status                           # stato delle migrazioni
```

- Gli script DB leggono `.env.local` (poi `.env`) dalla radice tramite `scripts/load-env.mjs`:
  non serve esportare `DATABASE_URL` a mano.
- **`apps/web/next.config.ts` carica `.env.local` dalla radice**: senza, il prerender ISR fallisce.
- Backoffice locale: `ADMIN_TOKEN=... pnpm --filter @extra-time/web dev`, poi
  `http://localhost:3000/admin?token=...`.

## Verifica dopo le modifiche

- Se tocchi il dominio: `pnpm --filter @extra-time/football-domain test`.
- Prima di dichiarare completato: `pnpm typecheck` e `pnpm lint` (girano anche in CI).
- La CI (GitHub Actions) esegue migrate + smoke test + seed + typecheck + lint + test + build
  contro un Postgres reale.
- Con Turbo, dopo modifiche alle pagine può servire `rm -rf apps/web/.next`: la cache può
  restituire output vecchio e far sembrare le modifiche non applicate.

## Convenzioni commit

```
feat: nuova funzionalità
fix: correzione bug
style: stili CSS
refactor: refactoring
docs: documentazione
```

## Flusso git

- Repo GitHub: `ecopraf/extra-time` (privato, branch di default `main`).
- Flusso normale: branch `fase-N-...` + **pull request verso `main`**.
- Eccezione temporanea concordata: finché il committente è l'unico a lavorare, si committa
  direttamente su `main`. Con l'arrivo di collaboratori si torna alle PR.
- Non committare artefatti di build: `node_modules/`, `dist/`, `.next/`, `.turbo/`.

## Tooling e lint

- Lint: `pnpm lint` (ESLint, config in `apps/web/.eslintrc.cjs`). Non usare `next lint`
  (deprecato in Next 16); aggiungere le regole ESLint nella config.
- Nessun formatter configurato ancora: introdurre Prettier/Biome è un lavoro a sé (non farlo di iniziativa).
