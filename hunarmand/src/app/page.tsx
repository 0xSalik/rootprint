import * as React from "react";

import { listCrafts } from "../../lib/data";
import { CraftCard } from "@/components/preview/craft-card";
import { SiteFooter } from "@/components/site/site-footer";
import { HashiaBorder, TalimTexture } from "@/components/motifs";

/* -------------------------------------------------------------------------
 * /  — Home (Craft Entry Point)
 *
 * Two sections + footer:
 *
 *   1. Dark full-viewport hero with a faint Talim grid (the
 *      Kashmiri talim notation, here just an atmospheric texture)
 *      and a hand-drawn Hashia border under the title block
 *   2. "Choose a Craft" — six entry cards in a 3 × 2 grid, each
 *      painted in its own seasonal palette and linking to
 *      /craft/[slug]
 *
 * The hero starts at viewport top:0 so the fixed <SiteNav /> reads
 * as transparent over it, then fades to a solid parchment bar once
 * the user scrolls past the hero.
 * ----------------------------------------------------------------------- */

export const metadata = {
  title: "Hunarmand · Kashmir's Living Crafts",
  description:
    "Six heritage crafts. Eighteen verified masters. Explore the masters, book an experience, preserve a legacy.",
};

export default function HomePage() {
  const crafts = listCrafts();

  return (
    <>
      {/* ────────────── Hero ────────────── */}
      <section className="relative isolate min-h-[100svh] flex flex-col bg-walnut text-ink-inverse overflow-hidden">
        {/* Talim grid overlay */}
        <TalimTexture
          className="absolute inset-0 w-full h-full text-gold-light pointer-events-none"
          opacity={0.06}
        />

        {/* Vertical gradient — pulls focus to the title block */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 38%, rgba(200, 151, 90, 0.10), transparent 70%)",
          }}
        />

        <div className="relative flex-1 flex items-center">
          <div className="mx-auto max-w-5xl px-5 sm:px-8 pt-28 sm:pt-36 pb-16 text-center w-full animate-stagger-up">
            <p className="display-italic text-[18px] sm:text-[22px] text-gold-light/85 mb-6 sm:mb-8">
              &ldquo;The hand still remembers what the book never wrote.&rdquo;
            </p>

            <h1 className="display-hero text-[44px] sm:text-[56px] md:text-[64px] text-ink-inverse mb-5 sm:mb-7">
              Kashmir&apos;s Living Crafts
            </h1>

            <p className="font-body text-[16px] sm:text-[18px] leading-relaxed text-ink-inverse/75 max-w-2xl mx-auto">
              Explore the masters. Book an experience. Preserve a legacy.
            </p>

            {/* Gold Hashia under the hero block */}
            <div className="mt-10 sm:mt-12 flex justify-center">
              <HashiaBorder
                className="w-[280px] sm:w-[420px] text-gold"
                color="var(--gold)"
                opacity={0.85}
                height={14}
              />
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#crafts"
                className="inline-flex items-center justify-center px-5 py-3 rounded-craft bg-gold text-ink font-ui text-[13px] tracking-wide hover:bg-gold-light transition-colors min-h-11"
              >
                Choose a Craft ↓
              </a>
              <a
                href="/demo"
                className="inline-flex items-center justify-center px-5 py-3 rounded-craft border border-ink-inverse/30 text-ink-inverse font-ui text-[13px] tracking-wide hover:border-gold-light hover:text-gold-light transition-colors min-h-11"
              >
                See a guided demo
              </a>
            </div>
          </div>
        </div>

        {/* Bottom whisper — scroll prompt */}
        <div className="relative pb-8 flex justify-center">
          <span className="meta-mono text-ink-inverse/45">
            scroll · choose a craft
          </span>
        </div>
      </section>

      {/* ────────────── Choose a Craft ────────────── */}
      <section
        id="crafts"
        className="bg-parchment py-16 sm:py-24 scroll-mt-24"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <p className="label-ui text-ink-margin mb-3">Six living crafts</p>
            <h2 className="font-display text-[32px] sm:text-[40px] text-ink leading-tight">
              Choose a Craft
            </h2>
            <p className="font-body italic text-[15px] sm:text-[16px] text-ink-faded mt-3 max-w-xl mx-auto">
              Every craft below is held by three masters whose hands carry
              what no book recorded.
            </p>
            <div className="mt-6 flex justify-center">
              <HashiaBorder
                className="w-40 text-gold"
                color="var(--gold)"
                opacity={0.7}
                height={12}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 stagger-children">
            {crafts.map((c) => (
              <CraftCard key={c.slug} craft={c} />
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
