import * as React from "react";

/* -------------------------------------------------------------------------
 * <MoatTimeline />
 *
 * "Started 2025 → 100 Vaults → 1,000 Vaults → Scaled to Rajasthan, Kerala"
 * Drawn as a horizontal craft thread connecting four knot-nodes. The
 * thread is a single SVG path with a faint outline (the thread shadow)
 * and a brighter centerline. Knots are gold rings with dot centres.
 * ----------------------------------------------------------------------- */

interface Milestone {
  year: string;
  label: string;
}

const MILESTONES: Milestone[] = [
  { year: "2025", label: "Hunarmand begins · Srinagar" },
  { year: "Year 1", label: "100 Vaults captured" },
  { year: "Year 3", label: "1,000 Vaults · all 9 crafts" },
  { year: "Year 5", label: "Rajasthan · Kerala" },
];

export function MoatTimeline({ className }: { className?: string }) {
  return (
    <div className={className}>
      {/* Mobile: stacked vertical list */}
      <ol className="md:hidden space-y-6">
        {MILESTONES.map((m, i) => (
          <li key={i} className="flex items-start gap-4">
            <div className="relative shrink-0 mt-1">
              <span
                className="block size-3 rounded-full"
                style={{ backgroundColor: "var(--gold)" }}
              />
              <span
                className="absolute inset-0 size-3 rounded-full animate-ping"
                style={{ backgroundColor: "var(--gold)", opacity: 0.35 }}
              />
            </div>
            <div>
              <p className="label-ui text-gold-light">{m.year}</p>
              <p className="font-display text-xl text-ink-inverse mt-1">
                {m.label}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {/* Desktop: horizontal craft thread */}
      <div className="hidden md:block">
        <svg
          viewBox="0 0 1000 160"
          className="w-full h-auto"
          role="presentation"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="thread-grad" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#c8975a" stopOpacity="0.1" />
              <stop offset="15%" stopColor="#c8975a" stopOpacity="0.85" />
              <stop offset="85%" stopColor="#d4a017" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#d4a017" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Thread shadow */}
          <path
            d="M 20 86 C 200 70, 350 100, 500 80 S 800 88, 980 80"
            fill="none"
            stroke="#1a1410"
            strokeWidth="3"
            strokeOpacity="0.6"
          />
          {/* Thread highlight */}
          <path
            d="M 20 84 C 200 68, 350 98, 500 78 S 800 86, 980 78"
            fill="none"
            stroke="url(#thread-grad)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />

          {/* Knot positions, computed as evenly-spaced x along the curve */}
          {MILESTONES.map((m, i) => {
            const x = 80 + i * 280;
            const y = 80 + Math.sin(i * 1.2) * 6;
            return (
              <g key={i}>
                {/* Halo */}
                <circle cx={x} cy={y} r="14" fill="#c8975a" fillOpacity="0.18" />
                {/* Outer ring */}
                <circle
                  cx={x}
                  cy={y}
                  r="9"
                  fill="none"
                  stroke="#d4a017"
                  strokeWidth="1.4"
                />
                {/* Center knot */}
                <circle cx={x} cy={y} r="4" fill="#e8c48a" />
                <circle cx={x} cy={y} r="1.5" fill="#1a1410" />

                {/* Year above */}
                <text
                  x={x}
                  y={y - 26}
                  textAnchor="middle"
                  fontFamily="var(--font-ui-stack)"
                  fontSize="11"
                  letterSpacing="2"
                  fill="#e8c48a"
                  style={{ textTransform: "uppercase" }}
                >
                  {m.year}
                </text>

                {/* Label below */}
                <text
                  x={x}
                  y={y + 36}
                  textAnchor="middle"
                  fontFamily="var(--font-display-stack)"
                  fontSize="18"
                  fill="#faf7f2"
                >
                  {m.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
