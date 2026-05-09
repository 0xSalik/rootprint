import * as React from "react";

import {
  type WorkshopFull,
} from "@/lib/workshops";
import { themeClassForSeason } from "@/lib/seasons";
import { type BookingState, encodeBookingHref } from "@/lib/booking-state";
import { LandingFooter } from "@/components/landing/landing-footer";

import {
  type BookingStep,
  BookingProgress,
} from "./booking-progress";
import { BookingSummary } from "./booking-summary";

/* -------------------------------------------------------------------------
 * <BookingShell />
 *
 * Common chrome for every booking step:
 *   • Seasonal class (so all season-* tokens snap to the craft palette)
 *   • Header with workshop name + master
 *   • Hashia progress indicator (BookingProgress)
 *   • Two-column body: step content (left) + booking summary (right)
 *   • Landing footer
 *
 * Each step page renders only its own form; everything around it
 * comes from here.
 * ----------------------------------------------------------------------- */

interface BookingShellProps {
  workshop: WorkshopFull;
  state: BookingState;
  step: BookingStep;
  /** Heading + small kicker for the current step. */
  stepLabel: string;
  stepHeading: string;
  stepBlurb?: string;
  children: React.ReactNode;
  /** Hide the right-hand summary on the confirmation step (which has
   *  its own certificate). Defaults to false. */
  hideSummary?: boolean;
}

export function BookingShell({
  workshop,
  state,
  step,
  stepLabel,
  stepHeading,
  stepBlurb,
  children,
  hideSummary,
}: BookingShellProps) {
  const seasonClass = themeClassForSeason(workshop.season);

  /* The Hashia progress indicator's anchors. We pre-build the URL
   * for each step using the current state so the user can jump back. */
  const hrefs: [string, string, string] = [
    encodeBookingHref({ workshopId: workshop.offering.id, step: "date", state }),
    encodeBookingHref({ workshopId: workshop.offering.id, step: "details", state }),
    encodeBookingHref({ workshopId: workshop.offering.id, step: "payment", state }),
  ];

  return (
    <div className={seasonClass}>
      <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-8 sm:pt-10 pb-16 sm:pb-20">
        <header className="mb-8 sm:mb-10">
          <p className="meta-mono text-ink-margin">Booking · {workshop.offering.title}</p>
          <h1
            className="font-display text-ink leading-tight mt-1"
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              letterSpacing: "-0.005em",
            }}
          >
            {step === 4 ? "Reserved." : stepHeading}
          </h1>
          {stepBlurb && (
            <p className="font-serif italic text-ink-faded mt-2 max-w-prose">
              {stepBlurb}
            </p>
          )}
        </header>

        {/* Progress */}
        {step !== 4 && (
          <div className="mb-10 sm:mb-12">
            <BookingProgress current={step} hrefs={hrefs} />
          </div>
        )}

        {/* Body */}
        <div
          className={
            hideSummary
              ? ""
              : "grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-8 lg:gap-10"
          }
        >
          <main>
            <p className="meta-mono text-ink-margin mb-2">{stepLabel}</p>
            {children}
          </main>

          {!hideSummary && (
            <aside className="lg:sticky lg:top-6 self-start">
              <BookingSummary workshop={workshop} state={state} />
            </aside>
          )}
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
