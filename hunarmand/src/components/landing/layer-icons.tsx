import * as React from "react";

/* -------------------------------------------------------------------------
 * Four layer icons — Vault, Sanad, Ustaad, Bazaar.
 *
 * Spec: "craft-ink icon (SVG line art, not filled — delicate)". Each one
 * is a 64×64 viewBox, single-stroke, drawn in `currentColor` so the
 * card can recolor it via Tailwind text utilities.
 * ----------------------------------------------------------------------- */

type IconProps = React.SVGProps<SVGSVGElement>;

const baseProps = {
  viewBox: "0 0 64 64",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  role: "presentation",
  "aria-hidden": true,
};

/** Vault — an illuminated manuscript page bound to a rosette clasp. */
export function VaultIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      {/* Manuscript outline */}
      <path d="M14 10 H46 A4 4 0 0 1 50 14 V52 A2 2 0 0 1 48 54 H16 A2 2 0 0 1 14 52 Z" />
      {/* Spine seam */}
      <path d="M14 14 H50" />
      {/* Inner border – aged paper edge */}
      <path d="M19 19 H45 V47 H19 Z" />
      {/* Calligraphic flourish lines */}
      <path d="M23 26 H41" opacity="0.7" />
      <path d="M23 30 H38" opacity="0.5" />
      <path d="M23 34 H41" opacity="0.7" />
      <path d="M23 38 H35" opacity="0.5" />
      {/* Rosette clasp */}
      <circle cx="32" cy="44" r="3.2" />
      <path d="M32 41.5 V46.5 M29.5 44 H34.5" />
    </svg>
  );
}

/** Sanad — a wax-sealed, dotted scroll certificate. */
export function SanadIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      {/* Scroll body */}
      <path d="M14 14 H46 A4 4 0 0 1 50 18 V46 A4 4 0 0 1 46 50 H14" />
      {/* Curl on the left */}
      <path d="M14 14 A4 4 0 1 0 14 22 V42 A4 4 0 1 0 14 50" />
      {/* Inscription lines */}
      <path d="M22 22 H44" opacity="0.7" />
      <path d="M22 27 H40" opacity="0.55" />
      <path d="M22 32 H44" opacity="0.7" />
      <path d="M22 37 H38" opacity="0.55" />
      {/* Wax seal with rays */}
      <circle cx="42" cy="46" r="4" />
      <path d="M42 40.5 V43 M42 49 V51.5 M36.5 46 H39 M45 46 H47.5" />
      {/* Verification check inside seal */}
      <path d="M40 46 L41.5 47.5 L44 44.8" strokeWidth="1.3" />
    </svg>
  );
}

/** Ustaad — a master's hand resting on a loom warp. */
export function UstaadIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      {/* Loom frame */}
      <path d="M10 14 V50 M54 14 V50" />
      <path d="M8 14 H56 M8 50 H56" />
      {/* Warp threads */}
      <path d="M16 16 V48 M22 16 V48 M28 16 V48 M34 16 V48 M40 16 V48 M46 16 V48" opacity="0.45" />
      {/* Single strong working thread */}
      <path d="M14 32 Q 32 28 50 32" strokeWidth="1.5" />
      {/* Hand — palm + four fingers + thumb resting on the warp */}
      <path d="M24 40 Q 24 34 28 33 L28 27 Q 28 25 30 25 Q 32 25 32 27 L32 32 Q 33 32 33 30 L33 26 Q 33 24 35 24 Q 37 24 37 26 L37 32 Q 38 32 38 31 L38 28 Q 38 26 40 26 Q 42 26 42 28 L42 33 Q 43 33 43 32 L43 30 Q 43 28 45 28 Q 47 28 47 30 L47 38 Q 47 44 40 44 L30 44 Q 24 44 24 40 Z" />
    </svg>
  );
}

/** Bazaar — a Kashmiri archway lantern over an open door. */
export function BazaarIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      {/* Outer arch */}
      <path d="M12 50 V28 Q 12 12 32 12 Q 52 12 52 28 V50" />
      {/* Inner arch */}
      <path d="M20 50 V30 Q 20 20 32 20 Q 44 20 44 30 V50" />
      {/* Ground line */}
      <path d="M8 50 H56" />
      {/* Lantern hanging from apex */}
      <path d="M32 12 V18" />
      <path d="M28 18 H36 L34 24 H30 Z" />
      <path d="M30 24 V28 M34 24 V28" />
      {/* Lantern flame */}
      <path d="M32 25 Q 31 27 32 28 Q 33 27 32 25 Z" fill="currentColor" />
      {/* Hashia detail along arch */}
      <circle cx="20" cy="30" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="44" cy="30" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
