import * as React from "react";

import { type Artisan } from "../../../lib/data";

/* -------------------------------------------------------------------------
 * <IdentityBar />
 *
 * The narrow strip directly under the banner. Four stats arranged
 * across the row on desktop, two-by-two on mobile:
 *
 *   pieces signed | disputes | open workshop slots | lineage est.
 *
 * Background is the paper tone (--bg-secondary) to read as one
 * continuous bar regardless of which seasonal palette the page is
 * painted in.
 * ----------------------------------------------------------------------- */

interface IdentityBarProps {
  artisan: Artisan;
}

export function IdentityBar({ artisan }: IdentityBarProps) {
  const stats = [
    { label: "Pieces signed", value: artisan.piecesSigned.toString() },
    { label: "Disputes", value: artisan.disputes.toString() },
    {
      label: "Workshop slots",
      value: `${artisan.workshopSlots} open`,
    },
    { label: "Lineage est.", value: artisan.lineageEstYear },
  ];

  return (
    <section className="bg-paper border-b border-line">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-5 sm:py-6">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col">
              <dt className="label-ui text-ink-margin">{s.label}</dt>
              <dd className="font-display text-[26px] sm:text-[28px] text-ink leading-tight mt-1">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
