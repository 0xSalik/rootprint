import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getWorkshop,
  listWorkshopIds,
  formatDateShort,
  formatINR,
} from "@/lib/workshops";
import { workshopKindMeta, languageLabel } from "@/lib/artisans";
import { themeClassForSeason, SEASON_META } from "@/lib/seasons";
import { LandingFooter } from "@/components/landing/landing-footer";
import { HashiaBorder } from "@/components/motifs";

import { WorkshopHero } from "@/components/workshops/workshop-hero";
import { SessionStructure } from "@/components/workshops/session-structure";
import { PricingTable } from "@/components/workshops/pricing-table";
import { BookingWidget } from "@/components/workshops/booking-widget";

/* -------------------------------------------------------------------------
 * /workshop/[id] — Individual Workshop Page
 *
 * 60/40 split on desktop:
 *   • Left  → panoramic hero, title, master link, "what you'll learn",
 *             "what you'll take home", session structure timeline, the
 *             5-tier pricing table.
 *   • Right → sticky booking widget (the one client island).
 *
 * On mobile the booking widget collapses out of the rail and lands at
 * the bottom of the page; the master's contact link is preserved.
 * ----------------------------------------------------------------------- */

type Params = { id: string };

export const dynamicParams = false;

export async function generateStaticParams(): Promise<Params[]> {
  return listWorkshopIds().map((id) => ({ id }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { id } = await params;
  const w = getWorkshop(id);
  if (!w) return { title: "Workshop not found" };
  return {
    title: `${w.offering.title} · ${w.artisan.name}`,
    description: w.ext.longBlurb,
  };
}

export default async function WorkshopDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const w = getWorkshop(id);
  if (!w) notFound();

  const seasonClass = themeClassForSeason(w.season);
  const seasonMeta = SEASON_META[w.season];
  const kindMeta = workshopKindMeta(w.offering.kind);

  return (
    <div className={seasonClass}>
      {/* ============================ Top breadcrumb ============================ */}
      <nav
        aria-label="Breadcrumb"
        className="mx-auto max-w-6xl px-5 sm:px-8 pt-6 sm:pt-8"
      >
        <p className="meta-mono text-ink-margin">
          <Link href="/workshops" className="hover:text-ink transition-colors">
            ← All workshops
          </Link>
        </p>
      </nav>

      {/* ============================ Hero ============================ */}
      <header className="mx-auto max-w-6xl px-5 sm:px-8 pt-4 sm:pt-6">
        <WorkshopHero craft={w.craft} className="mb-6 sm:mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 lg:gap-12 items-start">
          <div>
            <p className="meta-mono text-ink-margin">
              {seasonMeta.glyph} {seasonMeta.englishName} · {kindMeta.label}
            </p>
            <h1
              className="font-display font-medium text-ink leading-[1.04] mt-2"
              style={{
                fontSize: "clamp(32px, 4.5vw, 48px)",
                letterSpacing: "-0.005em",
              }}
            >
              {w.offering.title}
            </h1>
            <p className="font-serif italic text-ink-faded mt-3 max-w-prose">
              with{" "}
              <Link
                href={`/artisan/${w.artisan.slug}`}
                className="not-italic font-serif text-ink hover:text-brand transition-colors"
              >
                {w.artisan.name}
              </Link>
              , {w.artisan.craftEnglish.toLowerCase()} master from{" "}
              {w.artisan.village}, {w.artisan.district}
            </p>
            <p className="font-body text-ink-faded mt-5 max-w-prose leading-relaxed">
              {w.ext.longBlurb}
            </p>

            <FactRow w={w} />
          </div>

          {/* Booking widget — sits in this rail on desktop, lands at the
              bottom on small screens via order-2 fallback. */}
          <div className="lg:sticky lg:top-6 self-start order-last lg:order-none">
            <BookingWidget workshop={w} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 sm:px-8 mt-12 sm:mt-16">
        <HashiaBorder height={6} color="var(--season-gold)" opacity={0.55} />
      </div>

      {/* ============================ Learn / take home ============================ */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          <BulletColumn
            label="What you will actually learn"
            heading="The technique, in his own words."
            items={w.ext.learningOutcomes}
            tone="deep"
          />
          <BulletColumn
            label="What you will take home"
            heading="Something held by the hands, not just the inbox."
            items={w.ext.takeHome}
            tone="gold"
          />
        </div>
      </section>

      {/* ============================ Session structure ============================ */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 pb-12 sm:pb-16">
        <header className="mb-6 sm:mb-8 max-w-2xl">
          <p className="meta-mono text-ink-margin">Session structure</p>
          <h2 className="font-display text-3xl sm:text-4xl text-ink leading-tight mt-1">
            How the {w.offering.duration.toLowerCase()} unfolds.
          </h2>
        </header>
        <SessionStructure segments={w.ext.sessionStructure} />
      </section>

      {/* ============================ Pricing tiers ============================ */}
      <section
        className="border-t border-line py-12 sm:py-16"
        style={{ backgroundColor: "var(--bg-secondary)" }}
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <header className="mb-8 sm:mb-10 max-w-2xl">
            <p className="meta-mono text-ink-margin">Pricing tiers</p>
            <h2 className="font-display text-3xl sm:text-4xl text-ink leading-tight mt-1">
              Five ways to spend the day.
            </h2>
            <p className="font-body text-ink-faded mt-3">
              Every tier is set by Mohammad Yusuf and Hunarmand together — never
              by an algorithm. The Recommended tier is what most participants
              choose.
            </p>
          </header>
          <PricingTable tiers={w.ext.pricingTiers} />
        </div>
      </section>

      {/* ============================ Foot CTA ============================ */}
      <section className="mx-auto max-w-3xl px-5 sm:px-8 py-12 sm:py-16 text-center">
        <p
          className="font-display text-3xl sm:text-4xl text-ink leading-tight"
          style={{ fontStyle: "italic" }}
        >
          "{w.ext.confirmationNote}"
        </p>
        <p className="meta-mono text-ink-margin mt-4">
          — {w.artisan.name.split(/\s+/)[0]}
        </p>
        <p className="mt-8">
          <a
            href="#booking-widget"
            className="inline-flex items-center justify-center px-6 py-3 rounded-craft bg-brand text-ink-inverse font-ui tracking-wide hover:bg-brand-light transition-colors min-h-12"
          >
            Reserve a seat
          </a>
        </p>
      </section>

      <LandingFooter />
    </div>
  );
}

/* ----------------------------- Subparts ----------------------------- */

function FactRow({
  w,
}: {
  w: NonNullable<ReturnType<typeof getWorkshop>>;
}) {
  return (
    <dl className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-4">
      <Fact label="Duration" value={w.offering.duration} />
      <Fact
        label="Capacity"
        value={`Up to ${w.offering.capacity} ${w.offering.capacity === 1 ? "guest" : "guests"}`}
      />
      <Fact
        label="From"
        value={formatINR(w.offering.pricePerPerson) + " / person"}
      />
      <Fact label="Next date" value={formatDateShort(w.offering.nextDate)} />
      <Fact
        label="Languages"
        value={w.offering.languages
          .map((c) => languageLabel(c).label)
          .join(" · ")}
        wide
      />
      <Fact
        label="Venue"
        value={`${w.ext.location.name} · ${w.ext.location.address}`}
        wide
      />
    </dl>
  );
}

function Fact({
  label,
  value,
  wide,
}: {
  label: string;
  value: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={[
        "border-l-2 pl-3",
        wide ? "col-span-2" : "",
      ].join(" ")}
      style={{ borderColor: "var(--season-gold)" }}
    >
      <dt className="meta-mono text-ink-margin">{label}</dt>
      <dd className="font-serif text-ink leading-snug mt-0.5">{value}</dd>
    </div>
  );
}

function BulletColumn({
  label,
  heading,
  items,
  tone,
}: {
  label: string;
  heading: string;
  items: string[];
  tone: "deep" | "gold";
}) {
  const dot = tone === "deep" ? "var(--season-deep)" : "var(--season-gold)";
  return (
    <div>
      <p className="meta-mono text-ink-margin">{label}</p>
      <h2 className="font-display text-2xl sm:text-3xl text-ink leading-tight mt-1">
        {heading}
      </h2>
      <ul className="mt-5 space-y-3">
        {items.map((line, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-2 inline-block size-2 rounded-full shrink-0"
              style={{ backgroundColor: dot }}
            />
            <span className="font-serif text-ink leading-snug">{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
