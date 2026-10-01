# EXTRA TIME — Open Questions (per Vittorio)

Domande ordinate per priorità. **Aggiornamento (fine Fase 1):** diverse domande di
Priorità 1–2 sono ormai **risolte** dalla costruzione del pilota Lazio; sono marcate con
✅ qui sotto. Restano aperte soprattutto le domande di prodotto/business (Priorità 3–4).

## Priorità 1 — (in gran parte risolte in Fase 1)

1. **Cosa intendi esattamente per "LIVE"?**
   Testuale (gol/cambi), editoriale (cronaca+foto), video, o premium (video+telecronaca+dati)?
   Da qui dipendono costi, persone e tecnologia. (Noi partiremmo dal testuale.)

2. **Fonti dati: quali, con che diritti e con che formato?**
   FIGC, LND, Comitato Regionale Lazio, società? PDF, CSV, API, inserimento manuale?
   Chi ce le fornisce e con quale accordo?

3. **Chi inserisce e aggiorna i dati sui campi?** *(ancora aperta — rilevante per i
   risultati)* Redazione interna, referenti per girone, dirigenti delle società, volontari?
   Oggi orari/date si aggiornano dai comunicati LND (import da UI); l'inserimento **risultati**
   è il prossimo flusso da definire (manuale dall'Hub vs import). Vedi la proposta dedicata.

4. ✅ **ID condivisi YFM ↔ EXTRA TIME.** *Risolta* (`docs/yfm-mapping.md`): campo `yfm_id`
   come stringa opaca, flusso unidirezionale YFM → ET (migrazione `0002_yfm_id_links`).

5. ✅ **YFM separato o integrato.** *Risolta*: restano separati (ET pubblico, YFM B2B),
   integrati sullo stesso Football Data Core, DB distinti.

## Priorità 2 — (in parte risolte)

6. ✅ **Categorie della Fase 1.** *Risolta* per il pilota: giovanili U14–U19 (Regionale +
   Elite) e dilettanti Eccellenza/Promozione/Prima/Seconda Categoria.

7. ✅ **Perimetro geografico del pilota.** *Risolta*: **Lazio**, stagione 2026/2027,
   ~66 gironi.

8. **"News"**: chi scrive? Con che cadenza? Vogliamo partire con contenuti generati dai dati
   (es. "risultati della giornata") o con redazione vera da subito?

9. **"Portale scout"**: osservatori professionisti, società, o anche allenatori/genitori?
   Vogliamo introdurre verifiche su chi può accedere ai dati dei minori?

10. **Video / contenuti esclusivi**: produzione interna, collaborazione con videomaker locali,
    o contenuti forniti dalle società?

## Priorità 3 — Prodotto e business

11. **Qual è il primo utente che vuoi conquistare?**
    Tifoso/famiglia, società, allenatore, o giocatore? (Consigliamo di sceglierne uno e
    servirlo bene prima di allargare.)

12. **Modello di partnership con le società**: gratis, freemium, a pagamento?
    Cosa ricevono in cambio della pubblicazione dei dati?

13. **Monetizzazione**: quale di questi percorsi vedi più realistico nei primi 12–18 mesi?
    B2C (premium/advertising), B2B (YFM/servizi), Media (sponsor/branded content), Scout
    (accesso database)?

14. **Risorse disponibili**: budget, ore/settimana, quante persone, competenze presenti vs da
    acquisire?

15. **Nome e identità**: "EXTRA TIME" è definitivo? Serve un logo/identità visiva da subito?
    YFM viene rinominato per l'ecosistema o resta YFM?

## Priorità 4 — Visione a 3 anni

16. **Come immagini EXTRA TIME tra 3 anni?**
    Portale nazionale di riferimento del dilettantistico? Piattaforma dati venduta ai media?
    Ecosistema YFM + portale? Questo orienta tutte le priorità.

**Richiesta esplicita:** _"Non mi serve l'index. Mi serve capire come immagini il prodotto tra
3 anni e come arriviamo lì attraverso step che abbiano valore già da soli."_
