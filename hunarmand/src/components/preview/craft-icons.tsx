import * as React from "react";

import type { Craft } from "../../../lib/data";

/* -------------------------------------------------------------------------
 * <CraftIcon kind="…" />
 *
 * Six line-art glyphs — one per craft. Stroke colour resolves from
 * `currentColor`, so the same icon paints in any seasonal deep tone
 * by setting the colour on the wrapper. Sized via the `size` prop.
 *
 *   naqashi  — a painted box with the gold-leaf brush above
 *   loom     — vertical loom with warp lines + a shuttle
 *   needle   — sozni needle drawn through cloth, knot at the back
 *   leaf     — chinar/walnut leaf, single carved curl
 *   knot     — woven knot grid, four warp + four weft, one knot
 *   lattice  — eight-pointed khatamband interlock star
 * ----------------------------------------------------------------------- */

type IconKind = Craft["iconKey"];

interface CraftIconProps {
  kind: IconKind;
  size?: number;
  className?: string;
  /** Stroke width. Defaults to 1.4 px in the 64×64 viewBox. */
  strokeWidth?: number;
}

export function CraftIcon({
  kind,
  size = 64,
  className,
  strokeWidth = 1.4,
}: CraftIconProps) {
  return (
    <svg
      role="presentation"
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {pathsFor(kind)}
    </svg>
  );
}

function pathsFor(kind: IconKind): React.ReactNode {
  switch (kind) {
    case "naqashi":
      return (
        <g>
          {/* Box */}
          <rect x="14" y="28" width="36" height="22" rx="2" />
          <line x1="14" y1="34" x2="50" y2="34" />
          {/* Lid line + small clasp */}
          <path d="M22 28 V25 Q22 22 25 22 H39 Q42 22 42 25 V28" />
          <circle cx="32" cy="40" r="3" />
          {/* Brush above */}
          <line x1="48" y1="14" x2="40" y2="22" />
          <path d="M40 22 l -3 3 l 6 0 l 3 -3 z" />
          {/* Gold-leaf swirl */}
          <path d="M18 16 q 4 -4 8 0 q 4 4 8 0" opacity="0.7" />
        </g>
      );

    case "loom":
      return (
        <g>
          {/* Loom uprights */}
          <line x1="14" y1="10" x2="14" y2="54" />
          <line x1="50" y1="10" x2="50" y2="54" />
          {/* Top + bottom beams */}
          <line x1="10" y1="14" x2="54" y2="14" strokeWidth="2" />
          <line x1="10" y1="50" x2="54" y2="50" strokeWidth="2" />
          {/* Warp lines */}
          {[20, 25, 30, 35, 40, 45].map((x) => (
            <line key={x} x1={x} y1="14" x2={x} y2="50" />
          ))}
          {/* Shuttle */}
          <path d="M16 32 q 16 -3 32 0 q -16 3 -32 0 z" fill="currentColor" opacity="0.18" stroke="currentColor" />
          {/* Loom feet */}
          <line x1="10" y1="54" x2="18" y2="54" strokeWidth="1.8" />
          <line x1="46" y1="54" x2="54" y2="54" strokeWidth="1.8" />
        </g>
      );

    case "needle":
      return (
        <g>
          {/* Cloth ground (faint) */}
          <rect x="10" y="22" width="44" height="20" rx="1" opacity="0.4" />
          {/* Needle */}
          <line x1="14" y1="46" x2="48" y2="20" strokeWidth="1.6" />
          {/* Eye */}
          <ellipse cx="14" cy="46" rx="2.2" ry="1.4" transform="rotate(-37 14 46)" />
          {/* Tip */}
          <circle cx="48" cy="20" r="0.9" fill="currentColor" />
          {/* Thread */}
          <path d="M14 46 Q 6 48 4 54 Q 2 60 10 60" />
          {/* Stitches above the needle path */}
          {[0, 1, 2, 3].map((i) => {
            const x1 = 18 + i * 6;
            const y1 = 32 - i * 2;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x1 + 4}
                y2={y1 + 1}
                opacity="0.7"
              />
            );
          })}
        </g>
      );

    case "leaf":
      return (
        <g>
          {/* Five-lobed chinar / walnut leaf */}
          <path
            d="M32 8 C 38 14, 46 14, 52 18 C 50 24, 46 28, 40 30 C 46 36, 48 42, 44 50 C 38 46, 34 40, 32 36 C 30 40, 26 46, 20 50 C 16 42, 18 36, 24 30 C 18 28, 14 24, 12 18 C 18 14, 26 14, 32 8 Z"
            fill="currentColor"
            fillOpacity="0.08"
          />
          {/* Central vein */}
          <line x1="32" y1="10" x2="32" y2="48" />
          {/* Side veins */}
          <line x1="32" y1="20" x2="20" y2="28" opacity="0.7" />
          <line x1="32" y1="20" x2="44" y2="28" opacity="0.7" />
          <line x1="32" y1="32" x2="22" y2="42" opacity="0.7" />
          <line x1="32" y1="32" x2="42" y2="42" opacity="0.7" />
          {/* Carved curl detail */}
          <path d="M28 56 q 4 -3 8 0" />
        </g>
      );

    case "knot":
      return (
        <g>
          {/* Warp + weft grid */}
          {[18, 26, 34, 42].map((y) => (
            <line key={`h${y}`} x1="12" y1={y} x2="52" y2={y} opacity="0.5" />
          ))}
          {[18, 26, 34, 42].map((x) => (
            <line key={`v${x}`} x1={x} y1="12" x2={x} y2="52" opacity="0.5" />
          ))}
          {/* Knots at the intersections */}
          {[18, 26, 34, 42].flatMap((x) =>
            [18, 26, 34, 42].map((y) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="currentColor" />
            )),
          )}
          {/* Highlighted central knot */}
          <circle cx="30" cy="30" r="3" fill="currentColor" />
          <circle cx="30" cy="30" r="5" />
          {/* Tassel */}
          <line x1="30" y1="48" x2="30" y2="56" />
          <line x1="28" y1="56" x2="32" y2="56" />
        </g>
      );

    case "lattice":
      return (
        <g>
          {/* Outer ring */}
          <circle cx="32" cy="32" r="22" />
          {/* 8-pointed star */}
          <path d="M32 10 L 38 26 L 54 32 L 38 38 L 32 54 L 26 38 L 10 32 L 26 26 Z" />
          {/* Rotated overlay square (creates the 8-point look) */}
          <rect x="22" y="22" width="20" height="20" transform="rotate(45 32 32)" />
          <rect x="22" y="22" width="20" height="20" />
          {/* Center dot */}
          <circle cx="32" cy="32" r="2" fill="currentColor" />
        </g>
      );
  }
}
