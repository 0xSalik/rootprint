import * as React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getWorkshop, listWorkshopIds } from "@/lib/workshops";
import {
  decodeBookingState,
  generateBookingReference,
} from "@/lib/booking-state";
import { BookingShell } from "@/components/booking/booking-shell";
import {
  BookingCertificate,
  CertificateActions,
} from "@/components/booking/booking-certificate";
import { Confetti } from "@/components/booking/confetti";

/* -------------------------------------------------------------------------
 * /booking/[workshop-id]/confirmation
 *
 * Reached after the test-mode payment. Renders the booking certificate
 * (printable as a clean A4 PDF), the calendar handoff buttons, and a
 * subtle one-shot CSS-only confetti in the artisan's seasonal palette.
 * No JavaScript required for the confetti or the certificate; only the
 * Print button is a tiny client island.
 * ----------------------------------------------------------------------- */

type Params = { "workshop-id": string };

export const dynamicParams = false;

export async function generateStaticParams(): Promise<Params[]> {
  return listWorkshopIds().map((id) => ({ "workshop-id": id }));
}

export const metadata: Metadata = {
  title: "Reserved · Hunarmand booking",
  robots: { index: false, follow: false },
};

interface BookingConfirmationPageProps {
  params: Promise<Params>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BookingConfirmationPage({
  params,
  searchParams,
}: BookingConfirmationPageProps) {
  const [{ "workshop-id": id }, sp] = await Promise.all([params, searchParams]);
  const workshop = getWorkshop(id);
  if (!workshop) notFound();

  const state = decodeBookingState(workshop, sp);
  /* Prefer the ref already in the URL (carried from /payment); fall
   * back to deterministic re-derivation so the same answers always
   * yield the same reference. */
  const reference =
    state.reference ||
    generateBookingReference(workshop.offering.id, state);

  return (
    <div className="relative">
      {/* Confetti — pure CSS, only animates on first paint, respects
          prefers-reduced-motion. Sits absolutely over the shell. */}
      <Confetti className="fixed inset-x-0 top-0 h-[60vh] -z-0" />

      <BookingShell
        workshop={workshop}
        state={{ ...state, reference }}
        step={4}
        stepLabel={`Reference · ${reference}`}
        stepHeading="Reserved."
        stepBlurb={`Your seat is held. ${workshop.artisan.name.split(/\s+/)[0]} has been notified — he'll send a personal SMS the morning of the workshop.`}
        hideSummary
      >
        <div className="space-y-6">
          <BookingCertificate
            workshop={workshop}
            state={{ ...state, reference }}
            reference={reference}
          />
          <CertificateActions
            workshop={workshop}
            state={{ ...state, reference }}
            reference={reference}
          />

          <ResumeNote />
        </div>
      </BookingShell>
    </div>
  );
}

/* ------------------------- A small "what's next" --------------------- */

function ResumeNote() {
  return (
    <section className="border border-line rounded-craft-lg bg-paper-deep px-5 sm:px-7 py-5 sm:py-6 mt-2">
      <p className="meta-mono text-ink-margin">What happens now</p>
      <ol className="mt-3 space-y-2 list-decimal list-inside font-body text-ink leading-relaxed marker:text-season-deep">
        <li>
          A confirmation SMS lands on your phone — in your chosen language.
        </li>
        <li>
          The morning of the workshop, the master sends a short voice note: how
          to reach the loom, what to wear, what to bring.
        </li>
        <li>
          On arrival, show the QR on your certificate. The session begins on
          time.
        </li>
        <li>
          After the workshop, a Sanad-signed take-home arrives in your email
          within seven days.
        </li>
      </ol>
    </section>
  );
}
