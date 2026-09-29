# EXTRA TIME — Football Data Core

> Il database è l'**asset vero** del progetto. L'interfaccia può cambiare, il logo può
> cambiare, il nome può cambiare. Ma se il modello dati è costruito bene, abbiamo costruito
> il cuore di EXTRA TIME.

## 1. Principio

Non costruire moduli indipendenti. Costruire un **Football Data Core** unico da cui derivano
tutte le viste e le funzionalità.

Il **Football Universe**:

```
Football Universe
│
├── Federazione
├── Regione
├── Provincia
├── Competizione
├── Girone
├── Club
├── Squadra
├── Giocatore
├── Partita
├── Evento
├── Statistica
├── News
└── Contenuto Live
```

## 2. La partita come oggetto centrale

La partita è l'oggetto da cui derivano:

```
Partita
 ├── Risultato
 ├── Classifica
 ├── Statistiche
 ├── Giocatori
 ├── Eventi
 ├── News
 ├── Live
 └── Video
```

Questo è il fondamento dell'architettura: le altre aree non sono moduli separati, ma **viste
diverse** sullo stesso core.

## 3. Modello relazionale (bozza)

Tabelle candidate:

```
regions            provinces          competitions       seasons
groups             clubs              teams              players
staff              matches            match_events       lineups
player_statistics  team_statistics    standings          news
media              scouting_reports   users              club_aliases
```

Relazioni principali:

```
Season
   ↓
Competition
   ↓
Group
   ↓
Team
   ↓
Match
   ↓
Events
   ↓
Players
```

Gerarchia territoriale/competitiva:

```
Regione → Provincia → Categoria → Girone → { Squadre, Calendario, Risultati, Classifica }
```

## 4. Identificativi canonici e alias (decisione critica)

Le fonti usano nomi diversi per lo stesso soggetto:

| Fonte | Nome |
|-------|------|
| LND | Albalonga Calcio |
| FIGC | SSD Albalonga |
| Altro | Albalonga |

EXTRA TIME deve avere un unico identificativo canonico:

```
club_id        = 12345
canonical_name = "Albalonga"
```

e una tabella alias:

```
club_aliases
  source          external_name
  LND             Albalonga Calcio
  FIGC            SSD Albalonga
  ...
```

Lo stesso vale per **giocatori, squadre, competizioni, impianti, arbitri**. Diventa
fondamentale per arrivare al nazionale.

## 5. ID condivisi tra YFM ed EXTRA TIME (decisione più importante)

Progettare **fin dal giorno 1** un identificativo univoco e condivisibile di
**Club, Team, Player e Match** tra YFM ed EXTRA TIME.

Questa è probabilmente la decisione architetturale più importante da prendere **prima** di
iniziare a sviluppare: abilita l'effetto rete e l'integrazione futura senza migrazioni
dolorose.

## 6. Data Ingestion Layer

Non permettere a ogni schermata di leggere direttamente dalla fonte originale.

```
                   DATA SOURCES
                       │
        ┌──────────────┼──────────────┐
        │              │              │
      FIGC/LND       Società       Redazione
        │              │              │
        └──────────────┼──────────────┘
                       ↓
                INGESTION ENGINE
                       ↓
                  VALIDATION
                       ↓
                  NORMALIZATION
                       ↓
               FOOTBALL DATA CORE
```

Il collo di bottiglia reale del progetto non è il frontend: è **avere dati affidabili e
aggiornati**.

## 7. Data Quality

Funzione necessaria fin dall'inizio (visibile nel backoffice):

```
⚠ 23 squadre con dati incompleti
⚠ 8 partite senza risultato
⚠ 4 giocatori duplicati
⚠ 12 nomi squadra da verificare
```
