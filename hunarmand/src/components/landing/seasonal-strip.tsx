import * as React from "react";
import Link from "next/link";

import { CraftColorProvider } from "@/components/theme/craft-color-provider";
import { HashiaBorder } from "@/components/motifs";
import {
  CRAFT_LABEL,
  type Craft,
  type Season,
  SEASON_META,
  getCurrentSeason,
} from "@/lib/seasons";

/* -------------------------------------------------------------------------
 * <SeasonalStrip />
 *
 * "What's Happening This Season". The wrapper detects the ambient
 * season from the calendar and applies the matching palette via
 * <CraftColorProvider>. Inside, four event cards in a horizontal scroll
 * (snap on mobile, normal flex on desktop). Each card shows event name,
 * craft type, date, price range, and a Book Now CTA.
 *
 * NOTE: The brief asks for "imagery" — we render motif-based tiles
 * rather than stock photos. If real images are added later, swap the
 * <CardArt /> body.
 * ----------------------------------------------------------------------- */

interface SeasonalEvent {
  id: string;
  title: string;
  craft: Craft;
  /** A short location string. */
  where: string;
  /** Free-form date label — workshops can be a single date, bazaars a range. */
  when: string;
  priceFrom: number;
  /** "workshop" | "bazaar" | "walk" — drives a small badge. */
  kind: "workshop" | "bazaar" | "walk";
}

/** Catalogue of seasonal events. The strip picks the four matching the
 *  ambient season; if a season has < 4, falls back to filling with the
 *  remainder cycling through the rest of the catalogue. */
const SEASONAL_CATALOGUE: Record<Season, SeasonalEvent[]> = {
  bahar: [
    {
      id: "tulip-bazaar",
      title: "Tulip Festival Bazaar",
      craft: "sozni",
      where: "IGM Garden, Srinagar",
      when: "Apr 1 – Apr 30",
      priceFrom: 0,
      kind: "bazaar",
    },
    {
      id: "sozni-half-day",
      title: "Half-Day Sozni Embroidery Session",
      craft: "sozni",
      where: "Aisha Begum's atelier · Rainawari",
      when: "Sat & Sun · 10:00",
      priceFrom: 4500,
      kind: "workshop",
    },
    {
      id: "spring-pashmina",
      title: "Spring Shawl Pop-up",
      craft: "shawl",
      where: "Kanihama Weavers' Hall",
      when: "Apr 18 – May 12",
      priceFrom: 0,
      kind: "bazaar",
    },
    {
      id: "old-city-walk",
      title: "Old City Heritage Walk",
      craft: "heritage-walk",
      where: "Downtown Srinagar",
      when: "Wed & Sat · 7:00 am",
      priceFrom: 1500,
      kind: "walk",
    },
  ],
  grism: [
    {
      id: "naqashi-grand",
      title: "Naqashi Masterclass on Houseboat",
      craft: "naqashi",
      where: "Nagin Lake · Srinagar",
      when: "Jul 6 · 09:00",
      priceFrom: 9000,
      kind: "workshop",
    },
    {
      id: "papier-half-day",
      title: "Papier-mâché Box Workshop",
      craft: "papier-mache",
      where: "Zaina Kadal Atelier",
      when: "Daily · except Friday",
      priceFrom: 5500,
      kind: "workshop",
    },
    {
      id: "copper-bazaar",
      title: "Eid Copper Bazaar",
      craft: "copper",
      where: "Maharaj Gunj market",
      when: "Aug 12 – Aug 18",
      priceFrom: 0,
      kind: "bazaar",
    },
    {
      id: "garden-walk",
      title: "Mughal Gardens Heritage Walk",
      craft: "heritage-walk",
      where: "Shalimar · Nishat",
      when: "Tue & Thu · 6:00 am",
      priceFrom: 1200,
      kind: "walk",
    },
  ],
  harud: [
    {
      id: "saffron-harvest",
      title: "Saffron Harvest at Dawn",
      craft: "saffron",
      where: "Pampore Fields",
      when: "Oct 25 – Nov 18 · 5:30 am",
      priceFrom: 3500,
      kind: "workshop",
    },
    {
      id: "carpet-half-day",
      title: "Half-Day Carpet Knotting",
      craft: "carpet",
      where: "M. Y. Sheikh's loom · Khanyar",
      when: "Mon, Wed, Sat · 14:00",
      priceFrom: 6000,
      kind: "workshop",
    },
    {
      id: "walnut-class",
      title: "Walnut Carving Masterclass",
      craft: "walnut",
      where: "Ghulam Rasool's workshop",
      when: "Sept 14 · 10:00",
      priceFrom: 7500,
      kind: "workshop",
    },
    {
      id: "saffron-bazaar",
      title: "Pampore Saffron Bazaar",
      craft: "saffron",
      where: "Pampore Town Hall",
      when: "Nov 1 – Nov 14",
      priceFrom: 0,
      kind: "bazaar",
    },
  ],
  shishur: [
    {
      id: "pashmina-day",
      title: "A Day on the Pashmina Loom",
      craft: "pashmina",
      where: "Kanihama Cooperative",
      when: "Dec 14 · 09:30",
      priceFrom: 8500,
      kind: "workshop",
    },
    {
      id: "kani-class",
      title: "Kani Talim Reading Session",
      craft: "kani",
      where: "Mir Brothers · Sopore",
      when: "Jan 11 · 11:00",
      priceFrom: 7000,
      kind: "workshop",
    },
    {
      id: "winter-bazaar",
      title: "Winter Pashmina Bazaar",
      craft: "pashmina",
      where: "Lal Chowk indoor mart",
      when: "Dec 20 – Feb 8",
      priceFrom: 0,
      kind: "bazaar",
    },
    {
      id: "wicker-walk",
      title: "Wicker Villages Heritage Walk",
      craft: "wicker",
      where: "Hokersar wetlands",
      when: "Sat · 8:00 am",
      priceFrom: 1500,
      kind: "walk",
    },
  ],
};

const KIND_LABEL: Record<SeasonalEvent["kind"], string> = {
  workshop: "Workshop",
  bazaar: "Bazaar",
  walk: "Heritage Walk",
};

export function SeasonalStrip() {
  const season: Season = getCurrentSeason();
  const meta = SEASON_META[season];
  const events = SEASONAL_CATALOGUE[season];

  return (
    <CraftColorProvider season={season} as="section">
      {/* Section background uses the season's "light" tint as a wash */}
      <div
        className="relative"
        style={{
          background:
            "linear-gradient(180deg, var(--bg-primary) 0%, var(--season-light) 25%, var(--season-light) 75%, var(--bg-primary) 100%)",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 md:px-10 py-20 md:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="label-ui" style={{ color: "var(--season-deep)" }}>
                {meta.glyph} {meta.name} · {meta.englishName} · in season now
              </p>
              <h2 className="display-hero text-3xl md:text-5xl text-ink mt-3">
                What's happening this season.
              </h2>
              <p className="font-body text-ink-faded text-base md:text-lg mt-4">
                {meta.tagline}
              </p>
            </div>

            <Link
              href="/workshops"
              className="hidden md:inline-flex items-center gap-2 font-ui text-xs uppercase tracking-[0.18em] text-brand hover:text-brand-light"
            >
              All workshops
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="mt-3">
            <HashiaBorder height={8} color="var(--season-deep)" opacity={0.45} />
          </div>

          {/* Horizontally scrolling card track */}
          <div className="mt-10 -mx-6 md:-mx-10 px-6 md:px-10 overflow-x-auto scrollbar-thin">
            <ul className="flex gap-5 snap-x snap-mandatory pb-4">
              {events.map((e) => (
                <li
                  key={e.id}
                  className="snap-start shrink-0 w-[82%] sm:w-[60%] md:w-[34%] lg:w-[28%]"
                >
                  <EventCard event={e} />
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/workshops"
            className="md:hidden mt-4 inline-flex items-center gap-2 font-ui text-xs uppercase tracking-[0.18em] text-brand"
          >
            All workshops <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </CraftColorProvider>
  );
}

function EventCard({ event }: { event: SeasonalEvent }) {
  const craftLabel = CRAFT_LABEL[event.craft];
  const isFree = event.priceFrom === 0;

  return (
    <article className="relative overflow-hidden surface-card hover-lift h-full flex flex-col">
      {/* Top art tile */}
      <div
        className="relative aspect-[5/3] overflow-hidden"
        style={{
          background:
            "linear-gradient(140deg, var(--season-deep) 0%, var(--season-mid) 100%)",
        }}
      >
        {/* Faint Talim grid + Hashia accent */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 200 120"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 opacity-25"
          aria-hidden="true"
        >
          <defs>
            <pattern id={`t-${event.id}`} width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="3" height="3" fill="var(--season-gold)" />
            </pattern>
          </defs>
          <rect width="200" height="120" fill={`url(#t-${event.id})`} />
        </svg>

        {/* Diagonal saffron thread */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 200 120"
          preserveAspectRatio="none"
          className="absolute inset-0"
          aria-hidden="true"
        >
          <path
            d="M -10 90 C 60 70, 140 40, 220 30"
            fill="none"
            stroke="var(--season-gold)"
            strokeWidth="1"
            opacity="0.65"
          />
          <circle cx="120" cy="56" r="3" fill="var(--season-gold)" />
        </svg>

        {/* Top-left kind badge */}
        <span
          className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-craft text-[10px] font-ui uppercase tracking-[0.16em]"
          style={{
            backgroundColor: "var(--season-light)",
            color: "var(--season-deep)",
          }}
        >
          ◆ {KIND_LABEL[event.kind]}
        </span>

        {/* Bottom-right craft script */}
        <span
          dir="rtl"
          className="absolute bottom-2 right-3 font-nastaliq text-2xl text-ink-inverse/80"
          aria-hidden="true"
        >
          {craftLabel.ur}
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        <p
          className="meta-mono"
          style={{ color: "var(--season-deep)" }}
        >
          {craftLabel.en}
        </p>

        <h3 className="font-display text-xl mt-2 text-ink leading-snug">
          {event.title}
        </h3>

        <dl className="mt-4 space-y-1.5 text-sm font-body text-ink-faded">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-margin">When</dt>
            <dd className="text-right">{event.when}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-margin">Where</dt>
            <dd className="text-right">{event.where}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-margin">From</dt>
            <dd className="text-right text-ink font-ui">
              {isFree ? "Free entry" : `Rs. ${event.priceFrom.toLocaleString("en-IN")}`}
            </dd>
          </div>
        </dl>

        <Link
          href={
            event.kind === "bazaar"
              ? `/bazaar/${event.id}`
              : `/workshop/${event.id}`
          }
          className="mt-5 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-craft font-ui text-xs uppercase tracking-[0.16em] text-ink-inverse"
          style={{ backgroundColor: "var(--season-deep)" }}
        >
          {event.kind === "bazaar" ? "Visit Bazaar" : "Book Now"}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
