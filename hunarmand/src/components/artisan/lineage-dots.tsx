import * as React from "react";

import type { LineageEntry } from "@/lib/artisans";

/* -------------------------------------------------------------------------
 * <LineageDots />
 *
 * One dot per generation. Filled = living (only the current master is
 * usually alive). Outline = passed. Hover any dot to reveal the
 * generation master's name and era as a small popover above the dot.
 *
 * Implementation: a CSS-only popover via group-hover so the component
 * stays SSR-friendly and doesn't need a portal.
 * ----------------------------------------------------------------------- */

interface LineageDotsProps {
  lineage: LineageEntry[];
  className?: string;
}

export function LineageDots({ lineage, className }: LineageDotsProps) {
  return (
    <div
      className={`flex items-center gap-3 ${className ?? ""}`}
      aria-label="Lineage"
    >
      {lineage.map((entry, i) => {
        const isCurrent = i === lineage.length - 1;
        return (
          <div key={i} className="relative group flex items-center">
            <span
              className={`block size-3 rounded-full transition-transform duration-200 ${
                entry.alive
                  ? "bg-gold seal-glow"
                  : "border border-ink-inverse/55"
              } group-hover:scale-125`}
              style={
                entry.alive
                  ? undefined
                  : { backgroundColor: "transparent" }
              }
              aria-label={`Generation ${i + 1} — ${entry.name}`}
            />

            {/* Connector line, except after the last dot */}
            {i < lineage.length - 1 ? (
              <span
                aria-hidden="true"
                className="ml-3 inline-block h-px w-6 bg-ink-inverse/35"
              />
            ) : null}

            {/* Tooltip */}
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-44 px-3 py-2 rounded-craft bg-walnut text-ink-inverse opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)] border border-gold/30 z-20"
            >
              <span className="block label-ui text-gold-light text-[10px]">
                Gen {i + 1}{isCurrent ? " · current" : ""}
              </span>
              <span className="block font-display text-sm leading-tight mt-1">
                {entry.name}
              </span>
              <span className="block meta-mono text-ink-inverse/70 mt-0.5">
                {entry.era}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
