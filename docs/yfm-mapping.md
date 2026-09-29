# EXTRA TIME ↔ YFM — Mapping degli identificativi condivisi

> Documento operativo che collega lo schema **YFM** (gestionale B2B, Supabase) allo schema
> **EXTRA TIME** (`db/migrations/0001_initial_schema.sql`). Risponde alla domanda aperta #4
> (`docs/open-questions.md`) e concretizza la decisione di `docs/football-data-core.md` §5.
>
> Sorgente schema YFM: database YFM (Supabase PostgreSQL 17), letto il 28/09/2026.
> Entrambi i sistemi usano UUID v4 (`gen_random_uuid()`) come chiavi primarie interne, ma i
> due database sono **separati**: l'identità condivisa è un *valore* memorizzato accanto alla
> PK (vedi §4), non una PK condivisa.

## 1. Principio condiviso

Lo schema EXTRA TIME dichiarava, nei commenti SQL, che gli UUID di `clubs`, `teams`,
`players`, `matches` **sono** gli identificativi condivisi con YFM. Con la scelta di database
separati quella formulazione va corretta: **YFM è il sistema di riferimento per gli ID** delle
anagrafiche che gestisce, ed ET li memorizza come valori di collegamento (`yfm_id`), mantenendo
la propria PK interna. Le fonti esterne (LND, FIGC) restano separate nelle tabelle `*_aliases`.
Questo documento definisce **come** i due schemi si corrispondono, dove il mapping è 1:1 e dove
NO.

## 2. Mapping entità (colpo d'occhio)

| Entità | EXTRA TIME | YFM | Proprietà ID | Mapping |
|--------|-----------|-----|--------------|---------|
| Club | `clubs` | `workspace` | **YFM** | ⚠️ concettualmente diverso (vedi §3.1) |
| Categoria | `competitions.category` | `category` | — | parziale, per valore (vedi §3.2) |
| Stagione | `seasons` | `season` | **EXTRA TIME** | ⚠️ scope diverso: ET globale, YFM per-club |
| Girone | `competition_groups` | `category.girone` (testo) + `competition` | **EXTRA TIME** | parziale |
| Squadra | `teams` | `team` | **YFM** | ⚠️ NON 1:1 (vedi §3.3) |
| Rosa | `team_players` | `team_player` | — | 1:1 concettuale |
| Giocatore | `players` | `player` | **YFM** | ✅ 1:1 (vedi §3.4) |
| Partita | `matches` | `match` | **EXTRA TIME** | ⚠️ NON 1:1 (vedi §3.5) |
| Evento | `match_events` | `match_event` | **EXTRA TIME** | 1:1 concettuale |
| Formazione | `lineups` | `match_formation` | **EXTRA TIME** | 1:1 concettuale |
| Staff | `staff` | `staff` / `team_staff` | **YFM** | parziale |
| Impianto | `matches.venue` (testo) | `facility` (entità) | **YFM** | ⚠️ ET testo, YFM entità |

> **Sintesi della proprietà**: YFM è il sistema di riferimento per le **anagrafiche**
> (Club, Team, Player, Staff). EXTRA TIME lo è per la **struttura federale e i risultati**
> (Stagione, Competizione, Girone, Partita, Eventi, Formazioni). Nessuno dei due invade il
> campo dell'altro.

## 3. Dettaglio e divergenze da risolvere

### 3.1 Club — `clubs` (ET) ↔ `workspace` (YFM)
- In **YFM** il "club" È il **workspace**: è anche il *tenant* gestionale (piano, utenti,
  settori abilitati). Ha `nome`, `nome_breve`, `logo_url`, `regione`.
- In **ET** `clubs` è un'anagrafica pubblica: `canonical_name`, `legal_name`, `province_id`,
  `city`, `founded_year`, `colors`, `logo_media_id`.
- **Proposta**: l'identificativo condiviso è `workspace.id` (YFM), **trattato come stringa
  opaca**. ET memorizza quel valore in `clubs.yfm_id` e crea la propria riga `clubs` con la
  propria PK interna. Quando un club gestito su YFM viene pubblicato su ET, ET crea la riga
  `clubs` **collegandola** a `workspace.id`; **non riusa l'UUID come primary key**.
- ⚠️ **Non toccare la PK di YFM**: `workspace` è in produzione ed è il *tenant* (utenti,
  piano, billing). Forzare `clubs.id` dentro `workspace.id` significherebbe modificare la
  chiave primaria di un sistema vivo. Si aggiunge invece un campo di collegamento
  (`external_club_id`) lato YFM, se serve la lettura inversa.
- ⚠️ `workspace` porta con sé dati gestionali che ET non deve avere. La condivisione è solo
  sull'**identità**, non sui campi.

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
- **Proposta**: l'identificativo condiviso di Squadra è quello **YFM** (`team.id`), che YFM
  genera per stagione. ET memorizza quel valore in `teams.yfm_id` e crea la propria riga
  `teams` persistente (club × categoria × genere). Per le squadre YFM legate alla stessa
  entità persistente in stagioni diverse, ET terrà **più alias** (`team_aliases`, uno per
  stagione) che puntano allo stesso `teams.id`: è esattamente lo scopo di `team_aliases`.
- ⚠️ Da decidere insieme: se in ET una squadra cambia categoria (es. U15 → U17) è la **stessa**
  entità persistente o una nuova? YFM in quel caso genera un nuovo `team`; ET deve decidere se
  seguirlo con un nuovo `teams` o con un alias di più. **DA DECIDERE INSIEME.**

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

- **Proposta**: l'identificativo condiviso del Giocatore è quello **YFM** (`player.id`), che
  YFM genera per i tesserati che gestisce. ET memorizza quel valore in `players.yfm_id`.
- ⚠️ **Il giocatore però NON è creato solo da YFM.** In ET i giocatori nascono anche in
  autonomia: `db/seeds/0001_pilot_lazio.sql` fa `insert into players …`, e il backoffice
  registra i marcatori in `match_events` collegandoli a `player_id`. Due creatori ⇒ due
  identità per la stessa persona, se non si disciplina il caso. Vedi §4 e §4.1.
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
- **Proposta**: gli identificativi delle partite di campionato ufficiale sono **ET**
  (ET è autoritativo sui risultati). Per le partite gestite su YFM in cui l'avversario non è
  un'entità nota, YFM tiene il proprio `match.id` e lo collega via `match_aliases`
  (`source='YFM'`, `external_id`). YFM ha già il precedente di ID esterni partita:
  `match.tc_match_url`, `match.tc_team_id` (Tuttocampo).

## 4. Strategia ID condivisi (decisione)

I due sistemi hanno **database separati**. Questo esclude la "PK condivisa" come strategia
generale: senza un DB comune non esiste alcuna FK tra i due, e ciò che serve è un **valore
di ID stabile e comune**, non che quel valore sia la *primary key*.

**Decisione: opzione B per tutte le entità.**

- Ogni sistema mantiene la **propria PK interna** (`gen_random_uuid()`).
- Ogni sistema memorizza l'identificativo dell'altro in un **campo di collegamento**:
  - lato ET: `clubs.yfm_id`, `teams.yfm_id`, `players.yfm_id` (+ `*_aliases.external_id`);
  - lato YFM: `external_club_id`, `external_team_id`, `external_player_id` (da aggiungere).
- L'identificativo di YFM si tratta come **stringa opaca**: non lo interpretiamo, non ne
  assumiamo il formato. Va memorizzato in una colonna `text` con indice unico.

**Proprietà degli ID** (confermata dal proprietario del prodotto):

| Entità | Chi genera l'ID condiviso | Chi lo riceve |
|--------|---------------------------|---------------|
| Club | **YFM** (`workspace.id`) | ET (`clubs.yfm_id`) |
| Team | **YFM** (`team.id`, per stagione) | ET (`teams.yfm_id`) |
| Player | **YFM** (`player.id`) | ET (`players.yfm_id`) |
| Staff | **YFM** | ET (`staff.yfm_id`) |
| Competizione / Girone / Stagione / Partita | **EXTRA TIME** | YFM (`external_*_id`) |

### 4.1 Chi crea il record (e il caso "nuovo")

YFM genera gli ID di Club, Team e Player. Ma **ET può creare i propri record in autonomia**
(seed del pilota, backoffice, ingestion FIGC/LND). Regola operativa:

| Caso | Chi crea | Cosa fa EXTRA TIME |
|------|----------|--------------------|
| Entità **già su YFM** | YFM (già fatto) | Importa e collega `yfm_id`. Nessuna ambiguità. |
| Entità **nuova** che YFM gestirà | **YFM** | La riceve dal sync e la collega. |
| Entità che ET rileva da FIGC/LND e YFM non ha | **EXTRA TIME** (provvisorio) | Crea la riga con `yfm_id = NULL`, stato `da riconciliare`. |
| Competizione / Girone / Partita | **EXTRA TIME** | YFM semmai li referenzia. |

Il terzo caso è il punto delicato: **ET non aspetta YFM per poter ingerire i dati**, ma non
si arroga il diritto di battezzare l'identità. Tiene un record provvisorio e lo riconcilia.

Coda di riconciliazione (pannello Data Quality, già previsto in `football-data-core.md` §7):

```
⚠ 12 club senza yfm_id — da collegare a YFM
⚠  7 giocatori senza yfm_id (possibili tesserati non ancora su YFM)
⚠  4 possibili duplicati (nome simile, stessa provincia)
```

**Regola d'oro**: EXTRA TIME **non scrive mai** nel database di produzione di YFM. Il flusso è
a senso unico, YFM → EXTRA TIME, con export/API periodica. La scrittura inversa è Fase 8.

## 5. Direzione del flusso e sorgente di verità

- **Anagrafica gestita** (club, squadre, rose, tesseramenti, dati giocatore): **YFM è
  autoritativo**. ET consuma la proiezione pubblica e non modifica l'identità.
- **Dati pubblici** (calendari, risultati, classifiche, competizioni): **ET è autoritativo**,
  li raccoglie dalle fonti FIGC/LND via ingestion.
- Un club può esistere su ET (pubblico) senza essere su YFM, e viceversa. Il collegamento
  avviene tramite il campo `yfm_id` / `external_*_id`, **mai** tramite PK condivisa.
- **Sincronizzazione**: pull periodico da parte di ET (export YFM → ingestion ET). Da definire
  cadenza e innesco (vedi checklist §6, punto 5).

## 6. Checklist decisioni aperte (per l'allineamento)

1. ~~UUID Club condiviso = `workspace.id`?~~ **Chiuso**: ID YFM memorizzato in `clubs.yfm_id`;
   la PK di `workspace` non si tocca (è il tenant in produzione).
2. Team: ET tiene la squadra persistente e collega le `team` YFM per-stagione via
   `teams.yfm_id` + alias. Confermare se un cambio di categoria (U15→U17) è la stessa entità.
3. Match: ID ET per le partite di campionato; ID YFM collegato via `match_aliases` per le
   partite con avversario non entità. Confermare.
4. **Chi crea il record nei casi misti**: regola §4.1 (record provvisorio + coda di
   riconciliazione). Confermare.
5. **Sincronizzazione**: cadenza, innesco (cron? export manuale? webhook?) e chi la esegue.
6. **Rinomina**: se YFM rinomina un club/giocatore, ET aggiorna `canonical_name` o conserva
   il vecchio nome come alias storico? (Il vincolo attuale `unique (source, external_name)`
   sugli alias va corretto: vedi §7.)
7. **Fusione/duplicati**: due club su YFM diventano uno (o viceversa) — serve una procedura di
   merge che unisca gli ID e riallinei gli alias.
8. **Proiezione pubblica del Player**: quali campi esatti YFM espone a ET, esclusi i dati
   sensibili (§3.4). Bloccante per la privacy dei minori.

## 7. Modifiche necessarie allo schema EXTRA TIME

Verificate su `db/migrations/0001_initial_schema.sql`:

1. **Campi di collegamento** (nuovi) — implementati in `0002_yfm_id_links.sql`:
   ```sql
   alter table clubs   add column yfm_id text;
   alter table teams   add column yfm_id text;
   alter table players add column yfm_id text;
   alter table staff   add column yfm_id text;

   -- Unicità parziale: ET può creare record provvisori con yfm_id nullo
   -- (in attesa di riconciliazione), ma un ID YFM non può puntare a due record.
   create unique index clubs_yfm_id_key on clubs (yfm_id) where yfm_id is not null;
   ```
   (Stesso schema per `teams`, `players`, `staff`.)
2. **Vincolo alias errato**: `club_aliases` e `team_aliases` hanno
   `unique (source, external_name)`. È sbagliato perché lega l'**identità** al **nome**: se la
   fonte rinomina il soggetto, il secondo inserimento viola il vincolo e l'ingestion si
   blocca. Va sostituito con `unique (source, external_id)`: è l'identificativo esterno a
   identificare l'entità, non il nome. La rinomina diventa un `UPDATE` di `external_name` sulla
   riga esistente (vedi punto 4).
3. **Vincoli mancanti**: `player_aliases`, `match_aliases` e `competition_aliases` non hanno
   alcun `unique`: la sincronizzazione può creare duplicati in silenzio. Aggiungere un indice
   unico parziale su `(source, external_id)` (dove `external_id is not null`).
4. **Rinomina = `UPDATE`, non nuova riga**: con `unique (source, external_id)` la stessa entità
   esterna punta sempre a un solo record canonico. Se si vuole conservare lo **storico dei
   nomi**, serve una tabella dedicata (`*_alias_history`) o un intervallo di validità: non si
   allenta l'unicità dell'identità. Nota: `club_aliases`/`team_aliases` usano un vincolo pieno,
   perché le righe con `external_id` nullo restano ammesse (in Postgres i NULL sono distinti).

## 8. Casi che rompono l'integrazione (da progettare ora)

- **Rinomina**: nome cambiato su YFM → ET **aggiorna** `external_name` sull'alias collegato
  (non crea una seconda riga). Il vecchio nome resta solo se si introduce uno storico dedicato.
- **Fusione**: due identità diventano una. Serve una procedura esplicita di merge, con
  riallineamento di alias, rose, partite e statistiche.
- **Sdoppiamento**: un soggetto creato due volte (una per sistema). La coda di riconciliazione
  deve proporre l'unione, non solo segnalarla.
