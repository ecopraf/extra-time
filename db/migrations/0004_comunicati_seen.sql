-- Stato "comunicati LND visti/importati" nel database.
--
-- Prima lo stato stava solo in scripts/import-sgs/state.json (ok per gli script
-- CLI), ma su Vercel il filesystem è read-only: l'endpoint di import non può
-- scriverci. Spostiamo lo stato marcato dall'UI qui, così è scrivibile in
-- produzione e condiviso tra endpoint e pagina Monitoraggio.
--
-- lnd-monitor.ts legge l'unione di questa tabella + state.json (storico), così
-- i comunicati già importati prima di questa migrazione restano "visti".

create table if not exists comunicati_seen (
    id          text primary key,           -- "<area>/<tipo>/<numero>", es. "Regionali/Dilettanti/63"
    numero      integer,
    area        text,
    tipo        text,
    titolo      text,
    source      text,                        -- etichetta sorgente (es. "CU63")
    applied_by  uuid references users(id) on delete set null,
    created_at  timestamptz not null default now()
);
