import * as React from "react";

import type { Craft } from "@/lib/seasons";

/* -------------------------------------------------------------------------
 * <BannerArt />
 *
 * The full-width immersive banner background. Per the brief, this is
 * a rich, textured image of the craft *material* — not the artisan's
 * face — colour-graded to the craft's seasonal palette.
 *
 * Built as inline SVG so it stays sharp at any width and respects the
 * seasonal CSS variables set by the wrapping <CraftColorProvider>.
 *
 * Two variants for the demo:
 *   carpet   – dense field of tilted knot heads (like looking at the
 *              loom an inch from the pile)
 *   pashmina – parallel curving warp threads under tension, with a
 *              talim-style colour band running through
 *
 * Other crafts fall through to a neutral seasonal weft.
 * ----------------------------------------------------------------------- */

interface BannerArtProps {
  craft: Craft;
  className?: string;
}

export function BannerArt({ craft, className }: BannerArtProps) {
  return (
    <svg
      role="presentation"
      aria-hidden="true"
      viewBox="0 0 1600 420"
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <defs>
        {/* Warm seasonal field — base */}
        <linearGradient id="banner-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--season-deep)" />
          <stop offset="60%" stopColor="var(--season-mid)" />
          <stop offset="100%" stopColor="var(--season-deep)" />
        </linearGradient>
        {/* Vignette that fades the bottom into bg-primary */}
        <linearGradient id="banner-fade-bottom" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--bg-primary)" stopOpacity="0.92" />
          <stop offset="35%" stopColor="var(--bg-primary)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--bg-primary)" stopOpacity="0" />
        </linearGradient>
        {/* Left dark gradient — keeps the headline legible */}
        <linearGradient id="banner-fade-left" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0f0a07" stopOpacity="0.78" />
          <stop offset="55%" stopColor="#0f0a07" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0f0a07" stopOpacity="0" />
        </linearGradient>
        {/* Soft highlight from upper-right */}
        <radialGradient id="banner-glow" cx="0.78" cy="0.2" r="0.65">
          <stop offset="0%" stopColor="var(--season-gold)" stopOpacity="0.35" />
          <stop offset="60%" stopColor="var(--season-gold)" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1600" height="420" fill="url(#banner-bg)" />

      {craft === "carpet" ? <CarpetField /> : null}
      {craft === "pashmina" ? <PashminaWarp /> : null}
      {craft !== "carpet" && craft !== "pashmina" ? <NeutralWeft /> : null}

      <rect width="1600" height="420" fill="url(#banner-glow)" />
      <rect width="1600" height="420" fill="url(#banner-fade-left)" />
      <rect width="1600" height="420" fill="url(#banner-fade-bottom)" />
    </svg>
  );
}

/* -- Variants ----------------------------------------------------------- */

/** Dense field of knot heads — ~26 cols × ~14 rows, slightly tilted, with
 *  a few bright saffron knots scattered through. Looks like a close-up
 *  of the loom an inch from the pile. */
function CarpetField() {
  const cols = 32;
  const rows = 16;
  const cellW = 1600 / cols;
  const cellH = 420 / rows;
  const dots: React.ReactNode[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = c * cellW + cellW / 2 + ((r % 2) * cellW) / 2;
      const cy = r * cellH + cellH / 2;
      // Pseudo-random brightness, deterministic by seed
      const seed = (r * 31 + c * 17) % 100;
      const isHi = seed < 6;
      const isMid = seed >= 6 && seed < 22;

      const fill = isHi
        ? "var(--season-gold)"
        : isMid
          ? "var(--season-light)"
          : "var(--season-deep)";
      const opacity = isHi ? 0.95 : isMid ? 0.55 : 0.7;

      dots.push(
        <ellipse
          key={`d-${r}-${c}`}
          cx={cx}
          cy={cy}
          rx={cellW * 0.36}
          ry={cellH * 0.28}
          fill={fill}
          opacity={opacity}
          transform={`rotate(${(seed % 11) - 5} ${cx} ${cy})`}
        />,
      );
    }
  }

  return (
    <g transform="translate(0, -10) rotate(-2 800 210)" opacity="0.85">
      {dots}
      {/* A few bright "surfaced" knots */}
      {[
        [320, 110, 6],
        [780, 200, 7],
        [1180, 140, 5],
        [560, 300, 6],
        [1320, 290, 5],
      ].map(([x, y, r], i) => (
        <g key={`hi-${i}`}>
          <circle cx={x} cy={y} r={(r as number) + 6} fill="var(--season-gold)" opacity="0.18" />
          <circle cx={x} cy={y} r={r as number} fill="var(--season-gold)" />
          <circle cx={x} cy={y} r={(r as number) * 0.4} fill="#1a1410" opacity="0.6" />
        </g>
      ))}
    </g>
  );
}

/** Parallel curving warp threads under tension, with a talim colour
 *  band crossing horizontally — Pashmina close-up. */
function PashminaWarp() {
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < 110; i++) {
    const x = i * 15 - 30;
    const sway = Math.sin(i * 0.5) * 4;
    const opacity = 0.25 + ((i * 7) % 10) * 0.06;
    lines.push(
      <path
        key={`warp-${i}`}
        d={`M ${x} -20 Q ${x + sway} 210, ${x + sway / 2} 460`}
        stroke="var(--season-light)"
        strokeWidth={i % 7 === 0 ? 1.4 : 0.7}
        strokeOpacity={opacity}
        fill="none"
      />,
    );
  }

  // Talim colour band — small squares of varying season tones across
  // a single horizontal stripe
  const band: React.ReactNode[] = [];
  for (let c = 0; c < 200; c++) {
    const tones = [
      "var(--season-gold)",
      "var(--season-deep)",
      "var(--season-mid)",
      "var(--season-light)",
      "var(--season-accent)",
    ];
    const tone = tones[(c * 13) % tones.length];
    band.push(
      <rect
        key={`tb-${c}`}
        x={c * 8}
        y={232}
        width={6}
        height={6}
        fill={tone}
        opacity={0.7}
      />,
    );
  }

  return (
    <g>
      {lines}
      {band}
      {/* Subtle horizontal weft strokes */}
      <path
        d="M -50 120 C 400 100, 1000 140, 1700 120"
        stroke="var(--season-gold)"
        strokeWidth="1.2"
        opacity="0.55"
        fill="none"
      />
      <path
        d="M -50 320 C 400 300, 1000 340, 1700 320"
        stroke="var(--season-gold)"
        strokeWidth="0.9"
        opacity="0.45"
        fill="none"
      />
    </g>
  );
}

/** Neutral fallback for crafts we haven't designed art for yet. */
function NeutralWeft() {
  const strokes: React.ReactNode[] = [];
  for (let i = 0; i < 70; i++) {
    const y = i * 7;
    strokes.push(
      <line
        key={`n-${i}`}
        x1="0"
        y1={y}
        x2="1600"
        y2={y + 6}
        stroke="var(--season-light)"
        strokeWidth="0.6"
        strokeOpacity={0.18 + ((i * 3) % 7) * 0.03}
      />,
    );
  }
  return <g>{strokes}</g>;
}
