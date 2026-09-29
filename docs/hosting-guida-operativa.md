# Guida operativa: mettere EXTRA TIME online

> Passo-passo per portare il progetto su un dominio pubblico, partendo **gratuitamente**.
> Complementare a `hosting-e-archivio.md` (che spiega *perché* certe scelte): qui c'è il
> *come*, nell'ordine in cui va fatto.
>
> Stato attuale: il codice gira in locale, il repository e' privato, nessun servizio e'
> ancora collegato.

## 0. Cosa serve, in ordine

| # | Cosa | Costo | Tempo |
|---|---|---|---|
| 1 | Dominio (es. `extratime.it`) | ~10-15 €/anno | 10 min |
| 2 | Account GitHub (esiste gia') | gratis | — |
| 3 | Account Vercel collegato a GitHub | gratis (Hobby) | 5 min |
| 4 | Database Postgres su Neon | gratis (Free) | 5 min |
| 5 | DNS su Cloudflare | gratis | 15 min |
| 6 | Storage asset su Cloudflare R2 | gratis (10 GB) | 15 min |
| 7 | Email su Resend | gratis (100/giorno) | 20 min |
| 8 | Deploy: Vercel costruisce dal repo | gratis | 10 min |

Totale: **il costo reale e' il dominio**, tutto il resto parte a zero.

## 1. Dominio

Registra il dominio dove preferisci (Cloudflare Registrar, Namecheap, Aruba). Poi **sposta
i nameserver su Cloudflare**: da quel momento DNS, CDN e protezione si gestiscono da un
unico pannello, e i record per Resend e Vercel si aggiungono li'.

Non serve registrare il dominio *presso* Cloudflare: basta puntarci i nameserver.

## 2. Database su Neon

Vercel Hobby non include un database, quindi il Postgres va da un'altra parte. Neon e' la
scelta piu' naturale perche' e' Postgres puro e ha un piano gratuito reale.

1. Crea un progetto su neon.tech (regione: Europa, es. Frankfurt).
2. Copia la **connection string** (`postgresql://...neon.tech/...?sslmode=require`).
3. Applica lo schema dal tuo Mac, puntando al database Neon:

```bash
DATABASE_URL="postgresql://...neon.tech/...?sslmode=require" pnpm db:setup
```

Lo stesso runner di migrazioni usato in locale funziona identico sul database remoto:
e' il vantaggio di avere le migrazioni versionate nel repo.

Attenzione: il piano Free di Neon **sospende il database dopo inattivita'**. Alla prima
richiesta dopo la pausa c'e' qualche secondo di risveglio. Accettabile in validazione.

## 3. Deploy su Vercel

1. Su vercel.com: **Add New → Project → Import** il repository `ecopraf/extra-time`.
2. Vercel riconosce il monorepo pnpm. Imposta la **Root Directory** su `apps/web`.
3. Aggiungi le **Environment Variables** (Production e Preview):
   - `DATABASE_URL` — la stringa di Neon
   - `ADMIN_TOKEN` — un token lungo e casuale per il backoffice
4. **Deploy**. Da qui in avanti ogni push su `main` pubblica automaticamente.

Le pagine del portale leggono dal database già in fase di build (prerender ISR): se
`DATABASE_URL` non è impostata su Vercel, la build **fallisce**. Vanno aggiunte *prima* del
primo deploy, non dopo.

### Il punto delicato: monorepo

L'app dipende dai pacchetti condivisi (`@extra-time/database`, `@extra-time/football-domain`,
`@extra-time/ui`), quindi la build **deve** partire dalla radice, non da `apps/web`.

Con la Root Directory su `apps/web`, Vercel di solito rileva il workspace pnpm e installa
dalla radice da solo. Se la build non trova i pacchetti `@extra-time/*`, correggi in
**Settings → Build and Deployment**:

| Campo | Valore |
|---|---|
| Install Command | `cd ../.. && pnpm install` |
| Build Command | `cd ../.. && pnpm --filter @extra-time/web build` |

Il progetto usa Turborepo: il comando `pnpm build` dalla radice costruisce tutti i
pacchetti nell'ordine giusto. Usare `--filter @extra-time/web` fa costruire solo cio' che
serve al portale e le sue dipendenze.

**Non** committare la cartella `.next`: la produce Vercel a ogni deploy.

## 4. Dominio su Vercel

Nel progetto Vercel: **Settings → Domains → Add**. Inserisci il dominio (e `www`).
Vercel mostra il record da creare. Su Cloudflare:

- crea il record **CNAME** indicato da Vercel;
- **importante**: metti il record in **DNS only** (nuvola grigia) durante la verifica,
  poi puoi riattivare il proxy. Con il proxy attivo Vercel non riesce a emettere il
  certificato e il dominio resta in errore.

Vercel emette e rinnova il certificato HTTPS da solo.

## 5. Storage asset su Cloudflare R2

Per immagini e allegati. **Non** metterli nel repository git ne' nel database.

1. Cloudflare Dashboard → **R2** → crea un bucket (es. `extra-time-assets`).
2. Collega il bucket a un sottodominio pubblico (es. `assets.extratime.it`).
3. Le credenziali (Access Key / Secret) vanno nelle environment di Vercel, non nel codice.

R2 Free: 10 GB di archiviazione e nessun costo di uscita dati — per questo e' preferibile
a soluzioni con egress a consumo.

## 6. Email con Resend

Dettagli completi in `hosting-e-archivio.md` §4. In sintesi:

1. Crea l'account su resend.com e aggiungi il **dominio**.
2. Pubblica su Cloudflare i record che Resend mostra: **SPF su `send`**, **DKIM su
   `resend._domainkey`**, **DMARC su `_dmarc`**.
3. L'errore classico: mettere l'SPF sul dominio principale invece che su `send`. Non
   verifichera' mai.
4. Aggiungi `RESEND_API_KEY` alle environment di Vercel.

## 7. Cosa NON fare adesso

- Non passare a Vercel Pro finche' il progetto non genera ricavi o serve piu' banda.
- Non aggiungere Cloudflare Workers per l'app Next.js: il piano Free ha un limite di CPU
  troppo basso per il rendering SSR (dettagli in `hosting-e-archivio.md` §2).
- Non costruire Kubernetes, AWS o infrastruttura multi-servizio: sarebbe sovraingegneria
  per questa fase.
- Non mettere video in R2 o nel database: quando arrivera' il video (Fase 7) servira' un
  servizio dedicato (Cloudflare Stream, alternativa Mux).

## 8. Checklist finale

- [ ] Dominio registrato e nameserver su Cloudflare
- [ ] Database Neon creato e schema applicato
- [ ] Repository importato su Vercel, Root Directory = `apps/web`
- [ ] Environment: `DATABASE_URL`, `ADMIN_TOKEN`
- [ ] Deploy verde
- [ ] Dominio collegato, HTTPS attivo
- [ ] Bucket R2 creato e sottodominio pubblico
- [ ] Dominio verificato su Resend, SPF/DKIM/DMARC pubblicati
- [ ] Prima pagina pubblica raggiungibile all'indirizzo reale
