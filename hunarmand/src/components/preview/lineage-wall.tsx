import * as React from "react";

import { type Artisan, type Craft, paletteVars, initialsFor } from "../../../lib/data";

/* -------------------------------------------------------------------------
 * <LineageWall />
 *
 * A horizontal scroll strip of generations. Each generation is an
 * oval with the family member's initials, name in Cormorant, era in
 * Jost (margin tone). The current master's oval is enlarged and
 * painted in the brand red. Generations are joined by a wavy gold
 * thread drawn as an inline SVG behind the row.
 * ----------------------------------------------------------------------- */

interface LineageWallProps {
  artisan: Artisan;
  craft: Craft;
}

export function LineageWall({ artisan, craft }: LineageWallProps) {
  const p = paletteVars(craft.palette);
  const lineage = artisan.lineage;
  const last = lineage.length - 1;

  return (
    <div className="relative">
      {/* Wavy gold thread behind the ovals */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1000 80"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-[80px] opacity-70"
      >
        <path
          d="M 0 40 Q 60 12 120 40 T 240 40 T 360 40 T 480 40 T 600 40 T 720 40 T 840 40 T 1000 40"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1.4"
          strokeDasharray="3 4"
        />
      </svg>

      <ol className="relative flex gap-6 sm:gap-8 overflow-x-auto pb-2 px-1 snap-x snap-mandatory scroll-smooth">
        {lineage.map((g, i) => {
          const isCurrent = i === last;
          const size = isCurrent ? 78 : 58;
          return (
            <li
              key={`${g.name}-${i}`}
              className="snap-start shrink-0 flex flex-col items-center text-center min-w-[140px]"
            >
              <div
                className="rounded-full flex items-center justify-center font-display font-semibold text-ink-inverse mb-2"
                style={{
                  width: size,
                  height: size,
                  fontSize: isCurrent ? 24 : 18,
                  backgroundColor: isCurrent ? "var(--brand)" : p.deep,
                  border: isCurrent ? "2px solid var(--gold)" : "none",
                  boxShadow: isCurrent
                    ? "0 0 0 6px rgba(200, 151, 90, 0.18)"
                    : "0 6px 14px -10px rgba(28,20,16,0.4)",
                  opacity: g.alive ? 1 : 0.78,
                }}
              >
                {initialsFor(g.name)}
              </div>
              <p
                className={[
                  "font-display text-[15px] leading-tight",
                  isCurrent ? "text-brand" : "text-ink",
                ].join(" ")}
              >
                {g.name}
              </p>
              <p className="font-ui text-[11px] tracking-wide uppercase text-ink-margin mt-1">
                {g.era}
              </p>
              <p className="font-ui text-[10px] tracking-wide uppercase text-ink-margin/80 mt-0.5">
                Generation {i + 1}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
