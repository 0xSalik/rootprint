import * as React from "react";

import {
  type Artisan,
  type Craft,
  initialsFor,
  ordinalGen,
  paletteVars,
} from "../../../lib/data";
import { HashiaBorder, TalimTexture } from "@/components/motifs";

/* -------------------------------------------------------------------------
 * <ArtisanBanner />
 *
 * Full-bleed hero band at the top of the artisan profile page.
 *
 *   • Background — diagonal gradient from --season-deep to
 *     --season-mid, plus a Talim grid laid in at 7% opacity
 *   • Left column —
 *       Koshur/Urdu craft name (Cormorant italic, gold)
 *       Artisan name (Cormorant 52 px, white)
 *       Generation · Craft · Location (Jost 15 px, gold-light)
 *       Lineage dots — filled for living gens, outlined for past
 *   • Right column —
 *       Circular portrait (200 px) with a craft-season ring,
 *       a white inner ring, the artisan's initials in Cormorant
 *       white, and a "SANAD VERIFIED ✓" gold pill at the bottom
 *   • Bottom edge — a Hashia border that transitions from the
 *     mid palette tone into the parchment surface below
 *
 * The banner reserves 400 px of height on desktop, 260 px on
 * mobile. The fixed nav sits over its very top — that's why the
 * inner padding starts at pt-32 on the left column.
 * ----------------------------------------------------------------------- */

interface ArtisanBannerProps {
  artisan: Artisan;
  craft: Craft;
}

export function ArtisanBanner({ artisan, craft }: ArtisanBannerProps) {
  const p = paletteVars(craft.palette);
  const lineageDots = Array.from(
    { length: artisan.generation },
    (_, i) => i + 1 === artisan.generation,
  );

  return (
    <section
      className="relative isolate text-ink-inverse overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${p.deep} 0%, ${p.mid} 100%)`,
        minHeight: "400px",
      }}
    >
      <TalimTexture
        className="absolute inset-0 w-full h-full text-ink-inverse pointer-events-none"
        opacity={0.07}
      />

      {/* Dark gradient overlay on the left for legibility */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0) 100%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 pt-28 sm:pt-36 pb-10 sm:pb-14 grid grid-cols-1 md:grid-cols-[1fr_240px] gap-8 md:gap-12 items-center min-h-[260px] md:min-h-[400px]">
        {/* Left column */}
        <div className="flex flex-col gap-3 sm:gap-4 animate-stagger-up">
          <p
            dir="rtl"
            lang="ur"
            className="font-nastaliq italic text-[16px] sm:text-[18px] text-gold-light/90"
          >
            {craft.nameUrdu} · {craft.name}
          </p>

          <h1 className="display-hero text-[40px] sm:text-[52px] md:text-[58px] text-ink-inverse leading-[1.02]">
            {artisan.name}
          </h1>

          <p className="font-ui text-[14px] sm:text-[15px] text-gold-light/85 tracking-wide">
            {ordinalGen(artisan.generation)} · {craft.name} ·{" "}
            {artisan.village}, {artisan.district}
          </p>

          {/* Lineage dots */}
          <div className="flex items-center gap-2 mt-1.5" aria-label={`${artisan.generation} generations`}>
            {lineageDots.map((isCurrent, i) => (
              <span
                key={i}
                aria-hidden="true"
                className="inline-block rounded-full"
                style={{
                  width: isCurrent ? 14 : 9,
                  height: isCurrent ? 14 : 9,
                  backgroundColor: isCurrent ? p.gold : "transparent",
                  border: isCurrent ? `2px solid ${p.gold}` : "1.5px solid rgba(232, 196, 138, 0.6)",
                }}
              />
            ))}
            <span className="ml-2 meta-mono text-ink-inverse/60">
              {artisan.lineageEstYear}+ · {artisan.generation} gens
            </span>
          </div>

          <p className="font-body italic text-[15px] sm:text-[16px] leading-relaxed text-ink-inverse/80 max-w-2xl mt-2 sm:mt-3">
            &ldquo;{artisan.irreplaceable}&rdquo;
          </p>
        </div>

        {/* Right column — portrait */}
        <div className="flex justify-center md:justify-end">
          <div className="relative">
            {/* Outer craft-season ring */}
            <div
              className="rounded-full p-1"
              style={{
                width: 200,
                height: 200,
                backgroundColor: p.gold,
              }}
            >
              {/* Inner white ring */}
              <div
                className="rounded-full p-1 w-full h-full"
                style={{ backgroundColor: "rgba(255,255,255,0.95)" }}
              >
                {/* Initials avatar */}
                <div
                  className="rounded-full w-full h-full flex items-center justify-center font-display text-[44px] text-ink-inverse"
                  style={{ backgroundColor: p.deep }}
                >
                  {initialsFor(artisan.name)}
                </div>
              </div>
            </div>

            {/* SANAD VERIFIED pill — bottom of the circle */}
            <span
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-ui text-[11px] tracking-[0.12em] uppercase whitespace-nowrap"
              style={{
                backgroundColor: p.gold,
                color: p.deep,
                boxShadow: "0 4px 14px -6px rgba(0,0,0,0.4)",
              }}
            >
              <Seal />
              Sanad Verified ✓
            </span>
          </div>
        </div>
      </div>

      {/* Hashia at the bottom — transitions banner → parchment */}
      <div className="relative">
        <HashiaBorder
          className="block w-full"
          color={p.gold}
          opacity={0.9}
          height={14}
        />
      </div>
    </section>
  );
}

function Seal() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.1" />
      <path d="M3.6 5.7 L4.9 7 L7.6 4.2" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
