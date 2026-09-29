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
