# Brand — EXTRA TIME

Materiali di identità visiva, derivati dal design system in [`packages/ui`](../../packages/ui).

## File

| File | Cos'è |
| --- | --- |
| `extra-time-identita-visiva.pdf` | La pagina `/presentazione` esportata in PDF (4 pagine), da mandare per email o WhatsApp. |
| `extra-time-identita-visiva.html` | La stessa pagina in un **unico file autonomo** (CSS incorporato, nessuno script): si apre con doppio clic, senza server e senza internet. |
| `anteprima-pagina.png` | Anteprima dell'intera pagina come immagine singola. |
| `logo/mark.svg` · `mark.png` | Simbolo base: X + punto live, fondo Navy arrotondato. |
| `logo/mark-inverso.svg` · `.png` | Simbolo senza fondo (per superfici chiare o scure). |
| `logo/mark-dinamico.svg` · `.png` | Variante con l'asta a freccia arancione (movimento). |
| `logo/mark-cerchio.svg` · `.png` | Variante circolare (avatar, favicon). |
| `logo/wordmark.svg` · `.png` | Scritta `EXTRA TIME +4'`. |
| `logo/timeline.svg` · `.png` | Elemento ricorrente `────●──── +4'`. |

## Colori

| Nome | HEX | Uso |
| --- | --- | --- |
| Extra Navy | `#0B132B` | header, testo forte, footer |
| Electric Blue | `#2563EB` | brand, link, CTA |
| Live Orange | `#FF6B2C` | LIVE, breaking, tempo aggiuntivo |
| Pitch Green | `#16A34A` | calcio, esito positivo (secondario) |
| White | `#FFFFFF` | superfici, contenuto |
| Light Gray | `#F4F6F8` | background |

Fonte di verità: [`packages/ui/src/tokens.ts`](../../packages/ui/src/tokens.ts).

## Rigenerare

Con l'app in esecuzione su `http://localhost:12000`:

```bash
# PDF (i colori del brand sono preservati dalla regola @media print in globals.css)
chromium --headless --no-pdf-header-footer \
  --print-to-pdf=docs/brand/extra-time-identita-visiva.pdf \
  http://localhost:12000/presentazione

# Anteprima PNG
chromium --headless --window-size=1240,3400 \
  --screenshot=docs/brand/anteprima-pagina.png \
  http://localhost:12000/presentazione

# PNG dei simboli
cd docs/brand/logo
for f in mark mark-inverso mark-dinamico mark-cerchio wordmark timeline; do
  chromium --headless --default-background-color=00000000 \
    --screenshot="$f.png" --window-size=512,512 "file://$PWD/$f.svg"
done
```

L'HTML autonomo si ottiene inlineando il CSS della pagina nel documento (vedi la
conversazione/PR di riferimento).
