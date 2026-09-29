# Extra Time

Piattaforma dedicata al **calcio dilettantistico e giovanile in Italia**.

## Obiettivo

Offrire gli stessi contenuti dei portali generalisti — calendari, partite, risultati live,
classifiche e statistiche dei calciatori — ma con un'**interfaccia più fluida** e un focus
specifico sulle categorie giovanili e dilettantistiche.

In più, rispetto agli analoghi:

- **News** dedicate al mondo dilettantistico e giovanile
- **LIVE**: partite e contenuti esclusivi
- **Portale Scout** per mettere in mostra i talenti
- **Youth Football Manager** integrato (nome e forma da definire)

La missione è aumentare la visibilità e l'attenzione mediatica non solo su Serie D ed
Eccellenza, ma anche sulle categorie inferiori, dove ci sono molte persone valide che
per mancanza di opportunità non riescono a mettersi in mostra.

## Documentazione

- [`docs/product-vision.md`](docs/product-vision.md) — vision, target, perimetro, roadmap, KPI
- [`docs/football-data-core.md`](docs/football-data-core.md) — modello dati e ID condivisi YFM↔EXTRA TIME
- [`docs/architecture.md`](docs/architecture.md) — architettura tecnica e stack
- [`AGENTS.md`](AGENTS.md) — contesto per gli agenti AI

## Roadmap (verticali a valore autonomo)

| Fase | Prodotto | Valore autonomo |
|------|----------|-----------------|
| 0 | Modello + architettura | Fondamenta |
| 1 | Campionati / risultati | Portale risultati |
| 2 | Squadre / giocatori | Database calcio |
| 3 | News | Portale informativo |
| 4 | Live testuale | Live football |
| 5 | Player Profile | Visibilità giocatori |
| 6 | Scout | Scouting platform |
| 7 | Video | Media platform |
| 8 | YFM integration | Ecosistema club |
| 9 | Espansione regionale | Scalabilità |
| 10 | Nazionale | Network nazionale |

## Stato

**Fase 0** — definizione del modello. La documentazione è in corso; nessun codice.

Modello dei tre prodotti:

1. **EXTRA TIME — MEDIA** (B2C): news, risultati, live, video.
2. **EXTRA TIME — FOOTBALL DATA** (B2C): calendari, classifiche, statistiche, profili.
3. **YFM — CLUB OPERATING SYSTEM** (B2B): gestione operativa per le società.

I tre condividono un **Football Data Core**.

## Licenza

Da definire.
