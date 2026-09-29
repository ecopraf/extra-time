import type { CSSProperties } from "react";
import { palette } from "./tokens";

/**
 * Simbolo di EXTRA TIME: la X di "EXTRA" con un punto centrale che ricorda
 * pallone / punto live / cronometro.
 *
 * Niente pallone realistico, scudetto o silhouette di calciatore: funziona anche da
 * sola, dentro un quadrato o un cerchio, per favicon e app icon.
 */

type MarkProps = {
  size?: number;
  /** Fondo Navy arrotondato (icona app). Se false, il simbolo è trasparente. */
  framed?: boolean;
  /** Mostra una freccia/movimento su un'asta (variante dinamica). */
  arrow?: boolean;
  className?: string;
  title?: string;
};

export function Mark({
  size = 48,
  framed = true,
  arrow = false,
  className,
  title = "EXTRA TIME",
}: MarkProps) {
  const stroke = framed ? palette.white : palette.electricBlue;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {framed && (
        <rect x="0" y="0" width="64" height="64" rx="14" fill={palette.extraNavy} />
      )}
      {/* Asta discendente (da sinistra in alto a destra in basso). */}
      <path
        d="M19 19 L45 45"
        stroke={stroke}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      {/* Asta ascendente: può diventare una freccia verso l'alto. */}
      {arrow ? (
        <g stroke={palette.liveOrange} strokeWidth="7" strokeLinecap="round" fill="none">
          <path d="M44 20 L22 42" />
          <path d="M22 42 L21 30" />
          <path d="M22 42 L34 43" />
        </g>
      ) : (
        <path
          d="M45 19 L19 45"
          stroke={stroke}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />
      )}
      <circle cx="32" cy="32" r="5" fill={palette.liveOrange} />
    </svg>
  );
}

/** Wordmark "EXTRA TIME" compatto e pesante, con eventuale "+4'". */
export function Wordmark({
  size = 28,
  extra,
  className,
}: {
  size?: number;
  /** Mostra il "+4'" arancione. */
  extra?: boolean;
  className?: string;
}) {
  const style: CSSProperties = {
    fontWeight: 900,
    fontSize: size,
    letterSpacing: "0.02em",
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "baseline",
    gap: size * 0.22,
  };
  return (
    <span className={className} style={style}>
      <span style={{ color: palette.white }}>EXTRA</span>
      <span style={{ color: palette.white, opacity: 0.92 }}>TIME</span>
      {extra && (
        <span style={{ color: palette.liveOrange, fontSize: size * 0.72 }}>+4&prime;</span>
      )}
    </span>
  );
}

/** Lockup completo: simbolo + wordmark + payoff (opzionale). */
export function Logo({
  markSize = 44,
  wordmarkSize = 30,
  payoff,
  className,
}: {
  markSize?: number;
  wordmarkSize?: number;
  payoff?: string;
  className?: string;
}) {
  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: markSize * 0.35 }}
    >
      <Mark size={markSize} />
      <span style={{ display: "inline-flex", flexDirection: "column", gap: 6 }}>
        <Wordmark size={wordmarkSize} extra />
        {payoff && (
          <span
            style={{
              color: palette.muted,
              fontSize: wordmarkSize * 0.4,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            {payoff}
          </span>
        )}
      </span>
    </span>
  );
}

/**
 * Elemento ricorrente dell'interfaccia: linea temporale con il momento decisivo.
 * `────●───── +4'`
 */
export function TimeLine({
  minute = "+4'",
  width = 220,
  className,
}: {
  minute?: string;
  width?: number;
  className?: string;
}) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: "0.02em",
      }}
    >
      <svg width={width} height="12" viewBox="0 0 220 12" aria-hidden="true">
        <line x1="0" y1="6" x2="220" y2="6" stroke={palette.navyLine} strokeWidth="2" />
        <line x1="0" y1="6" x2="150" y2="6" stroke={palette.electricBlue} strokeWidth="2" />
        <circle cx="150" cy="6" r="5" fill={palette.liveOrange} />
      </svg>
      <span style={{ color: palette.liveOrange }}>{minute}</span>
    </span>
  );
}
