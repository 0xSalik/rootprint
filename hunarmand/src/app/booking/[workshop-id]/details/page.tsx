import * as React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { getWorkshop, listWorkshopIds } from "@/lib/workshops";
import { decodeBookingState } from "@/lib/booking-state";
import { BookingShell } from "@/components/booking/booking-shell";
import { LANG_LABEL_FALLBACK } from "@/components/workshops/lang-labels";

/* -------------------------------------------------------------------------
 * /booking/[workshop-id]/details — Step 2 of 3 — Your details
 *
 * Phone-first per the brief. Optional fields: email, special notes,
 * add-on selection. Submitting moves to the payment step with
 * everything in the URL.
 * ----------------------------------------------------------------------- */

type Params = { "workshop-id": string };

export const dynamicParams = false;

export async function generateStaticParams(): Promise<Params[]> {
  return listWorkshopIds().map((id) => ({ "workshop-id": id }));
}

export const metadata: Metadata = {
  title: "Your details · Hunarmand booking",
  robots: { index: false, follow: false },
};

interface BookingDetailsPageProps {
  params: Promise<Params>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BookingDetailsPage({
  params,
  searchParams,
}: BookingDetailsPageProps) {
  const [{ "workshop-id": id }, sp] = await Promise.all([params, searchParams]);
  const workshop = getWorkshop(id);
  if (!workshop) notFound();

  const state = decodeBookingState(workshop, sp);

  return (
    <BookingShell
      workshop={workshop}
      state={state}
      step={2}
      stepLabel="Step 2 of 3 — Your details"
      stepHeading="Tell the master who's coming."
      stepBlurb="A phone is enough — Mohammad Yusuf will SMS the morning of, in your language. Email is optional but useful for the certificate."
    >
      <form
        action={`/booking/${workshop.offering.id}/payment`}
        method="get"
        className="space-y-7"
      >
        {/* Carry forward step-1 state */}
        <input type="hidden" name="date" value={state.date} />
        <input type="hidden" name="time" value={state.timeSlot} />
        <input type="hidden" name="participants" value={state.participants} />
        <input type="hidden" name="tier" value={state.tierId} />

        {/* === Identity === */}
        <fieldset className="space-y-4">
          <legend className="font-display text-xl text-ink leading-tight">
            Who's coming
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              name="name"
              label="Full name"
              required
              defaultValue={state.fullName}
              placeholder="Mohammad Yusuf Sheikh"
              autoComplete="name"
            />
            <Field
              name="phone"
              label="Phone (with country code)"
              required
              defaultValue={state.phone}
              placeholder="+91 9876 543 210"
              autoComplete="tel"
              type="tel"
              hint="We'll send an OTP to confirm"
            />
            <Field
              name="email"
              label="Email (optional)"
              defaultValue={state.email}
              placeholder="you@example.com"
              autoComplete="email"
              type="email"
              hint="For the booking certificate"
              wide
            />
          </div>
        </fieldset>

        {/* === Language === */}
        <fieldset className="space-y-3 pt-2">
          <legend className="font-display text-xl text-ink leading-tight">
            Conduct the session in
          </legend>
          <div className="flex flex-wrap gap-2">
            {workshop.offering.languages.map((code) => {
              const id = `lang-${code}`;
              const checked = state.language === code;
              return (
                <label
                  key={code}
                  htmlFor={id}
                  className={[
                    "inline-flex items-center justify-center px-4 py-2.5 rounded-craft border text-sm cursor-pointer min-h-11",
                    "transition-colors duration-150",
                    checked
                      ? "bg-season-deep border-season-deep text-ink-inverse"
                      : "bg-paper border-line text-ink hover:border-season-deep hover:text-season-deep",
                  ].join(" ")}
                >
                  <input
                    id={id}
                    type="radio"
                    name="lang"
                    value={code}
                    defaultChecked={checked}
                    className="sr-only"
                  />
                  {LANG_LABEL_FALLBACK[code] ?? code}
                </label>
              );
            })}
          </div>
          <p className="meta-mono text-ink-margin">
            The master can conduct in {workshop.offering.languages.length}{" "}
            languages. Translation earpieces are available as an add-on for
            English, Japanese, and French.
          </p>
        </fieldset>

        {/* === Notes === */}
        <fieldset className="space-y-3 pt-2">
          <legend className="font-display text-xl text-ink leading-tight">
            Anything the master should know?
          </legend>
          <label htmlFor="notes" className="sr-only">
            Special notes for the master
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={state.notes}
            placeholder="Allergies, mobility needs, the question you most want to ask…"
            className="w-full bg-paper border border-line rounded-craft px-4 py-3 font-body text-ink focus:outline-none focus:border-season-deep focus:ring-1 focus:ring-season-deep"
          />
        </fieldset>

        {/* === Add-ons === */}
        {workshop.ext.addOns.length > 0 && (
          <fieldset className="space-y-3 pt-2">
            <legend className="font-display text-xl text-ink leading-tight">
              Optional add-ons
            </legend>
            <ul className="space-y-3">
              {workshop.ext.addOns.map((a) => {
                const id = `addon-${a.id}`;
                const checked = state.addOnIds.includes(a.id);
                return (
                  <li key={a.id}>
                    <label
                      htmlFor={id}
                      className="flex items-start gap-3 p-3 border border-line rounded-craft hover:border-season-deep transition-colors cursor-pointer bg-paper"
                    >
                      <input
                        id={id}
                        type="checkbox"
                        name="addons"
                        value={a.id}
                        defaultChecked={checked}
                        className="mt-1 accent-[var(--brand)] size-4 shrink-0"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="font-body text-ink leading-snug block">
                          {a.label}
                          <span className="text-ink-faded ml-2 font-mono text-sm">
                            {a.pricePerPerson > 0
                              ? `+ Rs. ${a.pricePerPerson.toLocaleString("en-IN")} / person`
                              : "Included"}
                          </span>
                        </span>
                        <span className="meta-mono text-ink-margin block leading-snug mt-1">
                          {a.helper}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <p className="meta-mono text-ink-margin">
              Note: the booking widget joins these as comma-separated values in
              the URL — your previously-selected add-ons are pre-checked.
            </p>
          </fieldset>
        )}

        {/* Continue */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-line">
          <Link
            href={`/booking/${workshop.offering.id}`}
            className="font-ui text-sm text-ink-faded hover:text-ink transition-colors"
          >
            ← Change date
          </Link>
          <button
            type="submit"
            className="inline-flex items-center justify-center px-6 py-3 rounded-craft bg-brand text-ink-inverse font-ui tracking-wide hover:bg-brand-light transition-colors min-h-12"
          >
            Continue → Payment
          </button>
        </div>
      </form>
    </BookingShell>
  );
}

/* ------------------------------ Field ------------------------------ */

interface FieldProps {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  wide?: boolean;
}

function Field({
  name,
  label,
  hint,
  required,
  defaultValue,
  placeholder,
  type = "text",
  autoComplete,
  wide,
}: FieldProps) {
  const id = `field-${name}`;
  return (
    <div className={wide ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
      <label htmlFor={id} className="meta-mono text-ink-margin block">
        {label}
        {required && (
          <span aria-hidden="true" className="text-brand ml-1">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        name={name}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        type={type}
        autoComplete={autoComplete}
        className="w-full bg-paper border border-line rounded-craft px-4 py-2.5 font-body text-ink focus:outline-none focus:border-season-deep focus:ring-1 focus:ring-season-deep min-h-12"
      />
      {hint && <p className="meta-mono text-ink-margin">{hint}</p>}
    </div>
  );
}
