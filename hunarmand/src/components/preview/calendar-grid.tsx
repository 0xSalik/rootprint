import * as React from "react";
import Link from "next/link";

import { type Craft, paletteVars } from "../../../lib/data";

/* -------------------------------------------------------------------------
 * <CalendarGrid />
 *
 * A simple month calendar — pre-rendered server-side. Available
 * dates are anchor links that update the URL search params; the
 * currently selected date is painted in --brand red. Each available
 * cell is highlighted in --season-light; non-available cells are
 * faded out so the eye lands on what can be booked.
 *
 * The set of available dates is generated deterministically from
 * the workshop type (every Saturday for half-day, the first three
 * Mondays for multi-day, etc.) so the page never needs runtime data.
 * ----------------------------------------------------------------------- */

interface CalendarGridProps {
  craft: Craft;
  /** ISO month string YYYY-MM. Defaults to current month. */
  month?: string;
  /** Set of ISO YYYY-MM-DD strings that are available for booking. */
  available: Set<string>;
  /** Currently selected ISO date, if any. */
  selected?: string;
  /** Builder for the href of an available cell. */
  hrefForDate: (iso: string) => string;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function CalendarGrid({
  craft,
  month,
  available,
  selected,
  hrefForDate,
}: CalendarGridProps) {
  const p = paletteVars(craft.palette);
  const today = new Date();
  const [yyyy, mm] = (month ?? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`).split("-");
  const year = parseInt(yyyy);
  const monthIdx = parseInt(mm) - 1;

  /* Build a 6-row calendar grid, padding leading blanks for the first
   * day of the month and trailing blanks for the last. */
  const first = new Date(year, monthIdx, 1);
  const lastDay = new Date(year, monthIdx + 1, 0).getDate();
  const startWeekday = first.getDay();
  const cells: Array<{ iso?: string; day?: number }> = [];
  for (let i = 0; i < startWeekday; i++) cells.push({});
  for (let d = 1; d <= lastDay; d++) {
    const iso = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ iso, day: d });
  }
  while (cells.length % 7 !== 0) cells.push({});

  const monthLabel = first.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-paper border border-line rounded-craft-lg p-5 sm:p-6">
      <header className="flex items-center justify-between mb-4">
        <h3 className="font-display text-[20px] text-ink leading-tight">
          {monthLabel}
        </h3>
        <p className="meta-mono text-ink-margin">
          {available.size} dates available
        </p>
      </header>

      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {WEEKDAYS.map((w, i) => (
          <div
            key={i}
            className="text-center font-ui text-[11px] tracking-[0.1em] uppercase text-ink-margin py-1"
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((c, i) => {
          if (!c.iso) {
            return <div key={`b-${i}`} aria-hidden="true" />;
          }
          const isAvailable = available.has(c.iso);
          const isSelected = c.iso === selected;
          if (isAvailable) {
            return (
              <Link
                key={c.iso}
                href={hrefForDate(c.iso)}
                aria-label={c.iso}
                className={[
                  "aspect-square flex items-center justify-center rounded-craft text-[14px] font-ui transition-colors",
                  isSelected
                    ? "bg-brand text-ink-inverse"
                    : "text-ink hover:text-ink",
                ].join(" ")}
                style={
                  isSelected
                    ? undefined
                    : {
                        backgroundColor: p.light,
                        color: p.deep,
                      }
                }
              >
                {c.day}
              </Link>
            );
          }
          return (
            <div
              key={c.iso}
              aria-hidden="true"
              className="aspect-square flex items-center justify-center text-[14px] text-ink-margin/55"
            >
              {c.day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
