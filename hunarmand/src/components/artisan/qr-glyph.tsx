import * as React from "react";

/* -------------------------------------------------------------------------
 * <QrGlyph />
 *
 * A stylised QR icon used on every row of the Provenance Ledger. Three
 * "finder" squares + a faint cell pattern. Renders at any size.
 * Renders in `currentColor`.
 * ----------------------------------------------------------------------- */

interface QrGlyphProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function QrGlyph({ size = 18, ...rest }: QrGlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="presentation"
      aria-hidden="true"
      fill="currentColor"
      {...rest}
    >
      {/* Top-left finder */}
      <path d="M3 3 H10 V10 H3 Z M5 5 V8 H8 V5 Z" />
      {/* Top-right finder */}
      <path d="M14 3 H21 V10 H14 Z M16 5 V8 H19 V5 Z" />
      {/* Bottom-left finder */}
      <path d="M3 14 H10 V21 H3 Z M5 16 V19 H8 V16 Z" />
      {/* Data cells */}
      <rect x="13" y="13" width="2" height="2" />
      <rect x="17" y="13" width="2" height="2" />
      <rect x="13" y="17" width="2" height="2" />
      <rect x="19" y="15" width="2" height="2" />
      <rect x="15" y="19" width="2" height="2" />
      <rect x="19" y="19" width="2" height="2" />
      <rect x="11" y="3" width="2" height="2" />
      <rect x="11" y="7" width="2" height="2" />
      <rect x="11" y="11" width="2" height="2" />
      <rect x="3" y="11" width="2" height="2" />
      <rect x="7" y="11" width="2" height="2" />
    </svg>
  );
}
