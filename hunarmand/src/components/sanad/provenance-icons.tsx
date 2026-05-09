import * as React from "react";

/* -------------------------------------------------------------------------
 * Provenance step icons.
 *
 * Five small craft-ink glyphs used in the vertical Provenance Chain
 * timeline. Each is a single inline SVG, no icon library, all stroked
 * with `currentColor` so they pick up `text-season-deep`.
 *
 * They are deliberately quiet — the tone of an old engraved stamp,
 * not a modern app icon set.
 * ----------------------------------------------------------------------- */

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

function svgProps({ size = 22, className, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true as const,
    ...rest,
  };
}

/** Material-origin glyph: a fleece tuft / a mountain. */
export function MaterialIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M3 18 L9 9 L13 14 L17 7 L21 18 Z" />
      <line x1="3" y1="18" x2="21" y2="18" />
      <circle cx="9" cy="9" r="0.6" fill="currentColor" />
      <circle cx="17" cy="7" r="0.6" fill="currentColor" />
    </svg>
  );
}

/** Technique glyph: a loom shuttle. */
export function TechniqueIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M2 12 L7 6 L17 6 L22 12 L17 18 L7 18 Z" />
      <line x1="7" y1="6" x2="17" y2="18" />
      <line x1="7" y1="18" x2="17" y2="6" />
    </svg>
  );
}

/** Completed-on glyph: a leaf coming off the branch. */
export function CompletedIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M6 18 C 6 12, 11 6, 18 6 C 18 13, 13 18, 6 18 Z" />
      <line x1="6" y1="18" x2="11" y2="13" />
    </svg>
  );
}

/** Signed-on glyph: an inkwell with feather. */
export function SignedIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M4 21 L 11 14 L 17 8 L 19 6 L 18 5 L 16 7 L 10 13 L 3 20 Z" />
      <line x1="13" y1="11" x2="16" y2="14" />
    </svg>
  );
}

/** Cryptographic-signature glyph: a key with a hashia knot. */
export function SignatureIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="7" cy="14" r="3.2" />
      <line x1="9.6" y1="12.8" x2="20" y2="6.5" />
      <line x1="17.5" y1="8" x2="19" y2="9.5" />
      <line x1="14.5" y1="9.7" x2="16" y2="11.2" />
    </svg>
  );
}
