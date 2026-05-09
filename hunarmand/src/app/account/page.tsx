"use client";

import * as React from "react";
import Link from "next/link";

import { useRequireAuth } from "@/lib/auth";
import {
  api,
  type BookingWithWorkshop,
  type OrderWithBundle,
} from "@/lib/api";
import { HashiaBorder } from "@/components/motifs";

/* -------------------------------------------------------------------------
 * /account — patron / buyer dashboard
 *
 * Live data from the Render-hosted backend:
 *
 *   • /api/v1/bookings/me?phone=…  → workshops you've booked
 *   • /api/v1/orders/me?phone=…    → bundles you've checked out
 *
 * Anyone signed in can land here. If you signed in with the seeded
 * artisan phone we also link prominently across to /studio.
 * ----------------------------------------------------------------------- */

export default function AccountPage() {
  const auth = useRequireAuth();
  const [bookings, setBookings] = React.useState<BookingWithWorkshop[] | null>(null);
  const [orders, setOrders] = React.useState<OrderWithBundle[] | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!auth.phone) return;
    let cancelled = false;
    (async () => {
      try {
        const [b, o] = await Promise.all([
          api.bookings.listMine(auth.phone!).catch(() => ({ items: [] as BookingWithWorkshop[] })),
          api.orders.listMine(auth.phone!).catch(() => ({ items: [] as OrderWithBundle[] })),
        ]);
        if (cancelled) return;
        setBookings(b.items);
        setOrders(o.items);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Could not load your account.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth.phone]);

  if (!auth.hydrated || !auth.token) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center pt-24 text-ink-faded">
        <span className="font-mono text-[12px] uppercase tracking-[0.22em]">
          Loading your account…
        </span>
      </main>
    );
  }

  return (
    <main className="bg-parchment pt-24 pb-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <header className="mb-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faded">
            Patron · {auth.phone}
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-display text-[44px] leading-tight text-ink">
              {auth.master?.name ? `Welcome, ${auth.master.name}` : "Your account"}
            </h1>
            <div className="flex items-center gap-2">
              {auth.role === "artisan" ? (
                <Link
                  href="/studio"
                  className="rounded-craft border border-line bg-paper px-4 py-2 font-ui text-[13px] tracking-wide text-ink hover:border-brand"
                >
                  Open studio →
                </Link>
              ) : null}
              <button
                type="button"
                onClick={auth.logout}
                className="rounded-craft border border-line bg-paper px-4 py-2 font-ui text-[13px] tracking-wide text-ink hover:border-brand"
              >
                Sign out
              </button>
            </div>
          </div>
          <HashiaBorder className="mt-6 h-3 w-full text-gold" />
        </header>

        {loadError ? (
          <div className="mb-8 rounded-craft border border-brand/30 bg-brand-subtle px-4 py-3 font-body text-[13px] text-brand">
            {loadError}
          </div>
        ) : null}

        <div className="grid gap-10 md:grid-cols-2">
          <Section title="Workshops you've booked" hint="Heritage Walks, Master Sessions, masterclasses.">
            {bookings === null ? (
              <Skeleton lines={3} />
            ) : bookings.length === 0 ? (
              <Empty
                line="No bookings yet."
                cta={{ href: "/workshops", label: "Browse workshops" }}
              />
            ) : (
              <ul className="grid gap-3">
                {bookings.map((b) => (
                  <li key={b.id} className="rounded-craft border border-line bg-paper px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-display text-[20px] leading-tight text-ink">
                          {b.workshop_format ?? "Workshop"}
                        </div>
                        <div className="mt-0.5 font-body text-[13px] text-ink-faded">
                          with {b.master_name ?? "—"}
                          {" · "}
                          {fmtDate(b.booking_date)}
                          {" · "}
                          {b.num_participants} {b.num_participants === 1 ? "guest" : "guests"}
                        </div>
                      </div>
                      <Pill tone={b.status === "confirmed" ? "ok" : "muted"}>{b.status ?? "pending"}</Pill>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Pieces in your collection" hint="Verified bundles checked out from the Bazaar.">
            {orders === null ? (
              <Skeleton lines={3} />
            ) : orders.length === 0 ? (
              <Empty
                line="No orders yet."
                cta={{ href: "/bazaar", label: "Open the Bazaar" }}
              />
            ) : (
              <ul className="grid gap-3">
                {orders.map((o) => (
                  <li key={o.id} className="rounded-craft border border-line bg-paper px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-display text-[20px] leading-tight text-ink">
                          {o.bundle_name ?? "Bundle"}
                        </div>
                        <div className="mt-0.5 font-body text-[13px] text-ink-faded">
                          {o.bundle_price ? `₹${o.bundle_price.toLocaleString("en-IN")}` : "—"}
                          {" · "}
                          {fmtDate(o.created_at)}
                        </div>
                      </div>
                      <Pill tone={o.status === "completed" ? "ok" : "muted"}>{o.status ?? "pending"}</Pill>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </main>
  );
}

/* ─────────────────────────── helpers ─────────────────────────── */

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-[26px] leading-tight text-ink">{title}</h2>
      {hint ? (
        <p className="mt-1 font-body text-[13.5px] text-ink-faded">{hint}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Skeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-craft border border-line bg-paper"
        />
      ))}
    </div>
  );
}

function Empty({
  line,
  cta,
}: {
  line: string;
  cta: { href: string; label: string };
}) {
  return (
    <div className="rounded-craft border border-dashed border-line bg-parchment px-4 py-6 text-center">
      <p className="font-body text-[14px] text-ink-faded">{line}</p>
      <Link
        href={cta.href}
        className="mt-2 inline-flex items-center justify-center rounded-craft bg-brand px-4 py-2 font-ui text-[12.5px] tracking-wide text-ink-inverse hover:bg-brand-light"
      >
        {cta.label}
      </Link>
    </div>
  );
}

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "ok" | "muted";
}) {
  return (
    <span
      className={[
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em]",
        tone === "ok"
          ? "border-gold/40 bg-gold-light/30 text-ink"
          : "border-line bg-paper text-ink-faded",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
