import * as React from "react";

import { ChinarCorner, HashiaBorder, TalimTexture } from "@/components/motifs";

/* -------------------------------------------------------------------------
 * <SpotlightArt />
 *
 * The artisan spotlight blocks each have a tall craft tile in place of a
 * stock photo. The tile is built from the design system's own motifs so
 * it always looks like Hunarmand: a season-tinted gradient, a Talim
 * texture overlay, a single craft monogram in the centre, and a
 * Hashia + Chinar frame.
 *
 * The variant prop controls the central craft monogram so the two
 * spotlights on the landing page feel distinct.
 * ----------------------------------------------------------------------- */

type Variant = "knot" | "loom";

interface SpotlightArtProps {
  variant: Variant;
  className?: string;
}

export function SpotlightArt({ variant, className }: SpotlightArtProps) {
  return (
    <div
      className={`relative aspect-[4/5] overflow-hidden rounded-craft-lg surface-card ${className ?? ""}`}
      style={{
        background:
          "linear-gradient(160deg, var(--season-deep) 0%, var(--season-mid) 60%, var(--season-deep) 100%)",
      }}
    >
      {/* Talim texture overlay */}
      <TalimTexture
        opacity={0.14}
        color="var(--season-gold)"
        cell={5}
        gap={5}
      />

      {/* Inner cream frame, like a mounted plate */}
      <div
        className="absolute inset-5 rounded-craft border"
        style={{
          borderColor: "rgba(232, 196, 138, 0.35)",
          background:
            "radial-gradient(circle at 50% 40%, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Chinar leaves anchor each corner */}
      <div className="absolute inset-5 pointer-events-none">
        <div className="absolute top-0 left-0">
          <ChinarCorner corner="tl" size={56} color="var(--season-gold)" opacity={0.85} />
        </div>
        <div className="absolute top-0 right-0">
          <ChinarCorner corner="tr" size={56} color="var(--season-gold)" opacity={0.85} />
        </div>
        <div className="absolute bottom-0 left-0">
          <ChinarCorner corner="bl" size={56} color="var(--season-gold)" opacity={0.85} />
        </div>
        <div className="absolute bottom-0 right-0">
          <ChinarCorner corner="br" size={56} color="var(--season-gold)" opacity={0.85} />
        </div>
      </div>

      {/* Central craft monogram */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {variant === "knot" ? <KnotMark /> : <LoomMark />}
      </div>

      {/* Hashia bands top and bottom */}
      <div className="absolute left-8 right-8 top-10">
        <HashiaBorder
          height={8}
          color="var(--season-gold)"
          opacity={0.75}
        />
      </div>
      <div className="absolute left-8 right-8 bottom-10">
        <HashiaBorder
          height={8}
          color="var(--season-gold)"
          opacity={0.75}
        />
      </div>
    </div>
  );
}

/* -- Centerpiece monograms ---------------------------------------------- */

/** Carpet — a Persian-knot rosette, four-fold symmetric. */
function KnotMark() {
  return (
    <svg
      viewBox="0 0 200 200"
      width="55%"
      role="presentation"
      aria-hidden="true"
      style={{ color: "var(--season-gold)" }}
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        {/* Outer ring */}
        <circle cx="100" cy="100" r="78" opacity="0.45" />
        <circle cx="100" cy="100" r="62" opacity="0.7" />
        {/* Eight-petal rosette */}
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4;
          return (
            <path
              key={i}
              d={`M 100 100 Q ${100 + Math.cos(a - 0.3) * 36} ${100 + Math.sin(a - 0.3) * 36}, ${100 + Math.cos(a) * 56} ${100 + Math.sin(a) * 56} Q ${100 + Math.cos(a + 0.3) * 36} ${100 + Math.sin(a + 0.3) * 36}, 100 100 Z`}
              fill="currentColor"
              fillOpacity="0.18"
              stroke="currentColor"
              strokeWidth="1"
            />
          );
        })}
        {/* Center knot */}
        <circle cx="100" cy="100" r="10" fill="currentColor" fillOpacity="0.65" />
        <circle cx="100" cy="100" r="4" fill="#1a1410" />
      </g>
    </svg>
  );
}

/** Pashmina loom — three vertical warp threads under tension with a
 *  weft thread crossing horizontally. */
function LoomMark() {
  return (
    <svg
      viewBox="0 0 200 200"
      width="55%"
      role="presentation"
      aria-hidden="true"
      style={{ color: "var(--season-gold)" }}
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        {/* Loom uprights */}
        <path d="M40 30 V 170 M160 30 V 170" strokeWidth="1.4" opacity="0.7" />
        {/* Crossbeams */}
        <path d="M30 38 H 170 M30 162 H 170" strokeWidth="1.4" opacity="0.7" />
        {/* Warp threads */}
        {[60, 80, 100, 120, 140].map((x, i) => (
          <path
            key={i}
            d={`M${x} 38 V 162`}
            strokeWidth="0.9"
            opacity={0.55 + (i % 2) * 0.2}
          />
        ))}
        {/* Weft thread — long curving stroke under tension */}
        <path
          d="M40 100 Q 100 86 160 100"
          strokeWidth="1.6"
          opacity="0.95"
        />
        {/* Single highlighted node — a knot mid-pick */}
        <circle cx="100" cy="92" r="4" fill="currentColor" fillOpacity="0.85" />
        <circle cx="100" cy="92" r="9" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
      </g>
    </svg>
  );
}
