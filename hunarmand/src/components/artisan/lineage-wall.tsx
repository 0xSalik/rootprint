import * as React from "react";

import type { LineageEntry } from "@/lib/artisans";

/* -------------------------------------------------------------------------
 * <LineageWall /> — section 3f.
 *
 * A horizontal timeline of the artisan's lineage. On desktop, an SVG
 * craft-thread connects oval portrait placeholders carrying a name,
 * era, and one-line note. On mobile, the same data falls back to a
 * vertical list with a single thread on the left.
 * ----------------------------------------------------------------------- */

interface LineageWallProps {
  lineage: LineageEntry[];
}

export function LineageWall({ lineage }: LineageWallProps) {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-20 md:py-24">
        <header className="max-w-3xl">
          <p className="label-ui text-brand">The Lineage Wall</p>
          <h2 className="display-hero text-3xl md:text-5xl text-ink mt-3">
            Six thresholds of the same loom.
          </h2>
          <p className="font-body text-ink-faded text-base md:text-lg mt-4 max-w-2xl">
            The thread is unbroken. Each name below sat at the same
            workshop, faced the same loom, decided to teach the next.
          </p>
        </header>

        {/* Desktop: horizontal SVG timeline */}
        <div className="hidden md:block mt-14 relative">
          <DesktopTimeline lineage={lineage} />
        </div>

        {/* Mobile: vertical timeline */}
        <ol className="md:hidden mt-10 relative pl-10">
          <span
            aria-hidden="true"
            className="absolute left-3 top-2 bottom-2 w-px"
            style={{ backgroundColor: "var(--season-deep)" }}
          />
          {lineage.map((g, i) => (
            <li key={i} className="relative pb-8 last:pb-0">
              <span
                aria-hidden="true"
                className="absolute -left-7 top-2 size-4 rounded-full border-2 flex items-center justify-center"
                style={{
                  borderColor: "var(--season-deep)",
                  backgroundColor: g.alive ? "var(--season-gold)" : "var(--bg-primary)",
                }}
              />
              <p className="meta-mono text-[10px]" style={{ color: "var(--season-deep)" }}>
                Gen {i + 1} · {g.era}
              </p>
              <p className="font-display italic text-xl text-ink mt-1">{g.name}</p>
              <p className="font-body text-sm text-ink-faded mt-1 max-w-md">
                {g.note}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------- */

function DesktopTimeline({ lineage }: { lineage: LineageEntry[] }) {
  // Layout: 1200×220 viewBox. Place ovals along x-axis evenly.
  const W = 1200;
  const H = 240;
  const padX = 80;
  const span = W - padX * 2;
  const step = lineage.length > 1 ? span / (lineage.length - 1) : 0;
  const baselineY = 110;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label="Lineage thread"
    >
      <defs>
        <linearGradient id="lineage-thread" x1="0" x2="1">
          <stop offset="0%" stopColor="var(--season-deep)" stopOpacity="0.1" />
          <stop offset="15%" stopColor="var(--season-deep)" stopOpacity="0.85" />
          <stop offset="85%" stopColor="var(--season-gold)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="var(--season-gold)" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Thread shadow */}
      <path
        d={`M 20 ${baselineY + 4} C ${W * 0.25} ${baselineY - 12}, ${W * 0.55} ${baselineY + 18}, ${W - 20} ${baselineY - 6}`}
        stroke="var(--bg-dark)"
        strokeOpacity="0.18"
        strokeWidth="3"
        fill="none"
      />
      {/* Thread highlight */}
      <path
        d={`M 20 ${baselineY + 2} C ${W * 0.25} ${baselineY - 14}, ${W * 0.55} ${baselineY + 16}, ${W - 20} ${baselineY - 8}`}
        stroke="url(#lineage-thread)"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />

      {lineage.map((g, i) => {
        const x = padX + i * step;
        const y = baselineY;
        return (
          <g key={i}>
            {/* Connector dot tying oval to thread */}
            <line
              x1={x}
              y1={y}
              x2={x}
              y2={y - 28}
              stroke="var(--season-deep)"
              strokeOpacity="0.5"
              strokeWidth="0.8"
            />

            {/* Oval portrait placeholder */}
            <ellipse
              cx={x}
              cy={y - 50}
              rx={26}
              ry={32}
              fill={g.alive ? "var(--season-deep)" : "var(--bg-secondary)"}
              stroke={g.alive ? "var(--season-gold)" : "var(--season-deep)"}
              strokeWidth="1.4"
            />
            <text
              x={x}
              y={y - 45}
              textAnchor="middle"
              fontFamily="var(--font-display-stack)"
              fontStyle="italic"
              fontSize="18"
              fill={g.alive ? "var(--season-gold)" : "var(--season-deep)"}
            >
              {initials(g.name)}
            </text>

            {/* Generation marker */}
            <text
              x={x}
              y={y + 14}
              textAnchor="middle"
              fontFamily="var(--font-ui-stack)"
              fontSize="10"
              letterSpacing="2"
              fill="var(--season-deep)"
              style={{ textTransform: "uppercase" }}
            >
              Gen {i + 1}
            </text>
            <text
              x={x}
              y={y + 32}
              textAnchor="middle"
              fontFamily="var(--font-display-stack)"
              fontSize="14"
              fill="var(--text-primary)"
              fontStyle={g.alive ? "italic" : "normal"}
            >
              {shortName(g.name)}
            </text>
            <text
              x={x}
              y={y + 50}
              textAnchor="middle"
              fontFamily="var(--font-mono-stack)"
              fontSize="9"
              fill="var(--text-muted)"
            >
              {g.era}
            </text>
            <foreignObject
              x={x - 100}
              y={y + 56}
              width={200}
              height={60}
            >
              <p
                className="font-body text-[11px] text-ink-faded leading-snug text-center"
                style={{ margin: 0 }}
              >
                {g.note}
              </p>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 2) return name;
  // Initial + last two words for long names like "Sheikh Ghulam Mohammad"
  return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
}
