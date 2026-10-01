# EXTRA TIME — Product & Development Master Plan v0.1

Documento da condividere con Vittorio. Descrive il percorso **Fase 0 → Fase 10** con
deliverable, funzionalità, dipendenze, KPI e ciò che **non** va ancora sviluppato.

> **Stato (ottobre 2026): fine Fase 1 / inizio Fase 2.** Fase 0 (modello/architettura) e
> gran parte della Fase 1 (campionati/risultati, pilota Lazio) sono realizzate e online.
> Le fasi successive restano come pianificate sotto.

> Principio guida: ogni fase deve essere **utilizzabile senza aspettare quella successiva**.
> Ordine di valore: **Audience → Utilità → Network → Monetizzazione**.

## Legenda

- **Deliverable** — cosa esiste concretamente a fine fase.
- **Dipende da** — cosa deve esistere prima.
- **KPI** — come si misura il successo della fase.
- **NON ancora** — ciò che va esplicitamente rimandato.

---

## FASE 0 — Modello + Architettura

**Obiettivo:** definire identità, perimetro, modello dati e architettura. Nessun codice.

**Deliverable**
- Product Vision (`product-vision.md`)
- Football Data Core e ID condivisi (`football-data-core.md`)
- Architettura tecnica (`architecture.md`)
- Master Plan (questo documento) e Open Questions (`open-questions.md`)

**Dipende da:** nulla.

**KPI**
- Vision approvata da Vittorio
- Decisione presa sugli **ID condivisi** YFM ↔ EXTRA TIME
- Perimetro pilota (Lazio + categorie) confermato

**NON ancora:** codice, scaffolding, database, homepage.

---

## FASE 1 — MVP Informativo (Campionati e Risultati)

**Obiettivo:** dimostrare che EXTRA TIME è utile anche solo come luogo dove trovare
informazioni sul calcio locale.

**Deliverable**
- Football Data Core su PostgreSQL (schema territoriale + competitivo)
- Backoffice minimo per inserire competizioni, gironi, squadre, calendario, risultati
- Pagine pubbliche: regione → provincia → categoria → girone → calendario/risultati/classifica
- Calcolo classifica a partire dai risultati

**Funzionalità**
- Gerarchia dati: `Regione → Provincia → Categoria → Girone → { Squadre, Calendario, Risultati, Classifica }`
- Inserimento/sospensione/recupero partite
- Classifica con penalizzazioni

**Dipende da:** Fase 0; Football Data Core; ingestion base.

**KPI**
- n. campionati attivi, n. squadre, n. partite, n. giocatori
- frequenza di aggiornamento risultati
- utenti/mese

**NON ancora:** news, scout, AI, live video.

---

## FASE 2 — Squadre e Giocatori

**Obiettivo:** rendere la **partita** e la **squadra** le entità navigabili del database.

**Deliverable**
- Pagina squadra: campionato, classifica, calendario, risultati, rosa, staff, statistiche, news
- Pagina partita con evento, risultato, marcatori, formazioni
- Pagina giocatore base (anagrafica + presenze/gol/assist/minuti)

**Funzionalità**
- Partita come oggetto centrale da cui derivano risultato, classifica, statistiche, eventi
- Alias canonici (`club_aliases`) per unificare i nomi delle fonti

**Dipende da:** Fase 1.

**KPI**
- profili creati (squadre, giocatori), visite, ricerche, pagine viste

**NON ancora:** news editoriale, live, scouting, video.

---

## FASE 3 — News collegate ai dati

**Obiettivo:** creare audience editoriale senza separare l'articolo dal database.

**Deliverable**
- Headless CMS + modello news connesso a competizione, squadre, partita, giocatori, marcatori, classifica
- Homepage/dinamiche con contenuti derivati automaticamente

**Funzionalità**
- Articoli linkati a entità del Core
- Contenuti auto-generati: "Ultime 5 partite dell'Albalonga", "Capocannonieri U15", "Andamento ultime 5 giornate"

**Dipende da:** Fase 2.

**KPI**
- articoli, visite, utenti ricorrenti, tempo medio, condivisioni

**NON ancora:** live video, scouting marketplace, AI editoriale avanzata.

---

## FASE 4 — LIVE (per livelli)

**Obiettivo:** validare il live a partire dal livello più semplice.

**Deliverable**
- Livello **A** — live testuale: gol, ammonizioni, cambi con timestamp
- Alimentazione automatica del Football Data Core dagli eventi del live
- Realtime verso i client (`/live/match/123`)

**Livelli successivi**
- **B** live editoriale (cronaca + foto + commenti)
- **C** live video (streaming partita)
- **D** live premium (video + telecronaca + statistiche + esclusivi)

**Dipende da:** Fase 2 (partita come oggetto centrale).

**KPI**
- partite live, utenti contemporanei, eventi registrati, engagement

**NON ancora:** video streaming (C/D) prima di aver validato A.

---

## FASE 5 — Player Profile

**Obiettivo:** rendere la visibilità dei giocatori una funzionalità concreta.

**Deliverable**
- Pagina giocatore completa: anagrafica, ruolo, squadra, statistiche (presenze/gol/assist/minuti),
  storico squadre, partite, gol, assist, ammonizioni, video, osservazioni, profilo scout

**Dipende da:** Fase 2; Fase 4 per i contenuti live/video collegati.

**KPI**
- profili giocatore visualizzati, ricerche per giocatore, tempo sulla pagina

**NON ancora:** marketplace, contatti diretti, transazioni.

---

## FASE 6 — Scout

**Obiettivo:** costruire un **database di scouting**, non subito un marketplace.

**Deliverable**
- Ricerca con filtri: categoria, anno, regione, ruolo, altezza, piede, presenze, gol, assist, minuti
- Segnalazioni tracciate: da osservatore / società / allenatore
- Profilo scouting: dati oggettivi → statistiche → video → report osservatore

**Dipende da:** Fase 5.

**KPI**
- report creati, ricerche filtrate, osservatori attivi, giocatori segnalati

**NON ancora:** pagamenti, contratti, marketplace aperto ai procuratori.

---

## FASE 7 — Video / Media Platform

**Obiettivo:** affiancare al testo i contenuti video, senza gestire lo streaming in casa.

**Deliverable**
- Provider video esterno integrato; EXTRA TIME mantiene `video_id`, `match_id`, `player_id`,
  `timestamp`, `metadata`
- Gallery video su partita, squadra, giocatore, news

**Dipende da:** Fase 4.

**KPI**
- video pubblicati, play, watch time

**NON ancora:** piattaforma di streaming proprietaria.

---

## FASE 8 — Integrazione YFM

**Obiettivo:** attivare il ciclo di rete Società → YFM → Dati → EXTRA TIME → Visibilità.

**Deliverable**
- ID condivisi operativi tra YFM ed EXTRA TIME
- Pubblicazione automatica su EXTRA TIME (con autorizzazione del club) di rosa, partite, statistiche
- Profilo società arricchito

**Dipende da:** Fase 1 (Core) e decisione della Fase 0 sugli ID condivisi.

**KPI**
- club collegati, dati pubblicati automaticamente, copertura squadre gestite da YFM

**NON ancora:** fatturazione integrata, gestione pagamenti tra i due sistemi.

---

## FASE 9 — Espansione regionale

**Obiettivo:** replicare il modello fuori dal Lazio.

**Deliverable**
- Processo di onboarding di una nuova regione (dati, redazione, referenti)
- Strumenti di ingestion estesi alle nuove fonti

**Dipende da:** Fase 1–8 funzionanti sul pilota.

**KPI**
- n. regioni attive, tempo di attivazione per regione, copertura categorie

**NON ancora:** nessuna eccezione al modello dati per singole regioni.

---

## FASE 10 — Nazionale

**Obiettivo:** diventare un network nazionale.

**Deliverable**
- Copertura nazionale sul dilettantistico/giovanile
- Percorsi dedicati per le categorie inferiori (il cuore della missione)

**Dipende da:** Fase 9.

**KPI**
- copertura nazionale, utenti unici, club/giocatori presenti, retention

---

## Cosa NON sviluppare (in generale)

- Non costruire moduli indipendenti: tutto deriva dal **Football Data Core**.
- Non partire con microservizi.
- Non introdurre cache/Redis in modo preventivo.
- Non affrontare video streaming prima di aver validato il live testuale.
- Non costruire funzionalità solo perché potenzialmente monetizzabili.
- Non replicare YFM: EXTRA TIME si costruisce su modello dati e validazione, non su funzionalità.

## Dipendenze trasversali (presenti in tutte le fasi)

1. **Data Ingestion Layer** — validation + normalization verso il Core.
2. **Data Quality** — controllo continuo su dati incompleti/duplicati.
3. **RBAC** — il modello dei ruoli deve supportare da subito tutti i profili.
4. **ID condivisi YFM ↔ EXTRA TIME** — da decidere in Fase 0, prima di ogni sviluppo.
