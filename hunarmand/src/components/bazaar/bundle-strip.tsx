import * as React from "react";

import type { HeritageBundle } from "@/lib/bazaar";
import { BundleCard } from "./bundle-card";

/* -------------------------------------------------------------------------
 * <BundleStrip />
 *
 * Horizontal scroll for Heritage Bundles. Same scroll-snap pattern
 * as <EventStrip />, but the cards are wider (640px on desktop), so
 * fewer fit in view — encouraging the reader to take their time.
 * ----------------------------------------------------------------------- */

interface BundleStripProps {
  bundles: HeritageBundle[];
}

export function BundleStrip({ bundles }: BundleStripProps) {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-12 z-10 hidden sm:block"
        style={{
          backgroundImage:
            "linear-gradient(to left, var(--bg-primary) 0%, transparent 100%)",
        }}
      />
      <ul
        role="list"
        className="flex gap-6 overflow-x-auto pb-4 -mx-5 px-5 sm:-mx-8 sm:px-8 snap-x snap-mandatory scroll-pl-5 sm:scroll-pl-8"
        style={{ scrollbarWidth: "thin" }}
      >
        {bundles.map((b) => (
          <li key={b.id} className="contents">
            <BundleCard bundle={b} />
          </li>
        ))}
      </ul>
    </div>
  );
}
