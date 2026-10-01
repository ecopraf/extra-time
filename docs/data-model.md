# EXTRA TIME — Modello Dati (Football Data Core)

Design del modello dati. Lo schema PostgreSQL di riferimento è versionato in
[`db/migrations/`](../db/migrations). Questa è ancora una bozza progettuale, ma applicabile
e verificabile (vedi `pnpm db:setup`).

## 1. Principi

1. **Un core, molte viste.** Match, Stats, News, Live, Scout sono viste sullo stesso core.
2. **Identificativi canonici.** Ogni entità esterna viene ricondotta a un'unica entità
   canonica, con tabella di alias per le fonti.
3. **ID condivisi con YFM.** `clubs`, `teams`, `players`, `matches` hanno una chiave UUID che è
   anche l'identificativo scambiato con YFM.
4. **Tracciabilità delle fonti.** Ogni record importato sa da dove viene.

## 2. Gerarchia territoriale e competitiva

```
federations
   └── regions
         └── provinces
competitions (categoria, es. "U15 Regionali")
   └── seasons
         └── competition_groups (girone)
               └── teams
                     └── matches
```

- `federations` — FIGC, LND, comitati (con eventuale livello regionale).
- `regions` / `provinces` — anagrafica territoriale (pensata per l'Italia).
- `competitions` — la categoria/competizione (struttura).
- `seasons` — stagione sportiva (quella corrente del pilota: 2026/2027).
- `competition_groups` — il girone, cioè la competizione concreta in una stagione.

## 3. Entità canoniche e alias

| Entità | Tabella | Alias |
|--------|---------|-------|
| Club | `clubs` | `club_aliases` |
| Squadra | `teams` | `team_aliases` |
| Giocatore | `players` | `player_aliases` |
| Competizione | `competitions` | `competition_aliases` |
| Partita | `matches` | `match_aliases` |

Ogni tabella alias ha (`source`, `external_name`, `external_id`) per mappare i nomi usati
dalle diverse fonti sul record canonico.

Esempio:

| source | external_name |
|--------|---------------|
| LND | Albalonga Calcio |
| FIGC | SSD Albalonga |

## 4. ID condivisi YFM ↔ EXTRA TIME

Decisione architetturale più importante (vedi `football-data-core.md`).

- `clubs.id`, `teams.id`, `players.id`, `matches.id` sono **UUID** generati una volta e
  condivisibili con YFM.
- YFM importa/esporta questi UUID per collegare i propri dati operativi al portale pubblico.
- Gli identificativi delle fonti esterne (`*_aliases.external_id`) sono **separati** dagli UUID
  condivisi: le fonti non devono influenzare l'identità di sistema.

## 5. Partita come oggetto centrale

Da una riga di `matches` derivano:

```
matches ─┬── match_events      (gol, ammonizioni, cambi)
         ├── lineups           (formazioni, titolari/riserve)
         ├── team_statistics   (statistiche di squadra)
         ├── player_statistics (statistiche giocatore nella partita, se disponibili)
         ├── standings         (calcolata dai risultati)
         ├── news_matches      (articoli collegati)
         └── media             (foto, video)
```

## 6. Statistiche e classifiche

- `player_statistics` — aggregate per stagione/competizione (presenze, gol, assist, minuti,
  ammonizioni, espulsioni).
- `team_statistics` — aggregate per stagione/competizione e, se serve, per partita.
- `standings` — classifica calcolata: punti, vinte/nulle/perse, GF, GS, DR, penalizzazioni.
  Si conserva il valore **calcolato** per query veloci, ma resta sempre ricostruibile dai
  risultati.

## 7. Contenuti editoriali

- `news` — articolo con stato editoriale.
- `news_entities` — collegamento polimorfico articolo ↔ entità del core (competizione, squadra,
  partita, giocatore).
- `media` — immagini/video collegabili a partita, squadra, giocatore, news.
- Per il video si salva solo il riferimento (`provider`, `external_video_id`), non il file.

## 8. Scouting

- `scouting_profiles` — profilo scouting di un giocatore (attributi osservabili: altezza,
  piede, note).
- `scouting_reports` — report di un osservatore su un giocatore, con autore e contesto.
- `scouting_watchlist` — segnalazioni (osservatore/società/allenatore → giocatore).

## 9. Ingestion: provenienza dei dati

- `data_sources` — elenco delle fonti (FIGC, LND, comitato, società, redazione, manuale).
- `ingestion_runs` — esecuzioni di import (per audit e diagnosi).
- `ingestion_records` — singoli record importati, con stato di validazione/normalizzazione e
  riferimento al record canonico prodotto.

Nessuna vista applicativa legge direttamente dalla fonte: tutte leggono dal core.

## 10. Utenti e ruoli

- `users` — utenti di sistema (redazione, live operator, scout, club, coach, tifoso).
- `roles` / `user_roles` — RBAC.

```
SUPER ADMIN → ADMIN → REDAZIONE → LIVE OPERATOR → SCOUT → CLUB → COACH → USER
```

**Implementato** (migrazione `0003_auth_users`): tabelle `users`, `roles`, `user_roles` e
`user_sessions` (sessioni server-side). Auth **custom** (hashing scrypt, cookie `et_session`),
non Supabase/NextAuth. I 7 ruoli esistono; oggi è attivo soprattutto ADMIN per l'Hub
Impostazioni. La tabella `comunicati_seen` (migrazione `0004`) registra i comunicati LND
applicati dall'UI.

## 12. Data Quality (da progettare)

Quando il portale copre più regioni, il problema non è più *salvare* i dati ma **sapere se
sono corretti**. Questa sezione definisce come misurarlo. Non serve in Fase 1 (pochi dati),
ma il modello va previsto ora perché è ciò che rende il portale sostenibile su scala
nazionale.

### Controlli minimi

| Controllo | Domanda a cui risponde |
|---|---|
| Anagrafiche incomplete | Quante squadre/giocatori hanno campi obbligatori mancanti? |
| Duplicati sospetti | Ci sono due record canonici che sembrano la stessa entità? |
| Risultati incompleti | Quante partite giocate non hanno punteggio o marcatori? |
| Partite senza sede | Quante partite non hanno stadio o data? |
| Classifiche incoerenti | Il numero di partite giocate corrisponde ai punti? |
| Record non verificati | Quanti record importati non sono mai stati confermati da una persona? |

### Il legame con la provenienza

Data Quality si appoggia a ciò che già esiste: `ingestion_records` (§9) sa **da dove**
viene ogni dato, e `*_aliases.source` sa **con che nome** la fonte lo chiama. Senza la
tracciabilità delle fonti il controllo di qualità non è possibile — ed è per questo che
quella parte va prima.

### Dove vive

- **Backoffice**, area `Data Quality`: un elenco di anomalie con la fonte e il collegamento
  al record da correggere. Deve rispondere alla domanda "cosa devo sistemare oggi?".
- **Dati**: le anomalie si **calcolano**, non si salvano (§6, stesso principio: i fatti si
  conservano, le viste si ricalcolano). Un nuovo controllo è una nuova query, non una nuova
  tabella da popolare.

### Livelli

Si parte da un conteggio per categoria (squadre da verificare, duplicati, risultati senza
marcatori) e si cresce verso regole per competizione. In Fase 1 basta il primo livello.

## 13. Convenzioni

- Chiavi primarie `UUID` (`gen_random_uuid()`) per le entità condivise/core.
- Chiavi esterne con `ON DELETE RESTRICT` per i dati storici (non si perdono le partite).
- `created_at` / `updated_at` su tutte le tabelle.
- Nomi in inglese nel DB, `snake_case`; documentazione e UI in italiano.
- Vincoli `CHECK` sui domini (es. `status`, `match_events.type`, ruoli).

## 14. Estensioni future (non in questa bozza)

- Tabelle dedicata al LIVE (sessions, eventi in tempo reale) — Fase 4.
- Tabelle di caching/precalcolo classifiche — quando servirà.
- Tabelle tornei/amichevoli.
- Storicizzazione dei trasferimenti giocatore ↔ squadra (qui gestita con approssimazione).
