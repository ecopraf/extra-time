# Changelog

Tutte le modifiche rilevanti al progetto EXTRA TIME. Le date sono in formato
AAAA-MM-GG. Il progetto segue un versionamento informale per fasi (vedi
`docs/master-plan.md`); questo changelog raggruppa le modifiche per data e tema.

## [Non rilasciato] — 2026-10-01

### Hub Impostazioni e autenticazione
- Hub riservato `/impostazioni` con **autenticazione custom** (hashing scrypt + sessioni
  server-side su Neon, cookie `et_session`, middleware, 7 ruoli RBAC; migrazione
  `0003_auth_users`). Rimosso il vecchio `/admin?token=` con `ADMIN_TOKEN`.
- Backoffice a navigazione gerarchica **Settore → Campionato → Girone** con editor
  risultati, anagrafica e monitoraggio comunicati.
- Dashboard **Monitoraggio calendari**: legge in tempo reale i comunicati LND Lazio e li
  marca "Da rivedere" / "Importato".
- **Badge notifica** (solo admin) sull'icona Impostazioni: conta i comunicati da rivedere,
  con tooltip e link diretto al monitoraggio.

### Import calendari e risultati (package `@extra-time/ingest`)
- Nuovo package condiviso con la logica pura di parsing/applicazione, usata sia dagli
  script CLI sia dal web (parità verificata con gli script `.mjs`).
- **Programma gare** (orari/date): endpoint admin `/api/import-comunicato` con anteprima
  dry-run + conferma; bottone "Applica" nel monitoraggio.
- **Risultati ufficiali**: `parseRisultati` + `applyRisultati`; endpoint
  `/api/import-risultati` e bottone "Importa risultati". Registra i punteggi, porta le
  partite a "finished" e aggiorna le classifiche (calcolate dal dominio).
- **Importa da URL** (`/api/import-url` + card nell'Hub): incolla il link di un comunicato
  (PDF o ZIP), auto-rileva se contiene programma gare e/o risultati e applica.
- **Supporto ZIP/DOCX**: `fetchComunicatoText` gestisce sia i PDF sia gli archivi ZIP con
  dentro un `.docx` (estratto via `fflate`), per i comunicati non pubblicati in PDF.
- **Vincolo di settore** nell'applicazione risultati: un comunicato SGS applica solo alle
  categorie giovanili, un comunicato Dilettanti solo a quelle dilettantistiche — evita
  falsi positivi quando lo stesso club gioca in più campionati.
- `comunicati_seen` (migrazione `0004`): stato "visto/importato" sul DB (scrivibile anche
  in produzione), così il badge e lo stato nel monitoraggio si aggiornano dopo l'import.
- **Enumeratore storage** (`scripts/import-sgs/enumera-comunicati.mjs`) + workflow
  `inventario-comunicati.yml`: la pagina comunicati LND è renderizzata via JS, così
  l'enumerazione dello storage (HEAD su URL prevedibili) produce l'inventario completo
  classificato, come artifact CI. Il watcher `watch-comunicati.yml` apre una issue sui
  nuovi comunicati.

### Calendari — completezza e correttezza
- **Giovanili Regionali**: corretto l'offset del girone di ritorno (era `+15` fisso, ora
  `squadre − 1`); chiuso il buco delle giornate 14-15 (2730 partite rimappate).
- **Dilettanti**: generato il girone di ritorno mancante (le brochure pubblicano solo
  l'andata): 2958 partite a specchio con data "da definire", poi riempibili dai programma
  gare.
- U19 Elite lasciato alle 6 giornate reali disponibili (nessun dato fabbricato).

### Portale pubblico — UI/UX
- **Date delle giornate** sempre visibili in panoramica e calendario: data piena per le
  giornate di un solo giorno, intervallo compatto (es. "03/10 – 04/10") per quelle su più
  giorni; cella riga con "gg/mm · hh:mm" quando serve.
- **Navigazione risultati** nella panoramica: apre sull'ultima giornata giocata e le frecce
  ‹ › scorrono le giornate in modo coerente (prima il bug impediva di tornare alle prime
  giornate).
- **Monitoraggio responsive**: su mobile la tabella diventa **card compatte** (etichetta a
  sinistra, valore a destra, titolo in evidenza, bottone azione a piena larghezza); su
  desktop colonna Azioni allargata per non tagliare i bottoni.
- Stato "applicato" visibile sui bottoni import (verde "✓ Riapplica" / "✓ Reimporta").
- Fix warning React "unique key" nel calendario del girone.

### Documentazione
- Allineata tutta la documentazione allo stato reale: **Neon Postgres + auth custom**
  (non Supabase), Hub `/impostazioni` (non `/admin`), package `ingest`, migrazioni
  `0001`–`0004`, deploy Vercel. Chiarita la proprietà: **YFM è di Raffaele**; Vittorio ha
  proposto la collaborazione su EXTRA TIME.
- Steering `.kiro` aggiornate (stack, backoffice, import, DB condiviso, regole operative).

## Precedenti

Fasi 0 e 1 (modello dati, Football Data Core su Neon, portale pubblico per territorio,
pilota Lazio stagione 2026/2027). Vedi `docs/master-plan.md` e lo storico git.
