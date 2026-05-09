import * as React from "react";
import Link from "next/link";

/* -------------------------------------------------------------------------
 * <LandingNav />
 *
 * Sits inside the dark hero. Minimal, never sticky on the landing page —
 * the brief asks for the headline to lead, not the chrome. The
 * "Record Your Craft" CTA is doubled here so it's available without
 * scrolling.
 * ----------------------------------------------------------------------- */

export function LandingNav() {
  return (
    <nav className="relative z-20 flex items-center justify-between gap-6 py-6">
      <Link href="/" className="flex items-baseline gap-2 group">
        <span className="font-display text-2xl text-ink-inverse leading-none">
          Hunarmand
        </span>
        <span
          dir="rtl"
          className="font-nastaliq text-base text-gold-light leading-none translate-y-1"
          aria-hidden="true"
        >
          ہنرمند
        </span>
      </Link>

      <ul className="hidden md:flex items-center gap-8 label-ui text-ink-inverse/80">
        <li>
          <Link
            href="/directory"
            className="hover:text-gold transition-colors duration-200"
          >
            Masters
          </Link>
        </li>
        <li>
          <Link
            href="/workshops"
            className="hover:text-gold transition-colors duration-200"
          >
            Workshops
          </Link>
        </li>
        <li>
          <Link
            href="/bazaar"
            className="hover:text-gold transition-colors duration-200"
          >
            Bazaar
          </Link>
        </li>
        <li>
          <Link
            href="/design-system"
            className="hover:text-gold transition-colors duration-200"
          >
            Design&nbsp;System
          </Link>
        </li>
      </ul>

      <Link
        href="/vault/new"
        className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-craft border border-ink-inverse/25 hover:border-gold hover:text-gold text-ink-inverse font-ui text-xs uppercase tracking-[0.16em] transition-colors duration-200"
      >
        Record Your Craft
        <span aria-hidden="true">→</span>
      </Link>
    </nav>
  );
}
