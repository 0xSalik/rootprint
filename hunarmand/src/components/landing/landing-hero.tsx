import * as React from "react";
import Link from "next/link";

import { HashiaBorder, TalimTexture } from "@/components/motifs";

import { LandingNav } from "./landing-nav";
import { HeroArt } from "./hero-art";

/* -------------------------------------------------------------------------
 * <LandingHero />
 *
 * Full-viewport dark section. Talim grid texture at low opacity. Left
 * 60% (desktop): tagline → headline → subhead → two CTAs. Right 40%:
 * stylized fiber abstract that fades vignette-style into the walnut
 * background. Hashia border closes the section at the bottom.
 * ----------------------------------------------------------------------- */

export function LandingHero() {
  return (
    <section className="relative bg-walnut text-ink-inverse overflow-hidden">
      {/* Talim texture sits behind everything */}
      <TalimTexture opacity={0.06} />

      {/* Hero art — absolutely positioned right half on desktop, hidden
          on mobile (the headline already carries the weight). */}
      <div
        className="hidden md:block absolute inset-y-0 right-0 w-[55%] pointer-events-none"
        aria-hidden="true"
      >
        <HeroArt className="w-full h-full" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-10">
        <LandingNav />

        <div className="grid md:grid-cols-12 gap-10 md:gap-12 pt-16 pb-24 md:pt-24 md:pb-32 min-h-[calc(100vh-6rem)]">
          {/* Left 60% — content */}
          <div className="md:col-span-7 flex flex-col justify-center stagger-children">
            <p className="display-italic text-ink-inverse/65 text-base md:text-lg max-w-md">
              The hand still remembers what the book never wrote.
            </p>

            <h1 className="display-hero mt-5 text-4xl sm:text-5xl md:text-6xl text-ink-inverse leading-[1.04] max-w-2xl">
              Kashmir's masters are dying.
              <br />
              <span className="text-ink-inverse">
                Their knowledge dies with them.
              </span>
            </h1>

            <p className="font-body text-ink-inverse/70 mt-6 text-lg leading-relaxed max-w-xl">
              Hunarmand captures the unwritten — the technique, the memory,
              the lineage — before it is gone.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/directory"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-craft bg-brand text-ink-inverse font-ui text-sm uppercase tracking-[0.16em] transition-all duration-200 hover:bg-brand-light hover:translate-y-[-1px] hover:shadow-[0_12px_28px_-12px_rgba(196,69,74,0.6)]"
              >
                Explore Masters
                <span
                  className="transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>

              <Link
                href="/vault/new"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-craft border border-ink-inverse/30 text-ink-inverse font-ui text-sm uppercase tracking-[0.16em] transition-all duration-200 hover:border-gold hover:text-gold"
              >
                Record Your Craft
                <span
                  className="transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            </div>

            {/* Provenance note — small, low-key, builds trust below CTAs */}
            <p className="mt-10 meta-mono text-ink-inverse/45 max-w-md">
              <span className="text-gold-light">◆</span>&nbsp; Every artisan
              on Hunarmand carries a Sanad — a verified, cryptographically
              signed record of their craft lineage.
            </p>
          </div>

          {/* Right 40% — visual hand-off (desktop has the SVG behind;
              this column reserves layout space). On mobile, show the
              SVG inline as a textured tile beneath the content. */}
          <div className="md:col-span-5">
            <div className="md:hidden mt-2 rounded-craft-lg overflow-hidden border border-ink-inverse/15 aspect-[4/3]">
              <HeroArt className="w-full h-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Hashia divider — gold, full width */}
      <div className="relative z-10">
        <HashiaBorder height={12} color="var(--gold)" />
      </div>
    </section>
  );
}
