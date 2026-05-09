import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  type Craft,
  type Season,
  CRAFT_SEASON,
  SEASONS,
  SEASON_META,
  themeClassForSeason,
} from "@/lib/seasons";
import {
  filterProducts,
  listBundles,
  listCraftsInStorefront,
  listEvents,
  listProducts,
  PRICE_BANDS,
  type PriceBandId,
} from "@/lib/bazaar";

import { HashiaBorder } from "@/components/motifs";
import { LandingFooter } from "@/components/landing/landing-footer";

import { BazaarHero } from "@/components/bazaar/bazaar-hero";
import { EventStrip } from "@/components/bazaar/event-strip";
import { StorefrontFilter } from "@/components/bazaar/storefront-filter";
import { StorefrontGrid } from "@/components/bazaar/storefront-grid";
import { BundleStrip } from "@/components/bazaar/bundle-strip";

/* -------------------------------------------------------------------------
 * /bazaar — The Bazaar Landing
 *
 * Page composition (top → bottom):
 *
 *   1. <BazaarHero>          — dark hero, carved arch SVG behind copy
 *   2. Seasonal Pop-ups      — horizontal scroll of upcoming events
 *                              (live ones pulse), painted in season palette
 *   3. Always-on Storefront  — three-row filter (craft / season / price)
 *                              + Pinterest-style masonry product grid
 *   4. Heritage Bundles      — wide horizontal scroll of bundle cards
 *                              with composite images and bundle Sanad
 *   5. <LandingFooter>       — shared dark walnut footer
 *
 * Filter state lives entirely in URL search params (?craft= &season=
 * &band=) so the back button is meaningful and links can be shared.
 * ----------------------------------------------------------------------- */

export const metadata: Metadata = {
  title: "Bazaar · every piece carries a Sanad",
  description:
    "The Hunarmand Bazaar. Hand-knotted carpets, Pashmina, Kani — verified by Sanad, direct from the master's hands. Seasonal pop-ups, heritage bundles, always-on storefront.",
};

interface BazaarPageProps {
  searchParams: Promise<{
    craft?: string | string[];
    season?: string | string[];
    band?: string | string[];
  }>;
}

const VALID_CRAFTS = Object.keys(CRAFT_SEASON) as Craft[];
const VALID_SEASONS = SEASONS as readonly string[];
const VALID_BANDS = PRICE_BANDS.map((b) => b.id);

function pickOne(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseCraft(v: string | undefined): Craft | null {
  if (v && (VALID_CRAFTS as readonly string[]).includes(v)) return v as Craft;
  return null;
}
function parseSeason(v: string | undefined): Season | null {
  if (v && VALID_SEASONS.includes(v)) return v as Season;
  return null;
}
function parseBand(v: string | undefined): PriceBandId | null {
  if (v && (VALID_BANDS as readonly string[]).includes(v)) return v as PriceBandId;
  return null;
}

export default async function BazaarPage({ searchParams }: BazaarPageProps) {
  const sp = await searchParams;
  const craft = parseCraft(pickOne(sp.craft));
  const season = parseSeason(pickOne(sp.season));
  const band = parseBand(pickOne(sp.band));

  const allProducts = listProducts();
  const filtered = filterProducts({ craft, season, band }, allProducts);

  const events = listEvents();
  const liveEvents = events.filter((e) => e.isLive);
  const bundles = listBundles();
  const craftsAvailable = listCraftsInStorefront();

  return (
    <>
      {/* ─────────────────── 1. HERO ─────────────────── */}
      <BazaarHero />

      {/* ─────────── 2. Seasonal Pop-ups ─────────── */}
      <section
        id="events"
        className="mx-auto max-w-7xl px-5 sm:px-8 pt-14 sm:pt-20 pb-12 sm:pb-16"
      >
        <SectionHeader
          eyebrow={liveEvents.length > 0 ? "Live now & upcoming" : "Upcoming"}
          title="Seasonal pop-up bazaars"
          tagline="Each event painted in its own season. Live entries pulse."
          rightLink={{ label: "All events →", href: "/bazaar/events" }}
        />
        {events.length > 0 ? (
          <EventStrip events={events} />
        ) : (
          <p className="font-serif italic text-ink-faded mt-6">
            The next pop-up will be announced soon. Subscribe in the
            footer for a quiet, four-times-a-year dispatch.
          </p>
        )}
      </section>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <HashiaBorder height={8} color="var(--gold)" opacity={0.55} />
      </div>

      {/* ─────────── 3. Always-on Storefront ─────────── */}
      <section
        id="storefront"
        className="mx-auto max-w-7xl px-5 sm:px-8 pt-14 sm:pt-20 pb-12 sm:pb-16"
      >
        <SectionHeader
          eyebrow="Always on"
          title="The storefront"
          tagline="Every piece here carries a Sanad, or is being made for you on commission."
          rightLink={{ label: "How the Sanad works →", href: "/sanad" }}
        />

        <div className="mt-2">
          <StorefrontFilter
            craftsAvailable={craftsAvailable}
            craft={craft}
            season={season}
            band={band}
          />
        </div>

        <div className="mt-8">
          {filtered.length === 0 ? (
            <StorefrontEmptyState
              craft={craft}
              season={season}
              band={band}
            />
          ) : (
            <>
              <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
                <p className="font-display text-xl text-ink leading-none">
                  {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
                  {(craft || season || band) ? " match your filter" : " in the storefront"}
                </p>
                <p className="meta-mono text-ink-margin">
                  All prices in INR · all pieces ship insured & Sanad-stamped
                </p>
              </header>
              <StorefrontGrid products={filtered} />
            </>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <HashiaBorder height={8} color="var(--gold)" opacity={0.55} />
      </div>

      {/* ─────────── 4. Heritage Bundles ─────────── */}
      <section
        id="bundles"
        className="mx-auto max-w-7xl px-5 sm:px-8 pt-14 sm:pt-20 pb-20 sm:pb-24"
      >
        <SectionHeader
          eyebrow="Curated · composite Sanad"
          title="Heritage bundles"
          tagline="Hand-picked sets — multiple pieces, often multiple masters, signed under a single composite Sanad."
          rightLink={{ label: "All bundles →", href: "/bazaar/bundles" }}
        />
        <BundleStrip bundles={bundles} />
      </section>

      <LandingFooter />
    </>
  );
}

/* ─────────────────── small helpers ─────────────────── */

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  tagline: string;
  rightLink?: { label: string; href: string };
}

function SectionHeader({ eyebrow, title, tagline, rightLink }: SectionHeaderProps) {
  return (
    <header className="mb-7 sm:mb-9 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div>
        <p className="meta-mono text-brand mb-2">❦ {eyebrow}</p>
        <h2
          className="font-display text-ink leading-[1.06] tracking-[-0.005em]"
          style={{ fontSize: "clamp(28px, 3.6vw, 44px)" }}
        >
          {title}
        </h2>
        <p className="font-serif italic text-ink-faded mt-2 max-w-2xl">
          {tagline}
        </p>
      </div>
      {rightLink ? (
        <Link
          href={rightLink.href}
          className="font-ui text-sm text-ink hover:text-brand transition-colors duration-200 self-start sm:self-end"
        >
          {rightLink.label}
        </Link>
      ) : null}
    </header>
  );
}

function StorefrontEmptyState({
  craft,
  season,
  band,
}: {
  craft: Craft | null;
  season: Season | null;
  band: PriceBandId | null;
}) {
  const seasonMeta = season ? SEASON_META[season] : null;
  const bandMeta = band ? PRICE_BANDS.find((b) => b.id === band) : null;
  return (
    <div
      className={[
        season ? themeClassForSeason(season) : "",
        "max-w-2xl mx-auto text-center py-12 sm:py-16",
      ].join(" ")}
    >
      <p className="meta-mono text-season-deep">
        {seasonMeta ? `${seasonMeta.glyph} ${seasonMeta.englishName}` : "No matches"}
      </p>
      <h3 className="font-display text-3xl sm:text-4xl text-ink mt-3 leading-tight">
        Nothing matches that filter — yet.
      </h3>
      <p className="font-serif italic text-ink-faded mt-3">
        {craft && season
          ? `${SEASON_META[season]?.englishName} ${craft} pieces aren't on the floor right now.`
          : craft
            ? `No ${craft} pieces ${bandMeta ? `in ${bandMeta.label.toLowerCase()}` : ""}.`
            : season
              ? `Nothing in ${SEASON_META[season]!.englishName} ${bandMeta ? `at ${bandMeta.label.toLowerCase()}` : "right now"}.`
              : "Try widening the price band."}
      </p>
      <p className="mt-6">
        <Link
          href="/bazaar#storefront"
          className="inline-flex items-center px-4 py-2 rounded-craft border border-line text-ink hover:border-season-deep hover:text-season-deep transition-colors min-h-11 font-ui text-sm"
        >
          Show every piece →
        </Link>
      </p>
    </div>
  );
}
