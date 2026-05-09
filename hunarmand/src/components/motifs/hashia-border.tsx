import * as React from "react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------
 * <HashiaBorder />
 *
 * The Hashia is the repeating geometric border woven into Kani shawls —
 * a horizontal band of interlocking diamonds and dotted hexagons. We use
 * it as a section divider, a card's top edge, the underline on page
 * headers, and (animated, via `loader-hashia`) as the platform's
 * loading affordance.
 *
 * Props:
 *   color    — stroke color (defaults to the seasonal gold)
 *   opacity  — 0–1, defaults to 1
 *   height   — pixel height of the band
 *   className— additional classes (e.g. for animation)
 *   variant  — "line" (single woven row) | "double" (paired rows)
 *
 * The SVG repeats via <pattern>, so it stays crisp at any width.
 * ----------------------------------------------------------------------- */

interface HashiaBorderProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  opacity?: number;
  height?: number;
  variant?: "line" | "double";
}

const PATTERN_W = 28;
const PATTERN_H = 14;

export function HashiaBorder({
  color = "var(--season-gold, var(--gold))",
  opacity = 1,
  height = 14,
  variant = "line",
  className,
  ...rest
}: HashiaBorderProps) {
  const id = React.useId();
  const patternId = `hashia-${id}`;
  const totalH = variant === "double" ? height * 2 + 2 : height;

  return (
    <svg
      role="presentation"
      aria-hidden="true"
      width="100%"
      height={totalH}
      preserveAspectRatio="none"
      viewBox={`0 0 ${PATTERN_W * 8} ${totalH}`}
      className={cn("block", className)}
      style={{ opacity }}
      {...rest}
    >
      <defs>
        <pattern
          id={patternId}
          x="0"
          y="0"
          width={PATTERN_W}
          height={PATTERN_H}
          patternUnits="userSpaceOnUse"
        >
          {/* Diamond */}
          <path
            d={`M0 ${PATTERN_H / 2} L${PATTERN_W / 2} 1 L${PATTERN_W} ${PATTERN_H / 2} L${PATTERN_W / 2} ${PATTERN_H - 1} Z`}
            fill="none"
            stroke={color}
            strokeWidth="1"
          />
          {/* Center dot */}
          <circle
            cx={PATTERN_W / 2}
            cy={PATTERN_H / 2}
            r="1.2"
            fill={color}
          />
          {/* Side anchors */}
          <circle cx={0} cy={PATTERN_H / 2} r="0.8" fill={color} />
          <circle
            cx={PATTERN_W}
            cy={PATTERN_H / 2}
            r="0.8"
            fill={color}
          />
        </pattern>
      </defs>

      <rect
        x="0"
        y="0"
        width="100%"
        height={height}
        fill={`url(#${patternId})`}
      />

      {variant === "double" ? (
        <>
          <line
            x1="0"
            x2="100%"
            y1={height + 1}
            y2={height + 1}
            stroke={color}
            strokeWidth="0.6"
            opacity="0.7"
          />
          <rect
            x="0"
            y={height + 2}
            width="100%"
            height={height}
            fill={`url(#${patternId})`}
            transform={`scale(1, -1) translate(0, ${-(height * 2 + 2)})`}
          />
        </>
      ) : null}
    </svg>
  );
}
