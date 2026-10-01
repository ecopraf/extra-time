# EXTRA TIME — Architettura Tecnica

> Stack in uso: **Next.js (App Router) + TypeScript + Neon Postgres + Vercel**, con
> architettura modulare e un Football Data Core separato concettualmente dal frontend.
>
> **Nota sulle scelte di piattaforma**: in origine si valutava Supabase (DB/Auth/Storage/
> Realtime). La scelta effettiva è **Neon** per il Postgres serverless e un'**autenticazione
> custom** leggera (scrypt + sessioni server-side), senza Supabase/NextAuth. Dove sotto si
> legge "Supabase" come piattaforma backend, va inteso come alternativa storica non adottata.

## 0. Stato attuale vs obiettivo

Questo documento descrive **due cose distinte**: com'è il repository **oggi** (ciò che è
realmente costruito e verificato in CI) e dove vogliamo arrivare (**struttura target**).
Le sezioni sono etichettate di conseguenza.

**Attuale (Fase 1).** Monorepo pnpm/Turborepo. Il Football Data Core vive **fuori** dal
frontend, in package dedicati:

```
apps/web/                     Next.js — presentazione + Hub Impostazioni (app/, RSC)
packages/football-domain/     logica di dominio pura (classifiche, calendario) + test
packages/database/            accesso Neon Postgres (pg) + ./auth (scrypt, sessioni, RBAC)
packages/ingest/              import comunicati LND (parse/apply programma gare, pdf)
packages/types/               tipi condivisi del Football Data Core (ID condivisi con YFM)
packages/ui/                  design system (palette, token, componenti)
db/migrations/ + db/seeds/    schema versionato e dati pilota (idempotenti)
scripts/                      migrazioni, seed, create-admin, import-sgs (calendari LND)
```

Principi già in vigore: la business logic non sta nel frontend né nel database; le pagine
pubbliche leggono dal Core; il backoffice scrive tramite Server Actions e, quando serve
runtime Node, via API route (es. `/api/import-comunicato`). Deploy su Vercel
(`extra-time-fawn.vercel.app`), DB Neon condiviso tra locale e produzione.

**Obiettivo.** La struttura a `modules/` descritta nella sezione 3 è la **destinazione**
(modular monolith con moduli football/editorial/live/scouting/media), non lo stato attuale:
va introdotta man mano che i verticali maturano (news in Fase 3, live in Fase 4, scouting in
Fase 6), senza riscrivere ciò che già funziona.

## 1. Perché Next.js e non una SPA Vite

EXTRA TIME ha un requisito che YFM non ha nella stessa misura: la **SEO**.

Pagine da rendere trovabili su Google:

```
/extr-time
/lazio/eccellenza
/lazio/promozione/girone-a
/squadre/albalonga
/giocatori/mario-rossi
/partite/albalonga-vs-x
/news/...
```

Next.js permette di avere contemporaneamente **SEO + velocità + interattività** tramite
Server Components, SSR, Static Generation, ISR e Client Components.

## 2. Architettura a blocchi

```
                         EXTRA TIME
                              │
             ┌────────────────┴────────────────┐
             │                                 │
        PUBLIC WEB                         BACKOFFICE
             │                                 │
      Next.js / React                  Next.js / React
             │                                 │
             └────────────────┬────────────────┘
                              │
                         API / SERVICES
                              │
              ┌───────────────┼────────────────┐
              │               │                │
          Football         Editorial        Scouting
          Data Core          CMS             Engine
              │               │                │
              └───────────────┼────────────────┘
                              │
                        Neon PostgreSQL
                              │
          ┌───────────────────┼──────────────────┐
          │                   │                  │
       Storage              Realtime           Auth
```

## 3. Modular monolith (non microservizi)

Non un monolite con 200 endpoint dentro Next.js, ma **moduli ben separati nello stesso
repository**. Non microservizi: **modular monolith**.

> **Struttura target** (non ancora implementata): la logica resterà nei package del Core,
> mentre `app/` raccoglierà le rotte. I moduli `editorial/`, `live/`, `scouting/`, `media/`
> nascono con i rispettivi verticali; oggi esiste solo `football/`.

```
src/
│
├── modules/
│   ├── football/
│   │   ├── competitions/
│   │   ├── teams/
│   │   ├── players/
│   │   ├── matches/
│   │   └── standings/
│   ├── editorial/
│   │   ├── news/
│   │   ├── authors/
│   │   └── categories/
│   ├── live/
│   │   ├── match-live/
│   │   └── events/
│   ├── scouting/
│   │   ├── reports/
│   │   └── profiles/
│   └── media/
│
├── app/
│   ├── [region]/
│   ├── [competition]/
│   ├── [team]/
│   ├── [player]/
│   └── news/
│
└── shared/
```

Non partire con microservizi: per il livello iniziale sarebbe overhead. Quando qualcosa
diventa realmente pesante, lo si estrae.

## 4. Piattaforma: Neon + servizi dedicati (non Supabase)

```
Neon Postgres            ← database serverless (il Core)
Auth custom (scrypt)     ← sessioni server-side in user_sessions, cookie et_session
Storage: Cloudflare R2   ← media/loghi (vedi docs/hosting-e-archivio.md)
Realtime: da definire     ← per il Live (Fase 4), non ancora adottato
```

La **business logic importante resta nell'application layer** (package del Core), non nella
piattaforma. Scelta storica scartata: Supabase come backend-all-in-one.

## 5. Rendering e caching delle pagine pubbliche

Una pagina come `/squadre/albalonga` non deve interrogare il DB ad ogni visita. Usare
ISR/cache:

```
Database → Next.js → HTML/cache → 10.000 utenti
```

invece di:

```
10.000 utenti → 10.000 query DB
```

Redis/cache: **non subito**, ma previsto. Non comprare infrastruttura preventiva.

## 6. LIVE: realtime

```
Match
 ├── goal
 ├── card
 ├── substitution
 └── other event
       ↓
Realtime (provider da definire)
       ↓
Client (/live/match/123)
```

Tutti gli utenti collegati vedono l'evento quasi immediatamente. Il live **alimenta
automaticamente il Football Data Core**. Il meccanismo realtime (SSE, polling o un servizio
dedicato) sarà scelto in Fase 4; non è ancora implementato.

## 7. Video: fuori dal database

Se "LIVE" significa streaming video, **non** passare il flusso video dal database.

Usare in futuro un **provider video specializzato**, mentre EXTRA TIME mantiene nel proprio
database `video_id`, `match_id`, `player_id`, `timestamp`, `metadata`.

```
EXTRA TIME (dati + metadata + riferimenti) → Video Platform (esterna)
```

## 8. CMS editoriale

Valutare un **headless CMS** per la parte editoriale:

```
Next.js
 ├── Football Data → Neon Postgres (il Core)
 └── Editorial     → Headless CMS (da valutare in Fase 3)
```

Così la redazione crea articoli, categorie, tag, autori, immagini, gallery, contenuti
speciali senza entrare nell'area tecnica.

## 9. Hub Impostazioni / backoffice (`/impostazioni`)

Il backoffice è **fondamentale** fin dall'inizio. Oggi vive in `/impostazioni` (non più
`/admin`), con navigazione gerarchica Settore → Campionato → Girone. Aree:

- **Data Management** — competizioni, squadre, giocatori, partite, risultati (editor
  risultati per girone; anagrafica per le creazioni) — *implementato*
- **Monitoraggio calendari** — comunicati LND, con "Applica" per i programma gare — *implementato*
- **Editorial** — articoli, immagini, video, homepage — *Fase 3*
- **Live** — gestione evento, cronaca, formazione — *Fase 4*
- **Scout** — profili, report, segnalazioni — *Fase 6*
- **Moderation / Data Quality** — contenuti, utenti, segnalazioni sui dati — *futuro*

## 10. Auth e ruoli (RBAC)

**Autenticazione custom** (implementata, migrazione `0003_auth_users`): hashing `scrypt`,
sessioni server-side in `user_sessions` (cookie opaco `et_session`), `middleware.ts` a
protezione delle route. **Non** Supabase Auth / NextAuth. Ruoli RBAC previsti:

```
SUPER ADMIN → ADMIN → REDAZIONE → LIVE OPERATOR → SCOUT → CLUB → COACH → USER
```

I 7 ruoli sono in tabella; oggi è attivo soprattutto ADMIN per l'Hub. Crea un admin con
`node scripts/create-admin.mjs`.

## 11. Monorepo

Oggi (una sola app, il backoffice è dentro `apps/web` come `/impostazioni`):

```
extra-time/
│
├── apps/
│   └── web/                  portale pubblico + Hub Impostazioni
│
├── packages/
│   ├── ui/
│   ├── database/             (+ ./auth)
│   ├── ingest/               import comunicati LND
│   ├── football-domain/
│   └── types/
│
├── db/ (migrations, seeds)
├── scripts/ (migrate, seed, create-admin, import-sgs)
└── infrastructure/
```

Con **pnpm + Turborepo**. Non servono app separate dal giorno 1: eventuali `admin/` o
`maybe-mobile/` si aggiungeranno solo se e quando servono.

## 12. Mobile

Prima **Web App responsive / PWA**. Non fare Web + iOS + Android alla partenza. Solo con
utenti reali valutare React Native / Expo.

## 13. Stack concreto di partenza

| Componente | Scelta attuale | Note |
|------------|----------------|------|
| Frontend | Next.js (App Router) | React Server Components |
| Linguaggio | TypeScript | |
| UI | CSS scritto a mano (`globals.css`) | Tailwind/shadcn **non** adottati |
| Database | **Neon** Postgres (via `pg`) | serverless; condiviso locale+prod |
| Backend platform | nessuna all-in-one | **non** Supabase |
| Auth | **custom** (scrypt + sessioni) | tabella `user_sessions`, cookie `et_session` |
| Realtime | da definire (Fase 4) | non ancora adottato |
| Storage | Cloudflare R2 | media/loghi |
| Hosting | Vercel | `extra-time-fawn.vercel.app` |
| CMS | Headless CMS (da valutare, Fase 3) | |
| Validation | validazione manuale nel data layer | Zod non ancora introdotto |
| ORM/query | query SQL dirette (`pg`) | nessun ORM |
| Monorepo | pnpm / Turborepo | |
| Monitoring | da definire (Sentry candidato) | |
| Video | provider esterno (futuro) | |
| Mobile | PWA → eventualmente Expo | |

## 14. Principio guida

Non fare un secondo YFM. Non portare in EXTRA TIME il principio _"costruiamo la funzionalità e
poi vediamo"_.

```
DATA MODEL → BUSINESS MODEL → USER JOURNEYS → MVP → VALIDATION → EXPANSION
```

e non:

```
Homepage → Login → Dashboard → 100 funzionalità
```
