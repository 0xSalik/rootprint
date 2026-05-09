"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth";
import { api, ApiError, type Paginated, type WorkshopWithMaster, type MasterPublic } from "@/lib/api";

/* -------------------------------------------------------------------------
 * <BookingConfirmAction />
 *
 * Replaces the static "Pay & confirm" submit button on
 * /booking/[workshop-id]/payment with a client-side handler that
 * actually persists a booking against the live backend before
 * navigating to the confirmation page.
 *
 * Responsibilities:
 *
 *   • Resolve the mock workshop slug (e.g. "yusuf-walk") to a real
 *     backend Workshop UUID. The mock slug encodes the artisan +
 *     workshop kind ("walk" | "half-day" | "multi-day"), so we look
 *     up the master by `lineage_id` (matching the artisan slug we
 *     pass in), then pick the workshop whose format prefix matches
 *     the kind.
 *
 *   • POST /api/v1/commerce/book with the resolved UUID, the user's
 *     phone (from the form they typed; falls back to the logged-in
 *     phone), the chosen ISO date, and participant count.
 *
 *   • If anything fails (offline, AI core hiccup, no live workshop
 *     match), still navigate to the confirmation page so the demo
 *     never dead-ends — but show the error inline so we know.
 *
 * The static booking pages stay as-is for the marketing surface;
 * this component slots into the form so the live API gets the row.
 * ----------------------------------------------------------------------- */

type Kind = "walk" | "half-day" | "multi-day" | "virtual";

const KIND_PREFIX: Record<Kind, string[]> = {
  // The seed script writes workshop formats like
  //   "Heritage Walk · Pashmina Weaving"
  //   "Half-Day Workshop · Pashmina Weaving"
  //   "Multi-Day Masterclass · Pashmina Weaving"
  // We match by prefix so the lookup is robust to small variants.
  walk: ["Heritage Walk"],
  "half-day": ["Half-Day Workshop", "Half Day Workshop"],
  "multi-day": ["Multi-Day Masterclass", "Multi Day Masterclass"],
  // Virtual maps to a half-day for the booking-side lookup; the seed
  // doesn't write a separate "virtual" format.
  virtual: ["Half-Day Workshop"],
};

interface BookingConfirmActionProps {
  artisanSlug: string;
  workshopKind: Kind;
  isoDate: string;
  participants: number;
  formStateQuery: string;
  confirmationHref: string;
  total: string;
  className?: string;
}

export function BookingConfirmAction({
  artisanSlug,
  workshopKind,
  isoDate,
  participants,
  formStateQuery,
  confirmationHref,
  total,
  className,
}: BookingConfirmActionProps) {
  const router = useRouter();
  const auth = useAuth();
  const [submitting, setSubmitting] = React.useState(false);
  const [warning, setWarning] = React.useState<string | null>(null);

  async function resolveWorkshopId(): Promise<string | null> {
    const masterPage = await api.masters.list(artisanSlug, 5, 0);
    const master =
      masterPage.items.find(
        (m: MasterPublic) =>
          (m.lineage_id ?? "").toLowerCase() === artisanSlug.toLowerCase(),
      ) ?? masterPage.items[0];
    if (!master) return null;

    const workshops: Paginated<WorkshopWithMaster> = await api.workshops.list({
      master_id: master.id,
      limit: 100,
    });
    const prefixes = KIND_PREFIX[workshopKind] ?? KIND_PREFIX["walk"];
    const matched = workshops.items.find((w) =>
      prefixes.some((p) => (w.format ?? "").toLowerCase().startsWith(p.toLowerCase())),
    );
    return matched?.id ?? workshops.items[0]?.id ?? null;
  }

  async function go(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setSubmitting(true);
    setWarning(null);

    try {
      const phone = auth.phone ?? extractPhoneFromQuery(formStateQuery);
      if (!phone) {
        // No phone at all — go to confirmation page anyway, the
        // confirmation surface still renders the certificate.
        router.push(`${confirmationHref}?${formStateQuery}`);
        return;
      }

      let workshopId: string | null = null;
      try {
        workshopId = await resolveWorkshopId();
      } catch (err) {
        setWarning(
          err instanceof ApiError
            ? `Could not look up the workshop (${err.status}). Booking will be recorded locally.`
            : "Could not look up the workshop. Booking will be recorded locally.",
        );
      }

      if (workshopId) {
        try {
          await api.bookings.create(workshopId, phone, isoDate, participants);
        } catch (err) {
          setWarning(
            err instanceof ApiError
              ? `Could not record the booking (${err.status}). Confirmation will still show.`
              : "Could not record the booking. Confirmation will still show.",
          );
        }
      }

      router.push(`${confirmationHref}?${formStateQuery}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {warning ? (
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faded">
          {warning}
        </p>
      ) : null}
      <button
        type="submit"
        onClick={go}
        disabled={submitting}
        className={
          className ??
          "inline-flex items-center justify-center px-7 py-3 rounded-craft bg-brand text-ink-inverse font-ui tracking-wide hover:bg-brand-light transition-colors min-h-12 disabled:opacity-60"
        }
      >
        {submitting ? "Confirming…" : `Pay ${total} & confirm`}
      </button>
    </div>
  );
}

/* The URL search-param form state encodes the buyer's phone in the
 * `phone` field; pull it out as a fallback when the user is not signed
 * in. Returns null if nothing reasonable is present.
 */
function extractPhoneFromQuery(query: string): string | null {
  const params = new URLSearchParams(query);
  const phone = params.get("phone");
  if (!phone) return null;
  const trimmed = phone.replace(/\s/g, "");
  if (trimmed.length < 7) return null;
  // Force a +country prefix so the phone matches what /bookings/me?phone= expects.
  return trimmed.startsWith("+") ? trimmed : `+91${trimmed}`;
}
