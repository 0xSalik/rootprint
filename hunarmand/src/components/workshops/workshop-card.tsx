import * as React from "react";
import Link from "next/link";

import { type WorkshopFull, formatDateShort, formatINR } from "@/lib/workshops";
import { workshopKindMeta } from "@/lib/artisans";
import { SEASON_META, themeClassForSeason } from "@/lib/seasons";

import { WorkshopThumb } from "./workshop-hero";

/* -------------------------------------------------------------------------
 * <WorkshopCard />
 *
 * Discovery grid card. Themed in *the workshop's intrinsic season*
 * (carpet → harud, pashmina → shishur), not in the page's filter
 * season. The 4px ribbon at the top of the card is the visual signature
 * — that ribbon is always the craft's seasonal --season-deep colour.
 *
 * Mirrors the wireframe in the brief:
 *   ┌────────────────────────────────┐
 *   │ [Craft image — 200px tall]     │
 *   │ [Season color ribbon — top]    │
 *   │                                │
 *   │ Half-Day Pashmina Workshop     │  ← Cormorant 20px
 *   │ With Mohammad Yusuf            │  ← Jost 14px
 *   │                                │
 *   │ ❄️ Winter · Kanihama           │
 *   │ ⏱ 4 hours · 6 participants     │
 *   │ 📅 Next: 14 Dec 2025           │
 *   │                                │
 *   │ Rs. 6,000 / person             │
 *   │ [Book Now]                     │
 *   └────────────────────────────────┘
 * ----------------------------------------------------------------------- */

interface WorkshopCardProps {
  workshop: WorkshopFull;
}

export function WorkshopCard({ workshop }: WorkshopCardProps) {
  const { offering, artisan, season, ext } = workshop;
  const seasonMeta = SEASON_META[season];
  const kindMeta = workshopKindMeta(offering.kind);

  return (
    <article
      className={[
        themeClassForSeason(season),
        "group relative bg-paper border border-line rounded-craft-lg overflow-hidden",
        "flex flex-col hover-lift",
      ].join(" ")}
    >
      {/* The 4px craft-season ribbon along the top */}
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: "var(--season-deep)" }}
      />

      {/* Image */}
      <Link
        href={`/workshop/${offering.id}`}
        aria-label={`${offering.title} with ${artisan.name}`}
        className="block relative"
      >
        <WorkshopThumb craft={workshop.craft} />
        {/* Kind tag pinned to the image */}
        <span
          className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-craft text-xs font-ui font-medium"
          style={{
            backgroundColor: "rgba(28, 20, 16, 0.78)",
            color: "var(--season-gold)",
          }}
        >
          <span aria-hidden="true">{seasonMeta.glyph}</span>
          {kindMeta.tag}
        </span>
      </Link>

      {/* Body */}
      <div className="flex-1 px-5 pt-5 pb-6 flex flex-col gap-3">
        <div>
          <Link
            href={`/workshop/${offering.id}`}
            className="block font-display text-[20px] leading-tight text-ink hover:text-season-deep transition-colors duration-200"
          >
            {offering.title}
          </Link>
          <p className="font-ui text-[14px] text-ink-faded mt-1">
            With{" "}
            <Link
              href={`/artisan/${artisan.slug}`}
              className="text-ink hover:text-brand transition-colors duration-200"
            >
              {artisan.name}
            </Link>
          </p>
        </div>

        <ul className="space-y-1 text-sm text-ink-faded font-body">
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="text-season-deep">
              {seasonMeta.glyph}
            </span>
            <span>
              {seasonMeta.englishName} · {ext.location.name.replace(/^The\s+/, "")}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <ClockIcon />
            <span>
              {offering.duration} · up to {offering.capacity}{" "}
              {offering.capacity === 1 ? "participant" : "participants"}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <CalendarIcon />
            <span>Next: {formatDateShort(offering.nextDate)}</span>
          </li>
        </ul>

        <p className="font-body text-sm text-ink-faded leading-snug line-clamp-2">
          {offering.blurb}
        </p>

        {/* Footer — price + CTA */}
        <div className="mt-auto pt-4 border-t border-line flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-2xl text-ink leading-none">
              {formatINR(offering.pricePerPerson)}
            </p>
            <p className="meta-mono text-ink-margin mt-1">/ person · base tier</p>
          </div>
          <Link
            href={`/workshop/${offering.id}`}
            className="inline-flex items-center justify-center px-4 py-2 rounded-craft bg-brand text-ink-inverse font-ui font-medium tracking-wide hover:bg-brand-light transition-colors duration-200 min-h-11"
          >
            Book now
            <span className="ml-1.5" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------ icons ------------------------------ */

function ClockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-season-deep"
    >
      <circle cx="8" cy="8" r="6.4" />
      <path d="M8 4.5 V8 L10.5 9.5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-season-deep"
    >
      <rect x="2" y="3.5" width="12" height="11" rx="1" />
      <line x1="2" y1="7" x2="14" y2="7" />
      <line x1="5" y1="2" x2="5" y2="5" />
      <line x1="11" y1="2" x2="11" y2="5" />
    </svg>
  );
}
