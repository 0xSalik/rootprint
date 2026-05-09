import * as React from "react";
import Link from "next/link";

import {
  type Craft,
  type WorkshopOffering,
  formatINR,
  paletteVars,
} from "../../../lib/data";

/* -------------------------------------------------------------------------
 * <WorkshopTile />
 *
 * One workshop card on the artisan profile. The top ribbon picks up
 * the craft's deep palette tone; the duration + price are stacked
 * top-right; seasonal availability pills run along the bottom.
 *
 * The "Book Now →" link points at the URL the booking flow
 * expects: /booking/[artisan-slug]/[workshop-type]
 * ----------------------------------------------------------------------- */

interface WorkshopTileProps {
  workshop: WorkshopOffering;
  craft: Craft;
  artisanSlug: string;
}

export function WorkshopTile({
  workshop,
  craft,
  artisanSlug,
}: WorkshopTileProps) {
  const p = paletteVars(craft.palette);

  return (
    <article
      className="relative flex flex-col rounded-craft-lg overflow-hidden surface-card hover-lift bg-paper"
      style={{ borderColor: "transparent" }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: p.deep }}
      />

      <div className="px-6 pt-9 pb-7 flex flex-col gap-4 min-h-[300px]">
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span
              className="label-ui"
              style={{ color: p.deep }}
            >
              {workshop.duration}
            </span>
            <h4 className="font-display text-[22px] leading-tight text-ink">
              {workshop.title}
            </h4>
          </div>
          <p className="text-right">
            <span className="block font-display text-[20px] text-brand">
              {formatINR(workshop.pricePerPerson)}
            </span>
            <span className="block font-ui text-[11px] tracking-wide uppercase text-ink-margin mt-0.5">
              per person
            </span>
          </p>
        </header>

        <p className="font-body text-[14px] leading-relaxed text-ink-faded">
          {workshop.description}
        </p>

        <p className="font-ui text-[12px] tracking-wide uppercase text-ink-margin">
          Max {workshop.capacity} participants
        </p>

        <div className="flex-1" />

        {/* Seasonal availability */}
        <div className="flex flex-wrap gap-1.5">
          {workshop.seasons.map((s) => (
            <span
              key={s}
              className="inline-flex items-center px-2 py-0.5 rounded-full font-ui text-[10px] tracking-[0.08em] uppercase"
              style={{
                backgroundColor: `${p.gold}25`,
                color: p.deep,
              }}
            >
              {s}
            </span>
          ))}
        </div>

        <Link
          href={`/booking/${artisanSlug}/${workshop.type}`}
          className="mt-3 inline-flex items-center justify-center px-4 py-2.5 rounded-craft bg-brand hover:bg-brand-light text-ink-inverse font-ui text-[13px] tracking-wide transition-colors min-h-10"
        >
          Book Now →
        </Link>
      </div>
    </article>
  );
}
