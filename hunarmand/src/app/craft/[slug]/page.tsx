import * as React from "react";
import { notFound } from "next/navigation";

import {
  CRAFT_SLUGS,
  type CraftSlug,
  getArtisansByCraft,
  getCraft,
  paletteVars,
  themeClassForPalette,
} from "../../../../lib/data";
import { ArtisanCard } from "@/components/preview/artisan-card";
import { CraftIcon } from "@/components/preview/craft-icons";
import { SiteFooter } from "@/components/site/site-footer";
import { HashiaBorder, TalimTexture } from "@/components/motifs";

/* -------------------------------------------------------------------------
 * /craft/[slug] — "Meet the Masters" listing for one craft
 *
 *   • Full-width hero painted in the craft's seasonal deep tone, with
 *     the Talim grid laid in at low opacity and the craft icon in a
 *     ribboned circle to the right of the title block
 *   • A Hashia border in the craft's gold tone underlines the hero
 *   • Below the hero: section title and a 3-card grid of artisans
 *
 * SSG: every craft slug from `lib/data` is pre-rendered.
 * ----------------------------------------------------------------------- */

export function generateStaticParams() {
  return CRAFT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const craft = getCraft(slug);
  if (!craft) return {};
  return {
    title: `${craft.name} · Hunarmand`,
    description: craft.description,
  };
}

export default async function CraftPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const craft = getCraft(slug);
  if (!craft) notFound();

  const artisans = getArtisansByCraft(slug as CraftSlug);
  const p = paletteVars(craft.palette);
  const themeClass = themeClassForPalette(craft.palette);

  return (
    <div className={themeClass}>
      {/* ───────── Hero ───────── */}
      <section
        className="relative isolate text-ink-inverse overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${p.deep} 0%, ${p.mid} 100%)`,
        }}
      >
        <TalimTexture
          className="absolute inset-0 w-full h-full text-ink-inverse pointer-events-none"
          opacity={0.08}
        />

        {/* Soft vignette */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(80% 60% at 20% 50%, rgba(0,0,0,0.18), transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 pt-32 sm:pt-40 pb-16 sm:pb-20 grid grid-cols-1 md:grid-cols-[1fr_220px] gap-10 items-center">
          <div className="flex flex-col gap-5 animate-stagger-up">
            <p className="label-ui text-ink-inverse/65">Hunarmand · Living craft</p>

            <div className="flex items-baseline gap-5 flex-wrap">
              <h1 className="display-hero text-[44px] sm:text-[56px] md:text-[64px] text-ink-inverse leading-[1.02]">
                {craft.name}
              </h1>
              <span
                dir="rtl"
                lang="ur"
                className="font-nastaliq text-[28px] sm:text-[32px] text-ink-inverse/85"
              >
                {craft.nameUrdu}
              </span>
            </div>

            <p className="font-body text-[16px] sm:text-[18px] leading-relaxed text-ink-inverse/85 max-w-2xl">
              {craft.longDescription}
            </p>

            <p className="font-ui text-[13px] tracking-wide uppercase text-ink-inverse/65 mt-2">
              {artisans.length} verified masters · workshops year-round
            </p>
          </div>

          {/* Right side: ribboned craft icon */}
          <div className="hidden md:flex justify-center">
            <div
              className="w-[180px] h-[180px] rounded-full flex items-center justify-center"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: `1px solid ${p.gold}`,
                boxShadow: `0 0 0 6px rgba(255,255,255,0.04), inset 0 0 0 4px ${p.gold}33`,
              }}
            >
              <CraftIcon
                kind={craft.iconKey}
                size={120}
                strokeWidth={1.2}
                className="text-ink-inverse"
              />
            </div>
          </div>
        </div>

        {/* Hashia border at the bottom edge of the hero */}
        <HashiaBorder
          className="block w-full"
          color={p.gold}
          opacity={0.9}
          height={14}
        />
      </section>

      {/* ───────── Meet the Masters ───────── */}
      <section className="bg-parchment py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <p className="label-ui text-ink-margin mb-3">
              Three living masters
            </p>
            <h2 className="font-display text-[32px] sm:text-[40px] text-ink leading-tight">
              Meet the Masters
            </h2>
            <p className="font-body italic text-[15px] sm:text-[16px] text-ink-faded mt-3 max-w-xl mx-auto">
              Each profile opens the master&apos;s Vault — what only they
              know, captured for the people who come next.
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 stagger-children">
            {artisans.map((a) => (
              <ArtisanCard key={a.slug} artisan={a} craft={craft} />
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
