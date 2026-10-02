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
- Espone anche `./auth` (hashing scrypt, sessioni, RBAC) usato dall'Hub Impostazioni.

## Import calendari (`packages/ingest`)

- Logica condivisa (pura TS) per l'import dei comunicati LND:
  - **programma gare** (orari/date): `parseProgrammaGare`, `applyProgrammaGare(db, gare, {dry, source})`
  - **risultati**: `parseRisultati`, `applyRisultati(db, risultati, {dry, settore})`.
    `settore` ("giovanili"|"dilettanti") vincola il matching alle categorie del settore,
    così lo stesso club in più campionati non causa falsi positivi. Il fallback "solo
    squadre" non scrive un risultato `finished` su una gara con kickoff futuro (una stessa
    coppia ricorre in giornate diverse).
  - **variazioni** (cambio campo/orario/data): `parseVariazioni`, `applyVariazioni(db, variazioni, {dry})`.
    Gestisce la sezione tabellare "VARIAZIONI AL PROGRAMMA GARE DEL …" + "PROGRAMMA GARE DI
    RECUPERO": aggiorna `kickoff_at`/`venue` della gara (match categoria→girone→squadre,
    giornata se nota), azzera `kickoff_at` se "da definire", non tocca lo status. Non
    gestisce il formato discorsivo "VARIAZIONI DEFINITIVE" (cambio sede interno permanente).
  - **fetch**: `fetchComunicatoText(url)` gestisce PDF **e** ZIP (con `.docx` dentro,
    estratto via `fflate`). `fetchPdfText` resta come alias.
- Usata sia dagli script CLI (`scripts/import-sgs/*`) sia dal web. Endpoint admin:
  `/api/import-comunicato` (programma gare), `/api/import-risultati` (risultati),
  `/api/import-url` (incolla un URL, auto-rileva programma gare / risultati / variazioni e
  applica). Tutti con anteprima dry-run + conferma e marcatura `comunicati_seen`. La parità
  con gli script `.mjs` è verificata.
- `scripts/import-sgs/enumera-comunicati.mjs` + workflow `inventario-comunicati.yml`:
  enumerano lo storage LND (la pagina è JS-rendered) e classificano i comunicati; batch in CI.
- Dipende da `pdf-parse` (importato come `pdf-parse/lib/pdf-parse.js` per evitare il
  side-effect dell'index) e `fflate`. Gli import interni al package sono **senza estensione
  `.js`** (moduleResolution Bundler + webpack).

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
- Route indice: `/` (home), `/campionati`, `/risultati`, `/classifiche`, `/live`,
  `/news`, `/scout`. Hub riservato: `/impostazioni`.
- Classifiche: **sempre** `computeStandings`, mai la tabella `standings` salvata.
- `revalidate` (ISR): 300s per gli indici, 120s per risultati/gironi, 30s per `/live`.
- La riga partita è il componente condiviso `apps/web/src/components/MatchRow.tsx`.

## Stili: prefissi CSS separati (non mescolare)

- `.portal-*` — portale pubblico reale.
- `.proto-*` — prototipo navigabile (`/prototipo`, dati finti, vetrina).
- `.pres-*` — pagina di presentazione (`/presentazione`, condivisibile, non prodotto finale).

## Hub Impostazioni / backoffice (`/impostazioni`)

- Hub riservato con **autenticazione custom** (niente Supabase/NextAuth): hashing
  `scrypt` + sessioni server-side (tabella `user_sessions`, cookie `et_session`),
  `middleware.ts` protegge le route, 7 ruoli RBAC (migrazione `0003_auth_users`).
  Login a `/impostazioni/login`; `requireAdmin` nelle Server Actions.
- Navigazione gerarchica **Settore → Campionato → Girone** (come il portale), non liste
  piatte. Sotto-pagine: `monitoraggio` (comunicati LND), `anagrafica` (creazioni),
  editor risultati per girone.
- Le scritture di base passano da **Server Actions** in
  `apps/web/src/app/impostazioni/actions.ts`.
- **API route** quando serve runtime Node o lavoro non banale: es.
  `/api/import-comunicato` (admin) applica un singolo "programma gare"
  (fetch PDF → parse → apply, anteprima dry-run + conferma) e marca il comunicato come
  visto (`comunicati_seen`, migrazione `0004`).
- Il vecchio pannello `/admin` con `ADMIN_TOKEN` in query string è **rimosso**.
