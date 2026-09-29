-- EXTRA TIME — Football Data Core
-- Migrazione 0002: collegamento identificativi YFM e vincoli di riconciliazione
-- Design document: docs/yfm-mapping.md (§4 e §7)
--
-- Contesto: YFM e EXTRA TIME usano database separati. L'identita' condivisa e' un *valore*
-- memorizzato accanto alla PK interna, non una PK condivisa. YFM e' autoritativo per le
-- anagrafiche (club, squadre, giocatori, staff); EXTRA TIME lo e' per competizioni, gironi,
-- stagioni e partite.
--
-- Gli ID di YFM sono trattati come stringhe opache: non se ne assume il formato.

-- ---------------------------------------------------------------------------
-- Campi di collegamento verso YFM
-- ---------------------------------------------------------------------------

alter table clubs   add column yfm_id text;
alter table teams   add column yfm_id text;
alter table players add column yfm_id text;
alter table staff   add column yfm_id text;

-- Indici unici parziali: il vincolo vale solo dove l'ID e' presente, perche' ET puo'
-- creare record provvisori (yfm_id nullo) in attesa di riconciliazione.
create unique index clubs_yfm_id_key   on clubs (yfm_id)   where yfm_id is not null;
create unique index teams_yfm_id_key   on teams (yfm_id)   where yfm_id is not null;
create unique index players_yfm_id_key on players (yfm_id) where yfm_id is not null;
create unique index staff_yfm_id_key   on staff (yfm_id)   where yfm_id is not null;

-- ---------------------------------------------------------------------------
-- Correzione dei vincoli sugli alias
--
-- Il vincolo (source, external_name) impediva di registrare una rinomina della fonte:
-- il secondo inserimento violava il vincolo e l'ingestion si bloccava. La stessa entita'
-- esterna deve invece puntare sempre allo stesso record canonico.
-- ---------------------------------------------------------------------------

alter table club_aliases drop constraint club_aliases_source_external_name_key;
alter table team_aliases drop constraint team_aliases_source_external_name_key;

-- Nessun duplicato presente: il vincolo stretto e' sicuro.
alter table club_aliases add constraint club_aliases_source_external_id_key
    unique (source, external_id);
alter table team_aliases add constraint team_aliases_source_external_id_key
    unique (source, external_id);

-- Tabelle che non avevano alcun vincolo: indice unico parziale su external_id.
-- Non e' possibile usare un vincolo pieno finche' esistono righe con external_id nullo.
create unique index player_aliases_source_external_id_key
    on player_aliases (source, external_id) where external_id is not null;
create unique index match_aliases_source_external_id_key
    on match_aliases (source, external_id) where external_id is not null;
create unique index competition_aliases_source_external_id_key
    on competition_aliases (source, external_id) where external_id is not null;
