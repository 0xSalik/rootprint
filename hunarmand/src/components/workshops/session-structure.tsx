import * as React from "react";

import { type SessionSegment } from "@/lib/workshops";

/* -------------------------------------------------------------------------
 * <SessionStructure />
 *
 * Horizontal timeline of a workshop session. Each segment is sized
 * proportionally to its duration. Multi-day sessions are stacked as
 * one row per day with a small day-label gutter on the left.
 *
 * Pure server component. The segment colour comes from a small
 * per-`kind` palette so the timeline reads at a glance — what's
 * hands-on, what's a tea break, what's a meal.
 * ----------------------------------------------------------------------- */

interface SessionStructureProps {
  segments: SessionSegment[];
}

export function SessionStructure({ segments }: SessionStructureProps) {
  /* Group segments by day (undefined day → 1) */
  const days = new Map<number, SessionSegment[]>();
  for (const seg of segments) {
    const d = seg.day ?? 1;
    if (!days.has(d)) days.set(d, []);
    days.get(d)!.push(seg);
  }
  const sortedDays = Array.from(days.keys()).sort((a, b) => a - b);
  const isMultiDay = sortedDays.length > 1;

  return (
    <div className="space-y-6">
      {sortedDays.map((dayNum) => {
        const daySegs = days.get(dayNum)!;
        const dayMins = totalMinutes(daySegs);
        return (
          <div key={dayNum} className="space-y-2">
            {isMultiDay && (
              <div className="flex items-baseline justify-between">
                <p className="font-display text-lg text-ink">Day {dayNum}</p>
                <p className="meta-mono text-ink-margin">
                  {Math.round(dayMins / 60)} hrs
                </p>
              </div>
            )}

            {/* The track */}
            <div
              className="relative w-full overflow-hidden rounded-craft border border-line"
              style={{ backgroundColor: "var(--season-light)" }}
            >
              <div className="flex h-14 sm:h-16 w-full">
                {daySegs.map((seg, i) => {
                  const mins = segmentMinutes(seg);
                  const widthPct = Math.max((mins / dayMins) * 100, 4);
                  return (
                    <div
                      key={`${dayNum}-${i}`}
                      title={`${seg.start}–${seg.end}  ${seg.label}`}
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: SEGMENT_COLOR[seg.kind],
                      }}
                      className="relative flex items-center justify-center px-1 border-r border-line/50 last:border-r-0 group"
                    >
                      <span
                        className="meta-mono uppercase tracking-[0.16em] text-[10px] truncate"
                        style={{ color: SEGMENT_INK[seg.kind] }}
                      >
                        {seg.start}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Hashia-feel underline */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1"
                style={{ backgroundColor: "var(--season-deep)", opacity: 0.45 }}
              />
            </div>

            {/* Legend rows below — readable on mobile */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-3">
              {daySegs.map((seg, i) => (
                <li
                  key={`legend-${dayNum}-${i}`}
                  className="flex items-baseline gap-3 text-sm"
                >
                  <span
                    aria-hidden="true"
                    className="inline-block size-2 rounded-full mt-1 shrink-0"
                    style={{ backgroundColor: SEGMENT_COLOR[seg.kind] }}
                  />
                  <span className="font-mono text-xs text-ink-margin tabular-nums w-[6.5em] shrink-0">
                    {seg.start}–{seg.end}
                  </span>
                  <span className="font-body text-ink-faded leading-snug">
                    {seg.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------- per-kind colour palette ----------------------- */

const SEGMENT_COLOR: Record<SessionSegment["kind"], string> = {
  intro: "var(--season-mid)",
  demo: "var(--season-deep)",
  "hands-on": "var(--season-gold)",
  tea: "var(--season-light)",
  lunch: "var(--season-accent)",
  reflection: "var(--bg-tertiary)",
  field: "var(--season-mid)",
};

/* Foreground ink colour, chosen for contrast against the corresponding
 * SEGMENT_COLOR background. */
const SEGMENT_INK: Record<SessionSegment["kind"], string> = {
  intro: "var(--bg-primary)",
  demo: "var(--season-gold)",
  "hands-on": "var(--text-primary)",
  tea: "var(--text-primary)",
  lunch: "var(--bg-primary)",
  reflection: "var(--text-primary)",
  field: "var(--bg-primary)",
};

/* ------------------------------ helpers ------------------------------ */

function segmentMinutes(seg: SessionSegment): number {
  return Math.max(parseClock(seg.end) - parseClock(seg.start), 5);
}

function totalMinutes(segs: SessionSegment[]): number {
  return segs.reduce((s, seg) => s + segmentMinutes(seg), 0);
}

function parseClock(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => Number(n));
  return h * 60 + m;
}
