import * as React from "react";

import { type Craft } from "@/lib/seasons";
import { TalimTexture, ArabesqueQuarter } from "@/components/motifs";

/* -------------------------------------------------------------------------
 * <PieceArt />
 *
 * A single beautiful close-up of the piece, rendered entirely in inline
 * SVG. Each craft has its own composition — there are no raster images
 * to ship, which keeps the Sanad page well under the 2-second LCP
 * target on a slow connection.
 *
 * This is the placeholder used when no real photograph has been uploaded
 * yet. When a photograph arrives later, swap this for a <picture>.
 * ----------------------------------------------------------------------- */

interface PieceArtProps {
  craft: Craft;
  /** Used to derive a stable seed so each piece looks slightly different
   *  even if it shares a craft. */
  pieceId: string;
  className?: string;
}

export function PieceArt({ craft, pieceId, className }: PieceArtProps) {
  const seed = pieceIdSeed(pieceId);
  return (
    <figure
      className={`relative aspect-[4/3] w-full overflow-hidden rounded-craft border border-line ${className ?? ""}`}
      style={{
        background:
          "linear-gradient(150deg, var(--season-gold-soft) 0%, var(--bg-primary) 65%)",
      }}
    >
      {craft === "carpet" && <CarpetArt seed={seed} />}
      {craft === "pashmina" && <PashminaArt seed={seed} />}
      {craft === "papier-mache" && <PapierMacheArt seed={seed} />}
      {craft === "kani" && <KaniArt seed={seed} />}
      {craft === "khatamband" && <KhatambandArt seed={seed} />}

      {/* Inner frame line */}
      <div
        aria-hidden="true"
        className="absolute inset-3 sm:inset-4 rounded-[6px] border pointer-events-none"
        style={{ borderColor: "rgba(60, 56, 52, 0.18)" }}
      />
      {/* Corner ornaments */}
      <ArabesqueQuarter
        className="absolute top-3 left-3 sm:top-4 sm:left-4"
        corner="tl"
        size={28}
        opacity={0.55}
      />
      <ArabesqueQuarter
        className="absolute top-3 right-3 sm:top-4 sm:right-4"
        corner="tr"
        size={28}
        opacity={0.55}
      />
      <ArabesqueQuarter
        className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4"
        corner="br"
        size={28}
        opacity={0.55}
      />
      <ArabesqueQuarter
        className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4"
        corner="bl"
        size={28}
        opacity={0.55}
      />
    </figure>
  );
}

/* -------------------------- Per-craft compositions ---------------------- */

/** Knotted rug section: a grid of warp lines and a central medallion. */
function CarpetArt({ seed }: { seed: number }) {
  const offset = (seed % 7) * 4;
  return (
    <svg
      className="absolute inset-0 size-full"
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern id="warp" width="6" height="600" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="600" stroke="var(--season-deep)" strokeOpacity="0.18" strokeWidth="1" />
        </pattern>
        <pattern id="weft" width="800" height="9" patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${offset})`}>
          <line x1="0" y1="0" x2="800" y2="0" stroke="var(--season-deep)" strokeOpacity="0.10" strokeWidth="1" />
        </pattern>
        <radialGradient id="medCarpet" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--season-gold)" stopOpacity="0.48" />
          <stop offset="100%" stopColor="var(--season-deep)" stopOpacity="0.0" />
        </radialGradient>
      </defs>
      <rect width="800" height="600" fill="url(#warp)" />
      <rect width="800" height="600" fill="url(#weft)" />

      {/* Talim diagonal weave hint */}
      <g opacity="0.16">
        <path
          d="M0 600 L800 0"
          stroke="var(--season-deep)"
          strokeWidth="0.7"
          strokeDasharray="8 6"
        />
        <path
          d="M0 0 L800 600"
          stroke="var(--season-deep)"
          strokeWidth="0.7"
          strokeDasharray="8 6"
        />
      </g>

      {/* Central medallion */}
      <g transform="translate(400 300)">
        <ellipse rx="240" ry="160" fill="url(#medCarpet)" />
        <g fill="none" stroke="var(--season-gold)" strokeWidth="1.4" opacity="0.85">
          <ellipse rx="120" ry="80" />
          <ellipse rx="80" ry="50" />
          <ellipse rx="40" ry="22" />
        </g>
        <g fill="var(--season-gold)" opacity="0.85">
          <circle r="5" />
          <circle cx="-120" r="3" />
          <circle cx="120" r="3" />
          <circle cy="-80" r="3" />
          <circle cy="80" r="3" />
        </g>
      </g>

      {/* Kerb / outer border indication */}
      <g fill="none" stroke="var(--season-deep)" strokeWidth="1.2" opacity="0.6">
        <rect x="40" y="40" width="720" height="520" />
        <rect x="58" y="58" width="684" height="484" strokeWidth="0.6" opacity="0.5" />
      </g>
    </svg>
  );
}

/** Pashmina shawl: woven stripes + a corner kani booteh. */
function PashminaArt({ seed }: { seed: number }) {
  const drift = (seed % 5) * 6;
  return (
    <svg
      className="absolute inset-0 size-full"
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern id="weave" width="3" height="3" patternUnits="userSpaceOnUse">
          <rect width="3" height="3" fill="var(--bg-primary)" />
          <rect width="1.5" height="1.5" fill="var(--season-deep)" fillOpacity="0.12" />
          <rect x="1.5" y="1.5" width="1.5" height="1.5" fill="var(--season-deep)" fillOpacity="0.12" />
        </pattern>
        <linearGradient id="fadeUp" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--season-deep)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--season-deep)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#weave)" />
      <rect width="800" height="600" fill="url(#fadeUp)" />

      {/* Border stripes */}
      <g fill="none" stroke="var(--season-gold)" strokeWidth="2" opacity="0.85">
        <line x1="0" y1="60" x2="800" y2="60" />
        <line x1="0" y1="540" x2="800" y2="540" />
      </g>
      <g fill="none" stroke="var(--season-deep)" strokeWidth="1" opacity="0.5">
        <line x1="0" y1="74" x2="800" y2="74" />
        <line x1="0" y1="526" x2="800" y2="526" />
      </g>

      {/* Big booteh (paisley) */}
      <g transform={`translate(${260 + drift} 300)`}>
        <path
          d="M0 -120 C 70 -110, 120 -50, 110 30 C 100 110, 30 140, -10 130 C -60 116, -90 60, -80 -10 C -70 -78, -40 -110, 0 -120 Z"
          fill="none"
          stroke="var(--season-gold)"
          strokeWidth="2.2"
          opacity="0.95"
        />
        <path
          d="M0 -90 C 50 -82, 90 -38, 82 22 C 74 80, 22 100, -8 92 C -44 82, -66 42, -58 -8 C -50 -58, -28 -82, 0 -90 Z"
          fill="none"
          stroke="var(--season-deep)"
          strokeWidth="1.4"
          opacity="0.75"
        />
        <path
          d="M0 -55 C 32 -50, 56 -22, 50 14 C 44 50, 14 60, -2 56 C -28 50, -42 26, -36 -4 C -30 -36, -16 -50, 0 -55 Z"
          fill="var(--season-gold)"
          opacity="0.45"
        />
        <circle r="8" fill="var(--season-gold)" opacity="0.85" />
      </g>

      {/* Smaller booteh */}
      <g transform="translate(560 360) scale(0.55)" opacity="0.6">
        <path
          d="M0 -120 C 70 -110, 120 -50, 110 30 C 100 110, 30 140, -10 130 C -60 116, -90 60, -80 -10 C -70 -78, -40 -110, 0 -120 Z"
          fill="none"
          stroke="var(--season-deep)"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}

/** Papier-mâché: a lacquered surface with floral cartouche. */
function PapierMacheArt({ seed }: { seed: number }) {
  return (
    <svg
      className="absolute inset-0 size-full"
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="lacquer" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="var(--season-gold-soft)" />
          <stop offset="100%" stopColor="var(--season-deep)" stopOpacity="0.18" />
        </radialGradient>
      </defs>
      <rect width="800" height="600" fill="url(#lacquer)" />

      {/* Cartouche */}
      <g transform="translate(400 300)">
        <path
          d="M -240 0 Q -240 -160 0 -160 Q 240 -160 240 0 Q 240 160 0 160 Q -240 160 -240 0 Z"
          fill="none"
          stroke="var(--season-gold)"
          strokeWidth="2"
          opacity="0.85"
        />
        {/* Floral spray */}
        <g transform="translate(-90 30) rotate(-15)" stroke="var(--season-deep)" strokeWidth="1.4" fill="none" opacity="0.85">
          <path d="M0 0 C 30 -40, 80 -55, 130 -45" />
          <circle cx="20" cy="-22" r="10" fill="var(--season-gold)" opacity="0.6" />
          <circle cx="60" cy="-44" r="14" fill="var(--season-gold)" opacity="0.7" />
          <circle cx="110" cy="-50" r="9" fill="var(--season-gold)" opacity="0.55" />
          <path d="M30 6 Q 36 -10 50 -14" />
          <path d="M70 -8 Q 76 -20 88 -22" />
        </g>
        <g transform={`translate(${(seed % 5) * 6 + 60} -10) rotate(170)`} stroke="var(--season-deep)" strokeWidth="1.4" fill="none" opacity="0.8">
          <path d="M0 0 C 30 -40, 80 -55, 130 -45" />
          <circle cx="20" cy="-22" r="8" fill="var(--season-gold)" opacity="0.55" />
          <circle cx="60" cy="-44" r="12" fill="var(--season-gold)" opacity="0.65" />
        </g>
      </g>
    </svg>
  );
}

/** Kani shawl: bold geometric talim cells + paisley bands. */
function KaniArt({ seed }: { seed: number }) {
  return (
    <svg
      className="absolute inset-0 size-full"
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern id="kani-cells" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="var(--bg-primary)" />
          <rect width="20" height="20" fill="var(--season-deep)" fillOpacity="0.06" />
          <rect x="9" y="0" width="2" height="20" fill="var(--season-deep)" fillOpacity="0.18" />
          <rect x="0" y="9" width="20" height="2" fill="var(--season-deep)" fillOpacity="0.14" />
        </pattern>
      </defs>
      <rect width="800" height="600" fill="url(#kani-cells)" />
      {/* Three booteh in a row */}
      {[200, 400, 600].map((cx, i) => (
        <g key={cx} transform={`translate(${cx} 320) scale(${0.7 + (i + seed) % 2 * 0.05})`} opacity="0.9">
          <path
            d="M0 -90 C 50 -82, 90 -38, 82 22 C 74 80, 22 100, -8 92 C -44 82, -66 42, -58 -8 C -50 -58, -28 -82, 0 -90 Z"
            fill="none"
            stroke="var(--season-gold)"
            strokeWidth="2"
          />
          <path
            d="M0 -55 C 32 -50, 56 -22, 50 14 C 44 50, 14 60, -2 56 C -28 50, -42 26, -36 -4 C -30 -36, -16 -50, 0 -55 Z"
            fill="var(--season-gold)"
            opacity="0.4"
          />
        </g>
      ))}
      {/* Top + bottom borders */}
      <g fill="none" stroke="var(--season-gold)" strokeWidth="2" opacity="0.9">
        <line x1="0" y1="60" x2="800" y2="60" />
        <line x1="0" y1="540" x2="800" y2="540" />
      </g>
    </svg>
  );
}

/** Khatamband: hexagonal interlocking geometry. */
function KhatambandArt({ seed }: { seed: number }) {
  return (
    <svg
      className="absolute inset-0 size-full"
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern id="hex" width="60" height="52" patternUnits="userSpaceOnUse" patternTransform={`translate(${(seed % 6) * 5} 0)`}>
          <polygon
            points="30,2 58,16 58,40 30,52 2,40 2,16"
            fill="none"
            stroke="var(--season-deep)"
            strokeOpacity="0.45"
            strokeWidth="1.2"
          />
          <polygon
            points="30,16 44,24 44,38 30,46 16,38 16,24"
            fill="var(--season-gold)"
            fillOpacity="0.18"
          />
        </pattern>
      </defs>
      <rect width="800" height="600" fill="url(#hex)" />
      {/* Talim glaze on top */}
      <TalimTexture
        className="absolute inset-0 size-full mix-blend-multiply"
        opacity={0.15}
      />
    </svg>
  );
}

/* -------------------------- helpers ------------------------------------ */

function pieceIdSeed(pieceId: string): number {
  let h = 0;
  for (let i = 0; i < pieceId.length; i++) {
    h = (h * 31 + pieceId.charCodeAt(i)) >>> 0;
  }
  return h;
}
