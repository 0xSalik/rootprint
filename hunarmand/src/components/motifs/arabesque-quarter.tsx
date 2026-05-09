import * as React from "react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------
 * <ArabesqueQuarter />
 *
 * A quarter-tile of a Kashmiri arabesque — interlacing tendrils ending
 * in stylized buds. Used as a corner ornament on the Sanad provenance
 * card and Heritage Bundle pages. Four placed mirror-symmetrically form
 * a complete tile.
 *
 * Props:
 *   corner   — which corner this quarter is anchored to
 *   color
 *   opacity
 *   size     — pixel dimension of the bounding box
 * ----------------------------------------------------------------------- */

type Corner = "tl" | "tr" | "bl" | "br";

interface ArabesqueQuarterProps extends React.SVGProps<SVGSVGElement> {
  corner?: Corner;
  color?: string;
  opacity?: number;
  size?: number;
}

const TRANSFORM_BY_CORNER: Record<Corner, string> = {
  tl: "scale(1, 1)",
  tr: "scale(-1, 1)",
  bl: "scale(1, -1)",
  br: "scale(-1, -1)",
};

export function ArabesqueQuarter({
  corner = "tl",
  color = "var(--season-gold, var(--gold))",
  opacity = 1,
  size = 88,
  className,
  ...rest
}: ArabesqueQuarterProps) {
  return (
    <svg
      role="presentation"
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn("block", className)}
      style={{ opacity }}
      {...rest}
    >
      <g
        transform={`translate(${corner === "tr" || corner === "br" ? 100 : 0}, ${corner === "bl" || corner === "br" ? 100 : 0}) ${TRANSFORM_BY_CORNER[corner]}`}
        fill="none"
        stroke={color}
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Outer frame swoop */}
        <path d="M 4 4 L 4 36 Q 4 52, 18 60 Q 32 68, 36 84 L 36 96" />
        {/* Inner mirroring vine */}
        <path d="M 12 4 L 12 24 Q 12 36, 24 42 Q 38 48, 42 64 L 42 96" />
        {/* Tendril 1 */}
        <path
          d="
            M 4 4
            Q 24 8, 38 22
            Q 48 32, 56 30
            Q 64 28, 64 18
            Q 64 8, 54 6
          "
        />
        {/* Tendril leaf cluster */}
        <path
          d="
            M 56 30
            Q 70 30, 78 40
            Q 84 48, 78 58
            Q 72 66, 60 60
          "
        />
        {/* Bud — small filled almond */}
        <path
          d="M 60 12 Q 66 12, 66 18 Q 66 24, 60 24 Q 54 24, 54 18 Q 54 12, 60 12 Z"
          fill={color}
          fillOpacity="0.85"
          stroke={color}
        />
        {/* Smaller bud */}
        <path
          d="M 78 50 Q 84 50, 84 56 Q 84 62, 78 62 Q 72 62, 72 56 Q 72 50, 78 50 Z"
          fill={color}
          fillOpacity="0.55"
          stroke={color}
        />
        {/* Anchor dot in corner */}
        <circle cx="6" cy="6" r="1.4" fill={color} stroke="none" />
      </g>
    </svg>
  );
}
