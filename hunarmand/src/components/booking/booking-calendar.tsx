import * as React from "react";
import Link from "next/link";

import { type WorkshopFull, formatDateLong } from "@/lib/workshops";

/* -------------------------------------------------------------------------
 * <BookingCalendar />
 *
 * A pure server-rendered calendar. Each "available" date is an anchor
 * link; clicking it picks that date and submits the booking form on
 * step 1. Unavailable days are dimmed and unlinked. Today gets a small
 * gold tick mark.
 *
 * The calendar shows up to two months — first month forward from the
 * earliest available date, second month if there are dates in it.
 * ----------------------------------------------------------------------- */

interface BookingCalendarProps {
  workshop: WorkshopFull;
  selectedIso?: string | null;
  /** Builder for the href when a date is clicked. The function receives
   *  the ISO date string and returns the full URL to navigate to. */
  hrefForDate: (iso: string) => string;
}

export function BookingCalendar({
  workshop,
  selectedIso,
  hrefForDate,
}: BookingCalendarProps) {
  const available = new Set(workshop.ext.availableDates);
  if (workshop.ext.availableDates.length === 0) {
    return (
      <p className="font-body text-ink-faded">
        No upcoming dates published for this workshop. Contact the master to ask
        for one.
      </p>
    );
  }

  const months = monthsFromDates(workshop.ext.availableDates);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      {months.map((m) => (
        <MonthGrid
          key={`${m.year}-${m.month}`}
          year={m.year}
          month={m.month}
          available={available}
          selectedIso={selectedIso}
          hrefForDate={hrefForDate}
        />
      ))}
      {selectedIso && (
        <p className="lg:col-span-2 meta-mono text-ink-margin">
          Selected · {formatDateLong(selectedIso)}
        </p>
      )}
    </div>
  );
}

/* ------------------------------ MonthGrid ------------------------------ */

interface MonthGridProps {
  year: number;
  /** 0-indexed month (Date.getMonth) */
  month: number;
  available: Set<string>;
  selectedIso?: string | null;
  hrefForDate: (iso: string) => string;
}

function MonthGrid({
  year,
  month,
  available,
  selectedIso,
  hrefForDate,
}: MonthGridProps) {
  const monthName = new Date(year, month, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  /* First weekday of the month, week starting on Monday (1) */
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayIso = new Date().toISOString().slice(0, 10);

  /* Build a flat list of cells */
  const cells: Array<{ iso: string | null; day: number | null }> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ iso: null, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ iso, day: d });
  }
  /* Pad the trailing row */
  while (cells.length % 7 !== 0) cells.push({ iso: null, day: null });

  return (
    <div>
      <header className="mb-3 flex items-baseline justify-between">
        <p className="font-display text-lg text-ink">{monthName}</p>
        <p className="meta-mono text-ink-margin">
          {Array.from(available).filter((d) => d.startsWith(`${year}-${String(month + 1).padStart(2, "0")}-`)).length} dates
        </p>
      </header>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w) => (
          <span
            key={w}
            className="meta-mono text-ink-margin text-center"
          >
            {w}
          </span>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) =>
          c.iso === null ? (
            <span key={i} aria-hidden="true" className="aspect-square" />
          ) : (
            <Day
              key={c.iso}
              iso={c.iso}
              day={c.day!}
              isAvailable={available.has(c.iso)}
              isSelected={selectedIso === c.iso}
              isToday={todayIso === c.iso}
              hrefForDate={hrefForDate}
            />
          ),
        )}
      </div>
    </div>
  );
}

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"] as const;

/* ------------------------------ Day cell ------------------------------ */

interface DayProps {
  iso: string;
  day: number;
  isAvailable: boolean;
  isSelected: boolean;
  isToday: boolean;
  hrefForDate: (iso: string) => string;
}

function Day({ iso, day, isAvailable, isSelected, isToday, hrefForDate }: DayProps) {
  const baseCell =
    "aspect-square inline-flex flex-col items-center justify-center rounded-craft text-sm font-mono select-none";

  if (!isAvailable) {
    return (
      <span
        className={[baseCell, "text-ink-margin/70 bg-transparent"].join(" ")}
        aria-label={`${day}, no workshop`}
      >
        {day}
      </span>
    );
  }

  if (isSelected) {
    return (
      <span
        aria-current="date"
        aria-label={`${formatDateLong(iso)}, selected`}
        className={[
          baseCell,
          "bg-season-deep text-ink-inverse border border-season-deep shadow-[0_4px_0_0_rgba(28,20,16,0.18)]",
        ].join(" ")}
      >
        {day}
        {isToday && (
          <span
            aria-hidden="true"
            className="block size-1 rounded-full mt-0.5"
            style={{ backgroundColor: "var(--season-gold)" }}
          />
        )}
      </span>
    );
  }

  return (
    <Link
      href={hrefForDate(iso)}
      aria-label={`${formatDateLong(iso)}, available`}
      className={[
        baseCell,
        "border border-season-gold/60 text-ink hover:bg-season-deep hover:text-ink-inverse",
        "transition-colors duration-150",
      ].join(" ")}
      style={{ backgroundColor: "var(--season-light)" }}
    >
      {day}
      {isToday && (
        <span
          aria-hidden="true"
          className="block size-1 rounded-full mt-0.5"
          style={{ backgroundColor: "var(--season-gold)" }}
        />
      )}
    </Link>
  );
}

/* ------------------------------ helpers ------------------------------ */

function monthsFromDates(dates: string[]): Array<{ year: number; month: number }> {
  const seen = new Set<string>();
  const out: Array<{ year: number; month: number }> = [];
  for (const iso of dates.slice().sort()) {
    const [y, m] = iso.split("-").map((n) => Number(n));
    const key = `${y}-${m}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ year: y, month: m - 1 });
    if (out.length === 2) break;
  }
  return out;
}
