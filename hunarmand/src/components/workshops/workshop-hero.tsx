import * as React from "react";

import { type Craft } from "@/lib/seasons";
import { TalimTexture } from "@/components/motifs";

/* -------------------------------------------------------------------------
 * <WorkshopHero />
 *
 * Two related compositions in one file:
 *
 *   <WorkshopHero />     — large panoramic SVG used at the top of the
 *                          /workshop/[id] detail page (NOT a centered
 *                          stock-photo hero — the brief explicitly
 *                          forbids that). Shows the *material being
 *                          worked*, framed cinematically.
 *
 *   <WorkshopThumb />    — the smaller, taller (200px) crop used inside
 *                          the WorkshopCard on the discovery grid.
 *
 * Both compositions are pure SVG so we ship no images, the page is
 * fast everywhere, and the colours follow the active season.
 * ----------------------------------------------------------------------- */

interface ArtProps {
  craft: Craft;
  className?: string;
}

export function WorkshopHero({ craft, className }: ArtProps) {
  return (
    <figure
      className={`relative w-full overflow-hidden rounded-craft-lg border border-line ${className ?? ""}`}
      style={{
        aspectRatio: "16 / 7",
        background:
          "linear-gradient(155deg, var(--season-deep) 0%, var(--bg-dark) 75%)",
      }}
    >
      <TalimTexture color="var(--season-gold)" opacity={0.10} />

      {/* Per-craft composition */}
      {craft === "carpet" && <CarpetPanorama />}
      {craft === "pashmina" && <PashminaPanorama />}
      {craft === "kani" && <KaniPanorama />}
      {craft === "papier-mache" && <PapierMachePanorama />}
      {craft === "khatamband" && <KhatambandPanorama />}
      {/* Fallback for the other crafts in the type, in case more are
          added later — same warp/weft motif. */}
      {!["carpet", "pashmina", "kani", "papier-mache", "khatamband"].includes(
        craft as string,
      ) && <CarpetPanorama />}

      {/* Cinematic vignettes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-transparent" />
      </div>
    </figure>
  );
}

export function WorkshopThumb({ craft, className }: ArtProps) {
  return (
    <figure
      className={`relative w-full overflow-hidden ${className ?? ""}`}
      style={{
        height: 200,
        background:
          "linear-gradient(165deg, var(--season-mid) 0%, var(--season-deep) 80%)",
      }}
    >
      <TalimTexture color="var(--season-gold)" opacity={0.12} />
      {craft === "carpet" && <CarpetThumb />}
      {craft === "pashmina" && <PashminaThumb />}
      {craft === "kani" && <KaniThumb />}
      {craft === "papier-mache" && <PapierMacheThumb />}
      {craft === "khatamband" && <KhatambandThumb />}
      {!["carpet", "pashmina", "kani", "papier-mache", "khatamband"].includes(
        craft as string,
      ) && <CarpetThumb />}

      {/* Bottom shade so the title above the card edge stays legible
          if a child writes text on top of the image. */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />
    </figure>
  );
}

/* ============================ Carpet ============================== */

function CarpetPanorama() {
  return (
    <svg
      className="absolute inset-0 size-full"
      viewBox="0 0 1600 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* Vertical warp — close-up rope of threads */}
      <g stroke="var(--season-gold)" strokeOpacity="0.4" strokeWidth="0.9">
        {Array.from({ length: 90 }).map((_, i) => (
          <line key={i} x1={i * 18 + 6} y1="0" x2={i * 18 + 6} y2="700" />
        ))}
      </g>
      {/* Weft rows being beaten down */}
      <g stroke="var(--bg-primary)" strokeOpacity="0.18" strokeWidth="1.2">
        {Array.from({ length: 32 }).map((_, i) => (
          <line key={i} x1="0" y1={i * 22 + 50} x2="1600" y2={i * 22 + 50} />
        ))}
      </g>
      {/* A row of fresh knots — saffron + walnut */}
      <g>
        {Array.from({ length: 80 }).map((_, i) => (
          <rect
            key={i}
            x={i * 20 + 8}
            y={400 + ((i * 7) % 9)}
            width="14"
            height="22"
            fill={i % 3 === 0 ? "var(--season-gold)" : i % 3 === 1 ? "var(--brand)" : "var(--season-mid)"}
            opacity={0.85}
          />
        ))}
      </g>
      {/* A hand silhouette holding the knotting hook */}
      <g transform="translate(1100 360)">
        <path
          d="M0 0 C 30 -20, 90 -30, 160 -22 C 220 -16, 260 -2, 280 30 L 280 100 L 0 100 Z"
          fill="rgba(0,0,0,0.55)"
        />
        {/* Hook */}
        <path
          d="M 40 -8 L 80 -50 L 110 -55 L 90 -25 L 60 -2 Z"
          fill="rgba(0,0,0,0.7)"
        />
      </g>
      {/* Selvedge edge at right */}
      <g stroke="var(--season-gold)" strokeWidth="2.6" opacity="0.75">
        <line x1="1590" y1="0" x2="1590" y2="700" />
        <line x1="1572" y1="0" x2="1572" y2="700" strokeWidth="1.2" opacity="0.8" />
      </g>
    </svg>
  );
}

function CarpetThumb() {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g stroke="var(--season-gold)" strokeOpacity="0.32" strokeWidth="0.7">
        {Array.from({ length: 60 }).map((_, i) => (
          <line key={i} x1={i * 14 + 6} y1="0" x2={i * 14 + 6} y2="200" />
        ))}
      </g>
      <g>
        {Array.from({ length: 40 }).map((_, i) => (
          <rect
            key={i}
            x={i * 20 + 8}
            y={120 + ((i * 7) % 10)}
            width="14"
            height="22"
            fill={i % 3 === 0 ? "var(--season-gold)" : i % 3 === 1 ? "var(--brand)" : "var(--season-mid)"}
            opacity={0.8}
          />
        ))}
      </g>
    </svg>
  );
}

/* ============================ Pashmina ============================== */

function PashminaPanorama() {
  return (
    <svg
      className="absolute inset-0 size-full"
      viewBox="0 0 1600 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* Soft cloth gradient */}
      <defs>
        <linearGradient id="pash-cloth" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--season-mid)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--season-deep)" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <rect width="1600" height="700" fill="url(#pash-cloth)" />

      {/* Threads of pashm being spun — diagonal */}
      <g stroke="var(--season-gold)" strokeOpacity="0.55" strokeWidth="1.1">
        {Array.from({ length: 18 }).map((_, i) => (
          <path
            key={i}
            d={`M ${-100 + i * 100} 700 Q ${300 + i * 100} ${300 + ((i * 31) % 80)} ${700 + i * 100} 0`}
            fill="none"
          />
        ))}
      </g>

      {/* The yinder spool, lower right */}
      <g transform="translate(1180 420)">
        <ellipse cx="0" cy="0" rx="160" ry="42" fill="rgba(0,0,0,0.65)" />
        <ellipse cx="0" cy="-8" rx="160" ry="42" fill="none" stroke="var(--season-gold)" strokeWidth="2" opacity="0.7" />
        <ellipse cx="0" cy="0" rx="120" ry="32" fill="var(--season-gold)" opacity="0.25" />
        {/* Yarn spiraling */}
        <g stroke="var(--season-gold)" strokeWidth="0.8" fill="none" opacity="0.7">
          <ellipse cx="0" cy="-2" rx="148" ry="30" />
          <ellipse cx="0" cy="2" rx="142" ry="32" />
          <ellipse cx="0" cy="6" rx="138" ry="33" />
        </g>
      </g>

      {/* Selvedge stripe */}
      <g fill="none" stroke="var(--season-gold)" strokeWidth="2" opacity="0.7">
        <line x1="0" y1="84" x2="1600" y2="84" />
        <line x1="0" y1="616" x2="1600" y2="616" />
      </g>
    </svg>
  );
}

function PashminaThumb() {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g stroke="var(--season-gold)" strokeOpacity="0.55" strokeWidth="1">
        {Array.from({ length: 12 }).map((_, i) => (
          <path
            key={i}
            d={`M ${-80 + i * 90} 200 Q ${200 + i * 60} ${100 + ((i * 23) % 30)} ${500 + i * 40} 0`}
            fill="none"
          />
        ))}
      </g>
      <g fill="none" stroke="var(--season-gold)" strokeWidth="1.4" opacity="0.55">
        <line x1="0" y1="32" x2="800" y2="32" />
        <line x1="0" y1="168" x2="800" y2="168" />
      </g>
    </svg>
  );
}

/* ============================ Kani ============================== */

function KaniPanorama() {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Talim cell grid */}
      <defs>
        <pattern id="kani-grid" width="22" height="22" patternUnits="userSpaceOnUse">
          <rect width="22" height="22" fill="var(--bg-dark)" />
          <rect x="10" y="0" width="2" height="22" fill="var(--season-gold)" fillOpacity="0.18" />
          <rect x="0" y="10" width="22" height="2" fill="var(--season-gold)" fillOpacity="0.14" />
        </pattern>
      </defs>
      <rect width="1600" height="700" fill="url(#kani-grid)" />
      {/* Three booteh in a row */}
      {[400, 800, 1200].map((cx, i) => (
        <g key={cx} transform={`translate(${cx} 360) scale(${1.1 + (i % 2) * 0.1})`} opacity="0.85">
          <path
            d="M0 -120 C 70 -110, 120 -50, 110 30 C 100 110, 30 140, -10 130 C -60 116, -90 60, -80 -10 C -70 -78, -40 -110, 0 -120 Z"
            fill="none"
            stroke="var(--season-gold)"
            strokeWidth="2.6"
          />
          <path
            d="M0 -55 C 32 -50, 56 -22, 50 14 C 44 50, 14 60, -2 56 C -28 50, -42 26, -36 -4 C -30 -36, -16 -50, 0 -55 Z"
            fill="var(--season-gold)"
            opacity="0.5"
          />
        </g>
      ))}
    </svg>
  );
}

function KaniThumb() {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <pattern id="kani-grid-thumb" width="14" height="14" patternUnits="userSpaceOnUse">
          <rect width="14" height="14" fill="var(--season-deep)" />
          <rect x="6" y="0" width="2" height="14" fill="var(--season-gold)" fillOpacity="0.2" />
          <rect x="0" y="6" width="14" height="2" fill="var(--season-gold)" fillOpacity="0.16" />
        </pattern>
      </defs>
      <rect width="800" height="200" fill="url(#kani-grid-thumb)" />
      {[200, 400, 600].map((cx) => (
        <g key={cx} transform={`translate(${cx} 100) scale(0.7)`} opacity="0.85">
          <path
            d="M0 -90 C 50 -82, 90 -38, 82 22 C 74 80, 22 100, -8 92 C -44 82, -66 42, -58 -8 C -50 -58, -28 -82, 0 -90 Z"
            fill="none"
            stroke="var(--season-gold)"
            strokeWidth="2"
          />
        </g>
      ))}
    </svg>
  );
}

/* ============================ Papier-mache ============================== */

function PapierMachePanorama() {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="lacquer-pano" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="var(--season-mid)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--season-deep)" stopOpacity="0.1" />
        </radialGradient>
      </defs>
      <rect width="1600" height="700" fill="url(#lacquer-pano)" />
      {/* Brushwork strokes */}
      <g stroke="var(--season-gold)" strokeWidth="1.4" fill="none" opacity="0.85">
        <path d="M 80 540 Q 200 360, 360 380 Q 520 400, 600 320" />
        <path d="M 700 540 Q 820 380, 980 380 Q 1140 380, 1240 280" />
        <path d="M 1280 540 Q 1380 420, 1480 380 Q 1560 360, 1580 320" />
      </g>
      {/* Floral cluster */}
      <g transform="translate(820 360) rotate(-10)">
        <circle cx="0" cy="0" r="34" fill="var(--season-gold)" opacity="0.7" />
        <circle cx="-50" cy="-20" r="20" fill="var(--season-gold)" opacity="0.55" />
        <circle cx="48" cy="-20" r="22" fill="var(--season-gold)" opacity="0.55" />
        <circle cx="-30" cy="40" r="14" fill="var(--bg-primary)" opacity="0.6" />
        <circle cx="36" cy="40" r="14" fill="var(--bg-primary)" opacity="0.6" />
      </g>
    </svg>
  );
}

function PapierMacheThumb() {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g transform="translate(400 100)">
        <circle cx="0" cy="0" r="32" fill="var(--season-gold)" opacity="0.7" />
        <circle cx="-50" cy="-12" r="20" fill="var(--season-gold)" opacity="0.55" />
        <circle cx="50" cy="-12" r="20" fill="var(--season-gold)" opacity="0.55" />
        <circle cx="-30" cy="36" r="12" fill="var(--bg-primary)" opacity="0.6" />
        <circle cx="30" cy="36" r="12" fill="var(--bg-primary)" opacity="0.6" />
      </g>
    </svg>
  );
}

/* ============================ Khatamband ============================== */

function KhatambandPanorama() {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <pattern id="khatam-pano" width="60" height="52" patternUnits="userSpaceOnUse">
          <polygon
            points="30,2 58,16 58,40 30,52 2,40 2,16"
            fill="none"
            stroke="var(--season-gold)"
            strokeOpacity="0.45"
            strokeWidth="1.4"
          />
          <polygon
            points="30,16 44,24 44,38 30,46 16,38 16,24"
            fill="var(--season-gold)"
            fillOpacity="0.18"
          />
        </pattern>
      </defs>
      <rect width="1600" height="700" fill="url(#khatam-pano)" />
    </svg>
  );
}

function KhatambandThumb() {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <pattern id="khatam-thumb" width="38" height="34" patternUnits="userSpaceOnUse">
          <polygon points="19,1 37,10 37,25 19,33 1,25 1,10" fill="none" stroke="var(--season-gold)" strokeOpacity="0.45" strokeWidth="1.3" />
          <polygon points="19,10 28,15 28,23 19,28 10,23 10,15" fill="var(--season-gold)" fillOpacity="0.2" />
        </pattern>
      </defs>
      <rect width="800" height="200" fill="url(#khatam-thumb)" />
    </svg>
  );
}
