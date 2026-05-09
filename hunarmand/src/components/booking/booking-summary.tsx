import * as React from "react";
import Link from "next/link";

import {
  type WorkshopFull,
  computeTotals,
  formatDateShort,
  formatINR,
  PLATFORM_FEE_RATE,
} from "@/lib/workshops";
import { languageLabelFallback } from "@/components/workshops/lang-labels";
import { ChinarCorner } from "@/components/motifs";

import { type BookingState } from "@/lib/booking-state";

/* -------------------------------------------------------------------------
 * <BookingSummary />
 *
 * The right-rail panel on every booking step. Server component. Reads
 * the current BookingState (parsed from URL params) and renders a
 * read-only summary of what the user has chosen so far. Each row is
 * a quiet anchor back to the step that owns it — so editing is never
 * more than one click away.
 * ----------------------------------------------------------------------- */

interface BookingSummaryProps {
  workshop: WorkshopFull;
  state: BookingState;
  /** When true, render in a horizontal "ribbon" mode at the top of mobile. */
  compact?: boolean;
}

export function BookingSummary({ workshop, state }: BookingSummaryProps) {
  const tier =
    workshop.ext.pricingTiers.find((t) => t.id === state.tierId) ??
    workshop.ext.pricingTiers[0];
  const addOns = workshop.ext.addOns.filter((a) =>
    state.addOnIds.includes(a.id),
  );
  const totals = computeTotals({
    pricePerPerson: tier.pricePerPerson,
    participants: state.participants,
    addOnPricesPerPerson: addOns.map((a) => a.pricePerPerson),
  });

  const back = `/workshop/${workshop.offering.id}`;

  return (
    <aside
      aria-labelledby="booking-summary-heading"
      className="relative bg-paper border border-line rounded-craft-lg p-5 sm:p-6 overflow-hidden"
    >
      <ChinarCorner
        corner="tr"
        size={120}
        opacity={0.1}
        className="absolute -top-3 -right-3 pointer-events-none"
      />

      <header className="mb-4 relative">
        <p className="meta-mono text-ink-margin">Your booking</p>
        <h2
          id="booking-summary-heading"
          className="font-display text-xl text-ink leading-tight mt-1"
        >
          {workshop.offering.title}
        </h2>
        <p className="font-body text-sm text-ink-faded mt-1">
          With{" "}
          <Link
            href={`/artisan/${workshop.artisan.slug}`}
            className="text-ink hover:text-brand transition-colors duration-200"
          >
            {workshop.artisan.name}
          </Link>
        </p>
        <p className="meta-mono text-ink-margin mt-2">
          <Link
            href={back}
            className="hover:text-ink transition-colors duration-200"
          >
            ← Back to workshop
          </Link>
        </p>
      </header>

      <dl className="space-y-2.5 text-sm border-t border-line pt-4">
        <Row
          label="Date"
          value={state.date ? formatDateShort(state.date) : "Pick a date"}
        />
        <Row label="Time" value={state.timeSlot ?? "—"} />
        <Row
          label="Participants"
          value={`${state.participants} ${state.participants === 1 ? "person" : "people"}`}
        />
        <Row label="Tier" value={tier.label} />
        <Row label="Language" value={languageLabelFallback(state.language)} />
        {addOns.length > 0 && (
          <Row
            label="Add-ons"
            value={
              <ul className="space-y-0.5">
                {addOns.map((a) => (
                  <li key={a.id} className="font-body text-ink leading-snug">
                    {a.label}
                  </li>
                ))}
              </ul>
            }
          />
        )}
      </dl>

      <div className="border-t border-line mt-4 pt-4 space-y-1.5 text-sm font-body text-ink-faded">
        <SmallRow label={`Base × ${state.participants}`} value={formatINR(totals.baseSubtotal)} />
        {addOns.length > 0 && (
          <SmallRow label="Add-ons" value={formatINR(totals.addOnsSubtotal)} />
        )}
        <SmallRow
          label={`Platform fee (${Math.round(PLATFORM_FEE_RATE * 100)}%)`}
          value={formatINR(totals.platformFee)}
        />
        <SmallRow label="GST (5%)" value={formatINR(totals.taxes)} />
        <div className="pt-2 mt-2 border-t border-line/60 flex items-baseline justify-between">
          <span className="font-display text-base text-ink">Total today</span>
          <span className="font-display text-xl text-ink tabular-nums">
            {formatINR(totals.total)}
          </span>
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------ Subparts ------------------------------ */

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[6.5em_1fr] gap-3">
      <dt className="meta-mono text-ink-margin">{label}</dt>
      <dd className="font-body text-ink">{value}</dd>
    </div>
  );
}

function SmallRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span>{label}</span>
      <span className="font-mono text-ink tabular-nums">{value}</span>
    </div>
  );
}
