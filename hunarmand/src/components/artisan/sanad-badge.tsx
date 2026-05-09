import * as React from "react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------
 * <SanadBadge />
 *
 * The verification mark that appears on every artisan card, the bottom
 * of the profile portrait, the bazaar and Sanad pages. Three levels:
 *   verified  – Hunarmand Sanad Verified
 *   guild     – Endorsed by the craft guild
 *   master    – Master Certified (the highest tier)
 *
 * Sizes: sm (inline chip), md (default), lg (over portrait).
 * ----------------------------------------------------------------------- */

type Level = "verified" | "guild" | "master";
type Size = "sm" | "md" | "lg";

const LEVEL_LABEL: Record<Level, string> = {
  verified: "Sanad Verified",
  guild: "Guild Endorsed",
  master: "Master Certified",
};

const SIZE_CLASSES: Record<
  Size,
  { wrap: string; check: number; text: string; py: string; px: string }
> = {
  sm: { wrap: "text-[10px]", check: 10, text: "tracking-[0.16em]", py: "py-0.5", px: "px-2" },
  md: { wrap: "text-[11px]", check: 12, text: "tracking-[0.18em]", py: "py-1", px: "px-2.5" },
  lg: { wrap: "text-xs", check: 14, text: "tracking-[0.2em]", py: "py-1.5", px: "px-3" },
};

interface SanadBadgeProps {
  level?: Level;
  size?: Size;
  className?: string;
}

export function SanadBadge({
  level = "verified",
  size = "md",
  className,
}: SanadBadgeProps) {
  const s = SIZE_CLASSES[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-ui uppercase rounded-full bg-walnut text-gold border border-gold/60 seal-glow",
        s.wrap,
        s.py,
        s.px,
        s.text,
        className,
      )}
      role="img"
      aria-label={`Hunarmand · ${LEVEL_LABEL[level]}`}
    >
      <CheckSeal size={s.check} />
      <span>{LEVEL_LABEL[level]}</span>
    </span>
  );
}

function CheckSeal({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      role="presentation"
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8"
        r="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M4.5 8.4 L7 10.8 L11.6 5.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
