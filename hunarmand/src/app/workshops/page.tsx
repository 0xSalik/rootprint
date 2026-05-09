import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  getCurrentSeason,
  SEASONS,
  SEASON_META,
  themeClassForSeason,
  type Season,
} from "@/lib/seasons";
import {
  listWorkshops,
  workshopsBySeason,
} from "@/lib/workshops";
import { HashiaBorder } from "@/components/motifs";
import { LandingFooter } from "@/components/landing/landing-footer";

import { SeasonPills } from "@/components/workshops/season-pill";
import { WorkshopCard } from "@/components/workshops/workshop-card";

/* -------------------------------------------------------------------------
 * /workshops — Workshop Discovery
 *
 * - Hero strip painted in the *current* ambient season (by date)
 * - Season pill row that filters via ?season=
 * - 3-column WorkshopCard grid (responsive)
 * - When the filter is empty, an honest "Spring workshops typically
 *   open in March" copy block (the demo masters happen to work in
 *   Harud and Shishur)
 * ----------------------------------------------------------------------- */

export const metadata: Metadata = {
  title: "Workshops · sit beside the master at the loom",
  description:
    "Hand-knotted carpets, pashmina, kani — book a workshop with a verified Hunarmand master. Half-day at the loom, multi-day immersions, virtual sessions, heritage walks.",
};

interface WorkshopsPageProps {
  searchParams: Promise<{ season?: string | string[] }>;
}

export default async function WorkshopsPage({ searchParams }: WorkshopsPageProps) {
  const sp = await searchParams;
  const requested = Array.isArray(sp.season) ? sp.season[0] : sp.season;
  const filterSeason: Season | null =
    requested && (SEASONS as readonly string[]).includes(requested)
      ? (requested as Season)
      : null;

  const ambient = getCurrentSeason();
  const heroSeason = filterSeason ?? ambient;
  const heroMeta = SEASON_META[heroSeason];

  const all = listWorkshops();
  const visible = filterSeason ? workshopsBySeason(filterSeason) : all;

  return (
    <>
      {/* ============================ HERO ============================ */}
      <section
        className={`${themeClassForSeason(heroSeason)} relative overflow-hidden border-b border-line`}
        style={{ backgroundColor: "var(--season-light)" }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(120% 80% at 90% -10%, var(--season-mid) 0%, transparent 60%), radial-gradient(80% 60% at -10% 110%, var(--season-deep) 0%, transparent 55%)",
          }}
        />
        <HashiaBorder
          height={6}
          color="var(--season-gold)"
          opacity={0.55}
          className="absolute inset-x-0 top-0"
        />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8 pt-12 sm:pt-16 pb-10 sm:pb-12">
          <div className="flex flex-wrap items-baseline gap-3 mb-3">
            <p className="meta-mono text-ink-margin">
              {heroMeta.glyph} {heroMeta.name} · {heroMeta.englishName}
              {filterSeason ? "" : " · today's ambient season"}
            </p>
          </div>
          <h1
            className="font-display text-ink leading-[1.04] max-w-3xl"
            style={{ fontSize: "clamp(36px, 5vw, 60px)", letterSpacing: "-0.01em" }}
          >
            Sit beside the master at the loom.
          </h1>
          <p className="font-serif italic text-ink-faded mt-3 max-w-2xl">
            {heroMeta.tagline}
          </p>

          <div className="mt-7 sm:mt-9">
            <SeasonPills current={filterSeason} basePath="/workshops" />
          </div>
        </div>
      </section>

      {/* ============================ GRID ============================ */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 py-12 sm:py-16">
        {visible.length === 0 ? (
          <SeasonEmptyState season={filterSeason!} />
        ) : (
          <>
            <header className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl sm:text-3xl text-ink leading-tight">
                {filterSeason
                  ? `${SEASON_META[filterSeason].englishName} workshops`
                  : "Every workshop on Hunarmand"}
              </h2>
              <p className="meta-mono text-ink-margin">
                {visible.length} {visible.length === 1 ? "workshop" : "workshops"}
                {filterSeason ? "" : " · all four seasons in time"}
              </p>
            </header>

            <ul
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7"
              role="list"
            >
              {visible.map((w) => (
                <li key={w.offering.id} className="contents">
                  <WorkshopCard workshop={w} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <LandingFooter />
    </>
  );
}

/* -------------------------- empty state ------------------------------- */

function SeasonEmptyState({ season }: { season: Season }) {
  const meta = SEASON_META[season];
  const emptyCopy: Record<Season, string> = {
    bahar:
      "Bahar workshops — sozni embroidery, tulip festival walks, first-shawl sessions — typically open in March, when the saffron stamen is sorted and the loom hall warms again.",
    grism:
      "Grism workshops — naqashi, copper-craft, summer heritage walks — typically open in June, when the bazaar wakes up before Eid.",
    harud:
      "No Harud workshops listed right now.",
    shishur:
      "No Shishur workshops listed right now.",
  };
  return (
    <div className={`${themeClassForSeason(season)} max-w-2xl mx-auto text-center py-12 sm:py-16`}>
      <p className="meta-mono text-season-deep">{meta.glyph} {meta.englishName}</p>
      <h2 className="font-display text-3xl sm:text-4xl text-ink mt-3 leading-tight">
        Not the season for it.
      </h2>
      <p className="font-serif italic text-ink-faded mt-3 max-w-prose mx-auto">
        {emptyCopy[season]}
      </p>
      <p className="mt-6">
        <Link
          href="/workshops"
          className="inline-flex items-center px-4 py-2 rounded-craft border border-line text-ink hover:border-season-deep hover:text-season-deep transition-colors min-h-11 font-ui text-sm"
        >
          Show all workshops →
        </Link>
      </p>
    </div>
  );
}
