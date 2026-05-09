"use client";

import * as React from "react";
import Link from "next/link";

import {
  type WorkshopAddOn,
  type WorkshopFull,
  PLATFORM_FEE_RATE,
  computeTotals,
  formatDateShort,
  formatINR,
} from "@/lib/workshops";
import { LANG_LABEL_FALLBACK } from "@/components/workshops/lang-labels";

/* -------------------------------------------------------------------------
 * <BookingWidget />
 *
 * The right-rail sticky widget on /workshop/[id]. The brief calls for a
 * "live price calculator" — so this is one of the very few client
 * islands in the codebase. State is local; on Reserve Now we hand off
 * to the SSR booking flow with everything in the URL.
 *
 * Mobile: collapses out of the sticky rail and re-flows below the
 * page content as a normal card. The handoff URL is identical.
 * ----------------------------------------------------------------------- */

interface BookingWidgetProps {
  workshop: WorkshopFull;
}

export function BookingWidget({ workshop }: BookingWidgetProps) {
  const { offering, ext } = workshop;

  const defaultTier =
    ext.pricingTiers.find((t) => t.highlight) ?? ext.pricingTiers[0];

  /* Local state — no global stores, no useReducer, no heroics */
  const [tierId, setTierId] = React.useState<string>(defaultTier.id);
  const [participants, setParticipants] = React.useState<number>(1);
  const [date, setDate] = React.useState<string>(ext.availableDates[0] ?? "");
  const [timeSlot, setTimeSlot] = React.useState<string>(ext.timeSlots[0] ?? "");
  const [addOns, setAddOns] = React.useState<Set<string>>(new Set());
  const [lang, setLang] = React.useState<string>(offering.languages[0]);

  const tier = ext.pricingTiers.find((t) => t.id === tierId) ?? defaultTier;
  const maxParticipants = Math.min(offering.capacity, 6);

  /* Compute live totals — re-runs on every change without extra ceremony. */
  const selectedAddOns = ext.addOns.filter((a) => addOns.has(a.id));
  const totals = computeTotals({
    pricePerPerson: tier.pricePerPerson,
    participants,
    addOnPricesPerPerson: selectedAddOns.map((a) => a.pricePerPerson),
  });

  /* Hand-off URL: every choice is in the search params so the booking
   * flow is fully SSR. */
  const reserveUrl = buildReserveUrl({
    workshopId: offering.id,
    date,
    timeSlot,
    participants,
    tierId: tier.id,
    addOnIds: Array.from(addOns),
    lang,
  });

  return (
    <aside
      aria-label="Reserve your seat"
      className="bg-paper border border-line rounded-craft-lg p-5 sm:p-6 space-y-5 shadow-[0_2px_0_0_var(--shadow-soft),0_24px_50px_-32px_var(--shadow-strong)]"
    >
      <header>
        <p className="meta-mono text-ink-margin">Reserve a seat</p>
        <p className="font-display text-2xl text-ink leading-tight mt-1">
          {formatINR(totals.total)}
          <span className="meta-mono text-ink-margin ml-2 align-baseline">
            total
          </span>
        </p>
        <p className="font-body text-xs text-ink-faded mt-1">
          {participants} {participants === 1 ? "person" : "people"} · {tier.label} tier · all fees included
        </p>
      </header>

      {/* Tier */}
      <Field label="Pricing tier">
        <select
          value={tierId}
          onChange={(e) => setTierId(e.target.value)}
          className={selectClass}
        >
          {ext.pricingTiers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label} — {formatINR(t.pricePerPerson)} / person
            </option>
          ))}
        </select>
      </Field>

      {/* Date */}
      <Field label="Date">
        <select
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={selectClass}
        >
          {ext.availableDates.map((d) => (
            <option key={d} value={d}>
              {formatDateShort(d)}
            </option>
          ))}
        </select>
      </Field>

      {/* Time slot */}
      {ext.timeSlots.length > 1 && (
        <Field label="Time">
          <select
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
            className={selectClass}
          >
            {ext.timeSlots.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      )}

      {/* Participants */}
      <Field label="Participants">
        <div className="flex items-stretch border border-line rounded-craft overflow-hidden">
          <button
            type="button"
            aria-label="Decrease participants"
            onClick={() => setParticipants((n) => Math.max(1, n - 1))}
            disabled={participants <= 1}
            className="px-3 bg-paper hover:bg-paper-deep disabled:opacity-40 transition-colors"
          >
            −
          </button>
          <div className="flex-1 flex items-center justify-center font-display text-lg text-ink">
            {participants}
          </div>
          <button
            type="button"
            aria-label="Increase participants"
            onClick={() =>
              setParticipants((n) => Math.min(maxParticipants, n + 1))
            }
            disabled={participants >= maxParticipants}
            className="px-3 bg-paper hover:bg-paper-deep disabled:opacity-40 transition-colors"
          >
            +
          </button>
        </div>
        <p className="meta-mono text-ink-margin mt-1.5">
          Up to {maxParticipants} for this workshop
        </p>
      </Field>

      {/* Language */}
      <Field label="Language">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className={selectClass}
        >
          {offering.languages.map((code) => (
            <option key={code} value={code}>
              {LANG_LABEL_FALLBACK[code] ?? code}
            </option>
          ))}
        </select>
      </Field>

      {/* Add-ons */}
      {ext.addOns.length > 0 && (
        <div className="space-y-2">
          <p className="meta-mono text-ink-margin">Add-ons (per person)</p>
          <ul className="space-y-2">
            {ext.addOns.map((a) => (
              <li key={a.id}>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addOns.has(a.id)}
                    onChange={(e) => {
                      const next = new Set(addOns);
                      if (e.target.checked) next.add(a.id);
                      else next.delete(a.id);
                      setAddOns(next);
                    }}
                    className="mt-1 accent-[var(--brand)] size-4 shrink-0"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="font-body text-sm text-ink leading-snug block">
                      {a.label}
                      <span className="text-ink-faded ml-1">
                        {a.pricePerPerson > 0
                          ? `· +${formatINR(a.pricePerPerson)}`
                          : "· Included"}
                      </span>
                    </span>
                    <span className="meta-mono text-ink-margin block leading-snug mt-0.5">
                      {a.helper}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Transparent breakdown */}
      <Breakdown totals={totals} addOns={selectedAddOns} participants={participants} />

      {/* CTA */}
      <Link
        href={reserveUrl}
        className="block text-center w-full px-5 py-3 rounded-craft bg-brand text-ink-inverse font-ui font-medium tracking-wide hover:bg-brand-light transition-colors duration-200 min-h-12"
      >
        Reserve Now
      </Link>
      <Link
        href={`/artisan/${workshop.artisan.slug}#contact`}
        className="block text-center w-full font-ui text-sm text-ink-faded hover:text-ink transition-colors duration-200"
      >
        Or contact the master first
      </Link>
    </aside>
  );
}

/* ------------------------------ Subparts ------------------------------ */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="meta-mono text-ink-margin block">{label}</span>
      {children}
    </label>
  );
}

const selectClass =
  "w-full bg-paper border border-line rounded-craft px-3 py-2 font-body text-ink focus:outline-none focus:border-season-deep focus:ring-1 focus:ring-season-deep min-h-11";

function Breakdown({
  totals,
  addOns,
  participants,
}: {
  totals: ReturnType<typeof computeTotals>;
  addOns: WorkshopAddOn[];
  participants: number;
}) {
  return (
    <div className="border-t border-line pt-4 space-y-1.5 text-sm font-body text-ink-faded">
      <Row label={`Base × ${participants}`} value={formatINR(totals.baseSubtotal)} />
      {addOns.length > 0 && (
        <Row
          label={`Add-ons × ${participants}`}
          value={formatINR(totals.addOnsSubtotal)}
        />
      )}
      <Row
        label={`Platform fee (${Math.round(PLATFORM_FEE_RATE * 100)}%)`}
        value={formatINR(totals.platformFee)}
      />
      <Row label="GST (5%)" value={formatINR(totals.taxes)} />
      <div className="pt-2 border-t border-line/60">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-base text-ink">Total today</span>
          <span className="font-display text-xl text-ink tabular-nums">
            {formatINR(totals.total)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span>{label}</span>
      <span className="font-mono text-ink tabular-nums">{value}</span>
    </div>
  );
}

/* ----------------------------- handoff URL ----------------------------- */

function buildReserveUrl(args: {
  workshopId: string;
  date: string;
  timeSlot: string;
  participants: number;
  tierId: string;
  addOnIds: string[];
  lang: string;
}): string {
  const p = new URLSearchParams();
  if (args.date) p.set("date", args.date);
  if (args.timeSlot) p.set("time", args.timeSlot);
  p.set("participants", String(args.participants));
  p.set("tier", args.tierId);
  if (args.addOnIds.length) p.set("addons", args.addOnIds.join(","));
  p.set("lang", args.lang);
  return `/booking/${args.workshopId}?${p.toString()}`;
}
