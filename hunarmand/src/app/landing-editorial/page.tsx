import * as React from "react";

import { LandingHero } from "@/components/landing/landing-hero";
import { CraftCounterStrip } from "@/components/landing/craft-counter-strip";
import { FourLayersSection } from "@/components/landing/four-layers-section";
import { SeasonalStrip } from "@/components/landing/seasonal-strip";
import { ArtisanSpotlight } from "@/components/landing/artisan-spotlight";
import { KnowledgeMoat } from "@/components/landing/knowledge-moat";
import { LandingFooter } from "@/components/landing/landing-footer";

/* -------------------------------------------------------------------------
 * /landing-editorial — the original 7-section editorial landing,
 * preserved here so the new craft-entry-point Home (`/`) can take
 * over the root route per the multi-page preview brief.
 * ----------------------------------------------------------------------- */

export const metadata = {
  title: "Hunarmand · Editorial preview",
  description:
    "The editorial seven-section preview of the Hunarmand landing — preserved alongside the craft-entry-point home.",
};

export default function LandingEditorialPage() {
  return (
    <>
      <LandingHero />
      <CraftCounterStrip />
      <FourLayersSection />
      <SeasonalStrip />
      <ArtisanSpotlight />
      <KnowledgeMoat />
      <LandingFooter />
    </>
  );
}
