import * as React from "react";

/* -------------------------------------------------------------------------
 * <MiniCalendar />
 *
 * A minimal month-view calendar. Available dates are highlighted with
 * a small filled dot in the season palette; the master's "next workshop"
 * date gets a stronger highlighted ring.
 *
 * Renders a fixed month (anchored to a date you pass in via `anchor`)
 * so server and client always agree — no hydration mismatches even when
 * we generate the page statically. Re-render server-side by changing
 * the anchor.
 * ----------------------------------------------------------------------- */

interface MiniCalendarProps {
  /** ISO date — the month containing this date is shown. */
  anchor: string;
  /** ISO dates that should be marked as available. */
  available: string[];
  /** ISO date that should be highlighted as the next confirmed slot. */
  highlight?: string;
  className?: string;
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function MiniCalendar({
  anchor,
  available,
  highlight,
  className,
}: MiniCalendarProps) {
  const anchorDate = new Date(anchor);
  const year = anchorDate.getUTCFullYear();
  const month = anchorDate.getUTCMonth();
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const startWeekday = firstOfMonth.getUTCDay();

  const availableSet = new Set(available.map((d) => isoDay(d)));
  const highlightDay = highlight ? isoDay(highlight) : null;

  // Build a 6-row grid of "cells", filling with blanks before/after.
  const cells: Array<{ day: number | null; iso: string | null }> = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ day: null, iso: null });
  for (let d = 1; d <= lastDay; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, iso });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, iso: null });

  return (
    <div className={`surface-card p-5 ${className ?? ""}`}>
      <div className="flex items-baseline justify-between">
        <p className="font-display text-lg text-ink">
          {MONTH_NAMES[month]} {year}
        </p>
        <p className="meta-mono">{available.length} dates open</p>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((w, i) => (
          <span
            key={i}
            className="meta-mono text-[10px] text-ink-margin uppercase tracking-[0.16em] py-1"
          >
            {w}
          </span>
        ))}
        {cells.map((cell, i) => {
          if (!cell.day) return <span key={i} className="aspect-square" />;
          const isAvail = cell.iso ? availableSet.has(cell.iso) : false;
          const isHighlight = cell.iso && cell.iso === highlightDay;

          return (
            <span
              key={i}
              className="relative aspect-square flex flex-col items-center justify-center rounded-craft text-sm font-ui"
              style={
                isHighlight
                  ? {
                      backgroundColor: "var(--season-deep)",
                      color: "var(--season-gold)",
                    }
                  : undefined
              }
            >
              <span
                className={
                  isAvail && !isHighlight ? "text-ink" : isHighlight ? "" : "text-ink-margin"
                }
              >
                {cell.day}
              </span>
              {isAvail && !isHighlight ? (
                <span
                  aria-label="available"
                  className="absolute bottom-1 size-1.5 rounded-full"
                  style={{ backgroundColor: "var(--season-deep)" }}
                />
              ) : null}
            </span>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between meta-mono">
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block size-1.5 rounded-full"
            style={{ backgroundColor: "var(--season-deep)" }}
          />
          Open slot
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block size-2.5 rounded-craft"
            style={{ backgroundColor: "var(--season-deep)" }}
          />
          Confirmed
        </span>
      </div>
    </div>
  );
}

function isoDay(iso: string): string {
  return iso.slice(0, 10);
}
