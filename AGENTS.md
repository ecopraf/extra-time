# AGENTS.md — EXTRA TIME

Contesto per agenti AI che lavorano su questo repository.

## Lingua

Tutta la documentazione e le comunicazioni con il committente sono in **italiano**.

## Cos'è EXTRA TIME

Piattaforma digitale per dare visibilità al **calcio dilettantistico e giovanile italiano**.
Vedi `docs/product-vision.md` per vision, target, perimetro, roadmap e KPI.

## Approccio: docs-first, fasi a valore autonomo

- **La Fase 0 non produce codice.** Produce visione, modello dati e architettura.
- Non partire da homepage/index o dalla tecnologia: parti dal **modello editoriale/prodotto**
  e dalla **sequenza di valore**.
- Ogni fase della roadmap deve essere **utilizzabile senza aspettare la successiva**.
- Prima: **Audience → Utilità → Network → Monetizzazione**. Non costruire funzionalità solo
  perché potenzialmente monetizzabili.

## Principi architetturali

- Il **Football Data Core** è l'asset centrale: le aree (Match, Stats, News, Live, Scout) sono
  viste sullo stesso core, non moduli separati. Vedi `docs/football-data-core.md`.
- **Modular monolith**, non microservizi (almeno all'inizio).
- **ID univoci condivisi** di Club, Team, Player, Match tra YFM ed EXTRA TIME sono una
  decisione da prendere prima di sviluppare.
- **Data ingestion** centralizzata con validation + normalization; nessuna schermata legge
  direttamente dalle fonti originali.
- Stack di riferimento in `docs/architecture.md` (Next.js + TypeScript + Supabase + Vercel).

## Relazione con Youth Football Manager (YFM)

- YFM **non va rinominato**: resta il "Club Operating System" (B2B).
- EXTRA TIME è il portale pubblico (B2C/media).
- I due si integrano e condividono il Football Data Core.

## Convenzioni commit

```
feat: nuova funzionalità
fix: correzione bug
style: stili CSS
refactor: refactoring
docs: documentazione
```

## Cosa NON fare

- Non replicare lo stack YFM pedissequamente.
- Non fare Live video / Scout marketplace / AI prima delle fasi precedenti.
- Non permettere accesso diretto ai dati dalle fonti esterne nelle viste applicative.
