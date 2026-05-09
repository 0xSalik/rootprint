import * as React from "react";
import Link from "next/link";

import {
  SEASON_META,
  themeClassForSeason,
} from "@/lib/seasons";
import {
  type BazaarEvent,
  formatDateRange,
} from "@/lib/bazaar";

/* -------------------------------------------------------------------------
 * <EventCard />
 *
 * A featured seasonal-pop-up card. Painted entirely in its own
 * season's palette — even when the surrounding strip carries a
 * different ambient theme — so the row reads as four distinct
 * places, not four rows of grey.
 *
 * Live events get a pulsing red dot in the top-right corner.
 *
 *   ┌────────────────────────────────────────┐
 *   │                  [● Live now]          │  ← only when isLive
 *   │  ❄ Shishur · Winter                    │
 *   │  Winter Pashmina                       │
 *   │  Bazaar                                │
 *   │  Polo View · Srinagar                  │
 *   │  12 – 21 Dec 2026 · 22 masters         │
 *   │  ─────                                 │
 *   │  Twenty-two pashmina masters, ten      │
 *   │  loom-side demos a day, kahwa on us.   │
 *   │  84 day passes left      [RSVP →]      │
 *   └────────────────────────────────────────┘
 * ----------------------------------------------------------------------- */

interface EventCardProps {
  event: BazaarEvent;
}

export function EventCard({ event }: EventCardProps) {
  const meta = SEASON_META[event.season];
  return (
    <article
      className={[
        themeClassForSeason(event.season),
        "group relative overflow-hidden rounded-craft-lg border bg-paper",
        "border-line hover-lift",
        "min-w-[300px] max-w-[340px] sm:min-w-[340px] sm:max-w-[380px]",
        "snap-start flex flex-col",
      ].join(" ")}
    >
      {/* Live indicator — top right, pulses */}
      {event.isLive ? <LiveBadge /> : null}

      {/* Top photo-area — a wash of season palette + season glyph */}
      <div
        className="relative h-36 sm:h-40 overflow-hidden border-b border-line"
        style={{
          backgroundImage:
            "linear-gradient(135deg, var(--season-light) 0%, color-mix(in oklab, var(--season-light) 60%, var(--season-mid) 40%) 100%)",
        }}
      >
        {/* Decorative motif: huge faint glyph + four-pointed marquee dots */}
        <span
          aria-hidden="true"
          className="absolute -right-3 -bottom-3 select-none font-display text-[120px] leading-none"
          style={{ color: "var(--season-deep)", opacity: 0.18 }}
        >
          {meta.glyph}
        </span>
        <ChinarTucked />
        <p
          className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-craft text-[11px] font-ui tracking-[0.16em] uppercase"
          style={{
            backgroundColor: "rgba(28, 20, 16, 0.78)",
            color: "var(--season-gold)",
          }}
        >
          <span aria-hidden="true">{meta.glyph}</span>
          {meta.name} · {meta.englishName}
        </p>
      </div>

      {/* Body */}
      <div className="px-5 pt-5 pb-6 flex-1 flex flex-col gap-3">
        <header>
          <h3 className="font-display text-[22px] sm:text-[24px] text-ink leading-tight">
            {event.name}
          </h3>
          <p className="meta-mono text-ink-margin mt-1.5">
            {event.venue} · {event.city}
          </p>
        </header>

        <ul className="space-y-1.5 text-sm font-body text-ink-faded">
          <li className="flex items-start gap-2">
            <DateIcon />
            <span>{formatDateRange(event.startsOn, event.endsOn)}</span>
          </li>
          <li className="flex items-start gap-2">
            <MasterIcon />
            <span>
              {event.artisanCount} master{event.artisanCount === 1 ? "" : "s"} on the floor
            </span>
          </li>
        </ul>

        <p className="font-body text-sm text-ink-faded leading-snug line-clamp-3">
          {event.blurb}
        </p>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-line flex items-end justify-between gap-3">
          <div>
            <p className="meta-mono text-season-deep">
              {event.seatsLeft > 0 ? `${event.seatsLeft} day passes left` : "Free entry"}
            </p>
            <p className="meta-mono text-ink-margin mt-1">
              Featured: {event.featuredCrafts.join(" · ")}
            </p>
          </div>
          <Link
            href={`/bazaar/events/${event.id}`}
            className="inline-flex items-center justify-center px-4 py-2 rounded-craft font-ui text-sm tracking-wide min-h-11 transition-colors duration-200"
            style={{
              backgroundColor: "var(--season-deep)",
              color: "var(--text-inverse)",
            }}
            aria-label={`RSVP to ${event.name}`}
          >
            RSVP <span className="ml-1.5" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ─────────────────────────── live badge ───────────────────────── */

function LiveBadge() {
  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded-full bg-walnut/80 backdrop-blur-sm">
      <span className="relative inline-flex">
        <span className="absolute inline-flex h-2 w-2 rounded-full bg-brand opacity-75 animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
      </span>
      <span className="meta-mono text-[10px] tracking-[0.18em] uppercase text-ink-inverse/90">
        Live now
      </span>
    </div>
  );
}

/* ─────────────────────────── small icons ───────────────────────── */

function DateIcon() {
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
      className="text-season-deep mt-0.5 shrink-0"
    >
      <rect x="2" y="3.5" width="12" height="11" rx="1" />
      <line x1="2" y1="7" x2="14" y2="7" />
      <line x1="5" y1="2" x2="5" y2="5" />
      <line x1="11" y1="2" x2="11" y2="5" />
    </svg>
  );
}

function MasterIcon() {
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
      className="text-season-deep mt-0.5 shrink-0"
    >
      <circle cx="8" cy="5" r="2.6" />
      <path d="M2.5 14 c 1.4 -3 4 -4.2 5.5 -4.2 c 1.5 0 4.1 1.2 5.5 4.2" />
    </svg>
  );
}

function ChinarTucked() {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 42 42"
      fill="none"
      stroke="var(--season-deep)"
      strokeWidth="0.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="absolute top-3 right-3 opacity-50"
      aria-hidden="true"
    >
      <path d="M21 4 c 4 6 9 7 14 6 c -2 6 -6 9 -10 9 c 4 4 5 9 4 13 c -5 -2 -8 -6 -8 -10 c -3 4 -8 5 -13 4 c 1 -5 5 -8 9 -9 c -4 -3 -6 -8 -5 -13 c 4 1 7 4 9 0 Z" />
    </svg>
  );
}
