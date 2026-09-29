---
inclusion: always
---

# EXTRA TIME — Prodotto e principi

## Cos'è

Piattaforma digitale per dare visibilità al **calcio dilettantistico e giovanile italiano**.
Stessi contenuti dei portali generalisti (calendari, partite, risultati live, classifiche,
statistiche) ma con interfaccia più fluida e focus sulle categorie giovanili/dilettantistiche.
Perimetro pilota: **Lazio**.

## Lingua

- Tutta la documentazione, l'interfaccia utente e le comunicazioni con il committente sono in **italiano**.
- I nomi nel database e nel codice sono in **inglese/snake_case** (convenzione tecnica).

## I tre prodotti (condividono un unico Football Data Core)

1. **EXTRA TIME — MEDIA** (B2C): news, risultati, live, video.
2. **EXTRA TIME — FOOTBALL DATA** (B2C): calendari, classifiche, statistiche, profili.
3. **YFM — CLUB OPERATING SYSTEM** (B2B): gestione operativa per le società.

## Regole sul rapporto con YFM

- **YFM non va rinominato**: resta il "Club Operating System" (B2B).
- EXTRA TIME è il portale pubblico (B2C/media).
- I due condividono il Football Data Core ma restano **database separati**.
- Decisione presa (`docs/yfm-mapping.md`): ogni sistema tiene la propria PK e memorizza
  l'ID dell'altro come stringa opaca (`yfm_id` lato ET). Flusso **unidirezionale YFM → ET**:
  ET non scrive mai nel database di YFM.
- Autorità sui dati: **YFM** autoritativo su anagrafiche (club, team per-stagione, player, staff);
  **ET** autoritativo su struttura federale e risultati (competizioni, gironi, stagioni, partite).

## Approccio: docs-first, fasi a valore autonomo

- La **Fase 0 non produce codice**: produce visione, modello dati e architettura.
- Non partire da homepage/tecnologia: partire dal **modello editoriale/prodotto** e dalla
  **sequenza di valore**.
- Ogni fase della roadmap deve essere **utilizzabile senza aspettare la successiva**.
- Ordine di priorità: **Audience → Utilità → Network → Monetizzazione**. Non costruire
  funzionalità solo perché potenzialmente monetizzabili.

## Roadmap (fasi a valore autonomo)

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

**Stato attuale: fine Fase 1 / inizio Fase 2.**

## Cosa NON fare

- Non replicare pedissequamente lo stack di YFM.
- Non costruire Live video / Scout marketplace / AI prima delle fasi precedenti.
- Non permettere accesso diretto ai dati dalle fonti esterne nelle viste applicative:
  tutto passa dal Football Data Core.

## Documentazione di riferimento

- `docs/product-vision.md` — vision, target, perimetro, roadmap, KPI
- `docs/master-plan.md` — master plan Fase 0→10
- `docs/football-data-core.md` — modello dati e ID condivisi YFM↔EXTRA TIME
- `docs/data-model.md` — design del modello dati
- `docs/architecture.md` — architettura tecnica e stack (attuale + obiettivo)
- `docs/yfm-mapping.md` — mappatura ID condivisi ET↔YFM (decisioni chiuse)
- `docs/open-questions.md` — domande aperte da chiarire con il committente
- `AGENTS.md` — contesto per gli agenti AI
