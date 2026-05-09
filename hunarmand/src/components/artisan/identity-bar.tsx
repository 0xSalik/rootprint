import * as React from "react";

import type { Artisan } from "@/lib/artisans";
import { formatDate } from "@/lib/artisans";

import {
  DisputeShieldIcon,
  LineageIcon,
  PiecesIcon,
  SlotsIcon,
} from "./identity-icons";

/* -------------------------------------------------------------------------
 * <CraftIdentityBar /> — section 3b.
 *
 * Narrow strip directly under the banner. Four quick stats, each with
 * a small craft-ink icon. Sits on bg-secondary with a thin top border.
 * ----------------------------------------------------------------------- */

interface IdentityBarProps {
  artisan: Artisan;
}

export function CraftIdentityBar({ artisan }: IdentityBarProps) {
  const stats: Array<{
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    label: string;
    value: string;
    note?: string;
  }> = [
    {
      Icon: PiecesIcon,
      label: "Pieces signed",
      value: artisan.piecesSigned.toLocaleString("en-IN"),
      note: "On the Sanad ledger",
    },
    {
      Icon: DisputeShieldIcon,
      label: "Disputes",
      value: artisan.disputes.toString(),
      note: artisan.disputes === 0 ? "Spotless record" : "See ledger",
    },
    {
      Icon: SlotsIcon,
      label: "Workshop slots",
      value: `${artisan.openSlots} open`,
      note: `Next: ${formatDate(artisan.nextWorkshop)}`,
    },
    {
      Icon: LineageIcon,
      label: "Est. lineage",
      value: artisan.lineageEstYear,
      note: `Generation ${artisan.generation} of ${artisan.lineage.length}`,
    },
  ];

  return (
    <section
      aria-label="Artisan identity bar"
      className="bg-paper border-b border-line"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-5 md:py-6">
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-y-5 gap-x-6 md:gap-x-10">
          {stats.map((s, i) => {
            const { Icon } = s;
            return (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="shrink-0 size-9 rounded-full inline-flex items-center justify-center"
                  style={{
                    color: "var(--season-deep)",
                    backgroundColor: "var(--season-light)",
                  }}
                >
                  <Icon />
                </span>
                <div className="min-w-0">
                  <p className="label-ui text-ink-margin text-[10px]">
                    {s.label}
                  </p>
                  <p className="font-display text-xl text-ink leading-tight mt-0.5">
                    {s.value}
                  </p>
                  {s.note ? (
                    <p className="meta-mono mt-0.5 text-[10px] truncate">
                      {s.note}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
