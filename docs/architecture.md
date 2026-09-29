# EXTRA TIME — Architettura Tecnica

> Scelta di partenza: **Next.js + TypeScript + PostgreSQL/Supabase + Vercel**, con
> architettura modulare e un Football Data Core separato concettualmente dal frontend.

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
                       PostgreSQL / Supabase
                              │
          ┌───────────────────┼──────────────────┐
          │                   │                  │
       Storage              Realtime           Auth
```

## 3. Modular monolith (non microservizi)

Non un monolite con 200 endpoint dentro Next.js, ma **moduli ben separati nello stesso
repository**. Non microservizi: **modular monolith**.

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

## 4. Supabase: piattaforma, non business logic

```
Supabase
│
├── PostgreSQL
├── Auth
├── Storage
└── Realtime
```

La **business logic importante resta nell'application layer**, non dentro Supabase.

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
Realtime (Supabase Realtime)
       ↓
Client (/live/match/123)
```

Tutti gli utenti collegati vedono l'evento quasi immediatamente. Il live **alimenta
automaticamente il Football Data Core**.

## 7. Video: fuori da Supabase

Se "LIVE" significa streaming video, **non** costruire `Camera → Supabase → Next.js`.

Usare in futuro un **provider video specializzato**, mentre EXTRA TIME mantiene nel proprio
database `video_id`, `match_id`, `player_id`, `timestamp`, `metadata`.

```
EXTRA TIME (dati + metadata + riferimenti) → Video Platform (esterna)
```

## 8. CMS editoriale

Valutare un **headless CMS** per la parte editoriale:

```
Next.js
 ├── Football Data → Supabase
 └── Editorial     → Headless CMS
```

Così la redazione crea articoli, categorie, tag, autori, immagini, gallery, contenuti
speciali senza entrare nell'area tecnica.

## 9. Backoffice `/admin`

Il backoffice è **fondamentale** fin dall'inizio. Sezioni:

- **Data Management** — competizioni, squadre, giocatori, partite, risultati
- **Editorial** — articoli, immagini, video, homepage
- **Live** — gestione evento, cronaca, formazione
- **Scout** — profili, report, segnalazioni
- **Moderation** — contenuti, utenti, segnalazioni
- **Data Quality** — segnalazioni sui dati incompleti/duplicati

## 10. Auth e ruoli (RBAC)

Supabase Auth, ma progettare da subito RBAC:

```
SUPER ADMIN → ADMIN → REDAZIONE → LIVE OPERATOR → SCOUT → CLUB → COACH → USER
```

Non serve implementarli tutti subito, ma il modello deve supportarli.

## 11. Monorepo

```
extra-time/
│
├── apps/
│   ├── web/
│   ├── admin/
│   └── maybe-mobile/
│
├── packages/
│   ├── ui/
│   ├── database/
│   ├── football-domain/
│   ├── types/
│   └── config/
│
└── infrastructure/
```

Con **pnpm + Turborepo**, oppure una struttura Next.js più semplice all'inizio. Non servono
tre applicazioni dal giorno 1, ma il concetto di monorepo permette di arrivarci.

## 12. Mobile

Prima **Web App responsive / PWA**. Non fare Web + iOS + Android alla partenza. Solo con
utenti reali valutare React Native / Expo.

## 13. Stack concreto di partenza

| Componente | Scelta |
|------------|--------|
| Frontend | Next.js |
| Linguaggio | TypeScript |
| UI | Tailwind CSS |
| Componenti | shadcn/ui |
| Database | PostgreSQL |
| Backend platform | Supabase |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime |
| Storage | Supabase Storage (inizialmente) |
| Hosting | Vercel |
| CMS | Headless CMS |
| Validation | Zod |
| ORM/query | Drizzle o Supabase client |
| Monorepo | pnpm / Turborepo |
| Analytics | soluzione semplice |
| Monitoring | Sentry |
| Video | provider esterno |
| Mobile | PWA → eventualmente Expo |

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
