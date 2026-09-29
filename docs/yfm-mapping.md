# EXTRA TIME ↔ YFM — Mapping degli identificativi condivisi

> Documento operativo che collega lo schema **YFM** (gestionale B2B, Supabase) allo schema
> **EXTRA TIME** (`db/migrations/0001_initial_schema.sql`). Risponde alla domanda aperta #4
> (`docs/open-questions.md`) e concretizza la decisione di `docs/football-data-core.md` §5.
>
> Sorgente schema YFM: database YFM (Supabase PostgreSQL 17), letto il 28/09/2026.
> Entrambi i sistemi usano UUID v4 (`gen_random_uuid()`) come chiavi primarie.

## 1. Principio condiviso (già allineato)

Lo schema EXTRA TIME dichiara già, nei commenti SQL, che gli UUID di `clubs`, `teams`,
`players`, `matches` **sono gli identificativi condivisi con YFM**, e che le fonti esterne
restano separate nelle tabelle `*_aliases`. Questo documento definisce **come** i due schemi
si corrispondono, dove il mapping è 1:1 e dove NO (divergenze da decidere).

## 2. Mapping entità (colpo d'occhio)

| Entità | EXTRA TIME | YFM | Mapping UUID |
|--------|-----------|-----|--------------|
| Club | `clubs` | `workspace` | ⚠️ concettualmente diverso (vedi §3.1) |
| Categoria | `competitions.category` | `category` | parziale (vedi §3.2) |
| Stagione | `seasons` | `season` | ⚠️ scope diverso: ET globale, YFM per-club |
| Girone | `competition_groups` | `category.girone` (testo) + `competition` | parziale |
| Squadra | `teams` | `team` | ⚠️ NON 1:1 (vedi §3.3) |
| Rosa | `team_players` | `team_player` | 1:1 concettuale |
| Giocatore | `players` | `player` | ✅ 1:1 (vedi §3.4) |
| Partita | `matches` | `match` | ⚠️ NON 1:1 (vedi §3.5) |
| Evento | `match_events` | `match_event` | 1:1 concettuale |
| Formazione | `lineups` | `match_formation` | 1:1 concettuale |
| Staff | `staff` | `staff` / `team_staff` | parziale |
| Impianto | `matches.venue` (testo) | `facility` (entità) | ⚠️ ET testo, YFM entità |

## 3. Dettaglio e divergenze da risolvere

### 3.1 Club — `clubs` (ET) ↔ `workspace` (YFM)
- In **YFM** il "club" È il **workspace**: è anche il *tenant* gestionale (piano, utenti,
  settori abilitati). Ha `nome`, `nome_breve`, `logo_url`, `regione`.
- In **ET** `clubs` è un'anagrafica pubblica: `canonical_name`, `legal_name`, `province_id`,
  `city`, `founded_year`, `colors`, `logo_media_id`.
- **Proposta**: l'UUID condiviso è `workspace.id` (YFM) = `clubs.id` (ET). Quando un club
  gestito su YFM viene pubblicato su ET, ET crea la riga `clubs` **riusando** `workspace.id`.
  Viceversa, se il club nasce su ET e poi passa a YFM, YFM registra `clubs.id` come proprio
  `workspace.id` (o in un campo `external_id` se non si vuole forzare la PK — vedi §4).
- ⚠️ Da decidere: `workspace` porta con sé dati gestionali che ET non deve avere. La
  condivisione è solo sull'**identità**, non sui campi.

### 3.2 Categoria — `competitions.category` (ET) ↔ `category` (YFM)
- ET modella la categoria dentro `competitions` (`category='U15'`, `level`, `gender`) +
  il girone concreto in `competition_groups`.
- YFM ha `category` per-workspace con `tipo_campionato`, `anno_da/anno_a`, `genere`,
  `settore`, `girone` (testo), `lnd_*`.
- **Non c'è UUID condiviso qui**: la categoria YFM è interna al club, la competizione ET è
  pubblica/trasversale. Si mappano per **valore** (es. `U15` + genere + girone), non per id.

### 3.3 Squadra — `teams` (ET) ↔ `team` (YFM)  ⚠️ divergenza strutturale
- **ET** `teams` = (`club_id` × `category` × `gender`), **senza stagione**: la stagione
  entra col girone via `group_teams`. Una squadra ET è persistente tra stagioni.
- **YFM** `team` = (`season_id` × `category_id`): la squadra è **legata alla stagione**.
  Cambio stagione → nuovo record `team` con nuovo UUID.
- **Conseguenza**: `team.id` (YFM) NON può essere direttamente `teams.id` (ET) 1:1, perché
  YFM genera un team per stagione mentre ET ne ha uno solo.
- **Proposta**: l'UUID condiviso di Team è quello **ET-style** (persistente per club+categoria).
  YFM mantiene i suoi `team` per-stagione e li collega all'UUID condiviso tramite un campo
  `external_team_id` (o mapping). In alternativa: condividere l'UUID solo a livello di
  (club, categoria) e derivare la stagione dal contesto. **DA DECIDERE INSIEME.**

### 3.4 Giocatore — `players` (ET) ↔ `player` (YFM)  ✅ mapping pulito
- Campi corrispondenti:

| ET `players` | YFM `player` |
|--------------|--------------|
| `first_name` | `nome` |
| `last_name` | `cognome` |
| `birth_date` / `birth_year` | `data_nascita` |
| `nationality` | `nazionalita` |
| `position` | `ruolo_principale` |
| `foot` (`destro/sinistro/entrambi`) | `piede_preferito` |
| `height_cm` | `altezza` |
| `photo_media_id` | `foto_url` |

- **`players.id` (ET) = `player.id` (YFM)**: il mapping più naturale e sicuro. Il giocatore
  è la stessa persona nei due mondi.
- ⚠️ **Privacy (vincolante)**: YFM `player` contiene dati NON pubblicabili — `codice_fiscale`,
  `contatti_genitori`, `certificato_medico_*`, `telefono`, `email`. ET (portale pubblico)
  deve importare **solo** i campi anagrafici sportivi della tabella sopra. Mai i dati
  sensibili di minori. Definire una vista/proiezione pubblica lato YFM prima di esportare.

### 3.5 Partita — `matches` (ET) ↔ `match` (YFM)  ⚠️ divergenza strutturale
- **ET** `matches`: `home_team_id` + `away_team_id`, entrambi FK reali a `teams`. Modello
  simmetrico "due squadre note".
- **YFM** `match`: un solo `team_id` (la squadra gestita) + `avversario` (testo libero) +
  `luogo` (casa/trasferta). Modello asimmetrico "la mia squadra vs un avversario".
- **Conseguenza**: un `match` YFM diventa un `matches` ET solo se l'avversario è
  riconducibile a un `teams.id` (via alias/canonicalizzazione). Finché l'avversario è testo,
  l'UUID non è condivisibile 1:1.
- **Proposta**: gli UUID match si condividono solo per partite dove **entrambe** le squadre
  sono entità note (tipico dei campionati ufficiali). Per le altre, ET genera il proprio
  `matches.id` e YFM lo registra via `match_aliases`/`external_id`. YFM ha già il precedente
  di ID esterni partita: `match.tc_match_url`, `match.tc_team_id` (Tuttocampo).

## 4. Strategia ID condivisi (proposta operativa)

Due opzioni, da scegliere insieme:

- **A. PK condivisa** — l'UUID è letteralmente lo stesso nei due DB (chi crea per primo lo
  genera, l'altro lo riusa come PK). Massima semplicità di join, ma accoppia i due schemi:
  funziona bene solo dove il mapping è 1:1 (Player ✅; Club con le cautele di §3.1).
- **B. Campo `external_id` bidirezionale** — ogni sistema tiene la propria PK e memorizza
  l'UUID dell'altro (ET usa già `*_aliases.external_id`; YFM aggiungerebbe `external_*_id`).
  Più disaccoppiato, gestisce anche i casi NON 1:1 (Team per-stagione, Match asimmetrico).

**Raccomandazione**: **Player → opzione A** (PK condivisa, è la stessa persona). **Club,
Team, Match → opzione B** (`external_id`), per assorbire le divergenze strutturali senza
forzare i modelli. Le tabelle `*_aliases` di ET sono già pronte per questo con `source='YFM'`.

## 5. Direzione del flusso e sorgente di verità

- **Anagrafica gestita** (rose, tesseramenti, dati giocatore): **YFM è autoritativo** per i
  club che gestisce. ET consuma la proiezione pubblica.
- **Dati pubblici** (calendari, risultati, classifiche di campionati non gestiti su YFM): **ET
  è autoritativo** (li raccoglie dalle fonti FIGC/LND via ingestion).
- Un club può esistere su ET (pubblico) senza essere su YFM, e viceversa. Il collegamento
  avviene quando entrambi lo referenziano con lo stesso UUID (o via `external_id`).

## 6. Checklist decisioni aperte (per l'allineamento)

1. UUID Club condiviso = `workspace.id`? (accettando che `workspace` = tenant, non solo club)
2. Team: PK condivisa persistente (ET-style) o `external_id` sui `team` per-stagione di YFM?
3. Match: condividere UUID solo per partite "due squadre note"? Gestire il resto via alias?
4. Chi è "primo creatore" nei casi misti (club nato su ET vs su YFM)?
5. Serve un servizio/tabella di mapping centrale, o basta `external_id` bidirezionale?
6. Sincronizzazione: push da YFM, pull da ET, o event-based sul core condiviso?
7. Proiezione pubblica del Player: quali campi esatti YFM espone a ET (esclusi i dati sensibili)?
