import * as React from "react";
import Link from "next/link";

import { HashiaBorder, TalimTexture } from "@/components/motifs";

/* -------------------------------------------------------------------------
 * <LandingFooter />
 *
 * Dark walnut footer. Hashia border as top divider. Four columns
 * (Platform · Crafts · Seasonal Bazaars · For Artisans). Bottom row:
 * Hunarmand wordmark + Koshur tagline (RTL right-aligned) + minimal
 * single-line newsletter input.
 * ----------------------------------------------------------------------- */

const COLUMNS: Array<{
  title: string;
  links: Array<{ label: string; href: string }>;
}> = [
  {
    title: "Platform",
    links: [
      { label: "The Masters", href: "/directory" },
      { label: "Workshops", href: "/workshops" },
      { label: "Bazaar", href: "/bazaar" },
      { label: "Sanad lookup", href: "/sanad" },
      { label: "Design system", href: "/design-system" },
    ],
  },
  {
    title: "Crafts",
    links: [
      { label: "Hand-knotted Carpet", href: "/directory?craft=carpet" },
      { label: "Pashmina · Kani", href: "/directory?craft=pashmina" },
      { label: "Sozni Embroidery", href: "/directory?craft=sozni" },
      { label: "Naqashi · Papier-mâché", href: "/directory?craft=naqashi" },
      { label: "Saffron · Walnut", href: "/directory?craft=saffron" },
    ],
  },
  {
    title: "Seasonal Bazaars",
    links: [
      { label: "Bahar · Spring", href: "/bazaar?season=bahar" },
      { label: "Grism · Summer", href: "/bazaar?season=grism" },
      { label: "Harud · Autumn", href: "/bazaar?season=harud" },
      { label: "Shishur · Winter", href: "/bazaar?season=shishur" },
      { label: "Heritage Bundles", href: "/bazaar/bundles" },
    ],
  },
  {
    title: "For Artisans",
    links: [
      { label: "Record your craft", href: "/vault/new" },
      { label: "Vault Studio", href: "/vault/new" },
      { label: "Artisan dashboard", href: "/artisan/dashboard" },
      { label: "Become a verified master", href: "/onboard" },
      { label: "Field facilitator program", href: "/facilitators" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="relative bg-walnut text-ink-inverse overflow-hidden">
      <TalimTexture opacity={0.05} />

      {/* Top Hashia border divider */}
      <div className="relative z-10">
        <HashiaBorder height={12} color="var(--gold)" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-10 py-16 md:py-20">
        {/* Top: brand block + 4 link columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          <div className="md:col-span-4">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl text-ink-inverse leading-none">
                Hunarmand
              </span>
              <span
                dir="rtl"
                className="font-nastaliq text-xl text-gold-light leading-none translate-y-1"
                aria-hidden="true"
              >
                ہنرمند
              </span>
            </div>

            <p className="display-italic text-ink-inverse/70 mt-4 max-w-sm">
              The tacit knowledge operating system for the last living
              masters of Kashmir's heritage crafts.
            </p>

            {/* Newsletter — minimal, single-line */}
            <form
              action="/api/newsletter"
              method="post"
              className="mt-7 max-w-sm"
            >
              <label
                htmlFor="newsletter-email"
                className="label-ui text-gold-light block"
              >
                Seasonal dispatches from the masters
              </label>
              <div className="mt-3 flex items-center border-b border-ink-inverse/30 focus-within:border-gold transition-colors">
                <input
                  id="newsletter-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@workshop.com"
                  className="bg-transparent flex-1 py-2 text-sm font-body text-ink-inverse placeholder:text-ink-inverse/40 focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="font-ui text-xs uppercase tracking-[0.18em] text-gold hover:text-gold-light pl-3 py-2"
                >
                  Subscribe →
                </button>
              </div>
              <p className="meta-mono mt-2">
                Four dispatches a year. One per season.
              </p>
            </form>
          </div>

          <nav
            aria-label="Footer"
            className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="label-ui text-gold-light">{col.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link
                        href={l.href}
                        className="font-body text-sm text-ink-inverse/75 hover:text-gold transition-colors duration-200"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Mid divider */}
        <div className="mt-14 mb-8">
          <HashiaBorder height={8} color="var(--gold)" opacity={0.45} />
        </div>

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="meta-mono text-ink-inverse/55">
            <p>© 2025 — 2026 Hunarmand · Srinagar · Made for the masters.</p>
            <p className="mt-1">
              <Link href="/about" className="hover:text-gold-light">About</Link>
              <span className="mx-2">·</span>
              <Link href="/privacy" className="hover:text-gold-light">Privacy</Link>
              <span className="mx-2">·</span>
              <Link href="/terms" className="hover:text-gold-light">Terms</Link>
              <span className="mx-2">·</span>
              <Link href="/press" className="hover:text-gold-light">Press</Link>
            </p>
          </div>

          {/* Koshur wordmark + tagline, RTL right-aligned */}
          <div dir="rtl" className="text-right">
            <p className="font-nastaliq text-3xl text-ink-inverse">ہنرمند</p>
            <p className="font-nastaliq text-base text-gold-light mt-1">
              آپ کا ہنر قیمتی ہے
            </p>
            <p
              dir="ltr"
              className="font-body italic text-xs text-ink-inverse/55 mt-1"
            >
              Your craft is precious.
            </p>
          </div>
        </div>

        {/* Social — unobtrusive, monogram dots */}
        <div className="mt-10 flex items-center gap-4">
          <span className="meta-mono">Follow the work:</span>
          <SocialDot href="https://instagram.com" label="Instagram">IG</SocialDot>
          <SocialDot href="https://github.com" label="GitHub">GH</SocialDot>
          <SocialDot href="mailto:hello@hunarmand.org" label="Email">@</SocialDot>
        </div>
      </div>
    </footer>
  );
}

function SocialDot({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="size-8 inline-flex items-center justify-center rounded-full border border-ink-inverse/25 text-[10px] font-ui text-ink-inverse/70 hover:border-gold hover:text-gold transition-colors duration-200"
    >
      {children}
    </Link>
  );
}
