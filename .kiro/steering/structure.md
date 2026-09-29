---
inclusion: always
---

# EXTRA TIME — Convenzioni di codice per area

## Database (`db/`)

- Il database è **versionato a migrazioni**: `db/migrations/*.sql`, applicate da
  `scripts/migrate.mjs` (tabella di controllo `schema_migrations`).
- **Non modificare una migrazione già applicata**: aggiungine una nuova.
- Seed: `db/seeds/*.sql`, applicati da `scripts/seed.mjs`. Devono essere **idempotenti**
  (`ON CONFLICT`).
- `db/smoke_test.sql` verifica lo schema su DB appena migrato e termina con `rollback`
  (non lascia dati). In CI è eseguito con `psql -f`.
- **Non usare meta-comandi psql (`\gset`, ecc.) dentro script passati con `-c`**: vanno
  eseguiti da file con `-f`.
- Connessione: `DATABASE_URL`, oppure `PGHOST`/`PGPORT`/`PGUSER`/`PGPASSWORD`/`PGDATABASE`.
- Convenzioni schema: PK **UUID**, `ON DELETE RESTRICT` sugli storici, nomi in inglese/snake_case.
- La classifica salvata in `standings` è un **valore derivato**: la fonte di verità è
  `computeStandings` in `packages/football-domain`. Le viste ricalcolano, non leggono la tabella.

## Package di dominio (`packages/football-domain`)

- Logica pura, senza I/O. Esporta `computeStandings` e `toStandingsRows`.
- Regole classifica: 3/1/0 punti; solo partite `finished` con punteggio; sottrae penalizzazioni;
  ordina per punti → differenza reti → gol fatti → teamId (ordinamento stabile).
- Unico package con test. Dopo ogni modifica: `pnpm --filter @extra-time/football-domain test`.

## Accesso dati (`packages/database`)

- Solo query e mapping ai tipi, **nessuna business logic**.
- Le query filtrano quasi ovunque sulla stagione corrente (`seasons.is_current`).
- Le funzioni sono divise in letture (portale/territorio) e scritture (admin).

## Design system (`packages/ui`)

- `src/tokens.ts` è la **fonte di verità** di palette e tipografia: Navy + Electric Blue
  dominanti, Orange come colore caratteristico (LIVE / tempo aggiuntivo). Il colore è
  **semantico** (blu=info, arancio=live, verde=positivo, rosso=alert), non decorativo.
- Se cambi la palette in `tokens.ts`, aggiorna anche i valori CSS in
  `apps/web/src/app/globals.css`.
- `src/Logo.tsx` espone `Mark` (simbolo X + punto live), `Wordmark`, `Logo`, `TimeLine`.
- Tipografia: **Inter** per l'interfaccia, **Barlow Condensed** per numeri e titoli.
  Self-hosted via `next/font` in `apps/web/src/app/layout.tsx`. Variabili: `--font-ui`, `--font-numeric`.
- Nessun pallone realistico/scudetto/silhouette nell'identità: il simbolo deve restare
  riconoscibile anche a 32×32.

## Portale pubblico (`apps/web/src/app`)

- Route territoriali annidate: `/[region]/[province]/[category]/[group]`. Codici brevi
  (`LAZ`, `RM`), non nomi estesi: es. `/laz/rm/u15/a`.
- Route indice: `/` (home), `/calcio`, `/risultati`, `/classifiche`, `/live`.
- Classifiche: **sempre** `computeStandings`, mai la tabella `standings` salvata.
- `revalidate` (ISR): 300s per gli indici, 120s per risultati/gironi, 30s per `/live`.
- La riga partita è il componente condiviso `apps/web/src/components/MatchRow.tsx`.

## Stili: prefissi CSS separati (non mescolare)

- `.portal-*` — portale pubblico reale.
- `.proto-*` — prototipo navigabile (`/prototipo`, dati finti, vetrina).
- `.pres-*` — pagina di presentazione (`/presentazione`, condivisibile, non prodotto finale).

## Backoffice (`/admin`)

- Pannello minimo protetto da token condiviso `ADMIN_TOKEN` via query string. Se la
  variabile non è impostata, il pannello è disabilitato.
- Le scritture passano da **Server Actions** in `apps/web/src/app/admin/actions.ts`, che
  chiamano le funzioni di scrittura di `@extra-time/database`. **Non creare API route
  separate per ora.**
- L'autenticazione vera (Supabase Auth / ruoli, tabelle RBAC già presenti ma non usate)
  sostituirà il token in una fase successiva.
