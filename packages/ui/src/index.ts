/**
 * Design system di EXTRA TIME.
 *
 * Fase 1: token (palette, tipografia, grammatica di colore) e identità visiva
 * (simbolo X + punto live, wordmark, logo, timeline).
 * I componenti di prodotto (Tailwind + shadcn/ui) arriveranno coi verticali.
 */

export {
  palette,
  semantic,
  typography,
  cssVariables,
  cssVariableBlock,
} from "./tokens";
export type { PaletteToken, SemanticTone } from "./tokens";

export { Mark, Wordmark, Logo, TimeLine } from "./Logo";
