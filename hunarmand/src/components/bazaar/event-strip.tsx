import * as React from "react";

import type { BazaarEvent } from "@/lib/bazaar";
import { EventCard } from "./event-card";

/* -------------------------------------------------------------------------
 * <EventStrip />
 *
 * Horizontal scroll of seasonal pop-up events. Snap points so the
 * scroll feels considered (one card at a time on mobile). At wider
 * viewports the cards line up and we get a subtle peek of the next
 * card on the right edge — encouraging horizontal exploration.
 *
 * Native CSS scroll-snap; no JS required.
 * ----------------------------------------------------------------------- */

interface EventStripProps {
  events: BazaarEvent[];
}

export function EventStrip({ events }: EventStripProps) {
  return (
    <div className="relative">
      {/* Right-edge fade hint, suggests scroll on overflow */}
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
        className="flex gap-5 sm:gap-6 overflow-x-auto pb-4 -mx-5 px-5 sm:-mx-8 sm:px-8 snap-x snap-mandatory scroll-pl-5 sm:scroll-pl-8"
        style={{ scrollbarWidth: "thin" }}
      >
        {events.map((ev) => (
          <li key={ev.id} className="contents">
            <EventCard event={ev} />
          </li>
        ))}
      </ul>
    </div>
  );
}
