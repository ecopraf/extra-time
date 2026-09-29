-- EXTRA TIME — Football Data Core
-- Migrazione 0001: schema iniziale (Fase 0)
-- Design document: docs/data-model.md
-- NOTE
--  * Gli UUID di clubs, teams, players, matches sono gli identificativi condivisi con YFM.
--  * Le fonti esterne sono mappate tramite le tabelle *_aliases: le fonti non influenzano
--    l'identita' di sistema.
--  * Nessuna vista applicativa legge direttamente dalle fonti: si legge sempre dal core.

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Territorio e federazioni
-- ---------------------------------------------------------------------------

create table federations (
    id          uuid primary key default gen_random_uuid(),
    code        text not null unique,          -- 'FIGC', 'LND', 'LND_LAZIO'
    name        text not null,
    level       text,                          -- 'nazionale' | 'regionale'
    parent_id   uuid references federations(id) on delete set null,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create table regions (
    id             uuid primary key default gen_random_uuid(),
    code           text not null unique,       -- 'LAZ'
    name           text not null,              -- 'Lazio'
    federation_id  uuid references federations(id) on delete set null,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

create table provinces (
    id          uuid primary key default gen_random_uuid(),
    region_id   uuid not null references regions(id) on delete restrict,
    code        text not null unique,          -- 'RM'
    name        text not null,                 -- 'Roma'
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Competizioni e stagioni
-- ---------------------------------------------------------------------------

create table competitions (
    id             uuid primary key default gen_random_uuid(),
    federation_id  uuid references federations(id) on delete set null,
    region_id      uuid references regions(id) on delete set null,
    code           text unique,
    name           text not null,              -- 'U15 Regionali'
    category       text not null,              -- 'U15'
    level          text,                       -- 'giovanile' | 'dilettantistico'
    gender         text not null default 'M' check (gender in ('M', 'F', 'X')),
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

create table seasons (
    id          uuid primary key default gen_random_uuid(),
    label       text not null unique,          -- '2025/2026'
    start_date  date,
    end_date    date,
    is_current  boolean not null default false,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- Il girone: il campionato concreto in una stagione.
create table competition_groups (
    id              uuid primary key default gen_random_uuid(),
    competition_id  uuid not null references competitions(id) on delete restrict,
    season_id       uuid not null references seasons(id) on delete restrict,
    province_id     uuid references provinces(id) on delete set null,
    code            text,                      -- 'A'
    name            text not null,             -- 'Girone A'
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    unique (competition_id, season_id, code)
);

-- ---------------------------------------------------------------------------
-- Club e squadre
-- ---------------------------------------------------------------------------

create table clubs (
    id              uuid primary key default gen_random_uuid(),  -- ID condiviso con YFM
    canonical_name  text not null,              -- 'Albalonga'
    legal_name      text,                       -- ragione sociale
    province_id     uuid references provinces(id) on delete set null,
    city            text,
    founded_year    int,
    colors          text,
    logo_media_id   uuid,                       -- FK aggiunta dopo media
    is_active       boolean not null default true,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create table club_aliases (
    id            uuid primary key default gen_random_uuid(),
    club_id       uuid not null references clubs(id) on delete cascade,
    source        text not null,                -- 'LND', 'FIGC', 'manuale'
    external_name text not null,
    external_id   text,
    created_at    timestamptz not null default now(),
    unique (source, external_name)
);

create table teams (
    id          uuid primary key default gen_random_uuid(),  -- ID condiviso con YFM
    club_id     uuid not null references clubs(id) on delete restrict,
    name        text not null,                  -- 'Albalonga U15'
    category    text,                           -- 'U15'
    gender      text not null default 'M' check (gender in ('M', 'F', 'X')),
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create table team_aliases (
    id            uuid primary key default gen_random_uuid(),
    team_id       uuid not null references teams(id) on delete cascade,
    source        text not null,
    external_name text not null,
    external_id   text,
    created_at    timestamptz not null default now(),
    unique (source, external_name)
);

-- Iscrizione di una squadra a un girone in una stagione.
create table group_teams (
    id            uuid primary key default gen_random_uuid(),
    group_id      uuid not null references competition_groups(id) on delete cascade,
    team_id       uuid not null references teams(id) on delete cascade,
    created_at    timestamptz not null default now(),
    unique (group_id, team_id)
);

-- ---------------------------------------------------------------------------
-- Persone: giocatori e staff
-- ---------------------------------------------------------------------------

create table players (
    id            uuid primary key default gen_random_uuid(),  -- ID condiviso con YFM
    first_name    text not null,
    last_name     text not null,
    birth_date    date,
    birth_year    int,
    nationality   text default 'IT',
    position      text,                         -- 'portiere' | 'difensore' | ...
    foot          text check (foot in ('destro', 'sinistro', 'entrambi')),
    height_cm     int,
    photo_media_id uuid,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

create table player_aliases (
    id            uuid primary key default gen_random_uuid(),
    player_id     uuid not null references players(id) on delete cascade,
    source        text not null,
    external_name text not null,
    external_id   text,
    created_at    timestamptz not null default now()
);

-- Appartenenza di un giocatore a una squadra (storico).
create table team_players (
    id           uuid primary key default gen_random_uuid(),
    team_id      uuid not null references teams(id) on delete cascade,
    player_id    uuid not null references players(id) on delete cascade,
    shirt_number int,
    from_date    date,
    to_date      date,
    is_current   boolean not null default true,
    created_at   timestamptz not null default now()
);

create index on team_players (team_id, is_current);
create index on team_players (player_id);

create table staff (
    id          uuid primary key default gen_random_uuid(),
    club_id     uuid references clubs(id) on delete cascade,
    team_id     uuid references teams(id) on delete cascade,
    first_name  text not null,
    last_name   text not null,
    role        text not null,                  -- 'allenatore', 'dirigente', ...
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create table competition_aliases (
    id               uuid primary key default gen_random_uuid(),
    competition_id   uuid not null references competitions(id) on delete cascade,
    source           text not null,
    external_name    text not null,
    external_id      text,
    created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Partite (oggetto centrale)
-- ---------------------------------------------------------------------------

create table matches (
    id             uuid primary key default gen_random_uuid(),  -- ID condiviso con YFM
    group_id       uuid references competition_groups(id) on delete set null,
    season_id      uuid references seasons(id) on delete set null,
    matchday       int,                          -- giornata
    home_team_id   uuid not null references teams(id) on delete restrict,
    away_team_id   uuid not null references teams(id) on delete restrict,
    kickoff_at     timestamptz,
    venue          text,
    status         text not null default 'scheduled'
                   check (status in ('scheduled', 'live', 'finished', 'postponed', 'suspended', 'cancelled')),
    home_score     int,
    away_score     int,
    home_score_ht  int,
    away_score_ht  int,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now(),
    check (home_team_id <> away_team_id)
);

create index on matches (group_id, matchday);
create index on matches (home_team_id);
create index on matches (away_team_id);
create index on matches (status);

create table match_aliases (
    id            uuid primary key default gen_random_uuid(),
    match_id      uuid not null references matches(id) on delete cascade,
    source        text not null,
    external_id   text,
    created_at    timestamptz not null default now()
);

create table match_events (
    id          uuid primary key default gen_random_uuid(),
    match_id    uuid not null references matches(id) on delete cascade,
    team_id     uuid references teams(id) on delete set null,
    player_id   uuid references players(id) on delete set null,
    related_player_id uuid references players(id) on delete set null, -- assist / subentrato
    minute      int,
    extra_minute int,
    type        text not null check (type in (
                    'goal', 'own_goal', 'penalty_goal', 'penalty_missed',
                    'yellow_card', 'red_card', 'substitution', 'assist', 'other')),
    detail      text,
    created_at  timestamptz not null default now()
);

create index on match_events (match_id, minute);

create table lineups (
    id           uuid primary key default gen_random_uuid(),
    match_id     uuid not null references matches(id) on delete cascade,
    team_id      uuid not null references teams(id) on delete cascade,
    player_id    uuid not null references players(id) on delete cascade,
    is_starter   boolean not null default false,
    shirt_number int,
    created_at   timestamptz not null default now(),
    unique (match_id, player_id)
);

-- ---------------------------------------------------------------------------
-- Statistiche e classifiche
-- ---------------------------------------------------------------------------

create table player_statistics (
    id              uuid primary key default gen_random_uuid(),
    player_id       uuid not null references players(id) on delete cascade,
    season_id       uuid references seasons(id) on delete cascade,
    competition_id  uuid references competitions(id) on delete cascade,
    team_id         uuid references teams(id) on delete set null,
    appearances     int not null default 0,
    starts          int not null default 0,
    minutes         int not null default 0,
    goals           int not null default 0,
    assists         int not null default 0,
    yellow_cards    int not null default 0,
    red_cards       int not null default 0,
    updated_at      timestamptz not null default now(),
    unique (player_id, season_id, competition_id)
);

create index on player_statistics (competition_id, season_id, goals desc);

create table team_statistics (
    id              uuid primary key default gen_random_uuid(),
    team_id         uuid not null references teams(id) on delete cascade,
    season_id       uuid references seasons(id) on delete cascade,
    competition_id  uuid references competitions(id) on delete cascade,
    played          int not null default 0,
    won             int not null default 0,
    drawn           int not null default 0,
    lost            int not null default 0,
    goals_for       int not null default 0,
    goals_against   int not null default 0,
    updated_at      timestamptz not null default now(),
    unique (team_id, season_id, competition_id)
);

-- Classifica: valore calcolato, sempre ricostruibile dai risultati.
create table standings (
    id                uuid primary key default gen_random_uuid(),
    group_id          uuid not null references competition_groups(id) on delete cascade,
    team_id           uuid not null references teams(id) on delete cascade,
    position          int,
    played            int not null default 0,
    won               int not null default 0,
    drawn             int not null default 0,
    lost              int not null default 0,
    goals_for         int not null default 0,
    goals_against     int not null default 0,
    goal_diff         int not null default 0,
    points            int not null default 0,
    points_penalty    int not null default 0,
    updated_at        timestamptz not null default now(),
    unique (group_id, team_id)
);

-- ---------------------------------------------------------------------------
-- Contenuti editoriali e media
-- ---------------------------------------------------------------------------

create table media (
    id                 uuid primary key default gen_random_uuid(),
    kind               text not null check (kind in ('image', 'video', 'document')),
    provider           text,                     -- 'supabase', 'youtube', 'vimeo', ...
    storage_path       text,
    external_video_id  text,                     -- per provider esterni
    url                text,
    caption            text,
    match_id           uuid references matches(id) on delete set null,
    team_id            uuid references teams(id) on delete set null,
    player_id          uuid references players(id) on delete set null,
    created_at         timestamptz not null default now()
);

create index on media (match_id);
create index on media (player_id);

create table news (
    id             uuid primary key default gen_random_uuid(),
    slug           text not null unique,
    title          text not null,
    subtitle       text,
    body           text,
    status         text not null default 'draft' check (status in ('draft', 'review', 'published', 'archived')),
    published_at   timestamptz,
    author_user_id uuid,                          -- FK aggiunta dopo users
    cover_media_id uuid references media(id) on delete set null,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

create index on news (status, published_at desc);

-- Collegamento articolo <-> entita' del core (polimorfico).
create table news_entities (
    id           uuid primary key default gen_random_uuid(),
    news_id      uuid not null references news(id) on delete cascade,
    entity_type  text not null check (entity_type in ('competition', 'group', 'team', 'player', 'match')),
    entity_id    uuid not null,
    created_at   timestamptz not null default now(),
    unique (news_id, entity_type, entity_id)
);

create index on news_entities (entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- Scouting
-- ---------------------------------------------------------------------------

create table scouting_profiles (
    id          uuid primary key default gen_random_uuid(),
    player_id   uuid not null unique references players(id) on delete cascade,
    summary     text,
    strengths   text,
    weaknesses  text,
    is_public   boolean not null default false,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create table scouting_reports (
    id           uuid primary key default gen_random_uuid(),
    player_id    uuid not null references players(id) on delete cascade,
    match_id     uuid references matches(id) on delete set null,
    author_user_id uuid,
    rating       int check (rating between 1 and 10),
    body         text,
    created_at   timestamptz not null default now()
);

create index on scouting_reports (player_id);

create table scouting_watchlist (
    id             uuid primary key default gen_random_uuid(),
    player_id      uuid not null references players(id) on delete cascade,
    reported_by_user_id uuid,
    source_kind    text check (source_kind in ('osservatore', 'societa', 'allenatore')),
    note           text,
    created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Ingestion: provenienza e audit dei dati
-- ---------------------------------------------------------------------------

create table data_sources (
    id          uuid primary key default gen_random_uuid(),
    code        text not null unique,           -- 'FIGC', 'LND', 'LND_LAZIO', 'CLUB', 'EDITORIAL'
    name        text not null,
    kind        text check (kind in ('api', 'csv', 'pdf', 'manual')),
    created_at  timestamptz not null default now()
);

create table ingestion_runs (
    id            uuid primary key default gen_random_uuid(),
    source_id     uuid not null references data_sources(id) on delete restrict,
    started_at    timestamptz not null default now(),
    finished_at   timestamptz,
    status        text not null default 'running' check (status in ('running', 'success', 'failed', 'partial')),
    records_total int not null default 0,
    records_ok    int not null default 0,
    records_error int not null default 0,
    notes         text
);

create table ingestion_records (
    id            uuid primary key default gen_random_uuid(),
    run_id        uuid not null references ingestion_runs(id) on delete cascade,
    entity_type   text not null,
    external_id   text,
    raw_payload   jsonb,
    status        text not null default 'pending' check (status in ('pending', 'valid', 'normalized', 'rejected', 'merged')),
    canonical_id  uuid,
    error         text,
    created_at    timestamptz not null default now()
);

create index on ingestion_records (run_id, status);

-- ---------------------------------------------------------------------------
-- Utenti e ruoli (RBAC)
-- ---------------------------------------------------------------------------

create table users (
    id          uuid primary key default gen_random_uuid(),
    email       text not null unique,
    display_name text,
    external_auth_id text,                      -- id in Supabase Auth
    is_active   boolean not null default true,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create table roles (
    id     uuid primary key default gen_random_uuid(),
    code   text not null unique,                -- 'ADMIN', 'REDAZIONE', 'LIVE_OPERATOR', 'SCOUT', 'CLUB', 'COACH', 'USER'
    name   text not null
);

create table user_roles (
    id       uuid primary key default gen_random_uuid(),
    user_id  uuid not null references users(id) on delete cascade,
    role_id  uuid not null references roles(id) on delete cascade,
    club_id  uuid references clubs(id) on delete cascade,  -- per ruoli legati a una societa'
    created_at timestamptz not null default now(),
    unique (user_id, role_id, club_id)
);

-- Chiavi esterne aggiunte dopo la creazione di users/media.
alter table news
    add constraint news_author_fk foreign key (author_user_id) references users(id) on delete set null;

alter table scouting_reports
    add constraint scouting_reports_author_fk foreign key (author_user_id) references users(id) on delete set null;

alter table scouting_watchlist
    add constraint scouting_watchlist_author_fk foreign key (reported_by_user_id) references users(id) on delete set null;

alter table clubs
    add constraint clubs_logo_fk foreign key (logo_media_id) references media(id) on delete set null;

alter table players
    add constraint players_photo_fk foreign key (photo_media_id) references media(id) on delete set null;
