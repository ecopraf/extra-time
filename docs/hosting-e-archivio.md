# EXTRA TIME — Hosting, servizi e archivio dei contenuti

> Documento di lavoro. Risponde a due domande: **dove ospitiamo i vari servizi** e
> **come rendiamo i contenuti consultabili nel tempo** (news, risultati, classifiche,
> rose, media). I prezzi sono quelli pubblicati dai fornitori, verificati a settembre 2026.

## 0. Contesto

Tre fatti che condizionano le scelte:

1. **YFM è su Vercel Pro** (progetto di Vittorio). Funziona, è a pagamento, e **resta
   separato**.
2. **EXTRA TIME è un progetto distinto**, nasce adesso e coinvolge altre persone. Non
   condivide risorse con YFM: database separato, progetto Vercel separato, piani separati.
3. **Si parte con tutto gratuito**, per validare l'idea. Si passa ai piani a pagamento
   quando il progetto è maturo.

L'integrazione tra i due è **possibile e prevista**, ma è una cosa futura (Fase 8) e
avviene a livello di dati, non di infrastruttura (vedi §1, ultimo paragrafo).

## 1. Fase di validazione: tutto gratuito

Scelta: **validare senza costi** e passare ai piani a pagamento solo quando il progetto è
maturo. Questo è possibile, ma **una** risorsa gratuita non è utilizzabile per EXTRA TIME:

> **Cloudflare Workers Free non regge Next.js SSR.** Il piano gratuito concede **10 ms di
> CPU per richiesta**; un render di pagina Next.js ne consuma 20–60 ms. La funzione viene
> interrotta. Cloudflare gratis va bene per siti statici, non per il nostro portale.

Quindi "tutto gratuito" significa, in pratica: **Vercel Hobby + Neon Free + R2 Free**.

### Stack gratuito consigliato

| Servizio | Scelta gratuita | Limite da conoscere |
|---|---|---|
| **Frontend** | **Vercel Hobby** | 100 GB banda, 1M richieste, 4 CPU-ore/mese |
| **Database** | **Neon Free** | 0,5 GB, 100 ore-compute/mese, **si sospende da solo** (nessuna pausa forzata) |
| **Media** | **Cloudflare R2** | 10 GB archiviazione, **uscita gratis**, 1M scritture + 10M letture |
| **Email** | **Resend** | 3.000 email/mese, **100/giorno** |
| **Ricerca** | Postgres full-text | incluso, nessun servizio in più |
| **Auth** | **custom, già attiva** | scrypt + sessioni server-side su Neon; nessun costo né servizio esterno |

**Perché Neon Free e non Supabase Free:** il piano gratuito di Supabase **mette in pausa i
progetti dopo 7 giorni di inattività** e va riattivato a mano. Neon invece si sospende da
solo e si risveglia alla prima query: nessun intervento manuale. Se un giorno la
sospensione automatica di Neon desse fastidio, si cambia fornitore — **il codice resta
Postgres puro**, quindi la migrazione è un dump e un restore.

### L'unico punto di attenzione: la regola "non commerciale" di Vercel Hobby

Vercel Hobby è consentito per progetti **personali e non commerciali**. Nella fase di
validazione EXTRA TIME non genera ricavi: non c'è pubblicità, non ci sono abbonamenti, non
ci sono clienti paganti. **Rientra quindi nel consentito.**

Ma va tenuto presente, perché la regola si basa sul **carattere** del progetto, non solo sui
consumi:

- Oggi: sito di risultati e news, **gratuito per tutti**, nessuna entrata → **Hobby è ok**.
- Al primo ricavo (pubblicità, sponsor, abbonamento, contenuti premium) → **serve Pro**.

Non è una scadenza tecnica, è una scadenza di prodotto: va messo in conto *prima* di
attivare la monetizzazione, perché a quel punto Vercel può sospendere il progetto.

### La leva per restare gratuiti più a lungo

Vercel Hobby dà 4 CPU-ore al mese: sono poche. Ma le pagine di un portale di risultati
(regione, girone, classifica, squadra) sono **quasi tutte statiche** e si rigenerano una
volta al giorno, dopo la giornata di campionato. Se la maggior parte delle richieste è
servita da cache invece che da render, il consumo di CPU resta basso.

Quindi la strategia gratuita non è solo "scegliere i piani free": è **prerenderizzare
aggressivamente** (ISR con revalidate giornaliero) e tenere dinamiche solo le parti che
cambiano davvero (risultati in diretta, ricerca, backoffice). Questo allunga la vita del
piano gratuito e, per inciso, rende il sito più veloce.

### Quando passare ai piani a pagamento

| Segnale | Azione |
|---|---|
| Primo ricavo (pubblicità, sponsor, abbonamento) | **Vercel Pro obbligatorio** ($20/seat) |
| Database oltre 400 MB o query lente | Neon Launch (~$5–20) |
| Immagini oltre 10 GB o molte visualizzazioni | R2 a consumo (centesimi) |
| Serve l'area scout con login | nessun costo auth: è già custom su Neon |

### Sull'integrazione futura con YFM

YFM è su Vercel Pro e resta **un'entità separata**: database separato, progetto Vercel
separato, piani separati. Non condividono risorse.

L'integrazione, quando arriverà (Fase 8), **non** richiede di unire i due progetti: si fa a
livello di **dati**, con gli ID condivisi già progettati (vedi `docs/yfm-mapping.md`).
YFM resta il sistema di riferimento per le anagrafiche (club, squadra, giocatore); EXTRA
TIME per competizioni e partite. Lo scambio avviene tramite gli ID, non tramite
l'infrastruttura.

Questa separazione è un vantaggio, non un limite: se domani EXTRA TIME passa a Cloudflare e
YFM resta su Vercel, l'integrazione continua a funzionare esattamente come prima, perché
parla solo di dati.

## 2. Comparativa piattaforme

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

**Raccomandazione per la validazione:** **Vercel Hobby** (gratuito, uso non commerciale
consentito finché non ci sono ricavi) con **Neon Free** e **R2 Free**. Il codice va tenuto
privo di dipendenze Vercel-specifiche (niente Vercel KV, Blob, Postgres): così, quando si
passa a Cloudflare per ragioni di costo, non c'è nulla da riscrivere. Il passaggio a
Vercel Pro è automatico al primo ricavo, non prima.

## 3. I servizi e dove metterli

| Servizio | Scelta consigliata | Perché |
|---|---|---|
| **Frontend / SSR** | **Vercel Hobby** ora → Pro al primo ricavo | Next.js nativo, preview, ISR |
| **Database** | **Neon Free** ora → Neon Launch dopo | Postgres gestito; separato da YFM come deciso |
| **Media (immagini)** | **Cloudflare R2** + Cloudflare Images | $0,015/GB/mese, **uscita gratis**, $5/100k immagini |
| **Media (video)** | Cloudflare Stream (Fase 7) | ~$5/1000 minuti archiviati, $1/1000 minuti serviti |
| **Ricerca** | **Postgres full-text** all'inizio | regge centinaia di query/s e fino a ~100k record; Typesense solo quando serve tolleranza ai typo e facet |
| **CMS / news** | **tabelle Postgres** ora, **Payload CMS** quando la redazione cresce | Payload gira *dentro* Next.js e usa **lo stesso Postgres**: nessuna frammentazione |
| **Email** | Resend o Brevo (free tier) | notifiche, contatti, credenziali staff |
| **Auth** | **custom** (scrypt + sessioni su Neon) | profili, backoffice, area scout — già implementata, non Supabase |

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

## 4. Email con Resend

### Cos'è (e cosa non è)

**Resend non è una casella di posta.** Non ha una inbox, non sostituisce
`extratime.italia@gmail.com`. È un servizio per **inviare** email dal codice.

| Cosa | Strumento |
|---|---|
| **Inviare** email automatiche dal sito | **Resend** |
| **Ricevere** email (casella reale `info@extratime.it`) | Google Workspace, Zoho Mail o simili |

### Come funziona

```
Il sito (Next.js) → API Resend → Amazon SES → casella del destinatario
```

1. Nel codice si chiama Resend con una **API key** (`RESEND_API_KEY`), una variabile
   d'ambiente come le altre.
2. Si passano mittente, destinatario, oggetto e corpo.
3. Resend consegna il messaggio (usa l'infrastruttura di Amazon SES; per questo l'SPF
   punta a `amazonses.com`).
4. Torna un **ID del messaggio**; via **webhook** si sa se è stato consegnato, aperto o
   rimbalzato.

Nessun server di posta da gestire.

### La verifica del dominio

Perché Gmail accetti i messaggi invece di metterli nello spam, il dominio va dimostrato
proprio con tre record DNS:

| Record | A cosa serve | Dove va |
|---|---|---|
| **SPF** (TXT) | Autorizza i server di Resend a spedire a nome tuo | sottodominio `send` |
| **DKIM** (TXT) | Firma crittografica: prova che il messaggio non è alterato | `resend._domainkey` |
| **DMARC** (TXT) | Dice ai riceventi cosa fare se i controlli falliscono | `_dmarc` |

**L'errore classico:** pubblicare i record sul dominio principale invece che sul
sottodominio `send`. La verifica non passa mai, senza spiegazioni. L'SPF va su
`send.extratime.it`, non su `extratime.it`. Resend mostra i valori esatti da copiare; il
record DMARC **non lo crea Resend**, lo suggerisce soltanto.

### React Email

I template si scrivono in **React e TypeScript** (libreria React Email) invece che in HTML
da email. Vantaggio concreto: si riusano i token del design system (`packages/ui`), quindi
le email hanno la stessa identità del sito senza riscrivere il CSS.

### Cosa ci faremo

| Email | Quando | A chi |
|---|---|---|
| Form contatti / assistenza | l'utente scrive dal sito | al team |
| Credenziali staff | dal pannello admin | al nuovo redattore |
| Reset password | area scout con login | all'utente |
| Notifiche | "la partita che segui è iniziata" | all'utente |
| Newsletter | con la redazione | agli iscritti |

### Limiti del piano gratuito

**3.000 email al mese, ma 100 al giorno.** È il limite giornaliero a mordere per primo:
superato, i messaggi successivi vengono messi in coda o persi (nessun addebito).
Attenzione: **ogni destinatario conta come un'email**, e anche le email in entrata
consumano la stessa quota.

### Un miglioramento concreto

L'index dei collaboratori usa un link `mailto:`, che apre il **programma di posta
dell'utente**. Se l'utente legge la posta solo dal telefono via web, o non ha un client
configurato, **il form non funziona e il messaggio si perde**. Con Resend il form invia
direttamente al team, da qualsiasi dispositivo, e resta traccia dell'invio.

## 5. Archivio: rendere i contenuti consultabili nel tempo

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

Per un archivio consultabile servono backup affidabili.

- **Neon**: offre branching e point-in-time restore (la finestra di ritenzione dipende dal
  piano; sul Free è limitata). Da verificare quando il dataset cresce.
- **In più (già in uso)**: dump logico periodico (`pg_dump`) — vedi la cartella `backups/`
  nel repo — idealmente su R2. Costo quasi nullo ($0,015/GB/mese) e ci mette al riparo anche
  da un errore del fornitore.

## 6. Costi per fase (riepilogo)

| Fase | Stack | Costo mensile |
|---|---|---|
| **Validazione** | **Vercel Hobby + Neon Free + R2 Free + Resend** | **$0** |
| Primo ricavo | Vercel Pro (obbligatorio) + Neon Launch | ~$25–45 |
| News e media (Fase 3) | + R2 a consumo | ~$45–70 |
| Live e video (Fase 7) | + Cloudflare Stream | +$50–500 secondo il video |

## 7. Decisioni

**Prese:**
- Database e ambiente **separati da YFM** (entità distinte; YFM resta di Vittorio).
- **Tutto gratuito** per la validazione: Vercel Hobby + Neon Free + R2 Free + Resend.
- Media su **Cloudflare R2** (uscita gratuita), non nel database.
- CMS: **tabelle Postgres** ora, **Payload** (stesso Postgres) in Fase 3.
- Integrazione YFM a livello **dati**, non di infrastruttura.

**Scelte confermate / da confermare:**
1. **Neon Free** come database gratuito — **confermato e in uso** (Supabase Free era
   l'alternativa, scartata: mette in pausa dopo 7 giorni di inattività).
2. **Resend** per le email transazionali (3.000/mese, 100/giorno).
3. **Prerenderizzazione aggressiva** come strategia per restare nel piano gratuito: richiede
   che le pagine pubbliche siano ISR con revalidate giornaliero.
