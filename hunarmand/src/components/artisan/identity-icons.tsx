import * as React from "react";

/* -------------------------------------------------------------------------
 * Four small craft-ink icons for the Craft Identity Bar.
 * Single-stroke SVGs in `currentColor`. Sized 24px by default.
 * ----------------------------------------------------------------------- */

type IconProps = React.SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  role: "presentation",
  "aria-hidden": true,
  width: 22,
  height: 22,
};

/** Pieces signed — a stamped page corner. */
export function PiecesIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 4 H14 L19 9 V20 H5 Z" />
      <path d="M14 4 V9 H19" />
      <path d="M8 13 H16 M8 16 H13" opacity="0.7" />
      <circle cx="16.4" cy="17.6" r="2.2" />
      <path d="M15.4 17.7 L16.1 18.4 L17.4 17.0" strokeWidth="1.6" />
    </svg>
  );
}

/** Disputes — a shield. */
export function DisputeShieldIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 L19 6 V12 Q 19 17, 12 21 Q 5 17, 5 12 V6 Z" />
      <path d="M9.2 12.5 L11.2 14.5 L14.8 10.5" strokeWidth="1.6" />
    </svg>
  );
}

/** Workshop slots — a calendar-with-seat icon. */
export function SlotsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="16" rx="1.6" />
      <path d="M3 9 H21" />
      <path d="M7 3 V7 M17 3 V7" />
      <circle cx="8" cy="14" r="0.7" fill="currentColor" />
      <circle cx="12" cy="14" r="0.7" fill="currentColor" />
      <circle cx="16" cy="14" r="0.7" fill="currentColor" />
      <circle cx="8" cy="18" r="0.7" fill="currentColor" />
      <circle cx="12" cy="18" r="1.4" fill="currentColor" />
      <circle cx="16" cy="18" r="0.7" fill="currentColor" />
    </svg>
  );
}

/** Lineage — a knotted thread, looping back. */
export function LineageIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 18 Q 8 14, 6 10 Q 4 6, 8 4 Q 12 2.4, 14 6 Q 15.5 9, 13 12 Q 10.5 15, 14 18 Q 17 20, 20 18" />
      <circle cx="8" cy="4" r="1" fill="currentColor" />
      <circle cx="6.4" cy="10.2" r="1" fill="currentColor" />
      <circle cx="13.4" cy="11.8" r="1" fill="currentColor" />
      <circle cx="14.6" cy="17.6" r="1" fill="currentColor" />
      <circle cx="20" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}
