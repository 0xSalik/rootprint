import * as React from "react";
import Link from "next/link";

import {
  type Artisan,
  type Craft,
  initialsFor,
  ordinalGen,
  paletteVars,
} from "../../../lib/data";

/* -------------------------------------------------------------------------
 * <ArtisanCard />
 *
 * One master on the /craft/[slug] grid. Card body is paper-coloured,
 * the top ribbon is the craft's deep palette tone, and the avatar
 * carries the same colour. The "Sanad Verified" gold pill, the
 * generation badge, and the two CTAs are placed in fixed positions
 * so all three cards on a row align cleanly.
 * ----------------------------------------------------------------------- */

interface ArtisanCardProps {
  artisan: Artisan;
  craft: Craft;
}

export function ArtisanCard({ artisan, craft }: ArtisanCardProps) {
  const p = paletteVars(craft.palette);

  return (
    <article
      className="relative flex flex-col rounded-craft-lg overflow-hidden surface-card hover-lift"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "transparent",
      }}
    >
      {/* Top ribbon */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: p.deep }}
      />

      <div className="px-6 pt-9 pb-7 flex flex-col gap-4 min-h-[420px]">
        {/* Avatar + verified pill */}
        <div className="flex items-start justify-between">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full font-display text-[22px] text-ink-inverse"
            style={{ backgroundColor: p.deep }}
          >
            {initialsFor(artisan.name)}
          </div>

          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-ui text-[11px] tracking-[0.08em] uppercase"
            style={{
              backgroundColor: "var(--brand-subtle)",
              color: "var(--brand)",
            }}
          >
            <Seal />
            Sanad Verified
          </span>
        </div>

        {/* Name + generation */}
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-[22px] leading-tight text-ink">
            {artisan.name}
          </h3>
          <p
            className="font-ui text-[12px] tracking-wide uppercase"
            style={{ color: p.deep }}
          >
            {ordinalGen(artisan.generation)} · {craft.name}
          </p>
        </div>

        {/* Location */}
        <p className="inline-flex items-center gap-1.5 font-ui text-[13px] text-ink-margin">
          <Pin />
          {artisan.village}, {artisan.district}
        </p>

        {/* Bio */}
        <p className="font-body italic text-[14px] leading-relaxed text-ink-faded line-clamp-3">
          {artisan.bio}
        </p>

        <div className="flex-1" />

        {/* CTAs */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Link
            href={`/artisan/${artisan.slug}`}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-craft bg-brand hover:bg-brand-light text-ink-inverse font-ui text-[13px] tracking-wide transition-colors min-h-10"
          >
            View Profile
          </Link>
          <Link
            href={`/booking/${artisan.slug}/heritage-walk`}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-craft border border-line text-ink hover:border-brand hover:text-brand font-ui text-[13px] tracking-wide transition-colors min-h-10"
          >
            Book Workshop
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ─────────────────────────── glyphs ───────────────────────────── */

function Seal() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1" />
      <path d="M3.6 5.7 L4.9 7 L7.6 4.2" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Pin() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <path d="M5.5 1 C 3.5 1 2 2.6 2 4.6 C 2 7.2 5.5 10 5.5 10 C 5.5 10 9 7.2 9 4.6 C 9 2.6 7.5 1 5.5 1 Z" stroke="currentColor" strokeWidth="1" fill="none" strokeLinejoin="round" />
      <circle cx="5.5" cy="4.6" r="1.2" stroke="currentColor" strokeWidth="1" fill="none" />
    </svg>
  );
}
