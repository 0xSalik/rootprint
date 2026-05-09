import * as React from "react";
import Link from "next/link";

import {
  type Artisan,
  type WorkshopOffering,
  formatDate,
  formatINR,
  languageLabel,
  workshopKindMeta,
} from "@/lib/artisans";

import { MiniCalendar } from "./mini-calendar";

/* -------------------------------------------------------------------------
 * <WorkshopsSection /> — section 3e.
 *
 * "Book Time With the Master." Two columns on desktop:
 *   • Left  (5/12): a minimal month-view calendar with available
 *                   dates marked in the season palette
 *   • Right (7/12): four stacked workshop type cards + a Virtual
 *                   Live Workshop card with a globe and language
 *                   flags
 * ----------------------------------------------------------------------- */

interface WorkshopsSectionProps {
  artisan: Artisan;
}

export function WorkshopsSection({ artisan }: WorkshopsSectionProps) {
  // Compute a deterministic set of "available" dates inside the same
  // month as the artisan's nextWorkshop. Open every Wed and Sat plus
  // the explicit nextDate of each workshop offering.
  const availableDates = React.useMemo(
    () => computeAvailableDates(artisan),
    [artisan],
  );

  const live = artisan.workshops.find((w) => w.kind === "virtual");
  const inPersonOfferings = artisan.workshops.filter((w) => w.kind !== "virtual");

  return (
    <section className="bg-parchment">
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-20 md:py-24">
        <header className="max-w-3xl">
          <p className="label-ui text-brand">Workshops &amp; Availability</p>
          <h2 className="display-hero text-3xl md:text-5xl text-ink mt-3">
            Book time with the master.
          </h2>
          <p className="font-body text-ink-faded text-base md:text-lg mt-4 max-w-2xl">
            Five ways to meet {firstName(artisan.name)}. Every booking
            includes the master's consent and is recorded against the
            workshop's own Sanad.
          </p>
        </header>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Calendar */}
          <div className="lg:col-span-5 lg:sticky lg:top-6">
            <MiniCalendar
              anchor={artisan.nextWorkshop}
              available={availableDates}
              highlight={artisan.nextWorkshop}
            />

            <p className="meta-mono mt-3">
              ◆ Calendar reflects the master's locally maintained slots.
              Dates marked confirmed have already been booked.
            </p>
          </div>

          {/* Workshop type cards */}
          <div className="lg:col-span-7 space-y-4">
            {inPersonOfferings.map((w) => (
              <WorkshopTypeCard key={w.id} workshop={w} />
            ))}

            {live ? <VirtualWorkshopCard workshop={live} /> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── In-person workshop card ────────────────────── */

function WorkshopTypeCard({ workshop }: { workshop: WorkshopOffering }) {
  const meta = workshopKindMeta(workshop.kind);

  return (
    <article className="surface-card hover-lift overflow-hidden craft-ribbon">
      <div className="p-6 md:p-7 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        <div className="md:col-span-8">
          <div className="flex items-center gap-3">
            <span
              className="label-ui text-[10px]"
              style={{ color: "var(--season-deep)" }}
            >
              {meta.label}
            </span>
            <span
              className="meta-mono text-[10px]"
              style={{ color: "var(--season-deep)" }}
            >
              · {meta.tag}
            </span>
          </div>
          <h3 className="font-display text-2xl text-ink mt-1.5 leading-tight">
            {workshop.title}
          </h3>
          <p className="font-body text-sm text-ink-faded mt-3 max-w-xl">
            {workshop.blurb}
          </p>

          <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 meta-mono">
            <Pair k="Duration" v={workshop.duration} />
            <Pair k="Capacity" v={`Max ${workshop.capacity}`} />
            <Pair k="Languages" v={workshop.languages.map((l) => languageLabel(l).label).join(" · ")} />
            <Pair k="Next" v={formatDate(workshop.nextDate)} />
          </dl>
        </div>

        <div className="md:col-span-4 flex md:flex-col items-end md:items-end justify-between md:justify-start gap-3">
          <div className="text-right">
            <p className="font-display text-2xl text-ink leading-none">
              {formatINR(workshop.pricePerPerson)}
            </p>
            <p className="meta-mono mt-1">per person</p>
          </div>
          <Link
            href={`/booking/${workshop.id}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-craft font-ui text-xs uppercase tracking-[0.16em] text-ink-inverse"
            style={{ backgroundColor: "var(--season-deep)" }}
          >
            Reserve
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ──────────────────────── Virtual workshop card ────────────────────── */

function VirtualWorkshopCard({ workshop }: { workshop: WorkshopOffering }) {
  return (
    <article className="overflow-hidden rounded-craft-lg relative bg-walnut text-ink-inverse">
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <svg viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
          <defs>
            <pattern id="virt-grid" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="3" height="3" fill="var(--season-gold)" />
            </pattern>
          </defs>
          <rect width="200" height="100" fill="url(#virt-grid)" />
        </svg>
      </div>

      <div className="relative z-10 p-6 md:p-7 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-7 flex items-start gap-4">
          <span
            className="shrink-0 inline-flex items-center justify-center size-12 rounded-full border"
            style={{
              borderColor: "var(--gold)",
              color: "var(--gold)",
            }}
            aria-hidden="true"
          >
            <GlobeIcon />
          </span>
          <div>
            <p className="label-ui text-gold-light">Virtual Live Workshop</p>
            <h3 className="font-display text-2xl text-ink-inverse mt-1 leading-tight">
              {workshop.title}
            </h3>
            <p className="font-body text-sm text-ink-inverse/75 mt-2 max-w-md">
              {workshop.blurb}
            </p>
            <ul className="mt-3 flex flex-wrap items-center gap-2">
              {workshop.languages.map((l) => {
                const lab = languageLabel(l);
                return (
                  <li
                    key={l}
                    title={lab.label}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-craft border border-gold/30 meta-mono text-gold-light"
                  >
                    <span aria-hidden="true">◆</span> {lab.native}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="md:col-span-5 flex items-center justify-between md:justify-end gap-5 md:flex-col md:items-end">
          <div className="text-right">
            <p className="font-display text-2xl text-ink-inverse leading-none">
              {formatINR(workshop.pricePerPerson)}
            </p>
            <p className="meta-mono text-ink-inverse/65 mt-1">per seat · {workshop.capacity} seats</p>
            <p className="meta-mono text-ink-inverse/65 mt-1">
              Next: {formatDate(workshop.nextDate)}
            </p>
          </div>
          <Link
            href={`/booking/${workshop.id}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-craft bg-gold text-walnut font-ui text-xs uppercase tracking-[0.16em] hover:bg-gold-light transition-colors"
          >
            Reserve
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ───────────────────────────── helpers ─────────────────────────────── */

function Pair({ k, v }: { k: string; v: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-ink-margin">{k}</span>
      <span className="text-ink">{v}</span>
    </span>
  );
}

function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12 H21 M12 3 Q 7 12, 12 21 Q 17 12, 12 3" />
    </svg>
  );
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0];
}

/** Produce a deterministic list of available ISO dates inside the
 *  month containing the artisan's nextWorkshop. We mark every
 *  Mon/Wed/Sat as a candidate slot, plus each workshop offering's
 *  own nextDate (in case it falls on another day). */
function computeAvailableDates(artisan: Artisan): string[] {
  const anchor = new Date(artisan.nextWorkshop);
  const y = anchor.getUTCFullYear();
  const m = anchor.getUTCMonth();
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const dates: string[] = [];
  for (let d = 1; d <= last; d++) {
    const day = new Date(Date.UTC(y, m, d)).getUTCDay();
    if (day === 1 || day === 3 || day === 6) {
      dates.push(`${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
  }
  // Add explicit workshop nextDates that fall in this month
  for (const w of artisan.workshops) {
    const wd = new Date(w.nextDate);
    if (wd.getUTCFullYear() === y && wd.getUTCMonth() === m) {
      const iso = w.nextDate.slice(0, 10);
      if (!dates.includes(iso)) dates.push(iso);
    }
  }
  return dates.sort();
}
