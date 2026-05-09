import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  type Artisan,
  type Craft,
  type WorkshopOffering,
  formatINR,
  getArtisan,
  getCraft,
  getWorkshopByType,
  paletteVars,
  themeClassForPalette,
} from "../../../../../lib/data";
import { BookingProgress, type BookingStep } from "@/components/preview/booking-progress";
import { CalendarGrid } from "@/components/preview/calendar-grid";
import { SiteFooter } from "@/components/site/site-footer";

/* -------------------------------------------------------------------------
 * /booking/[artisan-slug]/[workshop-type]
 *
 * (Filed under the [workshop-id]/ directory so the parent dynamic
 * segment name matches the existing /booking/[workshop-id]/…
 * subtree — Next.js requires both dynamic siblings at this depth
 * to share a bracket name. The URL is unchanged.)
 *
 * A 3-step flow rendered as a single server route. The user's
 * choices are stored in URL search parameters, so every step is
 * deep-linkable, refresh-safe, and adds no client-side state.
 *
 *   step=1  — Choose Date  (calendar + time-slot pills)
 *   step=2  — Your Details (name · phone · language · notes · add-on)
 *   step=3  — Confirm & Pay (order summary + Pay button)
 *
 * Submitting each step is a vanilla `<form method="get">` whose
 * action stays on the same path; the next step's params are
 * forwarded by hidden inputs so previous answers are preserved.
 *
 * The "Pay" button on step 3 is a link to /booking/confirmation
 * with all the same params attached so the confirmation page can
 * print the certificate.
 * ----------------------------------------------------------------------- */

/* The first dynamic segment is shared with the existing
 * /booking/[workshop-id]/{confirmation,details,payment} flow, so
 * Next.js can resolve a single bracket name at this depth. The
 * value here is semantically the artisan-slug — see the destructure
 * inside the page. */
type Params = { "workshop-id": string; "workshop-type": string };

type Search = Record<string, string | string[] | undefined>;

export const dynamic = "force-dynamic";

/* ─────────────────────── Available dates ──────────────────────── */
/* Generate a deterministic, plausible set of available dates for
 * each workshop type — no runtime data, no calendar libs. */

function buildAvailableDates(workshopType: string): {
  available: Set<string>;
  monthLabel: string;
} {
  const today = new Date();
  /* Always show the next month so the calendar is never empty. */
  const month = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const year = month.getFullYear();
  const monthIdx = month.getMonth();
  const lastDay = new Date(year, monthIdx + 1, 0).getDate();
  const out = new Set<string>();
  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, monthIdx, d);
    const wk = date.getDay();
    const iso = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (workshopType === "heritage-walk") {
      /* Saturdays and Sundays. */
      if (wk === 0 || wk === 6) out.add(iso);
    } else if (workshopType === "half-day") {
      /* Tuesday, Thursday, Saturday. */
      if (wk === 2 || wk === 4 || wk === 6) out.add(iso);
    } else if (workshopType === "multi-day") {
      /* First Monday of every week (3-day span starting Monday). */
      if (wk === 1 && d <= 22) out.add(iso);
    }
  }
  return {
    available: out,
    monthLabel: month.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
  };
}

const TIME_SLOTS = ["10:00 AM", "2:00 PM", "4:00 PM"];

/* ───────────────────────── helpers ────────────────────────────── */

const PLATFORM_FEE_PCT = 0.12;
const ADD_ON_HERITAGE_INR = 1500;

function parseStep(step?: string): BookingStep {
  const n = parseInt(step ?? "1");
  if (n === 2 || n === 3) return n;
  return 1;
}

function buildHref(
  basePath: string,
  current: Search,
  patch: Record<string, string | undefined>,
): string {
  const sp = new URLSearchParams();
  /* Carry forward every existing scalar param. */
  for (const [k, v] of Object.entries(current)) {
    if (typeof v === "string") sp.set(k, v);
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) sp.delete(k);
    else sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function readBookingState(search: Search) {
  const date = typeof search.date === "string" ? search.date : undefined;
  const time = typeof search.time === "string" ? search.time : undefined;
  const name = typeof search.name === "string" ? search.name : "";
  const phone = typeof search.phone === "string" ? search.phone : "";
  const language = typeof search.language === "string" ? search.language : "English";
  const notes = typeof search.notes === "string" ? search.notes : "";
  const addOn = search.addOn === "1";
  const participants = Math.max(
    1,
    parseInt(typeof search.participants === "string" ? search.participants : "1") || 1,
  );
  return { date, time, name, phone, language, notes, addOn, participants };
}

function pretty(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ─────────────────────────── Page ─────────────────────────────── */

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { "workshop-id": artisanSlug, "workshop-type": workshopType } = await params;
  const search = await searchParams;

  const artisan = getArtisan(artisanSlug);
  if (!artisan) notFound();
  const craft = getCraft(artisan.craft);
  if (!craft) notFound();
  const workshop = getWorkshopByType(workshopType);
  if (!workshop) notFound();

  const step = parseStep(typeof search.step === "string" ? search.step : "1");
  const state = readBookingState(search);
  const themeClass = themeClassForPalette(craft.palette);
  const basePath = `/booking/${artisanSlug}/${workshopType}`;

  const { available, monthLabel } = buildAvailableDates(workshopType);

  return (
    <div className={themeClass}>
      <main className="bg-parchment min-h-[100svh] pt-24 sm:pt-28 pb-24">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          {/* ── Header ── */}
          <header className="mb-10">
            <Link
              href={`/artisan/${artisanSlug}`}
              className="meta-mono text-ink-margin hover:text-ink transition-colors"
            >
              ← {artisan.name}
            </Link>
            <h1 className="font-display text-[32px] sm:text-[40px] text-ink leading-tight mt-3">
              Book the {workshop.title}
            </h1>
            <p className="font-body italic text-[15px] text-ink-faded mt-2">
              {workshop.duration} · {formatINR(workshop.pricePerPerson)} per
              person · max {workshop.capacity} participants
            </p>
          </header>

          {/* ── Progress ── */}
          <div className="mb-12">
            <BookingProgress step={step} />
          </div>

          {/* ── Step content ── */}
          {step === 1 ? (
            <Step1ChooseDate
              search={search}
              basePath={basePath}
              craft={craft}
              available={available}
              monthLabel={monthLabel}
              state={state}
            />
          ) : null}

          {step === 2 ? (
            <Step2YourDetails
              search={search}
              basePath={basePath}
              state={state}
              craft={craft}
            />
          ) : null}

          {step === 3 ? (
            <Step3ConfirmPay
              artisan={artisan}
              workshop={workshop}
              craft={craft}
              state={state}
            />
          ) : null}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

/* ───────────────────── Step 1 — Choose Date ───────────────────── */

function Step1ChooseDate({
  search,
  basePath,
  craft,
  available,
  monthLabel,
  state,
}: {
  search: Search;
  basePath: string;
  craft: Craft;
  available: Set<string>;
  monthLabel: string;
  state: ReturnType<typeof readBookingState>;
}) {
  const p = paletteVars(craft.palette);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-[24px] text-ink leading-tight">
          Choose your date
        </h2>
        <p className="font-body text-[14px] text-ink-faded mt-1">
          Available {monthLabel} — pick a date, then a time.
        </p>
      </div>

      <CalendarGrid
        craft={craft}
        available={available}
        selected={state.date}
        hrefForDate={(iso) =>
          buildHref(basePath, search, { date: iso, step: "1" })
        }
      />

      {/* Time slots */}
      <div className="bg-paper border border-line rounded-craft-lg p-5 sm:p-6">
        <h3 className="font-display text-[18px] text-ink leading-tight mb-3">
          Pick a time
        </h3>
        <div className="flex flex-wrap gap-2">
          {TIME_SLOTS.map((t) => {
            const selected = state.time === t;
            const href = buildHref(basePath, search, {
              time: t,
              step: "1",
            });
            return (
              <Link
                key={t}
                href={href}
                className={[
                  "inline-flex items-center justify-center px-4 py-2 rounded-craft border font-ui text-[13px] tracking-wide transition-colors",
                  selected
                    ? "bg-brand border-brand text-ink-inverse"
                    : "border-line text-ink hover:text-ink",
                ].join(" ")}
                style={
                  selected
                    ? undefined
                    : {
                        backgroundColor: p.light,
                        color: p.deep,
                        borderColor: "transparent",
                      }
                }
              >
                {t}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Continue */}
      <div className="flex items-center justify-end gap-3 mt-2">
        {!state.date || !state.time ? (
          <p className="font-ui text-[12px] tracking-wide uppercase text-ink-margin">
            Pick a date &amp; time to continue
          </p>
        ) : null}
        <Link
          href={buildHref(basePath, search, { step: "2" })}
          aria-disabled={!state.date || !state.time}
          className={[
            "inline-flex items-center justify-center px-5 py-3 rounded-craft font-ui text-[13px] tracking-wide min-h-11 transition-colors",
            state.date && state.time
              ? "bg-brand hover:bg-brand-light text-ink-inverse"
              : "bg-paper-deep text-ink-margin pointer-events-none",
          ].join(" ")}
        >
          Continue → Your details
        </Link>
      </div>
    </section>
  );
}

/* ─────────────────── Step 2 — Your Details ────────────────────── */

function Step2YourDetails({
  basePath,
  state,
}: {
  search: Search;
  basePath: string;
  state: ReturnType<typeof readBookingState>;
  craft: Craft;
}) {
  return (
    <section>
      <header className="mb-6">
        <h2 className="font-display text-[24px] text-ink leading-tight">
          Your details
        </h2>
        <p className="font-body text-[14px] text-ink-faded mt-1">
          Phone-first — we&apos;ll send your booking and the master&apos;s
          location on WhatsApp.
        </p>
      </header>

      <form
        method="get"
        action={basePath}
        className="bg-paper border border-line rounded-craft-lg p-6 sm:p-8 flex flex-col gap-5"
      >
        {/* Carry forward step-1 selections */}
        <input type="hidden" name="date" value={state.date ?? ""} />
        <input type="hidden" name="time" value={state.time ?? ""} />
        <input type="hidden" name="participants" value={String(state.participants)} />
        <input type="hidden" name="step" value="3" />

        <Field label="Full name" htmlFor="name">
          <input
            id="name"
            name="name"
            required
            defaultValue={state.name}
            className="w-full px-3 py-2.5 rounded-craft bg-parchment border border-line focus:border-brand focus:outline-none font-body text-[15px] text-ink"
          />
        </Field>

        <Field label="Phone (with country code)" htmlFor="phone">
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="+91 9XX XXX XXXX"
            defaultValue={state.phone}
            className="w-full px-3 py-2.5 rounded-craft bg-parchment border border-line focus:border-brand focus:outline-none font-body text-[15px] text-ink"
          />
        </Field>

        <Field label="Language preference" htmlFor="language">
          <select
            id="language"
            name="language"
            defaultValue={state.language}
            className="w-full px-3 py-2.5 rounded-craft bg-parchment border border-line focus:border-brand focus:outline-none font-body text-[15px] text-ink"
          >
            {["English", "Hindi", "Urdu", "Kashmiri", "French", "Japanese"].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Special notes (optional)" htmlFor="notes">
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={state.notes}
            placeholder="Anything we should pass to the master before you arrive?"
            className="w-full px-3 py-2.5 rounded-craft bg-parchment border border-line focus:border-brand focus:outline-none font-body text-[15px] text-ink resize-none"
          />
        </Field>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            name="addOn"
            value="1"
            defaultChecked={state.addOn}
            className="mt-1 accent-[var(--brand)]"
          />
          <span>
            <span className="font-display text-[16px] text-ink leading-tight">
              Add a Heritage Walk
            </span>
            <span className="block font-body italic text-[13px] text-ink-faded">
              + {formatINR(ADD_ON_HERITAGE_INR)} — visit three nearby clusters with a Sanad-verified guide.
            </span>
          </span>
        </label>

        <div className="flex items-center justify-between gap-3 mt-2">
          <Link
            href={`${basePath}?${new URLSearchParams({
              step: "1",
              date: state.date ?? "",
              time: state.time ?? "",
            }).toString()}`}
            className="inline-flex items-center gap-1.5 font-ui text-[13px] tracking-wide text-ink-faded hover:text-ink transition-colors"
          >
            ← Back to date
          </Link>
          <button
            type="submit"
            className="inline-flex items-center justify-center px-5 py-3 rounded-craft bg-brand hover:bg-brand-light text-ink-inverse font-ui text-[13px] tracking-wide min-h-11 transition-colors"
          >
            Continue → Confirm &amp; pay
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="font-ui text-[12px] tracking-[0.1em] uppercase text-ink-faded"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

/* ────────────────── Step 3 — Confirm & Pay ────────────────────── */

function Step3ConfirmPay({
  artisan,
  workshop,
  craft,
  state,
}: {
  artisan: Artisan;
  workshop: WorkshopOffering;
  craft: Craft;
  state: ReturnType<typeof readBookingState>;
}) {
  const p = paletteVars(craft.palette);
  const subtotal = workshop.pricePerPerson * state.participants;
  const addOn = state.addOn ? ADD_ON_HERITAGE_INR : 0;
  const beforeFee = subtotal + addOn;
  const platformFee = Math.round(beforeFee * PLATFORM_FEE_PCT);
  const total = beforeFee + platformFee;

  /* Build the confirmation URL — pass everything along. */
  const confirmHref = `/booking/confirmation?${new URLSearchParams({
    artisan: artisan.slug,
    workshop: workshop.type,
    date: state.date ?? "",
    time: state.time ?? "",
    name: state.name,
    phone: state.phone,
    language: state.language,
    addOn: state.addOn ? "1" : "0",
    participants: String(state.participants),
    total: String(total),
  }).toString()}`;

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h2 className="font-display text-[24px] text-ink leading-tight">
          Confirm &amp; pay
        </h2>
        <p className="font-body text-[14px] text-ink-faded mt-1">
          Review your booking — payment is secure and confirmed instantly.
        </p>
      </header>

      {/* Order summary — receipt style */}
      <div
        className="relative bg-paper rounded-craft-lg p-6 sm:p-8 border-t-4"
        style={{ borderColor: p.deep }}
      >
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="label-ui text-ink-margin">Order summary</p>
            <h3 className="font-display text-[22px] text-ink leading-tight mt-1">
              {workshop.title}
            </h3>
            <p className="font-body italic text-[13px] text-ink-faded mt-1">
              with {artisan.name} — {artisan.village}
            </p>
          </div>
          <p className="meta-mono text-ink-margin">
            ref · pre-confirmation
          </p>
        </header>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mb-6 pb-6 border-b border-line">
          <SummaryRow label="Date" value={state.date ? pretty(state.date) : "—"} />
          <SummaryRow label="Time" value={state.time ?? "—"} />
          <SummaryRow label="Participant(s)" value={String(state.participants)} />
          <SummaryRow label="Language" value={state.language} />
          <SummaryRow label="Name" value={state.name || "—"} />
          <SummaryRow label="Phone" value={state.phone || "—"} />
        </dl>

        <ul className="flex flex-col gap-2 text-[14px]">
          <LineItem
            label={`${workshop.title} × ${state.participants}`}
            value={formatINR(subtotal)}
          />
          {state.addOn ? (
            <LineItem
              label="Heritage Walk add-on"
              value={`+ ${formatINR(addOn)}`}
            />
          ) : null}
          <LineItem
            label={`Platform fee (${(PLATFORM_FEE_PCT * 100).toFixed(0)}%)`}
            value={formatINR(platformFee)}
          />
        </ul>

        <div className="mt-5 pt-5 border-t border-line flex items-center justify-between">
          <p className="font-display text-[20px] text-ink">Total</p>
          <p className="font-display text-[26px] text-brand">{formatINR(total)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-2">
        <Link
          href={`/booking/${artisan.slug}/${workshop.type}?${new URLSearchParams({
            step: "2",
            date: state.date ?? "",
            time: state.time ?? "",
            name: state.name,
            phone: state.phone,
            language: state.language,
            notes: state.notes,
            addOn: state.addOn ? "1" : "0",
            participants: String(state.participants),
          }).toString()}`}
          className="inline-flex items-center gap-1.5 font-ui text-[13px] tracking-wide text-ink-faded hover:text-ink transition-colors"
        >
          ← Back to details
        </Link>
        <Link
          href={confirmHref}
          className="inline-flex items-center justify-center px-6 py-3 rounded-craft bg-brand hover:bg-brand-light text-ink-inverse font-ui text-[13px] tracking-wide min-h-11 transition-colors"
        >
          Pay {formatINR(total)}
        </Link>
      </div>

      <p className="meta-mono text-ink-margin text-center">
        Mock payment for the preview — clicking Pay confirms your booking.
      </p>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label-ui text-ink-margin">{label}</dt>
      <dd className="font-body text-[14px] text-ink mt-0.5">{value}</dd>
    </div>
  );
}

function LineItem({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between font-body text-ink-faded">
      <span>{label}</span>
      <span className="font-mono text-ink">{value}</span>
    </li>
  );
}
