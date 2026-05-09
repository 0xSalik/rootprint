import * as React from "react";

import { HashiaBorder } from "@/components/motifs";

/* -------------------------------------------------------------------------
 * <VerificationBanner />
 *
 * Top strip. Two states:
 *
 *   verified === true
 *     Deep craft-color background ('--season-deep'), white text,
 *     gold-amber seal: "✓ Hunarmand Sanad Verified — This piece is
 *     authentic."
 *
 *   verified === false
 *     Brand-red background ('--brand'), white text, warning seal:
 *     "⚠ No Sanad found for this piece. Do not proceed without
 *     verification."
 *
 * The seal is an inline SVG so the banner renders identically with
 * styles disabled and across every browser without an icon font.
 * ----------------------------------------------------------------------- */

interface VerificationBannerProps {
  verified: boolean;
  title: string;
  body: string;
  /** Accessible name for the seal icon. */
  sealLabel: string;
}

export function VerificationBanner({
  verified,
  title,
  body,
  sealLabel,
}: VerificationBannerProps) {
  return (
    <header
      role="status"
      aria-live="polite"
      className={[
        "relative overflow-hidden border-b",
        verified
          ? "text-ink-inverse border-gold/40"
          : "text-ink-inverse border-brand-light/40",
      ].join(" ")}
      style={{
        backgroundColor: verified ? "var(--season-deep)" : "var(--brand)",
      }}
    >
      <div className="mx-auto max-w-3xl px-5 sm:px-8 py-5 sm:py-6 flex items-start gap-4">
        {verified ? <SealVerified label={sealLabel} /> : <SealWarning label={sealLabel} />}
        <div className="flex-1 min-w-0">
          <p
            className="font-display text-xl sm:text-2xl leading-tight"
            style={{ color: verified ? "var(--season-gold)" : "var(--bg-primary)" }}
          >
            {title}
          </p>
          <p className="font-body text-sm sm:text-base text-ink-inverse/85 mt-1">
            {body}
          </p>
        </div>
      </div>

      {/* Bottom Hashia rule transitions banner into the page */}
      <HashiaBorder
        height={6}
        color={verified ? "var(--season-gold)" : "var(--bg-primary)"}
        opacity={0.7}
      />
    </header>
  );
}

/* -- Seals -------------------------------------------------------------- */

function SealVerified({ label }: { label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      className="shrink-0 inline-flex items-center justify-center size-12 sm:size-14 rounded-full border-2"
      style={{
        borderColor: "var(--season-gold)",
        backgroundColor: "rgba(0, 0, 0, 0.18)",
      }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="11"
          cy="11"
          r="9.5"
          stroke="var(--season-gold)"
          strokeWidth="1.4"
        />
        <path
          d="M6 11.4 L9.6 14.8 L16 7.6"
          stroke="var(--season-gold)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function SealWarning({ label }: { label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      className="shrink-0 inline-flex items-center justify-center size-12 sm:size-14 rounded-full border-2"
      style={{
        borderColor: "var(--bg-primary)",
        backgroundColor: "rgba(0, 0, 0, 0.18)",
      }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M11 2 L21 19 H1 Z"
          stroke="var(--bg-primary)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M11 9 V14"
          stroke="var(--bg-primary)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="11" cy="17" r="1.2" fill="var(--bg-primary)" />
      </svg>
    </span>
  );
}
