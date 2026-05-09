import * as React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getWorkshop, listWorkshopIds } from "@/lib/workshops";
import { decodeBookingState } from "@/lib/booking-state";
import { BookingShell } from "@/components/booking/booking-shell";
import { BookingCalendar } from "@/components/booking/booking-calendar";

/* -------------------------------------------------------------------------
 * /booking/[workshop-id] — Step 1 of 3 — Choose your date
 *
 * The user lands here either from the workshop detail page (with all
 * their choices already in the URL) or from a bookmark (with bare
 * defaults). Picking a date submits the form (GET) to /details and
 * carries the rest of the state forward as hidden inputs.
 * ----------------------------------------------------------------------- */

type Params = { "workshop-id": string };

export const dynamicParams = false;

export async function generateStaticParams(): Promise<Params[]> {
  return listWorkshopIds().map((id) => ({ "workshop-id": id }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { "workshop-id": id } = await params;
  const w = getWorkshop(id);
  if (!w) return { title: "Booking" };
  return {
    title: `Reserve · ${w.offering.title}`,
    description: `Choose your date for ${w.offering.title} with ${w.artisan.name}.`,
    robots: { index: false, follow: false },
  };
}

interface BookingDatePageProps {
  params: Promise<Params>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BookingDatePage({
  params,
  searchParams,
}: BookingDatePageProps) {
  const [{ "workshop-id": id }, sp] = await Promise.all([params, searchParams]);
  const workshop = getWorkshop(id);
  if (!workshop) notFound();

  const state = decodeBookingState(workshop, sp);

  return (
    <BookingShell
      workshop={workshop}
      state={state}
      step={1}
      stepLabel="Step 1 of 3 — Choose your date"
      stepHeading="When would you like to come?"
      stepBlurb="Available dates glow in the season's colour. The master keeps the calendar himself — every date here is a real morning at the loom."
    >
      <form
        action={`/booking/${workshop.offering.id}/details`}
        method="get"
        className="space-y-8"
      >
        {/* Hidden inputs preserve state across steps */}
        <input type="hidden" name="participants" value={state.participants} />
        <input type="hidden" name="tier" value={state.tierId} />
        {state.addOnIds.length > 0 && (
          <input type="hidden" name="addons" value={state.addOnIds.join(",")} />
        )}
        <input type="hidden" name="lang" value={state.language} />

        {/* The visible date input is purely cosmetic — the BookingCalendar
            below sets ?date= via anchor links. We render a hidden input
            tracking the currently-selected date so the form-submit path
            (Continue button) carries it forward. */}
        <input type="hidden" name="date" value={state.date} />

        <BookingCalendar
          workshop={workshop}
          selectedIso={state.date}
          hrefForDate={(iso) => {
            const p = new URLSearchParams();
            p.set("date", iso);
            p.set("participants", String(state.participants));
            if (state.tierId) p.set("tier", state.tierId);
            if (state.addOnIds.length) p.set("addons", state.addOnIds.join(","));
            p.set("lang", state.language);
            if (state.timeSlot) p.set("time", state.timeSlot);
            return `/booking/${workshop.offering.id}?${p.toString()}`;
          }}
        />

        {/* Time slot picker — only show if more than one slot exists */}
        {workshop.ext.timeSlots.length > 1 && (
          <fieldset className="space-y-3">
            <legend className="meta-mono text-ink-margin">
              Pick a start time
            </legend>
            <div className="flex flex-wrap gap-3">
              {workshop.ext.timeSlots.map((slot) => {
                const id = `time-${slot.replace(/:/g, "")}`;
                const checked = state.timeSlot === slot;
                return (
                  <label
                    key={slot}
                    htmlFor={id}
                    className={[
                      "inline-flex items-center justify-center px-4 py-2.5 rounded-craft border text-sm cursor-pointer min-h-11",
                      "transition-colors duration-150 font-mono tabular-nums",
                      checked
                        ? "bg-season-deep border-season-deep text-ink-inverse"
                        : "bg-paper border-line text-ink hover:border-season-deep hover:text-season-deep",
                    ].join(" ")}
                  >
                    <input
                      id={id}
                      type="radio"
                      name="time"
                      value={slot}
                      defaultChecked={checked}
                      className="sr-only"
                    />
                    {slot}
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* Hidden time input when only one slot — keeps form complete. */}
        {workshop.ext.timeSlots.length <= 1 && (
          <input type="hidden" name="time" value={state.timeSlot} />
        )}

        {/* Continue */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-line">
          <p className="meta-mono text-ink-margin mr-auto">
            {state.date
              ? "Tap Continue when you're ready."
              : "Pick an available date above."}
          </p>
          <button
            type="submit"
            disabled={!state.date}
            className="inline-flex items-center justify-center px-6 py-3 rounded-craft bg-brand text-ink-inverse font-ui tracking-wide hover:bg-brand-light transition-colors min-h-12 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue → Your details
          </button>
        </div>
      </form>
    </BookingShell>
  );
}
