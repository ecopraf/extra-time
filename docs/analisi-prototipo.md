# Analisi integrata del prototipo dei collaboratori

> Documento di sintesi. Integra l'analisi esterna (ChatGPT) con lo stato reale del
> repository, verificato sul codice. Serve a decidere cosa adottare e cosa no, senza
> rifare ciò che esiste già.

## 0. Metodo

L'analisi esterna è stata confrontata con il codice e i documenti esistenti. Il risultato è
diviso in quattro categorie, perché il valore di un'analisi sta anche in ciò che non
aggiunge:

| Categoria | Significato |
|---|---|
| **Conferme** | Propone ciò che abbiamo già deciso. Nessuna azione. |
| **Ridondanze** | Propone ciò che abbiamo già **costruito**. Nessuna azione. |
| **Aggiunte** | Propone qualcosa che **non abbiamo**. Da valutare. |
| **Disaccordi** | Propone qualcosa in contrasto con una decisione presa. Da sciogliere. |

## 1. Conferme — propone ciò che abbiamo già deciso

Su questi punti l'analisi esterna è d'accordo con la nostra architettura. Sono conferme
utili (due analisi indipendenti convergono), ma non richiedono lavoro.

| Proposta esterna | Dove è già scritto |
|---|---|
| Next.js e **non** una SPA, per la SEO e le migliaia di URL indicizzabili | `architecture.md` §1 |
| Il **Football Data Core** come cuore: una sorgente, molti prodotti | `data-model.md` §1, `architecture.md` §2 |
| YFM **non** si rinomina e **non** si fonde: resta separato e collegato | `product-vision.md` §8 |
| Il video **non** va nello storage del database: serve un servizio dedicato | `hosting-e-archivio.md` §3 |
| Ogni dato importante deve sapere **da dove proviene** | `data-model.md` §1.4 (tabella `*_aliases` con `source`) |
| Non fare un progetto unico gigantesco: monorepo con `apps/` e `packages/` | `architecture.md` §0 (già realizzato) |
| Non partire da video, scout completo, app nativa, AI | `product-vision.md` §9 |
| Partire dal **Lazio** come regione pilota | `product-vision.md` §6 |
| La sequenza delle fasi (0→10) | `master-plan.md` (identica) |
| Live testuale prima, poi editoriale, poi video | `product-vision.md` Fase 4, livelli A→B→C→D |

## 2. Ridondanze — propone ciò che abbiamo già costruito

Qui l'analisi esterna **non sa** che è già fatto. È il punto più importante del documento,
perché evita di rifare lavoro.

### 2.1 La palette che propone è già la nostra

L'analisi propone come "palette ufficiale" questi valori. Confronto con
`packages/ui/src/tokens.ts`:

| Ruolo proposto | Loro | Noi | Esito |
|---|---|---|---|
| Extra Orange (LIVE) | `#FF6B2C` | `liveOrange: "#FF6B2C"` | **identico** |
| Pitch Green | `#16A34A` | `pitchGreen: "#16A34A"` | **identico** |
| Extra Navy | `#071A35` | `extraNavy: "#0B132B"` | equivalente |
| Extra Blue | `#1457E6` | `electricBlue: "#2563EB"` | equivalente |
| Alert Red | `#D64545` | `red: "#E23B3B"` | equivalente |
| Ice | `#F4F7FC` | `lightGray: "#F4F6F8"` | equivalente |
| Ink / Muted | `#0B1424` / `#65728A` | `navyText` / `muted` | equivalente |

**Nessuna modifica necessaria.** I due colori che l'analisi presenta come la propria
intuizione distintiva (l'arancione del LIVE e il verde) sono **già i nostri token**, con lo
stesso identico valore.

### 2.2 La "grammatica di colore" è già scritta

L'analisi propone che l'arancione non sia decorativo ma un **codice visivo**. È già la
nostra regola, scritta nei token:

> Blu = informazioni/navigazione · Arancio = LIVE/breaking
> Verde = risultato positivo/vittoria · Rosso = espulsione/errore/alert

E la distribuzione che propone (60% navy/blu, 30% bianco/ice, 10% arancio) è quella che il
prototipo in `/prototipo` già applica.

### 2.3 La "pagina competizione unica" è già realizzata

L'analisi propone di **non separare risultati e classifiche** e di costruire una pagina
unica del girone con classifica, prossima giornata, ultimi risultati, news, marcatori,
squadre.

Questa pagina **esiste già**: `apps/web/src/app/[region]/[province]/[category]/[group]/page.tsx`
contiene classifica, partite (giocate e da giocare) e **marcatori** (`listTopScorersByGroup`),
con `revalidate = 120`.

Mancano solo due blocchi dei sei proposti: **news del girone** (richiede la Fase 3) e
**elenco squadre** (banale, si aggiunge quando serve).

### 2.4 L'analisi esterna contiene una contraddizione

La proposta di menu al §6 elenca **RISULTATI** e **CLASSIFICHE** come voci separate. La
proposta al §7 dice di **non separarle** e di unificarle nella pagina del girone.

Le due cose non possono essere entrambe vere. Vince la §7, che è la scelta corretta e che
abbiamo già implementato.

## 3. Aggiunte — cose che non abbiamo e che vale la pena valutare

Qui c'è il valore reale dell'analisi esterna. Tre proposte sono nuove.

### 3.1 Data Quality / Data Manager (la più importante)

**Non abbiamo nulla del genere.** L'analisi propone un'area amministrativa che misura la
**qualità** dei dati:

```
DATA QUALITY
⚠ 23 squadre da verificare
⚠  8 giocatori duplicati
⚠ 12 risultati senza marcatori
⚠  4 partite senza stadio
✓ 1.284 partite verificate
```

Perché conta: quando si arriva a **10 regioni × 10 campionati × centinaia di gironi ×
migliaia di squadre**, il problema non è più "salvare i dati" ma **sapere se sono corretti**.
Noi abbiamo la tracciabilità delle fonti (`*_aliases`), che è il prerequisito, ma non la
misura.

**Da adottare.** Si aggiunge a `data-model.md` come sezione e al backoffice come area.
Serve a poco in Fase 1 (pochi dati), ma va **progettato ora** perché è ciò che rende il
portale sostenibile su scala nazionale.

### 3.2 Backoffice più completo

L'analisi propone un backoffice con: Dashboard, Campionati, Squadre, Partite, Risultati,
Giocatori, News, Live, **Video**, **Scout**, Utenti, **Data Quality**.

Il nostro backoffice attuale (`/admin`) copre l'inserimento di base. Le voci nuove sono
**Video**, **Scout** e **Data Quality**. Le prime due seguono le fasi (Fase 7 e Fase 6);
Data Quality va prevista prima.

### 3.3 Mux come alternativa per il video

Avevamo indicato Cloudflare Stream. L'analisi propone **Mux** come alternativa più
orientata al video professionale (live, low latency, analytics, player).

**Da tenere come alternativa**, non da adottare subito. La scelta va fatta in Fase 7, con i
numeri reali del video. La nostra indicazione resta Cloudflare Stream per la fase iniziale.

## 4. Disaccordi — proposte in contrasto con decisioni prese

### 4.1 Hosting: l'analisi propone Vercel Pro + Supabase Pro ($45/mese)

L'analisi dice: "inizialmente **Vercel Pro $20 + Supabase Pro $25** ≈ $45/mese".

**Contrasta con la decisione presa**: partire **gratuiti** per validare. Vince la decisione
presa, perché è più recente e risponde a un'esigenza esplicita (validare senza costi).

Nota: l'analisi **non menziona** la regola "non commerciale" di Vercel Hobby, che è il
punto chiave della nostra strategia gratuita. Va tenuta presente: Hobby è ok finché non ci
sono ricavi.

### 4.2 Font: l'analisi vuole Barlow Condensed, noi no

L'analisi dice: "manterrei i font del template — **EXTRA TIME = Barlow Condensed + Inter**"
e "non cambierei quasi nulla".

Ma il template contiene **tre** font:
`Archivo Black`, `Barlow Condensed`, `Inter`.

La nostra identità (`tokens.ts`) è **Inter/Manrope**, senza condensato.

**Questo è un vero disaccordo da sciogliere**, ed è l'unico punto in cui l'analisi esterna
propone di cambiare qualcosa che già funziona:

- **Opzione A — adottare Barlow Condensed** per titoli, risultati e punteggi (come propone
  l'analisi). Dà un carattere più "sportivo" e compatto, utile per tabelle fitte. Richiede
  di aggiornare `tokens.ts`, `globals.css` e i componenti.
- **Opzione B — restare su Inter/Manrope** (scelta attuale). Più neutra e leggibile,
  coerente col logo già disegnato, nessun lavoro.

La mia indicazione: **provare Barlow Condensed sui soli numeri e titoli di tabella**
(punteggi, classifiche), tenendo Inter per il resto. È un compromesso a basso rischio e si
valuta a vista. Ma è una decisione di identità: la lasciamo a chi decide il brand.

### 4.3 Menu: la gerarchia "CALCIO" a tendina

L'analisi propone un menu con `CALCIO` che apre Serie D → Terza Categoria → Giovanili.

Il nostro modello è **Regione → Provincia → Categoria → Girone**, già implementato e già
scritto in `product-vision.md` e `data-model.md`.

Le due cose non sono incompatibili: il menu a tendina può essere una **scorciatoia per
categoria** (le voci più cercate), mentre le pagine restano organizzate per gerarchia
territoriale. Ma va deciso, perché un menu che promette una navigazione per categoria e poi
porta a pagine per regione è confondente.

**Proposta:** tenere la gerarchia territoriale come struttura e aggiungere nel menu una
voce **"Campionati"** che elenca le categorie come scorciatoia. Senza sottomenu a tendina
per la Fase 1 (troppo presto, poche categorie caricate).

## 5. Sintesi delle decisioni

| Punto | Esito |
|---|---|
| Palette e grammatica di colore | **Già fatto** — identica, nessuna modifica |
| Pagina competizione unica | **Già fatto** — mancano solo news del girone e squadre |
| Next.js, non SPA | **Già deciso** — confermato |
| Football Data Core come cuore | **Già deciso** — confermato |
| YFM separato e collegato | **Già deciso** — confermato |
| **Data Quality / Data Manager** | **Da adottare** — aggiunto a `data-model.md` |
| Backoffice con Video, Scout, Data Quality | **Da prevedere** per fase |
| Mux come alternativa a Stream | **Alternativa**, decisione in Fase 7 |
| Hosting Vercel Pro + Supabase Pro | **Respinto** — si parte gratuiti |
| Font Barlow Condensed | **Da decidere** (proposta: solo numeri e titoli) |
| Menu per categoria | **Scorciatoia "Campionati"**, senza tendina in Fase 1 |

## 6. Conclusione

L'analisi esterna è **corretta sull'architettura** e converge con le nostre scelte su quasi
tutti i punti strutturali. La sua parte più utile è il **Data Quality**, che non avevamo e
che va progettato prima di crescere.

La sua parte meno utile è dove crede di innovare e invece **ripete ciò che esiste**: la
palette (che è già la nostra, con gli stessi valori) e la pagina competizione unica (che è
già implementata). Su questo va detto chiaramente: **non c'è nulla da rifare**.

I due punti da sciogliere sono **i font** e **il menu**. Il primo è una scelta di identità,
il secondo una scelta di navigazione. Il resto è già deciso o già costruito.
