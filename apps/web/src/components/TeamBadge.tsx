/**
 * Badge squadra: logo (se disponibile) + nome. Con fallback a un segnaposto
 * quando il logo manca. Usato in classifiche, elenco squadre, righe partita.
 */
export function TeamBadge({
  name,
  logo,
  size = 20,
  nameFirst = false,
}: {
  name: string;
  logo?: string | null;
  size?: number;
  /** Se true, il nome va prima del logo (per la colonna "casa" allineata a destra). */
  nameFirst?: boolean;
}) {
  const img = logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt=""
      width={size}
      height={size}
      className="team-badge-logo"
      loading="lazy"
    />
  ) : (
    <span
      className="team-badge-placeholder"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {name.charAt(0)}
    </span>
  );

  return (
    <span className="team-badge">
      {nameFirst ? (
        <>
          <span className="team-badge-name">{name}</span>
          {img}
        </>
      ) : (
        <>
          {img}
          <span className="team-badge-name">{name}</span>
        </>
      )}
    </span>
  );
}
