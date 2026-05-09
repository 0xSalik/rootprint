import * as React from "react";
import Link from "next/link";

import { HashiaBorder } from "@/components/motifs";

/* -------------------------------------------------------------------------
 * <SiteFooter />
 *
 * Minimal walnut footer used at the bottom of every page in the
 * craft-entry-point flow. The Hashia border at the top is the
 * transition between page colour and footer; the wordmark and tagline
 * sit on a single line at desktop and stack on mobile.
 * ----------------------------------------------------------------------- */

export function SiteFooter() {
  return (
    <footer className="bg-walnut text-ink-inverse mt-auto">
      <HashiaBorder
        className="block w-full text-gold"
        opacity={0.6}
        height={14}
      />
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="font-display italic text-[26px] leading-none text-ink-inverse hover:text-gold-light transition-colors"
          >
            Hunarmand
          </Link>
          <p className="font-body italic text-[14px] text-ink-inverse/65 max-w-md">
            The hand still remembers what the book never wrote.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 font-ui text-[13px] text-ink-inverse/65">
          <Link href="/" className="hover:text-ink-inverse transition-colors">
            Crafts
          </Link>
          <Link href="/bazaar" className="hover:text-ink-inverse transition-colors">
            Bazaar
          </Link>
          <Link href="/workshops" className="hover:text-ink-inverse transition-colors">
            Workshops
          </Link>
          <Link href="/demo" className="hover:text-ink-inverse transition-colors">
            Demo
          </Link>
        </div>

        <p className="meta-mono text-ink-inverse/45">
          © {new Date().getFullYear()} Hunarmand · Srinagar
        </p>
      </div>
    </footer>
  );
}
