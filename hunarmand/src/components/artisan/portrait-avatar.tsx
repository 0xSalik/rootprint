import * as React from "react";

import { ChinarCorner, HashiaBorder, TalimTexture } from "@/components/motifs";

/* -------------------------------------------------------------------------
 * <PortraitAvatar />
 *
 * The 180px circular portrait beside the headline. The brief calls
 * for an actual photograph; in the demo we generate a dignified
 * placeholder built from the design system's own motifs:
 *
 *   • Inner ring: cream
 *   • Outer ring: craft season color
 *   • Background: season-deep gradient with a faint Chinar leaf and
 *     Talim grid behind the artisan's initials
 *   • Initials in display type, gold on dark
 *
 * When real photography arrives, swap the inner content for an
 * <Image /> while keeping the double-ring frame.
 * ----------------------------------------------------------------------- */

interface PortraitAvatarProps {
  /** Full name. Initials are derived from the first + last word. */
  name: string;
  /** Render diameter in px. */
  size?: number;
}

export function PortraitAvatar({ name, size = 180 }: PortraitAvatarProps) {
  const initials = deriveInitials(name);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`Portrait of ${name}`}
      role="img"
    >
      {/* Outer ring — craft season color */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 220deg, var(--season-deep), var(--season-gold), var(--season-deep), var(--season-mid), var(--season-deep))",
        }}
      />
      {/* Inner ring — cream */}
      <div
        className="absolute rounded-full"
        style={{
          inset: 5,
          backgroundColor: "var(--bg-primary)",
        }}
      />
      {/* Plate */}
      <div
        className="absolute overflow-hidden rounded-full"
        style={{
          inset: 9,
          background:
            "radial-gradient(circle at 30% 25%, var(--season-mid) 0%, var(--season-deep) 70%, #1a1410 100%)",
        }}
      >
        {/* Talim texture & Chinar accents — sit behind the initials */}
        <TalimTexture
          color="var(--season-gold)"
          opacity={0.18}
          cell={4}
          gap={4}
        />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1 left-1">
            <ChinarCorner
              corner="tl"
              size={Math.round(size * 0.42)}
              color="var(--season-gold)"
              opacity={0.55}
            />
          </div>
          <div className="absolute bottom-1 right-1">
            <ChinarCorner
              corner="br"
              size={Math.round(size * 0.42)}
              color="var(--season-gold)"
              opacity={0.4}
            />
          </div>
        </div>

        {/* Initials */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-display text-ink-inverse leading-none"
            style={{
              fontSize: Math.round(size * 0.36),
              color: "var(--season-gold)",
              textShadow: "0 2px 12px rgba(0,0,0,0.45)",
            }}
          >
            {initials}
          </span>
        </div>

        {/* A subtle Hashia band across the lower third */}
        <div
          className="absolute left-0 right-0"
          style={{ bottom: Math.round(size * 0.18) }}
        >
          <HashiaBorder
            height={Math.round(size * 0.04)}
            color="var(--season-gold)"
            opacity={0.55}
          />
        </div>
      </div>
    </div>
  );
}

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return `${first}${last}`.toUpperCase();
}
