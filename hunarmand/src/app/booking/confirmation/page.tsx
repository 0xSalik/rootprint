import * as React from "react";
import Link from "next/link";

import {
  formatINR,
  getArtisan,
  getCraft,
  getWorkshopByType,
  paletteVars,
  themeClassForPalette,
} from "../../../../lib/data";
import { ChinarCorner, HashiaBorder } from "@/components/motifs";
import { PreviewConfetti } from "@/components/preview/preview-confetti";
import { SiteFooter } from "@/components/site/site-footer";

/* -------------------------------------------------------------------------
 * /booking/confirmation
 *
 * The celebration page — the moment the booking is confirmed.
 *
 *   • Subtle confetti in the craft's seasonal palette colours
 *   • A "Booking Certificate" card with ChinarCorner ornaments,
 *     Hashia borders top & bottom, and every booking detail laid
 *     out as a manuscript
 *   • Two CTAs: "Add to Google Calendar" (opens the GCal compose
 *     URL with the workshop pre-filled) and "View Artisan Profile"
 *
 * URL params are passed in from /booking/[artisan-slug]/[workshop-type]
 * after the user clicks Pay.
 * ----------------------------------------------------------------------- */

type Search = Record<string, string | string[] | undefined>;

export const dynamic = "force-dynamic";

function readParams(search: Search) {
  const get = (k: string) =>
    typeof search[k] === "string" ? (search[k] as string) : undefined;
  return {
    artisanSlug: get("artisan"),
    workshopType: get("workshop"),
    date: get("date"),
    time: get("time"),
    name: get("name"),
    phone: get("phone"),
    language: get("language") ?? "English",
    addOn: get("addOn") === "1",
    participants: parseInt(get("participants") ?? "1") || 1,
    total: parseInt(get("total") ?? "0") || 0,
  };
}

function prettyDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function buildBookingRef(name: string, date: string, time: string): string {
  /* Cheap deterministic 8-char ref that's pleasant to read aloud. */
  const seed = `${name}|${date}|${time}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  const abs = Math.abs(h).toString(36).toUpperCase().padStart(8, "0").slice(-8);
  return `HMD-${abs.slice(0, 4)}-${abs.slice(4, 8)}`;
}

function gcalLink(title: string, date: string, time: string, location: string, details: string): string {
  /* Convert "10:00 AM" → 100000, then pair with date to form the
   * compact dates= range Google Calendar expects.   */
  const t24 = (() => {
    const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time);
    if (!m) return [10, 0];
    let h = parseInt(m[1]);
    const min = parseInt(m[2]);
    const pm = /pm/i.test(m[3]);
    if (pm && h < 12) h += 12;
    if (!pm && h === 12) h = 0;
    return [h, min];
  })();
  const start = date.replaceAll("-", "");
  const startStamp = `${start}T${String(t24[0]).padStart(2, "0")}${String(t24[1]).padStart(2, "0")}00`;
  const endHour = (t24[0] + 4) % 24;
  const endStamp = `${start}T${String(endHour).padStart(2, "0")}${String(t24[1]).padStart(2, "0")}00`;

  const sp = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startStamp}/${endStamp}`,
    details,
    location,
  });
  return `https://www.google.com/calendar/render?${sp.toString()}`;
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const search = await searchParams;
  const params = readParams(search);

  const artisan = params.artisanSlug ? getArtisan(params.artisanSlug) : undefined;
  const craft = artisan ? getCraft(artisan.craft) : undefined;
  const workshop = params.workshopType ? getWorkshopByType(params.workshopType) : undefined;

  /* If anything's missing we still render — show graceful fallbacks
   * so the certificate is never blank. */
  const palette = craft?.palette ?? "autumn";
  const themeClass = themeClassForPalette(palette);
  const p = paletteVars(palette);

  const ref = buildBookingRef(
    params.name ?? "Guest",
    params.date ?? "",
    params.time ?? "",
  );

  const gcalHref = gcalLink(
    `Hunarmand · ${workshop?.title ?? "Workshop"} with ${artisan?.name ?? ""}`,
    params.date ?? new Date().toISOString().slice(0, 10),
    params.time ?? "10:00 AM",
    `${artisan?.village ?? ""}, ${artisan?.district ?? "Srinagar"}`,
    `Booking ref ${ref}. Hunarmand will share the master's exact location 24h before.`,
  );

  return (
    <div className={themeClass}>
      <PreviewConfetti palette={palette} />

      <main className="bg-parchment min-h-[100svh] pt-24 sm:pt-28 pb-24">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          {/* ── Heading ── */}
          <header className="text-center mb-10 animate-stagger-up">
            <p className="label-ui text-ink-margin mb-3">Booking confirmed</p>
            <h1 className="font-display text-[36px] sm:text-[44px] text-ink leading-tight">
              Wahaan se aap ke saath, {params.name?.split(" ")[0] ?? "friend"}.
            </h1>
            <p className="font-body italic text-[15px] sm:text-[16px] text-ink-faded mt-3 max-w-xl mx-auto">
              Your seat with {artisan?.name ?? "the master"} is held. Booking
              ref <span className="meta-mono text-ink">{ref}</span>.
            </p>
          </header>

          {/* ── Booking Certificate ── */}
          <section className="relative bg-paper border border-line rounded-craft-xl overflow-hidden">
            <ChinarCorner corner="tl" size={72} className="absolute top-2 left-2" />
            <ChinarCorner corner="tr" size={72} className="absolute top-2 right-2" />
            <ChinarCorner corner="bl" size={72} className="absolute bottom-2 left-2" />
            <ChinarCorner corner="br" size={72} className="absolute bottom-2 right-2" />

            <div className="px-8 pt-7">
              <HashiaBorder
                className="block w-full text-gold"
                color="var(--gold)"
                opacity={0.85}
                height={12}
              />
            </div>

            <div className="relative px-8 sm:px-12 py-10 sm:py-12 flex flex-col items-center text-center">
              <p className="label-ui text-ink-margin">Hunarmand</p>
              <h2 className="font-display text-[26px] sm:text-[28px] text-ink leading-tight mt-2">
                Booking Certificate
              </h2>
              <p className="meta-mono text-ink-margin mt-1">{ref}</p>

              <div className="mt-7 sm:mt-9 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5 text-left w-full">
                <CertField label="Workshop" value={workshop?.title ?? "Workshop"} />
                <CertField label="Master" value={artisan?.name ?? "—"} />
                <CertField label="Date" value={prettyDate(params.date)} />
                <CertField label="Time" value={params.time ?? "—"} />
                <CertField
                  label="Location"
                  value={artisan ? `${artisan.village}, ${artisan.district}` : "—"}
                />
                <CertField label="Participants" value={String(params.participants)} />
                <CertField label="Language" value={params.language} />
                <CertField
                  label="Add-on"
                  value={params.addOn ? "Heritage Walk · included" : "—"}
                />
              </div>

              <div className="mt-8 w-full flex items-center justify-between gap-6 pt-6 border-t border-line">
                <p
                  className="font-display italic text-[18px]"
                  style={{ color: p.deep }}
                >
                  Total paid
                </p>
                <p className="font-display text-[24px] text-brand">
                  {formatINR(params.total)}
                </p>
              </div>

              <p className="font-body italic text-[13px] text-ink-faded mt-6 max-w-md">
                The master will receive your booking and confirm by WhatsApp
                within 24 hours. The exact workshop address will arrive 24 h
                before your slot.
              </p>
            </div>

            <div className="px-8 pb-7">
              <HashiaBorder
                className="block w-full text-gold"
                color="var(--gold)"
                opacity={0.85}
                height={12}
              />
            </div>
          </section>

          {/* ── Actions ── */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={gcalHref}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center justify-center px-5 py-3 rounded-craft bg-brand hover:bg-brand-light text-ink-inverse font-ui text-[13px] tracking-wide min-h-11 transition-colors"
            >
              Add to Google Calendar
            </Link>
            {artisan ? (
              <Link
                href={`/artisan/${artisan.slug}`}
                className="inline-flex items-center justify-center px-5 py-3 rounded-craft border border-line text-ink hover:border-brand hover:text-brand font-ui text-[13px] tracking-wide min-h-11 transition-colors"
              >
                View Artisan Profile
              </Link>
            ) : null}
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-3 rounded-craft border border-line text-ink hover:border-brand hover:text-brand font-ui text-[13px] tracking-wide min-h-11 transition-colors"
            >
              Choose another craft
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function CertField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label-ui text-ink-margin">{label}</dt>
      <dd className="font-body text-[15px] text-ink mt-0.5">{value}</dd>
    </div>
  );
}
