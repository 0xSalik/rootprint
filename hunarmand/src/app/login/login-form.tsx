"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/lib/auth";
import { DEMO_ARTISAN, DEMO_BUYER, DEMO_OTP } from "@/lib/env";
import { ApiError } from "@/lib/api";
import { TalimTexture } from "@/components/motifs";

/* -------------------------------------------------------------------------
 * The actual login form. See `page.tsx` for the Suspense wrapper.
 * Two demo accounts: artisan and buyer/patron, both with mock OTP.
 * ----------------------------------------------------------------------- */

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const auth = useAuth();
  const next = search.get("next");

  const [phone, setPhone] = React.useState(DEMO_ARTISAN.phone);
  const [otp, setOtp] = React.useState(DEMO_OTP);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (auth.hydrated && auth.token) {
      router.replace(next ?? (auth.role === "artisan" ? "/studio" : "/account"));
    }
  }, [auth.hydrated, auth.token, auth.role, next, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { role } = await auth.login(phone, otp);
      router.replace(next ?? (role === "artisan" ? "/studio" : "/account"));
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.status === 0
            ? "Cannot reach the backend. Check your network."
            : err.message
          : err instanceof Error
            ? err.message
            : "Login failed.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function fill(role: "artisan" | "buyer") {
    setPhone(role === "artisan" ? DEMO_ARTISAN.phone : DEMO_BUYER.phone);
    setOtp(DEMO_OTP);
    setError(null);
  }

  return (
    <main className="relative flex min-h-[100svh] items-center justify-center bg-parchment px-5 pt-24 pb-16 sm:px-8">
      <TalimTexture
        className="pointer-events-none absolute inset-0 opacity-10"
        aria-hidden="true"
      />

      <section className="relative w-full max-w-[440px] rounded-craft border border-line bg-paper px-7 pt-9 pb-7 shadow-[0_24px_60px_-32px_rgba(28,20,16,0.35)] sm:px-9 sm:pt-10 sm:pb-8">
        <header className="mb-7 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faded">
            Hunarmand · Sign in
          </p>
          <h1 className="mt-3 font-display text-[34px] leading-tight text-ink">
            Enter the workshop
          </h1>
          <p className="mt-2 font-body text-[14px] leading-relaxed text-ink-faded">
            Use your phone number. The OTP for the demo is fixed at{" "}
            <span className="font-mono text-ink">{DEMO_OTP}</span>.
          </p>
        </header>

        <div className="mb-7 grid gap-2.5">
          <button
            type="button"
            onClick={() => fill("artisan")}
            className="group rounded-craft border border-line bg-parchment px-4 py-3 text-left transition-colors hover:border-brand"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-faded">
                Try as the artisan
              </span>
              <span className="font-mono text-[11.5px] text-ink-faded group-hover:text-brand">
                {DEMO_ARTISAN.phone}
              </span>
            </div>
            <div className="mt-1 font-display text-[18px] leading-tight text-ink">
              {DEMO_ARTISAN.label}
            </div>
            <div className="mt-0.5 font-body text-[12.5px] text-ink-faded">
              {DEMO_ARTISAN.hint}
            </div>
          </button>

          <button
            type="button"
            onClick={() => fill("buyer")}
            className="group rounded-craft border border-line bg-parchment px-4 py-3 text-left transition-colors hover:border-brand"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-faded">
                Try as a patron
              </span>
              <span className="font-mono text-[11.5px] text-ink-faded group-hover:text-brand">
                {DEMO_BUYER.phone}
              </span>
            </div>
            <div className="mt-1 font-display text-[18px] leading-tight text-ink">
              {DEMO_BUYER.label}
            </div>
            <div className="mt-0.5 font-body text-[12.5px] text-ink-faded">
              {DEMO_BUYER.hint}
            </div>
          </button>
        </div>

        <form onSubmit={submit} className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faded">
              Phone
            </span>
            <input
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-craft border border-line bg-paper px-3.5 py-2.5 font-mono text-[14px] text-ink outline-none focus:border-brand"
              placeholder="+919999999999"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faded">
              OTP
            </span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={8}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full rounded-craft border border-line bg-paper px-3.5 py-2.5 font-mono text-[14px] tracking-[0.2em] text-ink outline-none focus:border-brand"
              placeholder={DEMO_OTP}
            />
          </label>

          {error ? (
            <div className="rounded-craft border border-brand/30 bg-brand-subtle px-3.5 py-2.5 font-body text-[13px] text-brand">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 inline-flex items-center justify-center rounded-craft bg-brand px-4 py-3 font-ui text-[14px] tracking-wide text-ink-inverse transition-colors hover:bg-brand-light disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 font-body text-[12px] leading-relaxed text-ink-faded">
          Mock OTP for the hackathon submission. The same UI plugs into a real
          SMS provider behind a feature flag for production.
        </p>
      </section>
    </main>
  );
}
