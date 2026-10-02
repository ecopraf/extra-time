# Extra Time

Piattaforma dedicata al **calcio dilettantistico e giovanile in Italia**.

## Obiettivo

Offrire gli stessi contenuti dei portali generalisti — calendari, partite, risultati live,
classifiche e statistiche dei calciatori — ma con un'**interfaccia più fluida** e un focus
specifico sulle categorie giovanili e dilettantistiche.

In più, rispetto agli analoghi:

- **News** dedicate al mondo dilettantistico e giovanile
- **LIVE**: partite e contenuti esclusivi
- **Portale Scout** per mettere in mostra i talenti
- **Youth Football Manager** integrato (nome e forma da definire)

La missione è aumentare la visibilità e l'attenzione mediatica non solo su Serie D ed
Eccellenza, ma anche sulle categorie inferiori, dove ci sono molte persone valide che
per mancanza di opportunità non riescono a mettersi in mostra.

## Documentazione

- [`docs/product-vision.md`](docs/product-vision.md) — vision, target, perimetro, roadmap, KPI
- [`docs/master-plan.md`](docs/master-plan.md) — master plan Fase 0→10: deliverable, dipendenze, KPI
- [`docs/football-data-core.md`](docs/football-data-core.md) — modello dati e ID condivisi YFM↔EXTRA TIME
- [`docs/data-model.md`](docs/data-model.md) — design del modello dati ([`db/migrations/`](db/migrations))
- [`docs/architecture.md`](docs/architecture.md) — architettura tecnica e stack (stato attuale + obiettivo)
- [`docs/open-questions.md`](docs/open-questions.md) — domande aperte di prodotto/business
- [`AGENTS.md`](AGENTS.md) — contesto per gli agenti AI
- [`CHANGELOG.md`](CHANGELOG.md) — storico delle modifiche

## Identità visiva

- [`packages/ui`](packages/ui) — design system: palette, grammatica di colore, logo
  (simbolo X + punto live) e wordmark. Fonte di verità dei token; `apps/web/src/app/globals.css`
  ne rispecchia i valori.
- Anteprima navigabile su **`/presentazione`** (pagina da condividere, non prodotto finale):
  simbolo, palette, colore come grammatica, percorso a fasi e domande aperte.

## Roadmap (verticali a valore autonomo)

| Fase | Prodotto | Valore autonomo |
|------|----------|-----------------|
| 0 | Modello + architettura | Fondamenta |
| 1 | Campionati / risultati | Portale risultati |
| 2 | Squadre / giocatori | Database calcio |
| 3 | News | Portale informativo |
| 4 | Live testuale | Live football |
| 5 | Player Profile | Visibilità giocatori |
| 6 | Scout | Scouting platform |
| 7 | Video | Media platform |
| 8 | YFM integration | Ecosistema club |
| 9 | Espansione regionale | Scalabilità |
| 10 | Nazionale | Network nazionale |

## Stato

**Fine Fase 1 / inizio Fase 2.** Il pilota **Lazio** è online su Vercel
(`extra-time-fawn.vercel.app`): Football Data Core su Neon Postgres (stagione 2026/2027,
~66 gironi), portale pubblico per territorio e Hub Impostazioni con autenticazione.

Già disponibile:

- Rotta pubblica gerarchica: `/{regione}/{provincia}/{categoria}/{girone}`
  (es. `/laz/rm/u15/a`) con classifica calcolata dal dominio, risultati, prossime partite
  e capocannonieri. Rigenerazione ISR.
- **Hub Impostazioni** (`/impostazioni`) con **login e auth custom** (scrypt + sessioni,
  7 ruoli): backoffice gerarchico Settore → Campionato → Girone, editor risultati,
  anagrafica, monitoraggio dei comunicati LND.
- **Import calendari LND**: package `@extra-time/ingest` + `scripts/import-sgs/*` e gli
  endpoint admin (`/api/import-comunicato`, `/api/import-risultati`, `/api/import-url`) per
  applicare dall'UI programma gare, risultati e variazioni (cambi campo/orario/data), con
  anteprima + conferma. Un badge sull'icona Impostazioni segnala i comunicati da rivedere.
- CI GitHub Actions (`ci.yml`) con Postgres di servizio: migrazioni + seed + typecheck +
  lint + test + build. Un workflow `watch-comunicati.yml` apre una issue quando escono
  nuovi comunicati LND.

**Fase 0** — definizione del modello, completata: documentazione, schema dati e scaffold
del monorepo.

Modello dei tre prodotti:

1. **EXTRA TIME — MEDIA** (B2C): news, risultati, live, video.
2. **EXTRA TIME — FOOTBALL DATA** (B2C): calendari, classifiche, statistiche, profili.
3. **YFM — CLUB OPERATING SYSTEM** (B2B): gestione operativa per le società.

I tre condividono un **Football Data Core**.

## Struttura del monorepo

```
extra-time/
├── apps/
│   └── web/                     Next.js (portale pubblico)
├── packages/
│   ├── types/                   tipi del Football Data Core
│   ├── football-domain/         logica di dominio (classifiche) + test
│   ├── database/                accesso al core (schema in db/) + ./auth (sessioni, RBAC)
│   ├── ingest/                  import comunicati LND (programma gare, risultati, variazioni; pdf/zip)
│   └── ui/                      design system (palette, token, componenti)
├── db/
│   ├── migrations/              migrazioni versionate (scripts/migrate.mjs)
│   ├── seeds/                   dati pilota (scripts/seed.mjs)
│   └── smoke_test.sql           smoke test dello schema (rollback, non lascia dati)
├── scripts/
│   ├── migrate.mjs, seed.mjs    runner di migrazioni e seed
│   ├── create-admin.mjs         crea un utente admin per l'Hub
│   └── import-sgs/              pipeline import calendari LND (extract/build-seed/watch)
└── infrastructure/docker/       Postgres locale (opzione secondaria: in prod è Neon)
```

Requisiti: Node 20+, pnpm 9. Il DB è **Neon Postgres** (lo stesso in locale e in
produzione); Docker serve solo per un Postgres locale alternativo.

### Avvio su macOS (prima volta)

```bash
# 1. Clona il repository (privato: serve l'accesso al repo su GitHub)
git clone https://github.com/ecopraf/extra-time.git
cd extra-time

# 2. Attiva pnpm. Con corepack non serve installarlo a mano.
corepack enable
corepack prepare pnpm@9.15.0 --activate

# 3. Dipendenze del workspace
pnpm install

# 4. Variabili d'ambiente: imposta DATABASE_URL (Neon) in .env.local
cp .env.example .env.local
#    e incolla la connection string Neon in DATABASE_URL.
#    In alternativa, Postgres locale in Docker:
#    docker compose -f infrastructure/docker/docker-compose.yml up -d

# 5. (solo per un DB nuovo) schema e dati pilota — idempotente
pnpm db:setup

# 6. Avvia il portale
pnpm --filter @extra-time/web dev
# http://localhost:3000
```

Attenzione: il DB Neon è **condiviso tra locale e produzione**. Se usi la connection string
di produzione, le modifiche (seed, migrazioni, dati) toccano i dati reali. Per sviluppo
isolato conviene un branch Neon dedicato o il Postgres locale in Docker.

`pnpm db:setup` legge `.env.local`, quindi non serve esportare nulla a mano.

### Comandi utili

```bash
pnpm install                                     # installa il workspace
pnpm --filter @extra-time/football-domain test   # test della logica di dominio
pnpm --filter @extra-time/web dev                # porta 3000
pnpm build                                       # build di produzione
pnpm typecheck                                   # controllo dei tipi
pnpm lint                                        # lint
pnpm db:setup                                    # migrazioni + seed (idempotente)
pnpm db:migrate:status                           # stato delle migrazioni
```

Con `DATABASE_URL` impostato, in alternativa gli script usano `PGHOST`/`PGPORT`/`PGUSER`/`PGDATABASE`.

Backoffice (Hub Impostazioni):

```bash
# crea un utente admin (una volta), poi accedi dall'interfaccia
node scripts/create-admin.mjs
pnpm --filter @extra-time/web dev
# poi apri http://localhost:3000/impostazioni e fai login
```

## Licenza

Da definire.
