# Guida operativa: mettere EXTRA TIME online

> Passo-passo per portare il progetto su un dominio pubblico, partendo **gratuitamente**.
> Complementare a `hosting-e-archivio.md` (che spiega *perché* certe scelte): qui c'è il
> *come*, nell'ordine in cui va fatto.
>
> Stato attuale: **già online**. Il progetto è deployato su Vercel
> (`extra-time-fawn.vercel.app`) con database **Neon** (lo stesso usato in locale). I passi
> sotto restano utili come runbook/riferimento e per aggiungere dominio, R2 e Resend.

## 0. Cosa serve, in ordine

| # | Cosa | Costo | Tempo |
|---|---|---|---|
| 1 | Account GitHub (esiste gia') | gratis | — |
| 2 | Account Vercel collegato a GitHub | gratis (Hobby) | 5 min |
| 3 | Database Postgres su Neon | gratis (Free) | 5 min |
| 4 | Deploy: Vercel costruisce dal repo | gratis | 10 min |
| 5 | Dominio (es. `extratime.it`) | ~10-15 €/anno | 10 min |
| 6 | DNS su Cloudflare | gratis | 15 min |
| 7 | Storage asset su Cloudflare R2 | gratis (10 GB) | 15 min |
| 8 | Email su Resend | gratis (100/giorno) | 20 min |

**Si puo' partire senza dominio.** Con i passi 1-4 il sito e' gia' online, raggiungibile
all'indirizzo `*.vercel.app` che Vercel assegna. Dominio, DNS, R2 e Resend (passi 5-8) si
aggiungono dopo, senza rifare nulla: sono solo nomi e record che puntano allo stesso
progetto.

## 1. Database su Neon

Vai su neon.tech, crea il progetto (regione **Francoforte** per l'Italia) e copia la
connection string. Poi applica lo schema dal tuo Mac, puntando al database Neon:

```bash
DATABASE_URL="postgresql://...neon.tech/...?sslmode=require" pnpm db:setup
```

Lo stesso runner di migrazioni usato in locale funziona identico sul database remoto: e' il
vantaggio di avere le migrazioni versionate nel repo. Va eseguito **prima** del primo deploy,
altrimenti il portale si costruisce su tabelle vuote.

Attenzione: il piano Free di Neon **sospende il database dopo inattivita'**. Alla prima
richiesta dopo la pausa c'e' qualche secondo di risveglio. Accettabile in validazione.

## 2. Deploy su Vercel (senza dominio)

1. Su vercel.com: **Add New → Project → Import** il repository `ecopraf/extra-time`.
2. Vercel riconosce il monorepo pnpm. Imposta la **Root Directory** su `apps/web`.
3. Aggiungi le **Environment Variables** (Production e Preview):
   - `DATABASE_URL` — la stringa di Neon
   - (l'accesso all'Hub Impostazioni usa l'**auth custom**: utenti e sessioni sul DB, non
     servono token in env. Crea un admin con `node scripts/create-admin.mjs`. Il vecchio
     `ADMIN_TOKEN` non è più usato.)
4. **Deploy**. Da qui in avanti ogni push su `main` pubblica automaticamente.

Le pagine del portale leggono dal database gia' in fase di build (prerender ISR): se
`DATABASE_URL` non e' impostata su Vercel, la build **fallisce**. Va aggiunta *prima* del
primo deploy, non dopo.

A deploy finito il sito risponde su un indirizzo tipo `extra-time.vercel.app`. **Questo e'
gia' il portale online**, senza spendere nulla.

### Il punto delicato: monorepo

L'app dipende dai pacchetti condivisi (`@extra-time/database`, `@extra-time/football-domain`,
`@extra-time/ui`), quindi la build **deve** partire dalla radice, non da `apps/web`.

`apps/web/vercel.json` è già nel repo e imposta i comandi corretti, quindi normalmente non
devi toccare nulla: Vercel li legge da solo.

Se dovessi configurarli a mano in **Settings → Build and Deployment**, usa:

| Campo | Valore |
|---|---|
| Install Command | `cd ../.. && pnpm install` |
| Build Command | `cd ../.. && pnpm build` |

**Attenzione al comando di build.** `pnpm --filter @extra-time/web build` (senza `...`)
**non** funziona: costruisce solo `web`, senza compilare prima `@extra-time/football-domain`,
e la build fallisce con `Module not found: Can't resolve '@extra-time/football-domain'`.
Le due forme corrette sono `pnpm build` (Turborepo risolve l'ordine) oppure
`pnpm --filter @extra-time/web... build` (i tre puntini includono le dipendenze).

**Non** committare la cartella `.next`: la produce Vercel a ogni deploy.

## 3. Dominio (quando si decide di spenderlo)

Registra il dominio dove preferisci (Cloudflare Registrar, Namecheap, Aruba). Poi **sposta
i nameserver su Cloudflare**: da quel momento DNS, CDN e protezione si gestiscono da un
unico pannello, e i record per Resend e Vercel si aggiungono li'.

Non serve registrare il dominio *presso* Cloudflare: basta puntarci i nameserver.

Poi, nel progetto Vercel: **Settings → Domains → Add**. Inserisci il dominio (e `www`).
Vercel mostra il record da creare. Su Cloudflare:

- crea il record **CNAME** indicato da Vercel;
- **importante**: metti il record in **DNS only** (nuvola grigia) durante la verifica,
  poi puoi riattivare il proxy. Con il proxy attivo Vercel non riesce a emettere il
  certificato e il dominio resta in errore.

Vercel emette e rinnova il certificato HTTPS da solo.

## 4. Storage asset su Cloudflare R2

Per immagini e allegati. **Non** metterli nel repository git ne' nel database.

1. Cloudflare Dashboard → **R2** → crea un bucket (es. `extra-time-assets`).
2. Collega il bucket a un sottodominio pubblico (es. `assets.extratime.it`).
3. Le credenziali (Access Key / Secret) vanno nelle environment di Vercel, non nel codice.

R2 Free: 10 GB di archiviazione e nessun costo di uscita dati — per questo e' preferibile
a soluzioni con egress a consumo.

## 5. Email con Resend

Dettagli completi in `hosting-e-archivio.md` §4. In sintesi:

1. Crea l'account su resend.com e aggiungi il **dominio**.
2. Pubblica su Cloudflare i record che Resend mostra: **SPF su `send`**, **DKIM su
   `resend._domainkey`**, **DMARC su `_dmarc`**.
3. L'errore classico: mettere l'SPF sul dominio principale invece che su `send`. Non
   verifichera' mai.
4. Aggiungi `RESEND_API_KEY` alle environment di Vercel.

## 6. Cosa NON fare adesso

- Non passare a Vercel Pro finche' il progetto non genera ricavi o serve piu' banda.
- Non aggiungere Cloudflare Workers per l'app Next.js: il piano Free ha un limite di CPU
  troppo basso per il rendering SSR (dettagli in `hosting-e-archivio.md` §2).
- Non costruire Kubernetes, AWS o infrastruttura multi-servizio: sarebbe sovraingegneria
  per questa fase.
- Non mettere video in R2 o nel database: quando arrivera' il video (Fase 7) servira' un
  servizio dedicato (Cloudflare Stream, alternativa Mux).

## 7. Checklist finale

- [ ] Database Neon creato e schema applicato
- [ ] Repository importato su Vercel, Root Directory = `apps/web`
- [ ] Environment: `DATABASE_URL` (l'Hub usa auth custom su DB, nessun token in env)
- [ ] Utente admin creato (`node scripts/create-admin.mjs`)
- [ ] Deploy verde, sito raggiungibile su `*.vercel.app`
- [ ] (dopo) Dominio registrato, nameserver su Cloudflare, HTTPS attivo
- [ ] (dopo) Bucket R2 creato e sottodominio pubblico
- [ ] (dopo) Dominio verificato su Resend, SPF/DKIM/DMARC pubblicati
