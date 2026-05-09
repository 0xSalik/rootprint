import * as React from "react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------
 * <ChinarCorner />
 *
 * A stylized 5-lobed Chinar leaf — Kashmir's most iconic symbol — drawn
 * as a corner ornament. Used on artisan profile banners, the corners of
 * Sanad provenance certificates, and Heritage Bundle pages.
 *
 * Props:
 *   corner   — which corner the leaf points "into" (defaults TL)
 *   color    — fill color (defaults to seasonal gold)
 *   opacity
 *   size     — pixel size of the bounding box
 * ----------------------------------------------------------------------- */

type Corner = "tl" | "tr" | "bl" | "br";

interface ChinarCornerProps extends React.SVGProps<SVGSVGElement> {
  corner?: Corner;
  color?: string;
  opacity?: number;
  size?: number;
}

const CORNER_ROTATION: Record<Corner, number> = {
  tl: 0,
  tr: 90,
  br: 180,
  bl: 270,
};

export function ChinarCorner({
  corner = "tl",
  color = "var(--season-gold, var(--gold))",
  opacity = 1,
  size = 64,
  className,
  ...rest
}: ChinarCornerProps) {
  return (
    <svg
      role="presentation"
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn("block", className)}
      style={{
        opacity,
        transform: `rotate(${CORNER_ROTATION[corner]}deg)`,
      }}
      {...rest}
    >
      {/* Stem rising from the corner */}
      <path
        d="M8 8 Q 18 18, 28 28"
        stroke={color}
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Five-lobed Chinar leaf */}
      <g
        transform="translate(28, 28) scale(0.55)"
        fill={color}
        stroke={color}
        strokeWidth="0.7"
        strokeLinejoin="round"
      >
        <path
          d="
            M 0 80
            C -8 70, -18 62, -22 50
            C -36 56, -52 50, -58 36
            C -42 36, -32 28, -28 16
            C -42 14, -52 4, -52 -10
            C -38 -4, -24 -8, -16 -22
            C -22 -34, -16 -50, -2 -54
            C 0 -42, 8 -34, 18 -34
            C 16 -50, 26 -62, 40 -62
            C 38 -48, 44 -34, 56 -28
            C 50 -16, 50 0, 60 8
            C 46 12, 38 22, 36 36
            C 50 38, 60 50, 56 64
            C 42 56, 28 60, 20 72
            C 18 84, 10 92, 0 90
            Z
          "
          fillOpacity="0.16"
        />
        {/* Veins */}
        <path
          d="M 0 80 L 0 -40"
          stroke={color}
          strokeWidth="1"
          fill="none"
          opacity="0.7"
        />
        <path
          d="M 0 30 L -32 14"
          stroke={color}
          strokeWidth="0.8"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M 0 30 L 32 14"
          stroke={color}
          strokeWidth="0.8"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M 0 0 L -28 -22"
          stroke={color}
          strokeWidth="0.8"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M 0 0 L 28 -22"
          stroke={color}
          strokeWidth="0.8"
          fill="none"
          opacity="0.6"
        />
      </g>
    </svg>
  );
}
