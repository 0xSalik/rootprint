import * as React from "react";

import { HashiaBorder, TalimTexture } from "@/components/motifs";
import { BazaarArch } from "./bazaar-arch";

/* -------------------------------------------------------------------------
 * <BazaarHero />
 *
 * Full-width dark hero. The carved Mughal arch fills most of the
 * background; the title + tagline sit *inside* the arch's opening
 * at small/medium screens, and centred over the arch on larger
 * viewports (where the arch becomes a watermark).
 *
 *   ┌──────────────── walnut ──────────────────┐
 *   │            ✦  finial                      │
 *   │           /│\                             │
 *   │          / │ \                            │
 *   │         /  │  \  carved arch              │
 *   │        ┃ Hunarmand                      ┃ │
 *   │        ┃  Bazaar                        ┃ │
 *   │        ┃ Every piece carries a Sanad.   ┃ │
 *   │        ┃ Direct from the master's hands.┃ │
 *   │        ┃                                ┃ │
 *   │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
 *   └─────────────────────────────────────────────┘
 * ----------------------------------------------------------------------- */

export function BazaarHero() {
  return (
    <section className="relative bg-walnut text-ink-inverse overflow-hidden">
      <TalimTexture opacity={0.04} />

      {/* Top hashia border, paired & gold */}
      <div className="relative z-10">
        <HashiaBorder height={10} color="var(--gold)" opacity={0.55} />
      </div>

      {/* Edge vignettes — soft warmth bleeding in from left/right */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(60% 80% at 0% 50%, rgba(212, 160, 23, 0.18) 0%, transparent 60%), radial-gradient(60% 80% at 100% 50%, rgba(155, 74, 26, 0.18) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 pt-12 sm:pt-20 pb-20 sm:pb-28">
        {/* Tiny meta line above the arch */}
        <div className="text-center mb-8 sm:mb-10">
          <p className="meta-mono text-gold/80">
            ❦ The Bazaar · Hunarmand · Verified by Sanad
          </p>
        </div>

        {/* Arch + content composition.
            Arch fills the column behind; copy is centred over it. */}
        <div className="relative isolate">
          {/* The arch — fills width, scales by viewBox */}
          <BazaarArch
            className="w-full max-w-[760px] mx-auto block opacity-95"
          />

          {/* Title block — absolutely positioned so it sits visually
              *inside* the arch's opening on every viewport. */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <h1
              className="font-display text-ink-inverse leading-[1.04] tracking-[-0.01em]"
              style={{ fontSize: "clamp(40px, 7vw, 72px)" }}
            >
              Hunarmand{" "}
              <span className="block sm:inline italic text-gold-light">Bazaar</span>
            </h1>
            <p
              className="font-serif italic text-ink-inverse/85 mt-5 max-w-md mx-auto"
              style={{ fontSize: "clamp(15px, 1.4vw, 18px)", lineHeight: 1.55 }}
            >
              Every piece here carries a Sanad. Authentic, verified,
              direct from the master&apos;s hands.
            </p>

            {/* Two thin CTA links */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#storefront"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-craft border border-gold/60 text-gold-light hover:bg-gold/10 hover:text-gold transition-colors font-ui text-sm tracking-wide min-h-11"
              >
                Enter the bazaar →
              </a>
              <a
                href="#bundles"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-craft border border-ink-inverse/20 text-ink-inverse/80 hover:border-ink-inverse/50 hover:text-ink-inverse transition-colors font-ui text-sm tracking-wide min-h-11"
              >
                Heritage bundles
              </a>
            </div>

            {/* Floor inscription, just above the threshold of the arch */}
            <p
              className="meta-mono text-ink-inverse/55 mt-10 sm:mt-12"
              style={{
                position: "absolute",
                bottom: "11%",
                left: "50%",
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
              }}
            >
              · ہنرمند بازار · welcome ·
            </p>
          </div>
        </div>
      </div>

      {/* Bottom hashia border */}
      <div className="relative z-10">
        <HashiaBorder height={8} color="var(--gold)" opacity={0.55} />
      </div>
    </section>
  );
}
