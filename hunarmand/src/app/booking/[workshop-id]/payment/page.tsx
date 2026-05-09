import * as React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import {
  computeTotals,
  formatINR,
  getWorkshop,
  listWorkshopIds,
  PLATFORM_FEE_RATE,
} from "@/lib/workshops";
import {
  decodeBookingState,
  generateBookingReference,
} from "@/lib/booking-state";
import { BookingShell } from "@/components/booking/booking-shell";
import { SanadBadge } from "@/components/artisan/sanad-badge";
import { BookingConfirmAction } from "@/components/booking/booking-confirm-action";

/* -------------------------------------------------------------------------
 * /booking/[workshop-id]/payment — Step 3 of 3 — Payment
 *
 * The brief calls for "Razorpay embedded (test mode)". We render a
 * faithful test-mode payment surface (the order summary, the Sanad
 * badge, the methods strip) without actually calling Razorpay — this
 * is a demo. Submitting the form moves to the confirmation page.
 *
 * The reference is generated deterministically from the booking state
 * so refreshing the page doesn't change it.
 * ----------------------------------------------------------------------- */

type Params = { "workshop-id": string };

export const dynamicParams = false;

export async function generateStaticParams(): Promise<Params[]> {
  return listWorkshopIds().map((id) => ({ "workshop-id": id }));
}

export const metadata: Metadata = {
  title: "Payment · Hunarmand booking",
  robots: { index: false, follow: false },
};

interface BookingPaymentPageProps {
  params: Promise<Params>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BookingPaymentPage({
  params,
  searchParams,
}: BookingPaymentPageProps) {
  const [{ "workshop-id": id }, sp] = await Promise.all([params, searchParams]);
  const workshop = getWorkshop(id);
  if (!workshop) notFound();

  const state = decodeBookingState(workshop, sp);
  const reference = generateBookingReference(workshop.offering.id, state);

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

  return (
    <BookingShell
      workshop={workshop}
      state={state}
      step={3}
      stepLabel="Step 3 of 3 — Payment"
      stepHeading="Confirm and pay."
      stepBlurb="Razorpay handles the transaction in test mode for the demo. Nothing is charged. The certificate on the next page is real."
    >
      <form
        action={`/booking/${workshop.offering.id}/confirmation`}
        method="get"
        className="space-y-6"
      >
        {/* Carry forward state */}
        <input type="hidden" name="date" value={state.date} />
        <input type="hidden" name="time" value={state.timeSlot} />
        <input type="hidden" name="participants" value={state.participants} />
        <input type="hidden" name="tier" value={state.tierId} />
        {state.addOnIds.length > 0 && (
          <input type="hidden" name="addons" value={state.addOnIds.join(",")} />
        )}
        <input type="hidden" name="lang" value={state.language} />
        <input type="hidden" name="name" value={state.fullName} />
        <input type="hidden" name="email" value={state.email} />
        <input type="hidden" name="phone" value={state.phone} />
        <input type="hidden" name="notes" value={state.notes} />
        <input type="hidden" name="ref" value={reference} />

        {/* Razorpay-style payment surface */}
        <section
          aria-labelledby="payment-summary-heading"
          className="bg-paper border border-line rounded-craft-lg overflow-hidden"
        >
          <header
            className="px-5 sm:px-6 py-4 border-b border-line flex items-center justify-between gap-4"
            style={{ backgroundColor: "var(--season-deep)" }}
          >
            <div className="text-ink-inverse">
              <p
                className="meta-mono"
                style={{ color: "var(--season-gold)" }}
              >
                Hunarmand · Razorpay test mode
              </p>
              <p
                id="payment-summary-heading"
                className="font-display text-xl mt-1 leading-tight"
              >
                Pay {formatINR(totals.total)} to reserve your seat
              </p>
            </div>
            <SanadBadge level={workshop.artisan.sanadLevel} size="md" />
          </header>

          <div className="p-5 sm:p-6 space-y-6">
            {/* Order summary */}
            <div>
              <p className="meta-mono text-ink-margin mb-3">Order summary</p>
              <ul className="space-y-2 text-sm">
                <SummaryRow
                  label={`${tier.label} — ${state.participants} ${state.participants === 1 ? "person" : "people"}`}
                  value={formatINR(totals.baseSubtotal)}
                />
                {addOns.map((a) => (
                  <SummaryRow
                    key={a.id}
                    label={`${a.label} × ${state.participants}`}
                    value={formatINR(a.pricePerPerson * state.participants)}
                    sub
                  />
                ))}
                <SummaryRow
                  label={`Platform fee (${Math.round(PLATFORM_FEE_RATE * 100)}%)`}
                  value={formatINR(totals.platformFee)}
                  sub
                />
                <SummaryRow
                  label="GST (5%)"
                  value={formatINR(totals.taxes)}
                  sub
                />
                <li className="border-t border-line pt-3 mt-2 flex items-baseline justify-between">
                  <span className="font-display text-base text-ink">
                    Total today
                  </span>
                  <span className="font-display text-2xl text-ink tabular-nums">
                    {formatINR(totals.total)}
                  </span>
                </li>
              </ul>
            </div>

            {/* Payment method strip — visual only */}
            <div className="space-y-3">
              <p className="meta-mono text-ink-margin">Payment method</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "upi", label: "UPI" },
                  { id: "card", label: "Card" },
                  { id: "netbanking", label: "Netbanking" },
                  { id: "wallet", label: "Wallet" },
                ].map((m, i) => (
                  <span
                    key={m.id}
                    className={[
                      "inline-flex items-center justify-center px-3 py-2.5 rounded-craft border text-sm font-ui min-h-11",
                      i === 0
                        ? "bg-paper-deep border-season-deep text-ink"
                        : "bg-paper border-line text-ink-faded",
                    ].join(" ")}
                  >
                    {m.label}
                    {i === 0 && (
                      <span
                        className="ml-2 size-2 rounded-full"
                        style={{ backgroundColor: "var(--season-deep)" }}
                        aria-label="selected"
                      />
                    )}
                  </span>
                ))}
              </div>
              <p className="meta-mono text-ink-margin">
                UPI is preselected for the demo. The Confirm button below
                completes the test-mode payment instantly — nothing is charged.
              </p>
            </div>

            {/* Buyer cross-check */}
            <div className="border-t border-line pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <Cell label="Booking reference" value={reference} mono />
              <Cell label="Buyer" value={state.fullName || "—"} />
              <Cell label="Phone" value={state.phone || "—"} mono />
              {state.email && (
                <Cell label="Email" value={state.email} mono />
              )}
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Link
            href={`/booking/${workshop.offering.id}/details`}
            className="font-ui text-sm text-ink-faded hover:text-ink transition-colors"
          >
            ← Edit your details
          </Link>
          <BookingConfirmAction
            artisanSlug={workshop.artisan.slug}
            workshopKind={workshop.offering.kind as never}
            isoDate={state.date}
            participants={state.participants}
            formStateQuery={buildFormStateQuery(state, reference)}
            confirmationHref={`/booking/${workshop.offering.id}/confirmation`}
            total={formatINR(totals.total)}
          />
        </div>
      </form>
    </BookingShell>
  );
}

/* ----------------------------- Subparts ----------------------------- */

function SummaryRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: boolean;
}) {
  return (
    <li
      className={[
        "flex items-baseline justify-between gap-3",
        sub ? "text-ink-faded" : "text-ink",
      ].join(" ")}
    >
      <span className="font-body">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </li>
  );
}

/**
 * Build the URL search-param string the confirmation page expects,
 * mirroring the hidden inputs in the form above. Used by the live
 * confirm action that bypasses the form's GET submit.
 */
function buildFormStateQuery(
  state: ReturnType<typeof decodeBookingState>,
  reference: string,
): string {
  const params = new URLSearchParams();
  params.set("date", state.date);
  params.set("time", state.timeSlot);
  params.set("participants", String(state.participants));
  params.set("tier", state.tierId);
  if (state.addOnIds.length > 0) {
    params.set("addons", state.addOnIds.join(","));
  }
  params.set("lang", state.language);
  if (state.fullName) params.set("name", state.fullName);
  if (state.email) params.set("email", state.email);
  if (state.phone) params.set("phone", state.phone);
  if (state.notes) params.set("notes", state.notes);
  params.set("ref", reference);
  return params.toString();
}

function Cell({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <p className="meta-mono text-ink-margin">{label}</p>
      <p
        className={[
          "text-ink leading-snug",
          mono ? "font-mono tabular-nums tracking-[0.06em]" : "font-body",
        ].join(" ")}
        dir={mono ? "ltr" : undefined}
      >
        {value}
      </p>
    </div>
  );
}
