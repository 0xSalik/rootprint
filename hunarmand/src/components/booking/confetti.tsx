import * as React from "react";

/* -------------------------------------------------------------------------
 * <Confetti />
 *
 * The "subtle, in the craft's season palette" confetti from the brief.
 * No JavaScript — pure CSS. We render N small SVG petals positioned
 * at deterministic offsets and animate each one with a different
 * delay/duration so the field looks varied without RNG.
 *
 * Two glyph shapes (a chinar petal and a small medallion) so the
 * texture reads as Kashmiri craft fragments rather than generic
 * rectangles.
 * ----------------------------------------------------------------------- */

interface ConfettiProps {
  /** Number of pieces. Keep low — this overlays the page header for
   *  a single, deliberate moment. */
  count?: number;
  /** Hex / CSS colours used for each piece, in cycle. Defaults to the
   *  active season palette. */
  palette?: string[];
  className?: string;
}

const DEFAULT_PALETTE = [
  "var(--season-gold)",
  "var(--season-deep)",
  "var(--season-mid)",
  "var(--season-accent)",
];

export function Confetti({
  count = 36,
  palette = DEFAULT_PALETTE,
  className,
}: ConfettiProps) {
  const pieces = Array.from({ length: count }, (_, i) => i);
  return (
    <div
      aria-hidden="true"
      className={[
        "pointer-events-none absolute inset-0 overflow-hidden",
        "motion-reduce:hidden",
        className ?? "",
      ].join(" ")}
    >
      {pieces.map((i) => {
        const left = ((i * 37) % 100) + (i % 7) * 0.4; /* deterministic-ish spread */
        const delay = (i % 12) * 0.18;
        const duration = 2.4 + ((i * 13) % 7) * 0.2;
        const colour = palette[i % palette.length];
        const drift = ((i % 9) - 4) * 12;
        const isPetal = i % 2 === 0;
        return (
          <span
            key={i}
            className="absolute confetti-piece"
            style={
              {
                left: `${left}%`,
                top: "-10%",
                color: colour,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                "--confetti-x": `${drift}px`,
              } as React.CSSProperties
            }
          >
            {isPetal ? <Petal /> : <Medallion />}
          </span>
        );
      })}

      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
            opacity: 0;
          }
          15% { opacity: 1; }
          100% {
            transform: translate3d(var(--confetti-x), 110vh, 0) rotate(220deg);
            opacity: 0;
          }
        }
        .confetti-piece {
          will-change: transform, opacity;
          animation-name: confetti-fall;
          animation-timing-function: cubic-bezier(0.22, 0.61, 0.36, 1);
          animation-iteration-count: 1;
          animation-fill-mode: forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .confetti-piece { animation: none !important; opacity: 0 !important; }
        }
      `}</style>
    </div>
  );
}

function Petal() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 1 C 12 4, 14 9, 8 15 C 2 9, 4 4, 8 1 Z" />
    </svg>
  );
}

function Medallion() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6" />
    </svg>
  );
}
