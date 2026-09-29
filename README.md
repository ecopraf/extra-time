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
- [`docs/open-questions.md`](docs/open-questions.md) — domande aperte da chiarire prima dello sviluppo
- [`AGENTS.md`](AGENTS.md) — contesto per gli agenti AI

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

**Fase 1** (in corso) — MVP informativo del Football Data Core. Database versionato a
migrazioni con dataset pilota Lazio, pagine pubbliche navigabili per territorio e un
backoffice minimo per inserire dati.

Già disponibile:

- Rotta pubblica gerarchica: `/{regione}/{provincia}/{categoria}/{girone}`
  (es. `/laz/rm/u15/a`) con classifica calcolata dal dominio, risultati, prossime partite
  e capocannonieri. Rigenerazione ISR.
- Backoffice minimo su `/admin?token=…` (token condiviso `ADMIN_TOKEN`): crea club,
  squadre (con iscrizione al girone), gironi e partite, registra i risultati.
- CI GitHub Actions con Postgres di servizio: migrazioni + seed + typecheck + test + build.

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
│   ├── database/                accesso al core (schema in db/)
│   └── ui/                      design system (palette, token, componenti)
├── db/
│   ├── migrations/              migrazioni versionate (scripts/migrate.mjs)
│   ├── seeds/                   dati pilota (scripts/seed.mjs)
│   └── smoke_test.sql           smoke test dello schema (rollback, non lascia dati)
├── scripts/                     runner di migrazioni e seed
└── infrastructure/docker/       Postgres locale
```

Requisiti: Node 20+, pnpm 9, Docker (per il Postgres locale).

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

# 4. Postgres locale in Docker (porta 5432)
docker compose -f infrastructure/docker/docker-compose.yml up -d

# 5. Variabili d'ambiente: copia l'esempio e lascia i valori di default
cp .env.example .env.local

# 6. Schema e dati pilota (idempotente: si puo' rilanciare)
pnpm db:setup

# 7. Avvia il portale
pnpm --filter @extra-time/web dev
# http://localhost:3000
```

Nota: se hai gia' un Postgres sulla porta 5432, il compose non parte. Cambia la porta in
`infrastructure/docker/docker-compose.yml` **e** il `DATABASE_URL` in `.env.local`.

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

Backoffice locale:

```bash
ADMIN_TOKEN=cambiami pnpm --filter @extra-time/web dev
# poi apri http://localhost:3000/admin?token=cambiami
```

## Licenza

Da definire.
