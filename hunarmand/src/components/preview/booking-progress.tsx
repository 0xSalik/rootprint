import * as React from "react";

import { HashiaBorder } from "@/components/motifs";

/* -------------------------------------------------------------------------
 * <BookingProgress />
 *
 * The Hashia border at the top of the booking flow that fills in
 * left to right as the user advances. Three step labels run below:
 *
 *   Choose Date  →  Your Details  →  Confirm & Pay
 *
 * The fill is a CSS width on a layered Hashia clip — the gold dots
 * are visible through the active portion, faded for the upcoming
 * portion.
 * ----------------------------------------------------------------------- */

export type BookingStep = 1 | 2 | 3;

interface BookingProgressProps {
  step: BookingStep;
}

const LABELS: Array<{ step: BookingStep; label: string }> = [
  { step: 1, label: "Choose Date" },
  { step: 2, label: "Your Details" },
  { step: 3, label: "Confirm & Pay" },
];

export function BookingProgress({ step }: BookingProgressProps) {
  const pct = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div>
      <div className="relative h-[14px]">
        {/* Inactive Hashia underneath */}
        <HashiaBorder
          className="absolute inset-0 w-full text-gold/35"
          color="var(--gold)"
          opacity={0.35}
          height={14}
        />
        {/* Active fill clipped to width */}
        <div
          className="absolute top-0 left-0 h-full overflow-hidden transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ width: `${pct}%` }}
        >
          <HashiaBorder
            className="absolute inset-0 w-full text-gold"
            color="var(--gold)"
            opacity={1}
            height={14}
          />
        </div>
      </div>

      <ol className="mt-4 grid grid-cols-3 gap-2 text-center">
        {LABELS.map((l) => {
          const active = l.step === step;
          const done = l.step < step;
          return (
            <li
              key={l.step}
              className={[
                "font-ui text-[12px] tracking-[0.1em] uppercase",
                active
                  ? "text-brand"
                  : done
                    ? "text-ink-faded"
                    : "text-ink-margin",
              ].join(" ")}
            >
              <span aria-hidden="true" className="inline-block mr-2">
                {done ? "✓" : `0${l.step}`}
              </span>
              {l.label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
