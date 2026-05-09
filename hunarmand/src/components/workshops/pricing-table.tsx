import * as React from "react";

import { type PricingTier, formatINR } from "@/lib/workshops";

/* -------------------------------------------------------------------------
 * <PricingTable />
 *
 * The 5-tier pricing comparison from the brief, styled as a row of
 * comparison cards rather than a busy data table. The recommended
 * tier is visually anchored (gold ribbon, slight elevation) without
 * resorting to a bouncy "Most Popular" badge.
 *
 * Each tier carries a small bullet list of what's included; a screen
 * reader can skim the cards as a list.
 * ----------------------------------------------------------------------- */

interface PricingTableProps {
  tiers: PricingTier[];
}

export function PricingTable({ tiers }: PricingTableProps) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {tiers.map((tier) => (
        <li key={tier.id} className="contents">
          <article
            className={[
              "relative bg-paper border rounded-craft-lg flex flex-col h-full",
              "px-5 pt-6 pb-5",
              tier.highlight
                ? "border-season-gold ring-1 ring-season-gold/40 shadow-[0_18px_40px_-26px_var(--shadow-strong)]"
                : "border-line",
            ].join(" ")}
          >
            {tier.highlight && (
              <span
                aria-hidden="true"
                className="absolute -top-px inset-x-0 h-1 rounded-t-craft-lg"
                style={{ backgroundColor: "var(--season-gold)" }}
              />
            )}

            <header>
              <p className="meta-mono text-ink-margin">{tier.label}</p>
              <p className="font-display text-2xl text-ink leading-tight mt-1">
                {formatINR(tier.pricePerPerson)}
                <span className="meta-mono text-ink-margin ml-1.5 align-baseline">
                  / person
                </span>
              </p>
              <p className="font-body text-sm text-ink-faded mt-2 leading-snug">
                {tier.blurb}
              </p>
            </header>

            <ul className="mt-4 space-y-2 flex-1">
              {tier.includes.map((line, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 font-body text-sm text-ink-faded leading-snug"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1 inline-block size-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: "var(--season-deep)" }}
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            {tier.highlight && (
              <p className="mt-4 meta-mono text-season-deep">
                Recommended
              </p>
            )}
          </article>
        </li>
      ))}
    </ul>
  );
}
