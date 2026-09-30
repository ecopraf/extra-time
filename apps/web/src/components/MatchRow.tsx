import Link from "next/link";
import type { PortalMatchRow } from "@extra-time/database";
import { formatKickoff, slugify } from "@/lib/format";

/** Percorso pubblico del girone a cui appartiene una partita. */
function groupHref(match: PortalMatchRow): string | null {
  const { regionCode, provinceCode, category, groupCode } = match;
  if (!regionCode || !provinceCode || !category) return null;
  return `/${regionCode.toLowerCase()}/${provinceCode.toLowerCase()}/${slugify(category)}/${(groupCode ?? "a").toLowerCase()}`;
}

/**
 * Riga partita del portale: casa — punteggio — ospite.
 * Con `showMeta` mostra girone e data sotto la riga (viste elenco).
 */
export function MatchRow({
  match,
  showMeta = false,
}: {
  match: PortalMatchRow;
  showMeta?: boolean;
}) {
  const isLive = match.status === "live";
  const isPlayed = match.status === "finished" && match.homeScore !== null;
  const href = showMeta ? groupHref(match) : null;

  const center = isPlayed
    ? `${match.homeScore} - ${match.awayScore}`
    : formatKickoff(match.kickoffAt);

  const row = (
    <div className={`portal-match${isLive ? " is-live" : ""}`}>
      <span className="home">
        {isLive && <span className="live-dot" aria-hidden />}
        {match.homeName}
      </span>
      <span className="score">{center}</span>
      <span className="away">{match.awayName}</span>
    </div>
  );

  if (!showMeta) return row;

  return (
    <div className="portal-match-wrap">
      {href ? <Link href={href}>{row}</Link> : row}
      <p className="portal-match-meta">
        {match.category}
        {` · ${match.groupName}`}
        {match.provinceCode ? ` · ${match.provinceCode}` : ""}
        {` · ${formatKickoff(match.kickoffAt)}`}
      </p>
    </div>
  );
}
