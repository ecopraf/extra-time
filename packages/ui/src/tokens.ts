/**
 * Design token di EXTRA TIME.
 *
 * Fonte di verità per colori e tipografia. `apps/web/src/app/globals.css` rispecchia
 * questi valori come variabili CSS: se cambi la palette qui, aggiornala anche là.
 *
 * Identità: YFM comunica gestione/organizzazione, EXTRA TIME comunica calcio, ritmo,
 * informazione, visibilità e live. Dominante Navy + Electric Blue, con Orange come
 * colore caratteristico (tempo aggiuntivo / momento decisivo / live).
 */

export const palette = {
  extraNavy: "#0B132B",
  electricBlue: "#2563EB",
  liveOrange: "#FF6B2C",
  pitchGreen: "#16A34A",
  white: "#FFFFFF",
  lightGray: "#F4F6F8",

  // Estensioni per superfici e bordi (derivate dal Navy).
  navyRaised: "#111C3A",
  navyLine: "#22304F",
  navyText: "#E8EDF6",
  muted: "#9AA7BD",

  // Alert.
  red: "#E23B3B",
} as const;

export type PaletteToken = keyof typeof palette;

/**
 * Grammatica visiva: il colore non è decorativo ma indica un significato.
 * Blu = informazioni/navigazione · Arancio = LIVE/breaking
 * Verde = risultato positivo/vittoria · Rosso = espulsione/errore/alert
 * Navy = brand/contenuti · Bianco = contenuto
 */
export const semantic = {
  info: palette.electricBlue,
  live: palette.liveOrange,
  positive: palette.pitchGreen,
  negative: palette.red,
  brand: palette.extraNavy,
  surface: palette.white,
} as const;

export type SemanticTone = keyof typeof semantic;

/** Interfaccia: Inter o Manrope. Logo/wordmark: sans pesante e leggermente condensata. */
export const typography = {
  ui: "'Inter', 'Manrope', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  wordmark:
    "'Inter', 'Manrope', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  wordmarkWeight: 900,
} as const;

/**
 * Le variabili CSS usate dal web. Esportate anche come stringa per generare un :root
 * qualora serva (es. anteprime statiche).
 */
export const cssVariables: Record<string, string> = {
  "--navy": palette.extraNavy,
  "--navy-raised": palette.navyRaised,
  "--navy-line": palette.navyLine,
  "--blue": palette.electricBlue,
  "--orange": palette.liveOrange,
  "--green": palette.pitchGreen,
  "--red": palette.red,
  "--white": palette.white,
  "--light-gray": palette.lightGray,
  "--fg": palette.navyText,
  "--muted": palette.muted,
};

export function cssVariableBlock(selector = ":root"): string {
  const body = Object.entries(cssVariables)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");
  return `${selector} {\n${body}\n}`;
}
