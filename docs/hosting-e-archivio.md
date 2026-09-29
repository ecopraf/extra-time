# EXTRA TIME — Hosting, servizi e archivio dei contenuti

> Documento di lavoro. Risponde a due domande: **dove ospitiamo i vari servizi** e
> **come rendiamo i contenuti consultabili nel tempo** (news, risultati, classifiche,
> rose, media). I prezzi sono quelli pubblicati dai fornitori, verificati a settembre 2026.

## 0. Il vincolo di partenza

Due decisioni già prese condizionano tutto:

1. **EXTRA TIME ha database e ambiente separati da YFM**, per non consumare il piano di YFM.
2. **EXTRA TIME è commerciale** (pubblicità, abbonamenti, sponsor previsti in `product-vision.md` §12).

Da qui un punto che va chiarito subito, perché contraddice un'ipotesi informale:

> **Il piano gratuito di Vercel (Hobby) vieta l'uso commerciale.** Vercel lo applica
> attivamente: progetti Hobby usati per attività che generano ricavi vengono sospesi.
> Quindi EXTRA TIME **non può stare su Hobby**, nemmeno in un ambiente separato.

L'ambiente separato serve comunque, ma su **Vercel Pro** ($20/sviluppatore/mese) o su un
fornitore diverso. Non esiste la via "gratis e separato" restando su Vercel.

Da verificare con Vittorio: **su quale piano è oggi YFM?** Se è su Hobby, il problema non
riguarda solo EXTRA TIME — vale anche per YFM, che è un prodotto B2B commerciale. Va
chiarito prima di dimensionare i costi.

## 1. Comparativa piattaforme

| | **Vercel Pro** | **Cloudflare Workers** | **Hetzner + Coolify** |
|---|---|---|---|
| Costo base | $20 / seat / mese | $5 / mese (**per account**, non per persona) | ~€4–8 / mese (VPS) |
| Uso commerciale | incluso nel Pro | incluso | incluso |
| Banda | 1 TB, poi $0,15–0,40/GB | **illimitata** (nessun costo di uscita) | 20 TB incluse |
| Next.js | nativo, zero config | adattatore OpenNext (SSR, ISR, PPR, middleware) | nativo (Docker) |
| Preview per PR | sì, ottime | sì | con Coolify, buone |
| Immagini | Image Optimization a consumo | Cloudflare Images (a consumo) | da configurare |
| Limite tecnico tipico | costo a consumo (banda, richieste, build) | 128 MB di memoria per isolate, 10 MB bundle | gestisci tu tutto |
| Cold start | minimi | possibili | nessuno (processo sempre attivo) |
| Lock-in | alto | medio | nullo |
| Chi gestisce il server | Vercel | Cloudflare | **noi** |

### Costi reali per fase (stima)

| Scenario | Vercel Pro | Cloudflare | Hetzner + Coolify |
|---|---|---|---|
| **Fase 1** — pilota Lazio, 5–20k visite/mese, <100 MB | $20 + DB | $5 + DB | ~€6 (app + DB sullo stesso box) |
| **Fase 3** — 100k visite/mese, news e immagini, 2 stagioni | $20 + overage + DB → **$60–150** | $5 + R2/Images + DB → **~$25** | ~€15 |
| **Fase 7** — 1M visite/mese, live e video | $300–1000+ | $50–200 (il video domina) | €70–150 |

### Lettura

- **Vercel** è la strada più rapida a un deploy stabile con preview URL: è il framework
  "di casa", zero configurazione, ogni feature di Next.js funziona subito. Costa di più e
  il costo cresce con la banda.
- **Cloudflare** è l'economia migliore: $5 per account (non per persona), banda gratis,
  R2 senza costi di uscita. In cambio serve l'adattatore OpenNext e si perde un po' di DX.
- **Hetzner + Coolify** è il costo più basso in assoluto e dà controllo totale, ma il
  server lo gestiamo noi: aggiornamenti, backup, sicurezza. È lavoro, non solo risparmio.

**Raccomandazione Fase 1:** partire su **Vercel Pro** (1 seat) per arrivare subito al link
stabile che serve a Vittorio, tenendo il codice privo di dipendenze Vercel-specifiche
(niente Vercel KV, Blob, Postgres) così che il passaggio a Cloudflare resti possibile senza
riscritture. Rivalutare Cloudflare quando banda e media iniziano a pesare.

## 2. I servizi e dove metterli

| Servizio | Scelta consigliata | Perché |
|---|---|---|
| **Frontend / SSR** | Vercel Pro (poi Cloudflare) | Next.js, preview, ISR |
| **Database** | **Supabase, progetto separato** (Pro $25) o Neon | Postgres gestito; separato da YFM come deciso |
| **Media (immagini)** | **Cloudflare R2** + Cloudflare Images | $0,015/GB/mese, **uscita gratis**, $5/100k immagini |
| **Media (video)** | Cloudflare Stream (Fase 7) | ~$5/1000 minuti archiviati, $1/1000 minuti serviti |
| **Ricerca** | **Postgres full-text** all'inizio | regge centinaia di query/s e fino a ~100k record; Typesense solo quando serve tolleranza ai typo e facet |
| **CMS / news** | **tabelle Postgres** ora, **Payload CMS** quando la redazione cresce | Payload gira *dentro* Next.js e usa **lo stesso Postgres**: nessuna frammentazione |
| **Email** | Resend o Brevo (free tier) | notifiche, contatti, credenziali staff |
| **Auth** | Supabase Auth | profili, backoffice, area scout |

### Il punto importante sul CMS

Un CMS SaaS (Sanity, Contentful) terrebbe gli articoli **fuori** dal nostro database.
Ma in Fase 3 le news sono *collegate ai dati* ("articolo connesso a partita, squadre,
marcatori, classifica"): se l'articolo vive in un altro sistema, ogni collegamento diventa
un riferimento tra sistemi diversi e la generazione automatica di contenuti derivati si
complica.

**Payload CMS** (MIT, self-hosted) è l'eccezione: dalla v3 gira come plugin dentro
l'app Next.js e salva sullo **stesso Postgres**. L'articolo e la partita stanno nello
stesso database, quindi si possono unire con una `join`. Costo software zero; si paga solo
l'infrastruttura che già abbiamo.

**Consiglio:** in Fase 1–3 non introdurre un CMS. Una tabella `articles` + il backoffice
già esistente bastano. Payload si aggiunge dopo, senza migrare i contenuti, perché il
database è lo stesso.

## 3. Archivio: rendere i contenuti consultabili nel tempo

Questa è la parte che conta davvero. "Consultabile nel tempo" significa quattro cose
distinte, che vanno progettate adesso perché cambiarle dopo è costoso.

### 3.1 URL permanenti (permalink)

Ogni contenuto pubblicato riceve uno **slug stabile che non cambia mai**:

```
/news/2026/09/al-via-la-nuova-stagione-dilettanti
/partite/2026-09-21/albalonga-vs-lvpa-frascati
/lazio/eccellenza/2025-2026/girone-a/classifica
```

Regole: lo slug si genera una volta e non si tocca (se cambia il titolo, si aggiunge un
redirect 301 dal vecchio). I contenuti non si cancellano mai fisicamente: si **archiviano**
(campo `archived_at`). Un link pubblicato non deve mai rompersi: è ciò che rende un
archivio consultabile invece che una discarica.

### 3.2 Il testo sta nel database, non nel CMS

- Il corpo dell'articolo è una riga in `articles` (testo + metadati), nello stesso database
  dei risultati.
- Le **immagini non stanno né nel database né nel repository**: stanno su R2, e nel database
  c'è solo l'URL. Il database resta piccolo e i backup restano veloci.
- Versionamento: ogni modifica a un articolo pubblicato crea una revisione, non sovrascrive.
  Un articolo sbagliato si corregge senza perdere la versione precedente.

### 3.3 Storico sportivo (la parte difficile)

Il calcio è intrinsecamente storico: classifiche di stagioni passate, rose che cambiano,
albi d'oro. Serve un modello **temporale**, non solo "lo stato attuale".

| Dato | Come si conserva |
|---|---|
| **Risultati** | `matches` con `season_id`: una partita giocata è **immutabile**. Lo storico è già tutto lì. |
| **Classifiche** | **derivate**, non salvate: si ricalcolano dai risultati della stagione. Si materializzano per velocità, non per verità. |
| **Rose** | servono validità temporali: `valid_from` / `valid_to` sul tesseramento. "Dove giocava Rossi a marzo 2025" è una domanda legittima. |
| **Albi d'oro** | vista derivata: vincitori per competizione e stagione. |

Il principio: **i fatti si conservano, le viste si ricalcolano.** Salvare una classifica
come dato significa doverla correggere a mano quando emerge un errore; ricalcolarla dai
risultati significa che si corregge da sola.

### 3.4 Freddo e caldo

- **Caldo**: stagione corrente → Postgres, indicizzata, live.
- **Freddo**: stagioni passate → stesse tabelle, partizionate per stagione. Restano
  interrogabili ma non appesantiscono le query correnti.
- **Ghiacciato** (solo se un giorno servirà): export in Parquet su R2 per analisi storiche
  su grandi volumi, a $0,015/GB.

### 3.5 Backup

Il piano gratuito di Supabase **non ha backup automatici** e mette in pausa i progetti dopo
7 giorni di inattività. Per un archivio consultabile è inaccettabile.

- **Supabase Pro**: backup giornalieri, 7 giorni di ritenzione.
- **In più**: dump logico settimanale (`pg_dump`) su R2. Costo quasi nullo
  ($0,015/GB/mese), e ci mette al riparo anche da un errore del fornitore.

## 4. Costi per fase (riepilogo)

| Fase | Stack | Costo mensile stimato |
|---|---|---|
| 1 | Vercel Pro (1 seat) + Supabase Pro | ~$45 |
| 1 (economica) | Cloudflare Workers + Neon Launch | ~$10–15 |
| 3 | Vercel Pro + Supabase Pro + R2/Images | ~$60–70 |
| 3 (Cloudflare) | Workers + R2 + Neon | ~$25 |
| 7 | + Cloudflare Stream (video) | +$50–500 secondo il video |

## 5. Decisioni da prendere

1. **Vercel Pro o Cloudflare Workers?** Vercel = più rapido e comodo, $20/seat.
   Cloudflare = $5 per account e banda gratis, con un po' più di lavoro. La mia
   raccomandazione: Vercel Pro in Fase 1, rivalutare Cloudflare alla Fase 3.
2. **Supabase Pro ($25) o Neon (a consumo, ~$5–20)?** Supabase dà anche Auth, Storage e
   Realtime in un pacchetto; Neon è solo Postgres ma costa meno. Se l'area scout e i profili
   utente arrivano presto, Supabase conviene.
3. **Confermare R2 per i media** (zero costi di uscita) invece dello Storage di Supabase.
4. **Confermare Payload CMS in Fase 3** invece di un CMS SaaS esterno.
