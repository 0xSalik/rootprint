import * as React from "react";

import { type SignedPiece } from "@/lib/artisans";
import {
  type SanadDict,
  type SanadLocale,
  formatPriceLocale,
} from "@/lib/sanad-i18n";

/* -------------------------------------------------------------------------
 * <FairPriceBand />
 *
 * A horizontal "this is the verified price band for pieces of this
 * type" widget. The band itself is two stops on a gold gradient — low
 * end on the left, high end on the right — with a small marker showing
 * where this particular piece sits relative to the band.
 *
 * If no priceFrom/priceTo is on file, the section is hidden quietly.
 * ----------------------------------------------------------------------- */

interface FairPriceBandProps {
  piece: SignedPiece;
  dict: SanadDict;
  locale: SanadLocale;
}

export function FairPriceBand({ piece, dict, locale }: FairPriceBandProps) {
  if (!piece.priceFrom || !piece.priceTo) return null;

  const lo = piece.priceFrom;
  const hi = piece.priceTo;
  const fromText = formatPriceLocale(lo, locale);
  const toText = formatPriceLocale(hi, locale);

  return (
    <section
      aria-labelledby="fair-price-heading"
      className="bg-paper border border-line rounded-craft-lg p-6 sm:p-8"
    >
      <header className="mb-5">
        <p className="meta-mono text-ink-margin">{dict.fairPriceTitle}</p>
        <h2
          id="fair-price-heading"
          className="font-display text-2xl sm:text-3xl text-ink leading-tight mt-1 max-w-prose"
        >
          {dict.fairPriceBlurb(fromText, toText)}
        </h2>
      </header>

      {/* The band itself */}
      <div className="mt-6">
        {/* Band rail */}
        <div
          className="relative h-3 rounded-full overflow-hidden border border-line"
          style={{
            background:
              "linear-gradient(90deg, var(--season-gold-soft, #f0e5cf) 0%, var(--season-gold) 50%, var(--season-deep) 100%)",
          }}
          aria-hidden="true"
        >
          {/* Mid-tick marker — visual only */}
          <span
            className="absolute top-0 bottom-0 w-px bg-paper/70"
            style={{ left: "50%" }}
          />
        </div>

        {/* End labels */}
        <div className="mt-3 flex items-start justify-between gap-4 font-mono text-sm text-ink" dir="ltr">
          <div>
            <p className="meta-mono">{dict.fairPriceLow}</p>
            <p className="font-display text-xl sm:text-2xl mt-0.5 leading-none">
              {fromText}
            </p>
          </div>
          <div className="text-right">
            <p className="meta-mono">{dict.fairPriceHigh}</p>
            <p className="font-display text-xl sm:text-2xl mt-0.5 leading-none">
              {toText}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
