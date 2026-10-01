# EXTRA TIME — Product Vision v0.1

> Documento di visione, nato in Fase 0 (definizione del modello: visione, perimetro,
> sequenza di valore, KPI). **Aggiornamento**: la Fase 0 è conclusa — il prodotto è in
> **fine Fase 1 / inizio Fase 2**, con il pilota Lazio online. Questo documento resta la
> fonte della visione; per lo stato tecnico vedi `README.md` e `docs/architecture.md`.

## 1. Vision

EXTRA TIME è una piattaforma digitale per **dare visibilità al calcio dilettantistico e
giovanile italiano**.

Non vuole essere "un altro Tuttocampo". Vuole offrire gli stessi contenuti dei portali
generalisti — ma con un'**interfaccia più fluida** e un focus specifico su dilettanti e
settore giovanile.

La missione: aumentare l'attenzione mediatica non solo su Serie D ed Eccellenza, ma anche
sulle **categorie inferiori**, dove ci sono molte persone valide che, per mancanza di
opportunità, non riescono a mettersi in mostra.

## 2. Problema che vogliamo risolvere

- Il calcio dilettantistico/giovanile è **poco coperto** e frammentato tra fonti diverse.
- I portali esistenti sono **lenti, datati e poco fluidi**.
- I giocatori delle categorie minori **non hanno visibilità** né strumenti per farsi notare.
- Le società non hanno un luogo digitale che **organizzi e pubblicizzi** la loro attività.

## 3. Le 5 aree funzionali (+1)

| Area | Funzione |
|------|----------|
| ⚽ **Match** | Calendari, risultati, classifiche, partite |
| 📊 **Stats** | Calciatori, squadre, statistiche |
| 📰 **News** | Informazione / editoria |
| 🔴 **Live** | Dirette, cronache, contenuti esclusivi |
| 🔎 **Scout** | Profili, osservazione e valorizzazione giocatori |
| 🏟️ **YFM** | Strumenti operativi per società, tecnici e dirigenti |

## 4. I tre prodotti, non uno

I sistemi condividono un **Football Data Core** comune, ma servono utenti diversi.

1. **EXTRA TIME — MEDIA**
   Il pubblico entra per: _"Cosa è successo nel calcio dilettantistico?"_
   News, risultati, live, video.

2. **EXTRA TIME — FOOTBALL DATA**
   Il pubblico entra per: _"Voglio sapere cosa succede in questo campionato / questa squadra /
   questo giocatore."_
   Calendari, classifiche, statistiche, profili.

3. **YFM — CLUB OPERATING SYSTEM**
   La società entra per: _"Voglio gestire meglio la mia attività."_
   Rosa, allenamenti, convocazioni, partite, comunicazioni, amministrazione.

### Distinzione strategica

- **EXTRA TIME** → porta **visibilità** al calcio.
- **YFM** → porta **organizzazione** alle società.

I due prodotti si alimentano reciprocamente (vedi ciclo di rete, §10).

## 5. Utenti target

Società, dirigenti, allenatori, calciatori, genitori, procuratori/intermediari, osservatori,
direttori sportivi, giornalisti, tifosi, organizzatori di tornei.

Non necessariamente tutti subito: gli utenti target della prima fase sono **tifosi/famiglie**,
**società** e **giocatori** del territorio pilota.

## 6. Perimetro geografico iniziale

Partire da una **regione pilota: Lazio**, per accesso privilegiato a informazioni e società.

Non significa "EXTRA TIME Lazio", ma:

> **EXTRA TIME Italia — Pilot Lazio**

Si costruisce l'architettura pensando già all'Italia, ma si valida il modello su un
territorio controllabile (stessa logica di YFM: modello funzionante → replicazione → espansione).

## 7. Categorie iniziali

- U14, U15, U16, U17, U18, Juniores
- Prima Categoria, Promozione, Eccellenza
- Serie D: eventualmente in seguito

Motivo: vantaggio informativo già consolidato sul settore giovanile e dilettantistico.

## 8. Sequenza di valore (roadmap a verticali autoconsistenti)

Ogni fase deve essere **utilizzabile senza aspettare la successiva**.

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

### Dettaglio delle fasi principali

**FASE 1 — MVP Informativo.** Non news, non scout, non AI, non live video. Prima si dimostra
che EXTRA TIME è utile anche solo come luogo dove trovare informazioni sul calcio locale.
Gerarchia dati:

```
Regione → Provincia → Categoria → Girone → { Squadre, Calendario, Risultati, Classifica }
```

**FASE 2 — Squadra e Partita.** Ogni squadra ha una pagina (campionato, classifica,
calendario, risultati, rosa, staff, statistiche, news). La **partita è l'oggetto centrale**:
da essa derivano risultato, classifica, statistiche, giocatori, eventi, news, live, video.

**FASE 3 — News collegate ai dati.** Non "scriviamo articoli" ma articoli connessi a
competizione, squadre, partita, giocatori, marcatori, classifica. Così l'articolo è parte
del database e si possono generare automaticamente contenuti derivati ("Ultime 5 partite
dell'Albalonga", "Capocannonieri U15", "Andamento ultime 5 giornate").

**FASE 4 — LIVE (per livelli).**

| Livello | Descrizione |
|---------|-------------|
| A | Live testuale (gol, ammonizioni, cambi) |
| B | Live editoriale (cronaca + foto + commenti) |
| C | Live video (streaming partita) |
| D | Live premium (video + telecronaca + statistiche + contenuti esclusivi) |

Si parte da **A**, poi A → B → C → D. Il live deve alimentare automaticamente il Football Data Core.

**FASE 5 — Player Profile.** Pagina giocatore con dati anagrafici, ruolo, squadra e
statistiche (presenze, gol, assist, minuti), storico squadre, partite, video, osservazioni e
profilo scout. È qui che "dare visibilità a chi normalmente non ce l'ha" diventa una
**funzionalità concreta**, non uno slogan.

**FASE 6 — Scout.** Non subito un "marketplace dei giocatori", ma prima un **database di
scouting** con filtri (categoria, anno, regione, ruolo, altezza, piede, presenze, gol, assist,
minuti) e tracciamento delle segnalazioni (osservatore, società, allenatore). Poi il profilo
scouting: dati oggettivi → statistiche → video → report osservatore.

**FASE 8 — Integrazione YFM.** Non rinominare YFM. Tenere separati "EXTRA TIME — Portale
pubblico" e "YFM — Platform for Clubs", con integrazione. Un club che usa YFM gestisce rosa,
allenamenti, convocazioni, partite, statistiche; con autorizzazione pubblica automaticamente i
dati su EXTRA TIME.

## 9. Cosa NON sviluppare ancora

Errore da evitare: _"Facciamo Tuttocampo + Gazzetta Regionale + YouTube + scouting + YFM."_
Diventerebbe un progetto enorme.

Non costruire funzionalità solo perché potenzialmente monetizzabili. Ordine corretto:

> **Audience → Utilità → Network → Monetizzazione**

## 10. Ciclo di rete (il vero valore)

```
Società → YFM → Dati → EXTRA TIME → Visibilità → Giocatori/Squadre → Audience → Società
```

Più società usano YFM → più dati alimentano EXTRA TIME.
Più visibilità offre EXTRA TIME → più valore ha YFM per le società.

## 11. KPI per fase

**Fase 1** — Obiettivo: database calcio Lazio funzionante.
KPI: n. campionati, n. squadre, n. partite, n. giocatori, aggiornamento risultati, utenti/mese.

**Fase 2** — Obiettivo: pagine squadra/giocatore.
KPI: profili creati, visite, ricerche, pagine viste.

**Fase 3** — Obiettivo: audience editoriale.
KPI: articoli, visite, utenti ricorrenti, tempo medio, condivisioni.

**Fase 4** — Obiettivo: validare il LIVE.
KPI: partite live, utenti contemporanei, eventi registrati, engagement.

## 12. Monetizzazione (da progettare, non al centro)

- **B2C** — utente gratuito; pubblicità, statistiche premium, contenuti esclusivi, live premium.
- **B2B** — società: YFM, statistiche avanzate, scouting, profilo società, contenuti premium.
- **Media** — sponsor, advertising, partnership, branded content.
- **Scout** — accesso database, strumenti di ricerca, report, scouting avanzato.

## 13. Fonti dati

FIGC, LND, Comitati Regionali, Società, Dirigenti, Osservatori, Redazione, API, import CSV/PDF.
La gestione dell'ingestion è la vera difficoltà del progetto (vedi `architecture.md`).

## 14. Struttura del documento di vision (storico Fase 0)

Questo documento è nato per rispondere alla richiesta iniziale di una Product Vision con le
sezioni: Vision; Problema; Utenti target; Perimetro geografico; Categorie; Fonti dati;
Modello editoriale; Funzionamento LIVE; Scouting; Ruolo di YFM; Modello di partnership;
Monetizzazione futura; Roadmap; Fase 0–3; KPI; Risorse necessarie; Rischi.

Principio di fondo: _"Non serve l'index. Serve capire come immaginiamo il prodotto tra 3
anni e come arrivarci attraverso step che abbiano valore già da soli."_

## 15. Rischi

- **Scope creep**: troppe funzionalità prima di validare utenti e retention.
- **Qualità e aggiornamento dei dati**: il collo di bottiglia reale.
- **Dipendenza da fonti non strutturate** (PDF/CSV) e da soggetti terzi.
- **Costi** di streaming video se il LIVE viene affrontato troppo presto.
- **Risorse**: la redazione/live richiede persone, non solo tecnologia.
