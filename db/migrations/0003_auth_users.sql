-- EXTRA TIME — Migrazione 0003: autenticazione utenti (Hub Impostazioni)
-- Aggiunge la password (hash) agli utenti e popola i ruoli RBAC di base.
-- L'auth è custom leggera (cookie di sessione + bcrypt), su Neon. Nessun
-- provider esterno: external_auth_id resta per eventuali integrazioni future.

-- Password hash (bcrypt). Nullable: un utente può esistere senza password
-- (es. creato da import) finché non ne imposta una.
alter table users add column if not exists password_hash text;

-- Tracciamento accessi (facoltativo ma utile per audit di base).
alter table users add column if not exists last_login_at timestamptz;

-- Ruoli RBAC di base (i codici erano già previsti nel commento dello schema).
insert into roles (code, name) values
  ('ADMIN',         'Amministratore'),
  ('REDAZIONE',     'Redazione'),
  ('LIVE_OPERATOR', 'Operatore Live'),
  ('SCOUT',         'Osservatore'),
  ('CLUB',          'Società'),
  ('COACH',         'Allenatore'),
  ('USER',          'Utente')
on conflict (code) do nothing;

-- Sessioni: token di sessione server-side, così un logout invalida davvero
-- la sessione (il cookie porta solo l'id sessione firmato).
create table if not exists user_sessions (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references users(id) on delete cascade,
    created_at  timestamptz not null default now(),
    expires_at  timestamptz not null,
    user_agent  text,
    revoked_at  timestamptz
);

create index if not exists user_sessions_user_idx on user_sessions (user_id);
create index if not exists user_sessions_expires_idx on user_sessions (expires_at);
