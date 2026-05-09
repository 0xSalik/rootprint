import * as React from "react";

/* -------------------------------------------------------------------------
 * <BazaarArch />
 *
 * A carved wooden Mughal-Kashmiri ogee arch, drawn entirely as inline
 * SVG. This is the visual signature of /bazaar — the page literally
 * "sits inside" the arch.
 *
 *   ┌─────────────────────────────────────┐
 *   │      ✦                              │
 *   │     /\         carved cusped       │
 *   │    /  \        multi-foil          │
 *   │   /    \       arch frame          │
 *   │  ┃      ┃                          │
 *   │  ┃      ┃   <- carved column       │
 *   │  ┃      ┃                          │
 *   │  ┃      ┃                          │
 *   │ ━━━━━━━━━━━ <- floor / threshold   │
 *   └─────────────────────────────────────┘
 *
 * It is *transparent inside* — the page content shows through the
 * opening. Exposed via three layers:
 *
 *   • ArchFrame    — the carved wooden outline + columns + spandrels
 *   • ArchOpening  — the inner cusped path (used as a CSS clip-path
 *                    if you ever want to mask content into the shape)
 *   • A radial inner glow that suggests warm market light inside
 *
 * All strokes & fills resolve from CSS variables so the arch can be
 * re-painted by simply wrapping it in a different theme class.
 * ----------------------------------------------------------------------- */

interface BazaarArchProps {
  className?: string;
  /** Stroke colour for carved details. Defaults to gold-light. */
  carve?: string;
  /** The inner-glow tint (the "warm light inside the arch"). */
  glow?: string;
}

export function BazaarArch({
  className,
  carve = "var(--gold-light)",
  glow = "var(--autumn-gold)",
}: BazaarArchProps) {
  const id = React.useId();
  const glowId = `arch-glow-${id}`;
  const ribbingId = `arch-ribbing-${id}`;
  const lampId = `arch-lamp-${id}`;
  return (
    <svg
      role="presentation"
      aria-hidden="true"
      viewBox="0 0 800 920"
      preserveAspectRatio="xMidYMax meet"
      className={className}
    >
      <defs>
        {/* Warm interior glow — the bazaar lit from within */}
        <radialGradient id={glowId} cx="50%" cy="62%" r="55%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.42" />
          <stop offset="55%" stopColor={glow} stopOpacity="0.12" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        {/* Diagonal ribbing on the columns — woven cane texture */}
        <pattern
          id={ribbingId}
          x="0"
          y="0"
          width="6"
          height="10"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-18)"
        >
          <line x1="0" y1="0" x2="0" y2="10" stroke={carve} strokeWidth="0.6" opacity="0.55" />
        </pattern>
        {/* Hanging lamp glow */}
        <radialGradient id={lampId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.95" />
          <stop offset="60%" stopColor={glow} stopOpacity="0.35" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>

        {/* Re-usable inner arch opening, used as the glow clip + as
            the inner stroke. */}
        <path
          id={`opening-${id}`}
          d={INNER_OPENING_PATH}
          fill="none"
        />
      </defs>

      {/* Floor / threshold */}
      <line x1="60" y1="838" x2="740" y2="838" stroke={carve} strokeWidth="1.2" opacity="0.7" />
      <line x1="80" y1="848" x2="720" y2="848" stroke={carve} strokeWidth="0.7" opacity="0.45" />
      {/* Decorative dots along the floor */}
      {Array.from({ length: 23 }).map((_, i) => (
        <circle
          key={i}
          cx={120 + i * 26}
          cy={858}
          r={1.1}
          fill={carve}
          opacity="0.55"
        />
      ))}

      {/* Inner glow filling the opening */}
      <path d={INNER_OPENING_PATH} fill={`url(#${glowId})`} />

      {/* Carved wooden frame around the arch. The OUTER frame is a
          rounded-corner rectangle; the INNER opening is the cusped
          ogee. We composite via even-odd fill on a single path so
          the carved frame appears solid even in dark contexts. */}
      <path
        d={`${OUTER_FRAME_PATH} ${INNER_OPENING_PATH}`}
        fill="rgba(34, 22, 14, 0.55)"
        fillRule="evenodd"
        stroke={carve}
        strokeWidth="0.9"
        opacity="0.92"
      />
      {/* A second, finer carved line tracing the inside of the opening */}
      <path
        d={INNER_OPENING_PATH}
        fill="none"
        stroke={carve}
        strokeWidth="1.4"
        opacity="0.85"
      />
      {/* And a hairline trace just inside that, for the carved bevel feel */}
      <path
        d={INNER_OPENING_PATH}
        fill="none"
        stroke={carve}
        strokeWidth="0.5"
        opacity="0.45"
        transform="translate(0,3) scale(0.995, 0.995)"
        transform-origin="center"
      />

      {/* ─── Columns (carved cane texture under the spring line) ─── */}
      {/* left column ribbing */}
      <rect
        x="180"
        y="600"
        width="60"
        height="220"
        fill={`url(#${ribbingId})`}
        opacity="0.7"
      />
      {/* right column ribbing */}
      <rect
        x="560"
        y="600"
        width="60"
        height="220"
        fill={`url(#${ribbingId})`}
        opacity="0.7"
      />
      {/* Column capitals & bases (small carved bands) */}
      {[
        { x: 180, w: 60 },
        { x: 560, w: 60 },
      ].map((col) => (
        <g key={col.x}>
          {/* Capital */}
          <rect x={col.x - 6} y={585} width={col.w + 12} height={10} fill={carve} opacity="0.7" />
          <rect x={col.x - 10} y={595} width={col.w + 20} height={4} fill={carve} opacity="0.45" />
          {/* Base */}
          <rect x={col.x - 6} y={822} width={col.w + 12} height={6} fill={carve} opacity="0.55" />
          <rect x={col.x - 10} y={828} width={col.w + 20} height={4} fill={carve} opacity="0.7" />
        </g>
      ))}

      {/* ─── Spandrels (upper corner arabesques) ─── */}
      <g opacity="0.55">
        <SpandrelArabesque carve={carve} corner="tl" />
        <SpandrelArabesque carve={carve} corner="tr" />
      </g>

      {/* ─── Crown / finial above the apex ─── */}
      <g transform="translate(400 0)">
        <line x1="0" y1="38" x2="0" y2="14" stroke={carve} strokeWidth="0.9" opacity="0.7" />
        <circle cx="0" cy="10" r="5" fill={carve} opacity="0.85" />
        <path
          d="M -22 36 Q 0 24 22 36 Q 14 50 0 50 Q -14 50 -22 36 Z"
          fill={carve}
          opacity="0.45"
        />
        <path
          d="M -16 38 Q 0 30 16 38 Q 10 48 0 48 Q -10 48 -16 38 Z"
          fill="none"
          stroke={carve}
          strokeWidth="0.6"
          opacity="0.7"
        />
      </g>

      {/* ─── Hanging lamp (small, tucked under the apex inside) ─── */}
      <g transform="translate(400 220)">
        <line x1="0" y1="-118" x2="0" y2="-22" stroke={carve} strokeWidth="0.6" opacity="0.45" />
        <circle r="36" fill={`url(#${lampId})`} />
        <circle r="9" fill={glow} opacity="0.85" />
        <circle r="9" fill="none" stroke={carve} strokeWidth="0.5" opacity="0.7" />
        {/* tassel */}
        <line x1="0" y1="9" x2="0" y2="22" stroke={carve} strokeWidth="0.7" opacity="0.7" />
        <circle cx="0" cy="24" r="1.6" fill={carve} opacity="0.8" />
      </g>

      {/* ─── Cusped trim along the opening ─── */}
      {CUSP_DOTS.map((d, i) => (
        <circle
          key={i}
          cx={d[0]}
          cy={d[1]}
          r="2"
          fill={carve}
          opacity="0.85"
        />
      ))}
    </svg>
  );
}

/* -------------------------------------------------------------------- */
/*  Path strings — kept at module scope so they can be re-used by the   */
/*  hero component as a CSS clip-path if needed.                         */
/* -------------------------------------------------------------------- */

/** The outer carved-wood frame: rounded rectangle, 60px from edges,
 *  going clockwise. */
const OUTER_FRAME_PATH = `
  M 60 838
  L 60 110
  Q 60 60 110 60
  L 690 60
  Q 740 60 740 110
  L 740 838
  Z
`;

/** The inner cusped opening — a 5-lobe foliated arch with two
 *  vertical column shafts. Drawn clockwise so even-odd fill carves
 *  this shape *out* of the outer frame. */
const INNER_OPENING_PATH = `
  M 240 820
  L 240 320
  C 240 268, 264 232, 304 224
  C 322 220, 338 232, 348 208
  C 360 178, 376 132, 400 92
  C 424 132, 440 178, 452 208
  C 462 232, 478 220, 496 224
  C 536 232, 560 268, 560 320
  L 560 820
  Z
`;

/** Sample points along the inner opening where we drop small studded
 *  dots — these read as "carved cusps" along the arch profile. */
const CUSP_DOTS: Array<[number, number]> = [
  [304, 220],
  [338, 218],
  [378, 168],
  [400, 96],
  [422, 168],
  [462, 218],
  [496, 220],
  [240, 280],
  [240, 380],
  [240, 480],
  [240, 580],
  [560, 280],
  [560, 380],
  [560, 480],
  [560, 580],
];

/* -------------------------------------------------------------------- */

interface SpandrelProps {
  carve: string;
  corner: "tl" | "tr";
}

function SpandrelArabesque({ carve, corner }: SpandrelProps) {
  /* Thin arabesque vine in the upper corners of the frame, between
   * the rounded outer edge and the swooping arch. */
  const transform =
    corner === "tl"
      ? "translate(60, 60)"
      : "translate(740, 60) scale(-1, 1)";

  return (
    <g transform={transform} fill="none" stroke={carve} strokeWidth="0.7" strokeLinecap="round">
      <path d="M 22 18 C 90 10, 150 50, 168 130" opacity="0.7" />
      <path d="M 40 38 C 96 32, 140 60, 156 120" opacity="0.55" />
      {/* curling tendrils */}
      <path d="M 100 22 C 108 30, 96 38, 104 46 C 112 54, 100 62, 108 70" />
      <path d="M 140 50 C 150 60, 138 68, 148 76 C 158 84, 146 92, 156 100" />
      {/* small leaves */}
      <path d="M 70 16 q 6 -8 14 -2 q -2 8 -14 2 Z" fill={carve} opacity="0.65" stroke="none" />
      <path d="M 130 36 q 6 -8 14 -2 q -2 8 -14 2 Z" fill={carve} opacity="0.55" stroke="none" />
      <path d="M 168 84 q 6 -8 14 -2 q -2 8 -14 2 Z" fill={carve} opacity="0.55" stroke="none" />
    </g>
  );
}
