import * as React from "react";

/* -------------------------------------------------------------------------
 * <HeroArt />
 *
 * Spec: "a stylized abstract of Pashmina fiber — warm, textured,
 * full-bleed on that half. Subtle vignette fade into the dark
 * background."
 *
 * Built as inline SVG so it stays sharp at any size, costs zero
 * network requests, and renders identically to a printed plate. The
 * piece evokes raw wool — a dense weft of warm threads pulled tight,
 * crossed by a few brighter saffron strands, a knot or two surfacing
 * from the weave, and a vignette fading to walnut along the bottom and
 * left to make the hero text legible.
 * ----------------------------------------------------------------------- */

export function HeroArt({ className }: { className?: string }) {
  return (
    <svg
      role="presentation"
      aria-hidden="true"
      viewBox="0 0 600 700"
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <defs>
        {/* Warm wool gradient: rust → walnut */}
        <linearGradient id="hero-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a2316" />
          <stop offset="55%" stopColor="#241612" />
          <stop offset="100%" stopColor="#150d09" />
        </linearGradient>

        {/* Glow for the saffron threads */}
        <radialGradient id="hero-glow" cx="0.65" cy="0.4" r="0.65">
          <stop offset="0%" stopColor="#d4a017" stopOpacity="0.32" />
          <stop offset="60%" stopColor="#c8975a" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>

        {/* Vignette: fades art into walnut at bottom and at the left
            edge (the side that meets the headline text). */}
        <linearGradient id="hero-fade-left" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1a1410" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#1a1410" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#1a1410" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hero-fade-bottom" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#1a1410" stopOpacity="1" />
          <stop offset="40%" stopColor="#1a1410" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#1a1410" stopOpacity="0" />
        </linearGradient>

        {/* Single fiber strand template — varied by stroke width and
            position when used. */}
        <pattern
          id="weft"
          x="0"
          y="0"
          width="6"
          height="700"
          patternUnits="userSpaceOnUse"
        >
          <line
            x1="3"
            y1="0"
            x2="3"
            y2="700"
            stroke="#5a3a22"
            strokeOpacity="0.4"
            strokeWidth="0.6"
          />
        </pattern>
      </defs>

      {/* Background ground */}
      <rect width="600" height="700" fill="url(#hero-bg)" />

      {/* Densely packed vertical wool weft */}
      <rect
        width="600"
        height="700"
        fill="url(#weft)"
        opacity="0.85"
      />

      {/* A second, slightly tilted layer of weft for depth */}
      <g
        transform="translate(0, 0) rotate(-6 300 350)"
        opacity="0.55"
      >
        {Array.from({ length: 90 }).map((_, i) => (
          <line
            key={i}
            x1={-50 + i * 8}
            y1={-80}
            x2={-50 + i * 8}
            y2={780}
            stroke="#7a4f30"
            strokeWidth="0.7"
            strokeOpacity={0.35 + (i % 5) * 0.08}
          />
        ))}
      </g>

      {/* Curving saffron strands — the focal warm thread */}
      <g
        fill="none"
        strokeLinecap="round"
        opacity="0.95"
      >
        <path
          d="M-20 220 C 120 180, 260 240, 400 200 S 620 220, 640 210"
          stroke="#d4a017"
          strokeWidth="1.6"
          opacity="0.85"
        />
        <path
          d="M-20 270 C 140 240, 280 290, 420 260 S 620 270, 640 268"
          stroke="#c8975a"
          strokeWidth="1.2"
          opacity="0.75"
        />
        <path
          d="M-20 340 C 100 320, 260 360, 380 320 S 620 350, 640 340"
          stroke="#e8c48a"
          strokeWidth="0.9"
          opacity="0.6"
        />
        <path
          d="M-20 430 C 120 410, 280 460, 420 420 S 620 430, 640 428"
          stroke="#9b4a1a"
          strokeWidth="1.4"
          opacity="0.55"
        />
        <path
          d="M-20 520 C 140 500, 260 540, 400 510 S 620 520, 640 518"
          stroke="#c8975a"
          strokeWidth="1"
          opacity="0.5"
        />
      </g>

      {/* Glow lighting the threads from upper-right */}
      <rect width="600" height="700" fill="url(#hero-glow)" />

      {/* Surfaced knots — a few bright nodes, like emerging fibre ends */}
      <g>
        {[
          [180, 230, 4, 0.85],
          [380, 280, 3, 0.7],
          [240, 360, 2.4, 0.6],
          [460, 410, 3.4, 0.75],
          [320, 470, 2.2, 0.5],
          [200, 510, 3, 0.55],
        ].map(([cx, cy, r, op], i) => (
          <g key={i} opacity={op as number}>
            <circle cx={cx as number} cy={cy as number} r={(r as number) + 4} fill="#d4a017" opacity="0.12" />
            <circle cx={cx as number} cy={cy as number} r={r as number} fill="#e8c48a" />
            <circle cx={cx as number} cy={cy as number} r={(r as number) * 0.5} fill="#1a1410" opacity="0.5" />
          </g>
        ))}
      </g>

      {/* Hashia dotted band running through middle — a thread of pattern
          inside the abstract weft, hinting at the woven motif system */}
      <g opacity="0.5">
        <line x1="0" y1="595" x2="600" y2="595" stroke="#c8975a" strokeWidth="0.4" />
        {Array.from({ length: 30 }).map((_, i) => (
          <circle
            key={i}
            cx={20 + i * 20}
            cy={595}
            r="1.2"
            fill="#c8975a"
          />
        ))}
        <line x1="0" y1="610" x2="600" y2="610" stroke="#c8975a" strokeWidth="0.4" />
      </g>

      {/* Vignettes: bottom + left fade into walnut so hero text reads */}
      <rect width="600" height="700" fill="url(#hero-fade-left)" />
      <rect width="600" height="700" fill="url(#hero-fade-bottom)" />
    </svg>
  );
}
