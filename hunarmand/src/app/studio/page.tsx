"use client";

import * as React from "react";
import Link from "next/link";

import { useRequireAuth } from "@/lib/auth";
import {
  api,
  type WorkshopWithMaster,
  type VaultPublic,
  type SanadCard,
} from "@/lib/api";
import { HashiaBorder } from "@/components/motifs";

/* -------------------------------------------------------------------------
 * /studio — artisan-side dashboard
 *
 * The master's home base. Pulls live data from:
 *
 *   • /api/v1/workshops?master_id=<self>
 *   • /api/v1/vaults/me
 *   • /api/v1/sanad?master_id=<self>
 *
 * The phone-to-role inference in `lib/env.ts` decides who lands here
 * by default after login. Anyone signed in can navigate to it via the
 * site nav, but if they have no workshops registered the lists will
 * just be empty — there's no separate gating layer.
 * ----------------------------------------------------------------------- */

export default function StudioPage() {
  const auth = useRequireAuth();
  const [workshops, setWorkshops] = React.useState<WorkshopWithMaster[] | null>(null);
  const [vaults, setVaults] = React.useState<VaultPublic[] | null>(null);
  const [sanads, setSanads] = React.useState<SanadCard[] | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!auth.token || !auth.master) return;
    let cancelled = false;
    (async () => {
      try {
        const [w, v, s] = await Promise.all([
          api.workshops.list({ master_id: auth.master!.id }).catch(() => ({ items: [] as WorkshopWithMaster[] })),
          api.vaults.listMine(auth.token!).catch(() => ({ items: [] as VaultPublic[] })),
          api.sanad.listPublic(auth.master!.id).catch(() => ({ items: [] as SanadCard[] })),
        ]);
        if (cancelled) return;
        setWorkshops(w.items);
        setVaults(v.items);
        setSanads(s.items);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Could not load your studio.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth.token, auth.master]);

  if (!auth.hydrated || !auth.token) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center pt-24 text-ink-faded">
        <span className="font-mono text-[12px] uppercase tracking-[0.22em]">
          Loading the studio…
        </span>
      </main>
    );
  }

  return (
    <main className="bg-parchment pt-24 pb-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <header className="mb-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faded">
            Studio · {auth.phone}
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-[44px] leading-tight text-ink">
                {auth.master?.name ? auth.master.name : "Your studio"}
              </h1>
              {auth.master?.workshop_location ? (
                <p className="mt-1 font-body text-[14px] text-ink-faded">
                  {auth.master.workshop_location}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/studio/profile"
                className="rounded-craft border border-line bg-paper px-4 py-2 font-ui text-[13px] tracking-wide text-ink hover:border-brand"
              >
                Edit profile
              </Link>
              <Link
                href="/studio/workshops"
                className="rounded-craft border border-line bg-paper px-4 py-2 font-ui text-[13px] tracking-wide text-ink hover:border-brand"
              >
                Manage workshops
              </Link>
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

        <div className="grid gap-6 sm:grid-cols-3">
          <Stat
            label="Workshops live"
            value={workshops === null ? "…" : workshops.filter((w) => w.is_active).length.toString()}
          />
          <Stat
            label="Vault sessions"
            value={vaults === null ? "…" : vaults.length.toString()}
          />
          <Stat
            label="Sanads issued"
            value={sanads === null ? "…" : sanads.length.toString()}
          />
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-2">
          <Section title="Workshops" cta={{ href: "/studio/workshops", label: "Manage all →" }}>
            {workshops === null ? (
              <Skeleton lines={2} />
            ) : workshops.length === 0 ? (
              <Empty line="No workshops yet — add your first under 'Manage workshops'." />
            ) : (
              <ul className="grid gap-3">
                {workshops.slice(0, 4).map((w) => (
                  <li key={w.id} className="rounded-craft border border-line bg-paper px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-display text-[20px] leading-tight text-ink">
                          {w.format ?? "Workshop"}
                        </div>
                        <div className="mt-0.5 font-body text-[13px] text-ink-faded">
                          {w.duration_mins ? `${Math.round(w.duration_mins / 60)} hr` : "—"}
                          {" · "}
                          {w.price ? `₹${w.price.toLocaleString("en-IN")}` : "—"}
                        </div>
                      </div>
                      <span
                        className={[
                          "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em]",
                          w.is_active
                            ? "border-gold/40 bg-gold-light/30 text-ink"
                            : "border-line bg-paper text-ink-faded",
                        ].join(" ")}
                      >
                        {w.is_active ? "live" : "draft"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Vault sessions" hint="Recordings the team has captured into your archive.">
            {vaults === null ? (
              <Skeleton lines={2} />
            ) : vaults.length === 0 ? (
              <Empty line="No Vault sessions yet — your facilitator will schedule one." />
            ) : (
              <ul className="grid gap-3">
                {vaults.slice(0, 4).map((v) => (
                  <li key={v.id} className="rounded-craft border border-line bg-paper px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-display text-[18px] leading-tight text-ink">
                          Session {fmtDate(v.created_at)}
                        </div>
                        <div className="mt-0.5 font-body text-[13px] text-ink-faded font-mono">
                          {v.media_s3_key ? v.media_s3_key.split("/").pop() : "—"}
                        </div>
                      </div>
                      <span className="inline-flex items-center rounded-full border border-line px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-faded">
                        {v.status ?? "pending"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <Section
          className="mt-12"
          title="Sanads issued"
          hint="Cryptographic provenance certificates signed under your master keypair."
        >
          {sanads === null ? (
            <Skeleton lines={2} />
          ) : sanads.length === 0 ? (
            <Empty line="No Sanads issued yet." />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {sanads.slice(0, 6).map((s) => (
                <li key={s.id} className="rounded-craft border border-line bg-paper px-4 py-4">
                  <div className="font-display text-[18px] leading-tight text-ink">
                    {s.piece_name}
                  </div>
                  <div className="mt-0.5 font-body text-[13px] text-ink-faded">
                    {s.material_origin ?? "—"} · {fmtDate(s.created_at)}
                  </div>
                  <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faded">
                    {s.id.slice(0, 8)}…
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </main>
  );
}

/* ─────────────────────────── helpers ─────────────────────────── */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-craft border border-line bg-paper px-5 py-5">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-faded">
        {label}
      </div>
      <div className="mt-1 font-display text-[36px] leading-none text-ink">
        {value}
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  cta,
  children,
  className,
}: {
  title: string;
  hint?: string;
  cta?: { href: string; label: string };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[26px] leading-tight text-ink">{title}</h2>
          {hint ? (
            <p className="mt-1 font-body text-[13.5px] text-ink-faded">{hint}</p>
          ) : null}
        </div>
        {cta ? (
          <Link
            href={cta.href}
            className="font-ui text-[13px] tracking-wide text-ink-faded hover:text-brand"
          >
            {cta.label}
          </Link>
        ) : null}
      </div>
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

function Empty({ line }: { line: string }) {
  return (
    <div className="rounded-craft border border-dashed border-line bg-parchment px-4 py-6 text-center">
      <p className="font-body text-[14px] text-ink-faded">{line}</p>
    </div>
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
