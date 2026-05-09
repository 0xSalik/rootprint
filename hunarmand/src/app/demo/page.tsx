import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  MOHAMMAD_YUSUF,
  SEED_HERO_PIECE_ID,
  SEED_HERO_WORKSHOP_ID,
  SEED_BUNDLE_ID,
  SEED_EVENT_ID,
  SEED_SLUG,
  validateSeed,
} from "@seed/seed";

import { HashiaBorder } from "@/components/motifs";
import { LandingFooter } from "@/components/landing/landing-footer";
import { themeClassForSeason, SEASON_META } from "@/lib/seasons";

/* -------------------------------------------------------------------------
 * /demo — The Jury Demo Walkthrough
 *
 * One page, five steps, all anchored to the canonical Mohammad Yusuf
 * seed (`lib/seed.ts`). Each step is a deep link into the live page
 * the jury should land on, with a one-line briefing of what to point
 * at when the pixel hits the screen.
 *
 * The flow is the one called out in section 8 of the brief:
 *
 *   1. Scan QR  → Sanad page              (1.5s reveal · master,
 *                                            technique, signature)
 *   2. View profile → Artisan profile     (Craft DNA, lineage,
 *                                            signed pieces)
 *   3. Book workshop → Workshop page      (calendar → payment →
 *                                            certificate)
 *   4. Vault Studio                        (AI-led interview, in
 *                                            progress — placeholder
 *                                            link, real surface TBD)
 *   5. Bazaar → Heritage Bundle           (Khanyar Carpet Pair)
 *
 * The page itself is a server component. The seed is also rendered
 * as a small "Demo identity card" at the top so the jury can confirm
 * which master is being shown without leaving the page.
 * ----------------------------------------------------------------------- */

export const metadata: Metadata = {
  title: "Demo · Mohammad Yusuf Sheikh, end-to-end",
  description:
    "The five-step jury demo for Hunarmand, anchored in the canonical Mohammad Yusuf seed. Scan QR → Sanad → Artisan profile → Workshop → Vault → Bazaar bundle.",
};

const seasonClass = themeClassForSeason("harud");
const seasonMeta = SEASON_META.harud;

interface Step {
  index: number;
  eyebrow: string;
  title: string;
  body: string;
  /** What the jury should look for when they land on this page. */
  pointAt: string[];
  href: string;
  /** Display path next to the CTA. */
  display: string;
}

const STEPS: Step[] = [
  {
    index: 1,
    eyebrow: "01 · Scan",
    title: "The Sanad page",
    body:
      "Scan the QR on the back of a piece. The Sanad page renders SSR-only, in 1.5s, with master + technique + provenance + cryptographic signature — no JavaScript shipped.",
    pointAt: [
      "The verification banner at the top, painted gold-on-walnut.",
      "The provenance chain — material origin in Gurez, dye batch in Pulwama, signing event.",
      "The Ed25519 signature block at the bottom, expanded.",
      "The language switcher (six locales — try Japanese or Urdu).",
    ],
    href: `/sanad/${SEED_HERO_PIECE_ID}`,
    display: `/sanad/${SEED_HERO_PIECE_ID}`,
  },
  {
    index: 2,
    eyebrow: "02 · Profile",
    title: "Mohammad Yusuf, in full",
    body:
      "From the Sanad page, the buyer taps through to the artisan profile. The Craft DNA graph, the five-generation lineage wall, the Signed Pieces ledger, the supplier graph, three handwritten letters.",
    pointAt: [
      "The Craft DNA graph — four techniques, two endangered.",
      "The lineage wall — five generations back to the 1880s.",
      "The signed-piece ledger — IBM Plex Mono, like a bank statement.",
      "The handwritten letters from buyers in Kyoto, Bombay, Lyon.",
    ],
    href: `/artisan/${SEED_SLUG}`,
    display: `/artisan/${SEED_SLUG}`,
  },
  {
    index: 3,
    eyebrow: "03 · Workshop",
    title: "Book time with the master",
    body:
      "From the profile, the buyer picks a workshop. URL-driven booking flow — date → details → payment → confirmation — every step server-rendered, state lives in the query string.",
    pointAt: [
      "The 5-tier pricing card (we recommend the Master tier).",
      "The Hashia border progress indicator filling left-to-right.",
      "The confirmation certificate, ready for `window.print()` to PDF.",
    ],
    href: `/workshop/${SEED_HERO_WORKSHOP_ID}`,
    display: `/workshop/${SEED_HERO_WORKSHOP_ID}`,
  },
  {
    index: 4,
    eyebrow: "04 · Vault",
    title: "Where the knowledge was captured",
    body:
      "The Vault Studio surface — an AI-led interview with the master. This is the system the technique excerpts and clipIds on the Sanad page came from. Demo placeholder for now; real surface ships next.",
    pointAt: [
      "The four technique excerpts on the master's profile all carry a `vaultSession` and `clipId`.",
      "Vault session 2025-08-12 captured the 1940s knot and Gurez wool techniques.",
      "Vault session 2025-08-19 captured Winter Tension Adjustment (endangered).",
      "Vault session 2025-09-02 captured Natural Dye Ratios (rare).",
    ],
    href: `/artisan/${SEED_SLUG}#dna`,
    display: `/artisan/${SEED_SLUG}#dna`,
  },
  {
    index: 5,
    eyebrow: "05 · Bazaar",
    title: "The Khanyar Carpet Pair",
    body:
      "Close on the bazaar — Mohammad Yusuf's two pieces sold as one heritage bundle, under a single composite Sanad. The price band, the bundle Sanad ref, the included pieceIds — every value here comes from the same seed file.",
    pointAt: [
      "The bundle's composite Sanad reference (BNDL-KHN-9F2B).",
      "Both included pieces link back to live Sanad pages.",
      "Mohammad Yusuf's storefront — five verified, one made-to-order.",
      "His event — Harud Carpet Sundays — visible in the Seasonal Pop-ups strip.",
    ],
    href: `/bazaar?craft=carpet#bundles`,
    display: `/bazaar?craft=carpet#bundles`,
  },
];

export default function DemoPage() {
  const v = validateSeed(MOHAMMAD_YUSUF);
  const a = MOHAMMAD_YUSUF.artisan;

  return (
    <>
      {/* ─────────────────── HERO ─────────────────── */}
      <section
        className={`${seasonClass} relative overflow-hidden border-b border-line`}
        style={{ backgroundColor: "var(--season-light)" }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(120% 80% at 90% -10%, var(--season-mid) 0%, transparent 60%), radial-gradient(80% 60% at -10% 110%, var(--season-deep) 0%, transparent 55%)",
          }}
        />
        <HashiaBorder
          height={6}
          color="var(--season-gold)"
          opacity={0.55}
          className="absolute inset-x-0 top-0"
        />

        <div className="relative mx-auto max-w-5xl px-5 sm:px-8 pt-12 sm:pt-16 pb-10 sm:pb-12">
          <p className="meta-mono text-ink-margin">
            ❦ Demo walkthrough · single seed · {seasonMeta.glyph} {seasonMeta.englishName}
          </p>
          <h1
            className="font-display text-ink leading-[1.04] mt-2"
            style={{ fontSize: "clamp(36px, 5vw, 60px)", letterSpacing: "-0.01em" }}
          >
            One master, end-to-end.
          </h1>
          <p className="font-serif italic text-ink-faded mt-3 max-w-2xl">
            Five steps the jury sees. Every byte on every page comes from a single canonical seed at <code className="font-mono">/lib/seed.ts</code> — the same file <code className="font-mono">npm run seed:check</code> validates.
          </p>
        </div>
      </section>

      {/* ─────────────────── DEMO IDENTITY CARD ─────────────────── */}
      <section className={`${seasonClass} mx-auto max-w-5xl px-5 sm:px-8 mt-10`}>
        <div className="border border-line rounded-craft-lg bg-paper p-6 sm:p-7">
          <div className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
            <div>
              <p className="meta-mono text-season-deep">Seed identity</p>
              <h2 className="font-display text-2xl sm:text-3xl text-ink mt-1">
                {a.name}{" "}
                <span
                  dir="rtl"
                  className="font-nastaliq text-xl text-ink-faded"
                  aria-hidden="true"
                >
                  {a.craftUrdu}
                </span>
              </h2>
              <p className="font-body text-ink-faded mt-1">
                {a.craftEnglish} · {a.village}, {a.district} · Generation {a.generation}
              </p>
            </div>
            <div className="text-right">
              <p className="meta-mono text-ink-margin">Sanad level</p>
              <p className="font-display text-xl text-ink">{a.sanadLevel}</p>
            </div>
          </div>

          <p className="font-serif italic text-ink-faded leading-snug max-w-2xl">
            {a.irreplaceable}
          </p>

          <div className="mt-6">
            <HashiaBorder height={6} color="var(--season-gold)" opacity={0.7} />
          </div>

          <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-sm">
            <Stat label="Pieces signed" value={a.piecesSigned.toString()} />
            <Stat label="Disputes" value={a.disputes.toString()} />
            <Stat label="Open slots" value={a.openSlots.toString()} />
            <Stat label="Lineage from" value={a.lineageEstYear} />
            <Stat label="Techniques" value={v.counts.techniques.toString()} />
            <Stat label="Lineage" value={`${v.counts.lineage} gens`} />
            <Stat label="Signed ledger" value={`${v.counts.signedPieces} pieces`} />
            <Stat label="Workshops" value={v.counts.workshops.toString()} />
            <Stat label="Storefront" value={`${v.counts.storefront} listings`} />
            <Stat label="Bundle" value={SEED_BUNDLE_ID} />
            <Stat label="Hosted event" value={SEED_EVENT_ID} />
            <Stat
              label="Validation"
              value={v.ok ? "✓ all refs resolve" : `✕ ${v.issues.length} issues`}
              tone={v.ok ? "ok" : "warn"}
            />
          </dl>

          {!v.ok ? (
            <ul className="mt-4 space-y-1 text-sm text-brand">
              {v.issues.map((issue) => (
                <li key={issue}>· {issue}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      {/* ─────────────────── STEPS ─────────────────── */}
      <section className="mx-auto max-w-5xl px-5 sm:px-8 mt-12 sm:mt-16">
        <header className="mb-8 sm:mb-10">
          <p className="meta-mono text-brand">❦ The flow</p>
          <h2
            className="font-display text-ink leading-[1.06] mt-2"
            style={{ fontSize: "clamp(28px, 3.6vw, 44px)" }}
          >
            Five steps. One seed.
          </h2>
          <p className="font-serif italic text-ink-faded mt-2 max-w-2xl">
            Open each in a new tab and walk the jury through them in order. Every CTA below deep-links to a real, server-rendered page.
          </p>
        </header>

        <ol className="space-y-6 sm:space-y-8">
          {STEPS.map((step) => (
            <li key={step.index}>
              <DemoStepCard step={step} />
            </li>
          ))}
        </ol>
      </section>

      {/* ─────────────────── SEED ANCHORS ─────────────────── */}
      <section className="mx-auto max-w-5xl px-5 sm:px-8 mt-14 sm:mt-20">
        <header className="mb-6">
          <p className="meta-mono text-brand">❦ Quick links</p>
          <h2
            className="font-display text-ink leading-[1.06] mt-2"
            style={{ fontSize: "clamp(24px, 2.8vw, 34px)" }}
          >
            Every seed-anchored route.
          </h2>
          <p className="font-serif italic text-ink-faded mt-2">
            All seven of Mohammad Yusuf&apos;s signed pieces, all five of his workshops, his storefront, and his bundle — every one is a live page.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnchorList
            title="Signed pieces"
            items={MOHAMMAD_YUSUF.artisan.signedPieces.map((p) => ({
              label: `${p.pieceId}  ·  ${p.type}`,
              meta: `signed ${p.signedOn} · ${p.status}`,
              href: `/sanad/${p.pieceId}`,
            }))}
          />
          <AnchorList
            title="Workshops"
            items={MOHAMMAD_YUSUF.artisan.workshops.map((w) => ({
              label: w.title,
              meta: `${w.duration} · Rs. ${w.pricePerPerson.toLocaleString("en-IN")} / person`,
              href: `/workshop/${w.id}`,
            }))}
          />
          <AnchorList
            title="Storefront"
            items={MOHAMMAD_YUSUF.storefront.map((p) => ({
              label: p.name,
              meta: p.sanadVerified
                ? `verified · /sanad/${p.pieceId}`
                : "made-to-order",
              href: p.sanadVerified
                ? `/sanad/${p.pieceId}`
                : `/artisan/${SEED_SLUG}`,
            }))}
          />
          <AnchorList
            title="Bazaar surfaces"
            items={[
              {
                label: MOHAMMAD_YUSUF.bundle.name,
                meta: `${MOHAMMAD_YUSUF.bundle.bundleSanad} · ${MOHAMMAD_YUSUF.bundle.includes.length} items`,
                href: `/bazaar?craft=carpet#bundles`,
              },
              {
                label: MOHAMMAD_YUSUF.hostedEvent.name,
                meta: `${MOHAMMAD_YUSUF.hostedEvent.startsOn} → ${MOHAMMAD_YUSUF.hostedEvent.endsOn}`,
                href: `/bazaar#events`,
              },
              {
                label: "Storefront, filtered to carpet",
                meta: "/bazaar?craft=carpet#storefront",
                href: "/bazaar?craft=carpet#storefront",
              },
              {
                label: "Storefront, filtered to Harud",
                meta: "/bazaar?season=harud#storefront",
                href: "/bazaar?season=harud#storefront",
              },
            ]}
          />
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 sm:px-8 mt-14">
        <HashiaBorder height={8} color="var(--gold)" opacity={0.55} />
      </div>

      {/* ─────────────────── CLI HINT ─────────────────── */}
      <section className="mx-auto max-w-5xl px-5 sm:px-8 mt-10 mb-20">
        <div className="border border-line rounded-craft-lg bg-paper-deep p-5 sm:p-6">
          <p className="meta-mono text-brand mb-3">❦ Validate the seed at the terminal</p>
          <pre className="font-mono text-xs sm:text-sm text-ink leading-relaxed overflow-x-auto bg-walnut text-ink-inverse rounded-craft p-4">
            <code>{`# from hunarmand/
$ npm run seed:check

  Hunarmand seed · Mohammad Yusuf Sheikh
  Hand-knotted Carpet  ·  Khanyar, Srinagar
  ────────────────────────────────────────
  techniques     ${v.counts.techniques}
  lineage        ${v.counts.lineage} generations
  signed ledger  ${v.counts.signedPieces} pieces
  workshops      ${v.counts.workshops}
  storefront     ${v.counts.storefront} listings
  bundle         ${MOHAMMAD_YUSUF.bundle.name}
  ────────────────────────────────────────
  ${v.ok ? "✓" : "✕"} validation ${v.ok ? "OK" : "FAILED"}
`}</code>
          </pre>
        </div>
      </section>

      <LandingFooter />
    </>
  );
}

/* ─────────────────────────── primitives ───────────────────────── */

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "ok" | "warn";
}) {
  const valueColor =
    tone === "ok"
      ? "text-season-deep"
      : tone === "warn"
        ? "text-brand"
        : "text-ink";
  return (
    <div>
      <dt className="meta-mono text-ink-margin">{label}</dt>
      <dd className={`font-display text-lg leading-tight mt-0.5 ${valueColor}`}>
        {value}
      </dd>
    </div>
  );
}

function DemoStepCard({ step }: { step: Step }) {
  return (
    <article
      className={`${seasonClass} grid grid-cols-1 sm:grid-cols-[80px_1fr] gap-5 sm:gap-6 border border-line rounded-craft-lg bg-paper p-5 sm:p-7 hover-lift`}
    >
      {/* Step number, large */}
      <div className="flex sm:flex-col sm:items-center sm:justify-start gap-3">
        <span
          className="inline-flex items-center justify-center rounded-full font-display text-2xl sm:text-3xl text-ink-inverse"
          style={{
            backgroundColor: "var(--season-deep)",
            width: "56px",
            height: "56px",
          }}
        >
          {step.index}
        </span>
        <span className="meta-mono text-season-deep sm:mt-2 sm:text-center hidden sm:block">
          {step.eyebrow}
        </span>
      </div>

      <div>
        <p className="meta-mono text-season-deep mb-1 sm:hidden">{step.eyebrow}</p>
        <h3 className="font-display text-2xl sm:text-3xl text-ink leading-tight">
          {step.title}
        </h3>
        <p className="font-body text-ink-faded mt-2">{step.body}</p>

        <div className="mt-4">
          <p className="meta-mono text-ink-margin mb-1.5">Point at</p>
          <ul className="space-y-1 text-sm font-body text-ink-faded">
            {step.pointAt.map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span aria-hidden="true" className="text-season-deep mt-0.5">·</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            href={step.href}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-craft font-ui text-sm tracking-wide min-h-11 transition-colors duration-200"
            style={{
              backgroundColor: "var(--season-deep)",
              color: "var(--text-inverse)",
            }}
          >
            Open this step <span className="ml-1.5" aria-hidden="true">→</span>
          </Link>
          <code className="font-mono text-xs text-ink-margin truncate">
            {step.display}
          </code>
        </div>
      </div>
    </article>
  );
}

function AnchorList({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; meta: string; href: string }>;
}) {
  return (
    <div className={`${seasonClass} border border-line rounded-craft-lg bg-paper p-5 sm:p-6`}>
      <h3 className="font-display text-xl text-ink leading-none mb-4">{title}</h3>
      <ul className="divide-y divide-line">
        {items.map((item) => (
          <li key={item.href + item.label} className="py-2.5 flex flex-wrap items-baseline justify-between gap-2">
            <Link
              href={item.href}
              className="font-body text-sm text-ink hover:text-season-deep transition-colors"
            >
              {item.label}
            </Link>
            <code className="font-mono text-xs text-ink-margin">
              {item.meta}
            </code>
          </li>
        ))}
      </ul>
    </div>
  );
}
