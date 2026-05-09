import * as React from "react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------
 * <VaultClipStub />
 *
 * A 30-second Vault clip placeholder. The platform doesn't actually
 * stream video in the demo, so we render a styled "player surface": a
 * season-deep gradient with a Talim-script overlay, a play seal, the
 * clip's technique title, and a Vault session timestamp. The whole
 * tile is a button that, in production, would expand into a real
 * <video> element.
 * ----------------------------------------------------------------------- */

interface VaultClipStubProps {
  techniqueName: string;
  /** Vault session ISO date for attribution. */
  sessionDate: string;
  /** Display duration label, defaults to "0:30". */
  duration?: string;
  className?: string;
}

export function VaultClipStub({
  techniqueName,
  sessionDate,
  duration = "0:30",
  className,
}: VaultClipStubProps) {
  return (
    <div
      role="img"
      aria-label={`Vault clip — ${techniqueName} — ${duration}`}
      className={cn(
        "relative aspect-[16/9] w-full overflow-hidden rounded-craft border border-line/70 surface-card",
        className,
      )}
      style={{
        background:
          "radial-gradient(circle at 30% 40%, var(--season-mid) 0%, var(--season-deep) 100%)",
      }}
    >
      {/* Talim weft overlay */}
      <svg
        viewBox="0 0 200 113"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full opacity-[0.18]"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="vault-talim"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
          >
            <rect width="3" height="3" fill="var(--season-gold)" />
          </pattern>
        </defs>
        <rect width="200" height="113" fill="url(#vault-talim)" />
      </svg>

      {/* Subtle film grain via crosshatched strokes */}
      <svg
        viewBox="0 0 200 113"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full opacity-25"
        aria-hidden="true"
      >
        <path
          d="M -10 100 C 60 80, 140 50, 220 40"
          stroke="var(--season-gold)"
          strokeWidth="0.8"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M -10 70 C 70 60, 150 30, 220 18"
          stroke="var(--season-gold)"
          strokeWidth="0.6"
          fill="none"
          opacity="0.4"
        />
      </svg>

      {/* Top meta row */}
      <div className="absolute inset-x-0 top-0 px-4 py-3 flex items-start justify-between text-ink-inverse">
        <span className="meta-mono text-[10px] text-ink-inverse/80">
          ◆ Vault clip
        </span>
        <span className="meta-mono text-[10px] text-ink-inverse/80">
          {duration}
        </span>
      </div>

      {/* Center play seal */}
      <button
        type="button"
        aria-label="Play Vault clip"
        className="absolute inset-0 flex items-center justify-center group"
      >
        <span
          className="relative flex items-center justify-center size-16 rounded-full border-2 transition-transform duration-200 group-hover:scale-105"
          style={{
            borderColor: "var(--season-gold)",
            backgroundColor: "rgba(26, 20, 16, 0.45)",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="var(--season-gold)"
            aria-hidden="true"
          >
            <path d="M6 4 L18 11 L6 18 Z" />
          </svg>
          <span
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: "0 0 36px -6px var(--season-gold)" }}
            aria-hidden="true"
          />
        </span>
      </button>

      {/* Bottom title bar */}
      <div className="absolute inset-x-0 bottom-0 px-4 py-3 bg-gradient-to-t from-walnut/85 to-transparent text-ink-inverse">
        <p className="font-display italic text-base leading-tight">
          {techniqueName}
        </p>
        <p className="meta-mono text-[10px] text-ink-inverse/70 mt-0.5">
          Vault Session · {sessionDate}
        </p>
      </div>
    </div>
  );
}
