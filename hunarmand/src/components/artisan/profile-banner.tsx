import * as React from "react";

import { HashiaBorder } from "@/components/motifs";
import type { Artisan } from "@/lib/artisans";

import { BannerArt } from "./banner-art";
import { LineageDots } from "./lineage-dots";
import { PortraitAvatar } from "./portrait-avatar";
import { SanadBadge } from "./sanad-badge";

/* -------------------------------------------------------------------------
 * <ProfileBanner /> — section 3a.
 *
 * Full-width immersive panel — 280px tall on mobile, 420px on desktop.
 * Background: <BannerArt /> showing the craft material, colour-graded
 * to the season palette. Left content: craft name in Nastaliq, the
 * artisan's name in Cormorant 52px, then a Jost meta line, then the
 * lineage dots. Right side: 180px circular portrait with the Sanad
 * badge anchored to its lower edge. The Hashia border closes the
 * panel and transitions into the page below.
 * ----------------------------------------------------------------------- */

interface ProfileBannerProps {
  artisan: Artisan;
}

const ORDINAL = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];

export function ProfileBanner({ artisan }: ProfileBannerProps) {
  return (
    <section
      aria-label="Artisan profile banner"
      className="relative overflow-hidden bg-walnut"
    >
      {/* Background art */}
      <div className="absolute inset-0">
        <BannerArt craft={artisan.craft} className="w-full h-full" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-10 min-h-[280px] md:min-h-[420px] py-8 md:py-12 flex flex-col md:flex-row items-stretch md:items-center gap-6 md:gap-10">
        {/* Left content (over the dark gradient) */}
        <div className="flex-1 flex flex-col justify-center text-ink-inverse stagger-children">
          <p
            dir="rtl"
            className="font-display italic text-base md:text-lg text-gold leading-tight"
            aria-label={`Craft name in Urdu: ${artisan.craftUrdu}`}
          >
            {artisan.craftUrdu}
          </p>

          <h1 className="display-hero mt-2 text-4xl md:text-[3.25rem] text-ink-inverse leading-[1.04]">
            {artisan.name}
          </h1>

          <p className="font-ui text-[15px] uppercase tracking-[0.16em] text-gold-light/95 mt-3">
            {ORDINAL[artisan.generation] ?? `${artisan.generation}th`} Generation
            <span className="mx-2 text-gold-light/50">·</span>
            {artisan.craftEnglish}
            <span className="mx-2 text-gold-light/50">·</span>
            {artisan.village}, {artisan.district}
          </p>

          <div className="mt-6">
            <LineageDots lineage={artisan.lineage} />
          </div>

          <p className="mt-6 max-w-xl font-body italic text-ink-inverse/80 text-base md:text-lg leading-relaxed">
            <span aria-hidden="true" className="text-gold-light mr-2">✦</span>
            {artisan.irreplaceable}
          </p>
        </div>

        {/* Right portrait */}
        <div className="relative shrink-0 self-center">
          <PortraitAvatar name={artisan.name} size={180} />
          <span
            className="absolute left-1/2 -translate-x-1/2"
            style={{ bottom: -14 }}
          >
            <SanadBadge level={artisan.sanadLevel} size="md" />
          </span>
        </div>
      </div>

      {/* Bottom Hashia transitions to bg-primary */}
      <div className="relative z-10">
        <HashiaBorder
          height={12}
          color="var(--season-gold)"
          variant="line"
        />
      </div>
    </section>
  );
}
