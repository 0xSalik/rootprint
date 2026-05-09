import * as React from "react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------
 * <TalimTexture />
 *
 * The Talim is the carpet weaver's score — rows of colored squares that
 * encode every knot in a carpet. We render a faint version as a texture
 * overlay on dark surfaces (footer, hero overlays), at very low opacity
 * (5–7%).
 *
 * The component is absolutely-positioned by default (`fixed: false`)
 * inside its parent so it can sit behind content as a `pointer-events-none`
 * decorative layer.
 *
 * Props:
 *   color    — square color (defaults to seasonal gold)
 *   opacity  — defaults 0.06 per spec
 *   cell     — pixel size of one knot square
 *   gap      — pixel gap between knots
 *   inset    — when true, position absolute inset-0 inside parent
 * ----------------------------------------------------------------------- */

interface TalimTextureProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  opacity?: number;
  cell?: number;
  gap?: number;
  inset?: boolean;
}

export function TalimTexture({
  color = "var(--season-gold, var(--gold))",
  opacity = 0.06,
  cell = 6,
  gap = 4,
  inset = true,
  className,
  style,
  ...rest
}: TalimTextureProps) {
  const id = React.useId();
  const patternId = `talim-${id}`;
  const tile = cell + gap;

  return (
    <svg
      role="presentation"
      aria-hidden="true"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      className={cn(
        inset && "absolute inset-0 pointer-events-none",
        className,
      )}
      style={{ opacity, ...style }}
      {...rest}
    >
      <defs>
        <pattern
          id={patternId}
          width={tile}
          height={tile}
          patternUnits="userSpaceOnUse"
        >
          <rect
            x="0"
            y="0"
            width={cell}
            height={cell}
            fill={color}
            rx="0.5"
            ry="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
