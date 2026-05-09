import * as React from "react";
import Link from "next/link";

import { type Craft, paletteVars } from "../../../lib/data";
import { CraftIcon } from "./craft-icons";

/* -------------------------------------------------------------------------
 * <CraftCard />
 *
 * A single entry-point card on the home grid. The whole card is a
 * Next.js <Link> to /craft/[slug]. Painted in its own seasonal palette
 * (deep ribbon at the top, light wash for the body), so the home grid
 * reads as six small, distinct rooms rather than a uniform list.
 *
 * On hover: lifts 4 px, the top ribbon brightens, and the chevron
 * arrow slides one notch right.
 * ----------------------------------------------------------------------- */

interface CraftCardProps {
  craft: Craft;
}

export function CraftCard({ craft }: CraftCardProps) {
  const p = paletteVars(craft.palette);

  return (
    <Link
      href={`/craft/${craft.slug}`}
      className="group relative flex flex-col rounded-craft-lg overflow-hidden surface-card hover-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment transition-shadow"
      style={{
        backgroundColor: p.light,
        borderColor: "transparent",
      }}
    >
      {/* Top ribbon — deep palette colour, brightens on hover */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 transition-[height,background-color] duration-200 group-hover:h-1.5"
        style={{ backgroundColor: p.deep }}
      />

      {/* Body */}
      <div className="px-6 pt-9 pb-7 flex flex-col gap-3 min-h-[280px]">
        {/* Icon */}
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-2 transition-colors"
          style={{ color: p.deep, backgroundColor: "transparent" }}
        >
          <CraftIcon kind={craft.iconKey} size={56} strokeWidth={1.3} />
        </div>

        {/* Craft name (English, then Urdu) */}
        <div className="flex flex-col gap-1">
          <h3
            className="font-display text-[24px] leading-tight font-semibold"
            style={{ color: p.deep }}
          >
            {craft.name}
          </h3>
          <p
            dir="rtl"
            lang="ur"
            className="font-nastaliq text-ink-faded text-[16px] leading-snug"
          >
            {craft.nameUrdu}
          </p>
        </div>

        {/* One-line description */}
        <p className="font-body text-[14px] leading-relaxed text-ink-faded mt-1">
          {craft.description}
        </p>

        {/* Spacer pushes the masters line to the bottom */}
        <div className="flex-1" />

        {/* Masters count + arrow */}
        <div
          className="mt-3 inline-flex items-center justify-between gap-2 font-ui text-[13px] tracking-wide"
          style={{ color: p.deep }}
        >
          <span>{craft.mastersCount} Verified Masters</span>
          <span
            aria-hidden="true"
            className="inline-block transition-transform duration-200 group-hover:translate-x-1"
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
