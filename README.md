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
- [`docs/data-model.md`](docs/data-model.md) — design del modello dati ([`db/schema.sql`](db/schema.sql))
- [`docs/architecture.md`](docs/architecture.md) — architettura tecnica e stack
- [`docs/open-questions.md`](docs/open-questions.md) — domande aperte da chiarire prima dello sviluppo
- [`AGENTS.md`](AGENTS.md) — contesto per gli agenti AI

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

**Fase 0** — definizione del modello. Documentazione, schema dati e scaffold del monorepo
pronti; nessuna funzionalità di prodotto ancora implementata.

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
│   ├── database/                accesso al core (schema in db/)
│   ├── ui/                      componenti condivisi (placeholder)
│   └── config/                  configurazioni condivise
├── db/
│   ├── migrations/              migrazioni versionate (scripts/migrate.mjs)
│   ├── seeds/                   dati pilota (scripts/seed.mjs)
│   └── smoke_test.sql           smoke test del modello dati
├── scripts/                     runner di migrazioni e seed
└── infrastructure/docker/       Postgres locale
```

Requisiti: Node 20+, pnpm 9.

```bash
pnpm install                # installa il workspace
pnpm --filter @extra-time/football-domain test   # test della logica di dominio
pnpm --filter @extra-time/web dev                # porta 3000
```

Database locale:

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
cp .env.example .env.local        # DATABASE_URL verso il Postgres locale
pnpm db:setup                     # migrazioni + seed (idempotente)
pnpm db:migrate:status            # stato delle migrazioni
```

Con `DATABASE_URL` impostato, in alternativa gli script usano `PGHOST`/`PGPORT`/`PGUSER`/`PGDATABASE`.

## Licenza

Da definire.
