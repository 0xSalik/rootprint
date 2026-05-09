"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/lib/auth";

/* -------------------------------------------------------------------------
 * <SiteNav />
 *
 * Sticky top bar mounted in the root layout.
 *
 *   • Wordmark on the left (Cormorant italic, brand red, links to /)
 *   • Centre links on desktop: Crafts · Masters · Workshops · Bazaar
 *   • Right: "For Artisans" ghost button + "Book an Experience"
 *     brand-red button
 *   • Below 768 px the centre links collapse into a hamburger that
 *     slides a sheet in from the right
 *   • Background fades in on scroll: transparent at the top of any
 *     dark hero, parchment + bottom border once the user scrolls
 *
 * Marked "use client" because of `usePathname()` and the scroll
 * listener — these are the only client-only behaviours.
 * ----------------------------------------------------------------------- */

const NAV_LINKS: Array<{ href: string; label: string }> = [
  { href: "/", label: "Crafts" },
  { href: "/bazaar", label: "Bazaar" },
  { href: "/workshops", label: "Workshops" },
  { href: "/demo", label: "Demo" },
];

export function SiteNav() {
  const pathname = usePathname();
  const auth = useAuth();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const dashboardHref = auth.role === "artisan" ? "/studio" : "/account";
  const dashboardLabel = auth.role === "artisan" ? "Studio" : "Account";

  /* Scroll listener — triggers the background fade once the user has
   * moved past 24 px from the top of the document. */
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close the mobile sheet whenever the route changes. The lint
   * rule below would normally flag setState-in-effect, but here the
   * effect is the canonical way to react to a navigation event from
   * the Next.js router (pathname is supplied by usePathname). */
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={[
        "fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled
          ? "bg-parchment/92 supports-[backdrop-filter]:bg-parchment/75 backdrop-blur border-b border-line"
          : "bg-transparent border-b border-transparent",
      ].join(" ")}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
        {/* Wordmark */}
        <Link
          href="/"
          className="font-display italic text-[24px] leading-none text-brand hover:text-brand-light transition-colors"
        >
          Hunarmand
        </Link>

        {/* Desktop links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7"
        >
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "font-ui text-[14px] tracking-wide transition-colors",
                  active
                    ? "text-ink"
                    : scrolled
                      ? "text-ink-faded hover:text-ink"
                      : "text-ink-inverse/85 hover:text-ink-inverse",
                ].join(" ")}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTAs (desktop) — auth-aware */}
        <div className="hidden md:flex items-center gap-3">
          {auth.hydrated && auth.token ? (
            <>
              <Link
                href={dashboardHref}
                className={[
                  "inline-flex items-center justify-center px-4 py-2 rounded-craft border font-ui text-[13px] tracking-wide transition-colors min-h-9",
                  scrolled
                    ? "border-line text-ink hover:border-brand hover:text-brand"
                    : "border-ink-inverse/35 text-ink-inverse hover:border-gold-light hover:text-gold-light",
                ].join(" ")}
              >
                {dashboardLabel}
              </Link>
              <button
                type="button"
                onClick={auth.logout}
                className={[
                  "inline-flex items-center justify-center px-4 py-2 rounded-craft border font-ui text-[13px] tracking-wide transition-colors min-h-9",
                  scrolled
                    ? "border-line text-ink-faded hover:border-brand hover:text-brand"
                    : "border-ink-inverse/30 text-ink-inverse/85 hover:border-gold-light hover:text-gold-light",
                ].join(" ")}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={[
                  "inline-flex items-center justify-center px-4 py-2 rounded-craft border font-ui text-[13px] tracking-wide transition-colors min-h-9",
                  scrolled
                    ? "border-line text-ink hover:border-brand hover:text-brand"
                    : "border-ink-inverse/35 text-ink-inverse hover:border-gold-light hover:text-gold-light",
                ].join(" ")}
              >
                Sign in
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2 rounded-craft bg-brand hover:bg-brand-light text-ink-inverse font-ui text-[13px] tracking-wide transition-colors min-h-9"
              >
                Try the demo
              </Link>
            </>
          )}
        </div>

        {/* Hamburger (mobile) */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="site-nav-sheet"
          onClick={() => setOpen((v) => !v)}
          className={[
            "md:hidden inline-flex items-center justify-center w-10 h-10 rounded-craft border transition-colors",
            scrolled
              ? "border-line text-ink"
              : "border-ink-inverse/30 text-ink-inverse",
          ].join(" ")}
        >
          {open ? <CloseGlyph /> : <BurgerGlyph />}
        </button>
      </div>

      {/* Mobile sheet — slides in from the right */}
      <div
        id="site-nav-sheet"
        aria-hidden={!open}
        className={[
          "md:hidden fixed inset-0 top-16 z-40 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        {/* Backdrop */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="absolute inset-0 bg-walnut/55"
        />
        {/* Drawer */}
        <aside
          className={[
            "absolute right-0 top-0 bottom-0 w-[85vw] max-w-[360px] bg-parchment border-l border-line shadow-[0_24px_60px_-30px_rgba(28,20,16,0.5)] transition-transform duration-300",
            open ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        >
          <nav aria-label="Mobile" className="flex flex-col px-5 pt-6 pb-8 gap-1">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "font-display text-[28px] leading-tight py-3 border-b border-line",
                    active ? "text-brand" : "text-ink",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="mt-7 grid grid-cols-1 gap-3">
              {auth.hydrated && auth.token ? (
                <>
                  <Link
                    href={dashboardHref}
                    className="inline-flex items-center justify-center px-4 py-3 rounded-craft border border-line text-ink font-ui text-sm tracking-wide min-h-11"
                  >
                    {dashboardLabel}
                  </Link>
                  <button
                    type="button"
                    onClick={auth.logout}
                    className="inline-flex items-center justify-center px-4 py-3 rounded-craft border border-line text-ink-faded font-ui text-sm tracking-wide min-h-11"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-4 py-3 rounded-craft border border-line text-ink font-ui text-sm tracking-wide min-h-11"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-4 py-3 rounded-craft bg-brand text-ink-inverse font-ui text-sm tracking-wide min-h-11"
                  >
                    Try the demo
                  </Link>
                </>
              )}
            </div>
          </nav>
        </aside>
      </div>
    </header>
  );
}

/* ─────────────────────────── glyphs ───────────────────────────── */

function BurgerGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <line x1="3" y1="5" x2="15" y2="5" />
      <line x1="3" y1="9" x2="15" y2="9" />
      <line x1="3" y1="13" x2="15" y2="13" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <line x1="4" y1="4" x2="14" y2="14" />
      <line x1="14" y1="4" x2="4" y2="14" />
    </svg>
  );
}
