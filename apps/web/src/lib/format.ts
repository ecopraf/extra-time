/** Helper di presentazione condivisi dalle pagine pubbliche. */

export function formatKickoff(iso: string | null): string {
  if (!iso) return "data da definire";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  }).format(new Date(iso));
}

export const MATCH_STATUS_LABEL: Record<string, string> = {
  scheduled: "Programmata",
  live: "In corso",
  finished: "Finita",
  postponed: "Rinviata",
  suspended: "Sospesa",
  cancelled: "Annullata",
};

export function matchStatusLabel(status: string): string {
  return MATCH_STATUS_LABEL[status] ?? status;
}

/** Segmento URL leggibile a partire da un nome ("U15 Regionali" -> "u15-regionali"). */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Solo la data (gg/mm/aaaa) in fuso Europe/Rome. */
export function formatDateOnly(iso: string | null): string {
  if (!iso) return "data da definire";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Rome",
  }).format(new Date(iso));
}

/** Solo l'orario (hh:mm) in fuso Europe/Rome. */
export function formatTimeOnly(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  }).format(new Date(iso));
}

/** True se tutte le date ISO cadono nello stesso giorno (Europe/Rome). */
export function sameDay(isos: (string | null)[]): boolean {
  const days = isos
    .filter((x): x is string => !!x)
    .map((x) => formatDateOnly(x));
  return days.length > 0 && days.every((d) => d === days[0]);
}

/** Data compatta "gg/mm" (senza anno), in fuso Europe/Rome. Per righe fitte. */
export function formatDateShort(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Rome",
  }).format(new Date(iso));
}

/**
 * Etichetta data per l'intestazione di una giornata.
 * - un solo giorno  -> "06/09/2026"
 * - più giorni      -> intervallo compatto "06/09 – 07/09"
 * - nessuna data    -> "" (nessuna etichetta)
 * Robusta ai null: li ignora.
 */
export function formatRoundDate(isos: (string | null)[]): string {
  const valid = isos.filter((x): x is string => !!x).sort();
  if (valid.length === 0) return "";
  const first = valid[0]!;
  const last = valid[valid.length - 1]!;
  if (formatDateOnly(first) === formatDateOnly(last)) {
    return formatDateOnly(first);
  }
  return `${formatDateShort(first)} – ${formatDateShort(last)}`;
}

/**
 * Etichetta per la cella di una prossima partita.
 * Quando la giornata copre più giorni mostra "gg/mm · hh:mm" così ogni riga
 * porta la sua data; se è tutta lo stesso giorno basta l'orario.
 */
export function formatMatchCell(iso: string | null, roundSpansMultipleDays: boolean): string {
  if (!iso) return "data da definire";
  if (roundSpansMultipleDays) return `${formatDateShort(iso)} · ${formatTimeOnly(iso)}`;
  return formatTimeOnly(iso);
}
