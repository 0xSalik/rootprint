import * as React from "react";

import type { Craft } from "@/lib/seasons";
import type { ProductRatio } from "@/lib/bazaar";

/* -------------------------------------------------------------------------
 * <ProductArt />
 *
 * Per-craft SVG illustrations that fill the product card's image area
 * in the masonry grid. Every variant is drawn entirely inline so:
 *
 *   1. There is no network round-trip per card.
 *   2. The drawing inherits the card's seasonal palette via
 *      `var(--season-*)` — a Carpet card under .theme-harud renders
 *      autumn; the same Carpet under .theme-grism would render lapis.
 *   3. The product card can ask for one of four aspect ratios
 *      (`tall | portrait | square | wide`) and the SVG re-flows so
 *      the masonry grid breathes, never feels uniform.
 *
 * Supported crafts: carpet · pashmina · kani · saffron · everything
 * else falls back to the generic textile rectangle.
 * ----------------------------------------------------------------------- */

interface ProductArtProps {
  craft: Craft;
  ratio: ProductRatio;
  className?: string;
}

const RATIO_DIMS: Record<ProductRatio, { w: number; h: number }> = {
  tall: { w: 240, h: 400 },
  portrait: { w: 320, h: 400 },
  square: { w: 320, h: 320 },
  wide: { w: 480, h: 300 },
};

export function ProductArt({ craft, ratio, className }: ProductArtProps) {
  const dims = RATIO_DIMS[ratio];
  return (
    <div
      className={className}
      style={{
        width: "100%",
        aspectRatio: `${dims.w} / ${dims.h}`,
      }}
    >
      <svg
        role="presentation"
        aria-hidden="true"
        viewBox={`0 0 ${dims.w} ${dims.h}`}
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full block"
      >
        {renderVariant(craft, dims)}
      </svg>
    </div>
  );
}

/* Switch on craft inline so we never construct a new component reference
 * during render — the variants are plain JSX-returning functions, not
 * components, which keeps the react-hooks/static-components rule happy. */
function renderVariant(craft: Craft, dims: { w: number; h: number }) {
  const args = { width: dims.w, height: dims.h };
  switch (craft) {
    case "carpet":
      return CarpetArt(args);
    case "pashmina":
      return PashminaArt(args);
    case "kani":
      return KaniArt(args);
    case "saffron":
      return SaffronJarArt(args);
    default:
      return TextileArt(args);
  }
}

/* ────────────────────────── helpers ────────────────────────── */

interface DimsProps {
  width: number;
  height: number;
}

function ArtBackground({ width, height, tint = "var(--season-light)" }: DimsProps & { tint?: string }) {
  return <rect x="0" y="0" width={width} height={height} fill={tint} />;
}

/** A repeating dotted-diamond hashia border, 12px tall. */
function ArtHashia({ width, y, color }: { width: number; y: number; color: string }) {
  const tile = 18;
  const count = Math.ceil(width / tile);
  return (
    <g transform={`translate(0 ${y})`}>
      <line x1="0" y1="0" x2={width} y2="0" stroke={color} strokeWidth="0.6" opacity="0.6" />
      {Array.from({ length: count }).map((_, i) => (
        <g key={i} transform={`translate(${i * tile} 0)`}>
          <path
            d={`M0 4 L${tile / 2} 1 L${tile} 4 L${tile / 2} 7 Z`}
            fill="none"
            stroke={color}
            strokeWidth="0.7"
          />
          <circle cx={tile / 2} cy={4} r={0.9} fill={color} />
        </g>
      ))}
      <line x1="0" y1="9" x2={width} y2="9" stroke={color} strokeWidth="0.4" opacity="0.5" />
    </g>
  );
}

/* ──────────────────────── carpet variant ──────────────────────── */

function CarpetArt({ width, height }: DimsProps) {
  const inset = 14;
  const w = width - inset * 2;
  const h = height - inset * 2;
  /* Central medallion is sized to the smaller axis */
  const med = Math.min(w, h) * 0.55;
  const cx = width / 2;
  const cy = height / 2;
  return (
    <g>
      <ArtBackground width={width} height={height} tint="var(--season-light)" />

      {/* Outer carpet field */}
      <rect
        x={inset}
        y={inset}
        width={w}
        height={h}
        fill="var(--season-deep)"
        stroke="var(--season-gold)"
        strokeWidth="1"
      />

      {/* Inner border field */}
      <rect
        x={inset + 8}
        y={inset + 8}
        width={w - 16}
        height={h - 16}
        fill="none"
        stroke="var(--season-gold)"
        strokeWidth="0.6"
      />
      {/* Hashia bands top + bottom */}
      <ArtHashia width={width} y={inset + 14} color="var(--season-gold)" />
      <ArtHashia width={width} y={height - inset - 22} color="var(--season-gold)" />

      {/* Field knots — a Talim grid in the body of the carpet */}
      <g opacity="0.32">
        {Array.from({ length: Math.floor(h / 14) - 4 }).map((_, row) =>
          Array.from({ length: Math.floor(w / 14) - 2 }).map((_, col) => (
            <circle
              key={`${row}-${col}`}
              cx={inset + 18 + col * 14}
              cy={inset + 36 + row * 14}
              r={0.9}
              fill="var(--season-gold)"
            />
          )),
        )}
      </g>

      {/* Central medallion */}
      <g transform={`translate(${cx} ${cy})`}>
        <Medallion size={med} />
      </g>

      {/* Corner motifs */}
      {[
        { x: inset + 28, y: inset + 36, rot: 0 },
        { x: width - inset - 28, y: inset + 36, rot: 90 },
        { x: width - inset - 28, y: height - inset - 36, rot: 180 },
        { x: inset + 28, y: height - inset - 36, rot: 270 },
      ].map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${c.rot})`}>
          <CornerLeaf />
        </g>
      ))}
    </g>
  );
}

function Medallion({ size }: { size: number }) {
  const r = size / 2;
  return (
    <g>
      {/* outer ring */}
      <circle r={r} fill="var(--season-mid)" stroke="var(--season-gold)" strokeWidth="0.8" />
      {/* lobed inner */}
      <path
        d={lobePath(r * 0.78, 8)}
        fill="var(--season-light)"
        stroke="var(--season-gold)"
        strokeWidth="0.7"
      />
      {/* inner star */}
      <path
        d={starPath(r * 0.42, 8)}
        fill="var(--season-deep)"
        stroke="var(--season-gold)"
        strokeWidth="0.5"
      />
      <circle r={r * 0.12} fill="var(--season-gold)" />
    </g>
  );
}

function CornerLeaf() {
  return (
    <g
      fill="none"
      stroke="var(--season-gold)"
      strokeWidth="0.7"
      strokeLinecap="round"
    >
      <path d="M0 0 q 8 -4 16 0 q -2 8 -16 0 Z" fill="var(--season-gold)" opacity="0.6" stroke="none" />
      <path d="M2 -2 q 12 -4 22 4" />
      <path d="M-2 2 q 12 4 22 -4" />
    </g>
  );
}

function lobePath(r: number, lobes: number): string {
  const pts: string[] = [];
  const step = (Math.PI * 2) / lobes;
  for (let i = 0; i < lobes; i++) {
    const a1 = i * step;
    const a2 = (i + 0.5) * step;
    const a3 = (i + 1) * step;
    const x1 = Math.cos(a1) * r;
    const y1 = Math.sin(a1) * r;
    const x2 = Math.cos(a2) * (r * 1.18);
    const y2 = Math.sin(a2) * (r * 1.18);
    const x3 = Math.cos(a3) * r;
    const y3 = Math.sin(a3) * r;
    if (i === 0) pts.push(`M ${x1.toFixed(1)} ${y1.toFixed(1)}`);
    pts.push(`Q ${x2.toFixed(1)} ${y2.toFixed(1)} ${x3.toFixed(1)} ${y3.toFixed(1)}`);
  }
  pts.push("Z");
  return pts.join(" ");
}

function starPath(r: number, points: number): string {
  const inner = r * 0.45;
  const step = Math.PI / points;
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = i * step - Math.PI / 2;
    const rad = i % 2 === 0 ? r : inner;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  pts.push("Z");
  return pts.join(" ");
}

/* ──────────────────────── pashmina variant ──────────────────────── */

function PashminaArt({ width, height }: DimsProps) {
  return (
    <g>
      <ArtBackground width={width} height={height} tint="var(--season-light)" />
      {/* Soft draped folds suggested by gradient stripes */}
      <defs>
        <linearGradient id="psh-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--season-mid)" stopOpacity="0.85" />
          <stop offset="50%" stopColor="var(--season-mid)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--season-deep)" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={width} height={height} fill="url(#psh-grad)" />
      {/* Subtle weft lines (the warp tension story) */}
      <g opacity="0.18" stroke="var(--season-gold)" strokeWidth="0.5">
        {Array.from({ length: Math.ceil(height / 4) }).map((_, i) => (
          <line key={i} x1="0" y1={i * 4} x2={width} y2={i * 4 + 6} />
        ))}
      </g>
      {/* Embroidered border at top + bottom */}
      <ArtHashia width={width} y={20} color="var(--season-gold)" />
      <ArtHashia width={width} y={height - 32} color="var(--season-gold)" />

      {/* A row of small sozni floral motifs running down the centre */}
      <g opacity="0.7" transform={`translate(${width / 2} 0)`}>
        {Array.from({ length: Math.floor((height - 80) / 56) }).map((_, i) => (
          <g key={i} transform={`translate(0 ${56 + i * 56})`}>
            <SozniFlower />
          </g>
        ))}
      </g>

      {/* Fringe at the bottom */}
      <g stroke="var(--season-gold)" strokeWidth="0.8" opacity="0.85">
        {Array.from({ length: Math.floor(width / 8) }).map((_, i) => (
          <line
            key={i}
            x1={i * 8 + 4}
            y1={height - 18}
            x2={i * 8 + 4 + (i % 2 === 0 ? 0.5 : -0.5)}
            y2={height - 4}
          />
        ))}
      </g>
    </g>
  );
}

function SozniFlower() {
  return (
    <g
      stroke="var(--season-gold)"
      strokeWidth="0.7"
      strokeLinecap="round"
      fill="none"
    >
      <circle r="2.4" fill="var(--season-gold)" stroke="none" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <g key={deg} transform={`rotate(${deg})`}>
          <path d="M0 -2.4 q 2 -3 0 -8 q -2 5 0 8 Z" fill="var(--season-gold)" opacity="0.55" stroke="none" />
        </g>
      ))}
    </g>
  );
}

/* ────────────────────────── kani variant ────────────────────────── */

function KaniArt({ width, height }: DimsProps) {
  /* Kani is woven in coloured wood-bobbin blocks. We draw a grid of
     small coloured tiles using the season palette + warm rouge to
     suggest the multi-bobbin technique. */
  const cell = 12;
  const cols = Math.floor(width / cell);
  const rows = Math.floor(height / cell);
  const palette = [
    "var(--season-deep)",
    "var(--season-mid)",
    "var(--season-gold)",
    "var(--brand)",
    "var(--season-accent)",
    "var(--season-light)",
  ];
  return (
    <g>
      <rect x="0" y="0" width={width} height={height} fill="var(--season-deep)" />
      {/* tile field */}
      <g>
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => {
            /* Pseudo-deterministic palette pick — same input → same colour
               so SSR matches client. */
            const i = (r * 31 + c * 17 + r * c) % palette.length;
            const isMotif = ((r + c) % 5 === 0) || (r % 7 === 3 && c % 6 === 2);
            const isHashia = r === 1 || r === rows - 2;
            const fill = isHashia
              ? "var(--season-gold)"
              : isMotif
                ? palette[(i + 2) % palette.length]
                : palette[i];
            return (
              <rect
                key={`${r}-${c}`}
                x={c * cell}
                y={r * cell}
                width={cell - 0.6}
                height={cell - 0.6}
                fill={fill}
                opacity={isHashia ? 1 : 0.8}
              />
            );
          }),
        )}
      </g>
      {/* Soft overlay weft */}
      <g opacity="0.18" stroke="var(--season-light)" strokeWidth="0.4">
        {Array.from({ length: rows }).map((_, r) => (
          <line key={r} x1="0" y1={r * cell + cell / 2} x2={width} y2={r * cell + cell / 2} />
        ))}
      </g>
      {/* Hashia top + bottom edge marks */}
      <line x1="0" y1="6" x2={width} y2="6" stroke="var(--season-gold)" strokeWidth="0.8" />
      <line x1="0" y1={height - 6} x2={width} y2={height - 6} stroke="var(--season-gold)" strokeWidth="0.8" />
    </g>
  );
}

/* ───────────────────────── saffron jar ───────────────────────── */

function SaffronJarArt({ width, height }: DimsProps) {
  const cx = width / 2;
  const cy = height / 2;
  const jarW = Math.min(width, height) * 0.55;
  const jarH = Math.min(width, height) * 0.7;
  return (
    <g>
      <rect x="0" y="0" width={width} height={height} fill="var(--season-light)" />
      {/* Tabletop horizon */}
      <line x1="0" y1={cy + jarH / 2 + 6} x2={width} y2={cy + jarH / 2 + 6} stroke="var(--season-gold)" strokeWidth="0.6" opacity="0.6" />

      <g transform={`translate(${cx - jarW / 2} ${cy - jarH / 2})`}>
        {/* Lid */}
        <rect x={jarW * 0.18} y={-jarH * 0.06} width={jarW * 0.64} height={jarH * 0.08} rx="2" fill="var(--season-deep)" />
        <rect x={jarW * 0.22} y={-jarH * 0.02} width={jarW * 0.56} height={jarH * 0.04} fill="var(--season-gold)" opacity="0.65" />
        {/* Body */}
        <path
          d={`M ${jarW * 0.1} ${jarH * 0.05} 
              Q ${jarW * 0.05} ${jarH * 0.5} ${jarW * 0.16} ${jarH * 0.95}
              L ${jarW * 0.84} ${jarH * 0.95}
              Q ${jarW * 0.95} ${jarH * 0.5} ${jarW * 0.9} ${jarH * 0.05} Z`}
          fill="var(--season-mid)"
          opacity="0.85"
          stroke="var(--season-deep)"
          strokeWidth="0.8"
        />
        {/* Saffron fill (stamen threads) */}
        <g opacity="0.95">
          {Array.from({ length: 50 }).map((_, i) => {
            const x = jarW * 0.18 + ((i * 17) % (jarW * 0.62));
            const y = jarH * 0.4 + ((i * 13) % (jarH * 0.45));
            return (
              <line
                key={i}
                x1={x}
                y1={y}
                x2={x + (i % 3 === 0 ? 4 : -3)}
                y2={y + (i % 4 === 0 ? -4 : 3)}
                stroke="var(--brand)"
                strokeWidth="0.9"
                strokeLinecap="round"
              />
            );
          })}
        </g>
        {/* Label */}
        <rect x={jarW * 0.22} y={jarH * 0.2} width={jarW * 0.56} height={jarH * 0.18} fill="var(--season-light)" stroke="var(--season-deep)" strokeWidth="0.6" />
        <text
          x={jarW * 0.5}
          y={jarH * 0.305}
          fontSize="9"
          fontFamily="var(--font-mono-stack)"
          textAnchor="middle"
          fill="var(--season-deep)"
        >
          PAMPORE 2024
        </text>
      </g>
    </g>
  );
}

/* ────────────────────── generic textile ───────────────────────── */

function TextileArt({ width, height }: DimsProps) {
  return (
    <g>
      <ArtBackground width={width} height={height} tint="var(--season-light)" />
      <rect
        x={10}
        y={10}
        width={width - 20}
        height={height - 20}
        fill="var(--season-mid)"
        opacity="0.7"
      />
      <ArtHashia width={width} y={20} color="var(--season-gold)" />
      <ArtHashia width={width} y={height - 32} color="var(--season-gold)" />
      <g transform={`translate(${width / 2} ${height / 2})`}>
        <Medallion size={Math.min(width, height) * 0.4} />
      </g>
    </g>
  );
}
