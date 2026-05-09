import * as React from "react";
import Link from "next/link";

import {
  type WorkshopFull,
  computeTotals,
  formatDateLong,
  formatINR,
} from "@/lib/workshops";
import { type BookingState } from "@/lib/booking-state";
import { ArabesqueQuarter, HashiaBorder } from "@/components/motifs";
import { QrGlyph } from "@/components/artisan/qr-glyph";
import { languageLabelFallback } from "@/components/workshops/lang-labels";

import { PrintButton } from "./print-button";

/* -------------------------------------------------------------------------
 * <BookingCertificate />
 *
 * The headline element of the confirmation page. A cream certificate
 * card, painted in the artisan's craft colours, four arabesque
 * corners, a centred wordmark, the booking facts laid out as a deed.
 *
 * The print stylesheet at the bottom turns this single component into
 * a clean A4 print-out — that's our "downloadable as PDF" without
 * shipping a PDF library.
 * ----------------------------------------------------------------------- */

interface BookingCertificateProps {
  workshop: WorkshopFull;
  state: BookingState;
  /** The Hunarmand-issued booking reference. */
  reference: string;
}

export function BookingCertificate({
  workshop,
  state,
  reference,
}: BookingCertificateProps) {
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
    <article
      id="booking-certificate"
      className="relative bg-paper border border-line rounded-craft-lg overflow-hidden"
      style={{
        boxShadow:
          "0 1px 0 0 rgba(28, 20, 16, 0.04), 0 28px 56px -32px var(--shadow-strong)",
      }}
    >
      {/* Top hashia */}
      <HashiaBorder height={6} color="var(--season-gold)" opacity={0.85} />

      {/* Corner ornaments */}
      <ArabesqueQuarter
        className="absolute top-3 left-3 sm:top-5 sm:left-5"
        corner="tl"
        size={64}
        opacity={0.7}
      />
      <ArabesqueQuarter
        className="absolute top-3 right-3 sm:top-5 sm:right-5"
        corner="tr"
        size={64}
        opacity={0.7}
      />
      <ArabesqueQuarter
        className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5"
        corner="br"
        size={64}
        opacity={0.55}
      />
      <ArabesqueQuarter
        className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5"
        corner="bl"
        size={64}
        opacity={0.55}
      />

      <div className="px-6 sm:px-12 pt-10 sm:pt-14 pb-10 sm:pb-12">
        {/* Wordmark */}
        <header className="text-center max-w-xl mx-auto">
          <p className="meta-mono text-ink-margin">Booking certificate</p>
          <p
            className="font-display font-medium text-ink mt-2 leading-tight"
            style={{ fontSize: "clamp(28px, 5vw, 38px)" }}
          >
            {workshop.offering.title}
          </p>
          <p className="font-serif italic text-ink-faded mt-2">
            with {workshop.artisan.name},{" "}
            {workshop.artisan.craftEnglish.toLowerCase()} master,{" "}
            {workshop.artisan.village}
          </p>
          <p
            className="meta-mono text-ink-margin mt-4 tracking-[0.18em]"
            dir="ltr"
          >
            {reference}
          </p>
        </header>

        {/* Booking facts */}
        <dl className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
          <Row label="Date" value={state.date ? formatDateLong(state.date) : "—"} />
          <Row label="Time" value={state.timeSlot || "—"} />
          <Row
            label="Participants"
            value={`${state.participants} ${state.participants === 1 ? "person" : "people"}`}
          />
          <Row label="Tier" value={tier.label} />
          <Row label="Language" value={languageLabelFallback(state.language)} />
          <Row
            label="Venue"
            value={
              <>
                {workshop.ext.location.name}
                <br />
                <span className="text-ink-faded">
                  {workshop.ext.location.address}
                </span>
              </>
            }
          />
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
          <Row
            label="Buyer"
            value={
              <>
                {state.fullName || "—"}
                <br />
                <span className="font-mono text-ink-faded text-sm" dir="ltr">
                  {state.email || state.phone || "—"}
                </span>
              </>
            }
          />
        </dl>

        {/* Total ribbon */}
        <div
          className="mt-8 px-5 py-4 rounded-craft border border-line bg-paper-deep flex items-center justify-between"
          style={{ borderLeft: "4px solid var(--season-deep)" }}
        >
          <p className="font-serif text-ink">Paid in full · GST included</p>
          <p className="font-display text-2xl text-ink tabular-nums">
            {formatINR(totals.total)}
          </p>
        </div>

        {/* Footer — QR + master's note */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-start border-t border-line pt-6">
          <div className="flex flex-col items-center gap-2">
            <div className="size-28 rounded-craft border border-line bg-parchment flex items-center justify-center text-season-deep">
              <QrGlyph size={88} />
            </div>
            <p className="meta-mono text-ink-margin text-center">
              Show on arrival
            </p>
          </div>
          <div className="space-y-3">
            <p
              className="font-handwriting text-2xl text-ink leading-snug"
              style={{ color: "var(--season-deep)" }}
            >
              "{workshop.ext.confirmationNote}"
            </p>
            <p className="meta-mono text-ink-margin">
              — {workshop.artisan.name.split(/\s+/)[0]}, your master
            </p>
          </div>
        </div>
      </div>

      {/* Bottom hashia */}
      <HashiaBorder height={6} color="var(--season-gold)" opacity={0.85} />

      {/* Print styles — pressing the browser's "Print" turns this card
          into a clean single-page PDF without any external library. */}
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          body * { visibility: hidden !important; }
          #booking-certificate, #booking-certificate * { visibility: visible !important; }
          #booking-certificate {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </article>
  );
}

/* -------------------------- Calendar / actions ------------------------- */

interface CertificateActionsProps {
  workshop: WorkshopFull;
  state: BookingState;
  reference: string;
}

/** Print button + Add-to-Google-Calendar / Add-to-Apple-Calendar links.
 *  Renders below the certificate. */
export function CertificateActions({
  workshop,
  state,
  reference,
}: CertificateActionsProps) {
  const gcalUrl = buildGoogleCalendarUrl({ workshop, state, reference });
  const icsHref = buildIcsDataHref({ workshop, state, reference });

  return (
    <div className="no-print mt-8 flex flex-wrap gap-3 justify-center">
      <PrintButton />
      <a
        href={gcalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-craft border border-line bg-paper text-ink font-ui text-sm hover:border-season-deep transition-colors min-h-12"
      >
        Add to Google Calendar
      </a>
      <a
        href={icsHref}
        download={`${reference}.ics`}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-craft border border-line bg-paper text-ink font-ui text-sm hover:border-season-deep transition-colors min-h-12"
      >
        Add to Apple Calendar (.ics)
      </a>
      <Link
        href={`/workshops`}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-craft text-ink-faded font-ui text-sm hover:text-ink transition-colors min-h-12"
      >
        Back to workshops →
      </Link>
    </div>
  );
}

/* ------------------------------ helpers ------------------------------ */

function buildGoogleCalendarUrl(opts: {
  workshop: WorkshopFull;
  state: BookingState;
  reference: string;
}): string {
  const { workshop, state, reference } = opts;
  const start = combineIsoDateAndTime(state.date, state.timeSlot);
  const end = addHoursIso(start, durationHours(workshop));
  const text = encodeURIComponent(
    `${workshop.offering.title} — Hunarmand`,
  );
  const details = encodeURIComponent(
    `Hunarmand booking ${reference}\nWith ${workshop.artisan.name}\n${workshop.ext.location.address}`,
  );
  const location = encodeURIComponent(
    `${workshop.ext.location.name}, ${workshop.ext.location.address}`,
  );
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${toGCalUtc(start)}/${toGCalUtc(end)}&details=${details}&location=${location}`;
}

function buildIcsDataHref(opts: {
  workshop: WorkshopFull;
  state: BookingState;
  reference: string;
}): string {
  const { workshop, state, reference } = opts;
  const start = combineIsoDateAndTime(state.date, state.timeSlot);
  const end = addHoursIso(start, durationHours(workshop));
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hunarmand//Workshop Booking//EN",
    "BEGIN:VEVENT",
    `UID:${reference}@hunarmand`,
    `DTSTAMP:${toIcsUtc(new Date().toISOString())}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcs(workshop.offering.title)} — Hunarmand`,
    `LOCATION:${escapeIcs(workshop.ext.location.name + ", " + workshop.ext.location.address)}`,
    `DESCRIPTION:${escapeIcs(`Hunarmand booking ${reference}. With ${workshop.artisan.name}.`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

function combineIsoDateAndTime(dateIso: string, timeHHmm: string): string {
  const safeDate = dateIso || "2026-01-01";
  const safeTime = timeHHmm || "10:00";
  return `${safeDate}T${safeTime}:00`;
}

function durationHours(workshop: WorkshopFull): number {
  const m = workshop.offering.duration.match(/(\d+(?:\.\d+)?)\s*hour/i);
  if (m) return Number(m[1]);
  if (/day/i.test(workshop.offering.duration)) {
    const d = workshop.offering.duration.match(/(\d+)\s*day/);
    return d ? Number(d[1]) * 8 : 8;
  }
  if (/min/i.test(workshop.offering.duration)) {
    const mm = workshop.offering.duration.match(/(\d+)\s*min/);
    return mm ? Number(mm[1]) / 60 : 1;
  }
  return 4;
}

function addHoursIso(iso: string, hours: number): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + Math.round(hours * 60));
  return d.toISOString().replace(/\.\d+Z$/, "Z");
}

function toGCalUtc(iso: string): string {
  return iso.replace(/[-:]/g, "").replace(/\.\d+/, "");
}

function toIcsUtc(iso: string): string {
  return iso.replace(/[-:]/g, "").replace(/\.\d+/, "");
}

function escapeIcs(s: string): string {
  return s.replace(/[\\,;]/g, "\\$&").replace(/\n/g, "\\n");
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
    <div className="space-y-1">
      <dt className="meta-mono text-ink-margin">{label}</dt>
      <dd className="font-serif text-ink leading-snug">{value}</dd>
    </div>
  );
}
