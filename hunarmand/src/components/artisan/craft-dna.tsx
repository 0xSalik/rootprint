"use client";

import * as React from "react";

import { rarityMeta, type Technique } from "@/lib/artisans";

import { VaultClipStub } from "./vault-clip-stub";

/* -------------------------------------------------------------------------
 * <CraftDNA /> — section 3c, the "What Only Mohammad Knows" hero.
 *
 * Replaces a text bio with a visual knowledge map. Two views share the
 * same selected-technique state:
 *   • Left  (40%): an interactive SVG node graph — center node = the
 *                  master, four technique nodes around it. Selecting
 *                  a technique reveals its four sub-nodes (Tools,
 *                  Materials, Environmental tunings, Failure modes).
 *   • Right (60%): a custom accordion of techniques. The selected
 *                  one expands inline with the Vault excerpt,
 *                  attribution, the structured sub-category grid,
 *                  and a 30-second Vault clip stub.
 *
 * Implemented as a single client component so the two views stay
 * perfectly in sync without lifting state any further.
 * ----------------------------------------------------------------------- */

interface CraftDNAProps {
  artisanName: string;
  techniques: Technique[];
}

export function CraftDNA({ artisanName, techniques }: CraftDNAProps) {
  const [selectedId, setSelectedId] = React.useState<string>(
    techniques[0]?.id ?? "",
  );
  const selected = techniques.find((t) => t.id === selectedId) ?? techniques[0];

  return (
    <section className="bg-parchment">
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="label-ui text-brand">The Craft DNA</p>
          <h2 className="display-hero text-3xl md:text-5xl text-ink mt-3">
            What only {firstName(artisanName)} knows.
          </h2>
          <p className="font-body text-ink-faded text-base md:text-lg mt-4 max-w-2xl">
            Each node is a technique captured from a Vault session. Tap
            one to see the tools, materials, environmental tunings and
            failure modes that make it work — in the master's own words.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left — graph */}
          <div className="lg:col-span-5">
            <DnaGraph
              artisanName={artisanName}
              techniques={techniques}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />

            {selected ? (
              <p className="meta-mono mt-4 text-center">
                ◆ Selected: {selected.name}
              </p>
            ) : null}
          </div>

          {/* Right — technique list */}
          <ul className="lg:col-span-7 space-y-4">
            {techniques.map((t) => (
              <TechniqueAccordion
                key={t.id}
                technique={t}
                expanded={t.id === selectedId}
                onToggle={() =>
                  setSelectedId((cur) => (cur === t.id ? "" : t.id))
                }
                artisanName={artisanName}
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── Graph ─────────────────────────────── */

interface DnaGraphProps {
  artisanName: string;
  techniques: Technique[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const SUB_CATEGORIES = [
  { key: "tools", label: "Tools", letter: "T" },
  { key: "materials", label: "Materials", letter: "M" },
  { key: "tuning", label: "Tuning", letter: "E" },
  { key: "failure", label: "Failure", letter: "F" },
] as const;

function DnaGraph({
  artisanName,
  techniques,
  selectedId,
  onSelect,
}: DnaGraphProps) {
  // Lay out up to 4 technique nodes evenly around the center
  const cx = 250;
  const cy = 250;
  const R = 145;
  const positions = techniques.slice(0, 4).map((_, i) => {
    const angle = (-Math.PI / 2) + (i * (Math.PI * 2)) / Math.min(4, techniques.length);
    return {
      x: cx + Math.cos(angle) * R,
      y: cy + Math.sin(angle) * R,
      angle,
    };
  });

  return (
    <div className="relative aspect-square w-full max-w-md mx-auto">
      <svg
        viewBox="0 0 500 500"
        className="w-full h-full"
        role="img"
        aria-label="Craft DNA graph"
      >
        <defs>
          <radialGradient id="dna-center" cx="0.5" cy="0.45" r="0.6">
            <stop offset="0%" stopColor="var(--season-mid)" />
            <stop offset="100%" stopColor="var(--season-deep)" />
          </radialGradient>
          <filter id="dna-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Connecting threads */}
        {positions.map((p, i) => (
          <line
            key={`l-${i}`}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="var(--season-deep)"
            strokeOpacity={techniques[i].id === selectedId ? 0.9 : 0.4}
            strokeWidth={techniques[i].id === selectedId ? 1.6 : 0.8}
            strokeDasharray={techniques[i].id === selectedId ? "0" : "3 3"}
          />
        ))}

        {/* Sub-nodes for the selected technique */}
        {techniques.map((t, ti) => {
          if (t.id !== selectedId) return null;
          const p = positions[ti];
          // Project sub-nodes outward along the spoke + perpendicular fan
          const baseAngle = p.angle;
          const subR = 58;
          return (
            <g key={`subs-${t.id}`} className="dna-fade-in">
              {SUB_CATEGORIES.map((cat, i) => {
                // Fan the four sub-nodes around the technique node, at
                // angles -45°, -15°, +15°, +45° relative to the spoke
                const fan =
                  baseAngle + (-Math.PI / 4 + (i * Math.PI) / 6);
                const sx = p.x + Math.cos(fan) * subR;
                const sy = p.y + Math.sin(fan) * subR;
                return (
                  <g key={cat.key}>
                    <line
                      x1={p.x}
                      y1={p.y}
                      x2={sx}
                      y2={sy}
                      stroke="var(--season-gold)"
                      strokeOpacity="0.6"
                      strokeWidth="0.8"
                    />
                    <circle
                      cx={sx}
                      cy={sy}
                      r="14"
                      fill="var(--bg-primary)"
                      stroke="var(--season-deep)"
                      strokeWidth="1.2"
                    />
                    <text
                      x={sx}
                      y={sy + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontFamily="var(--font-ui-stack)"
                      fontSize="11"
                      fontWeight="500"
                      fill="var(--season-deep)"
                    >
                      {cat.letter}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Center node */}
        <g>
          <circle
            cx={cx}
            cy={cy}
            r="46"
            fill="url(#dna-center)"
            stroke="var(--season-gold)"
            strokeWidth="1.4"
          />
          <circle
            cx={cx}
            cy={cy}
            r="60"
            fill="none"
            stroke="var(--season-gold)"
            strokeOpacity="0.35"
            strokeWidth="0.6"
          />
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            fontFamily="var(--font-ui-stack)"
            fontSize="10"
            fill="var(--season-gold)"
            letterSpacing="2"
            style={{ textTransform: "uppercase" }}
          >
            Master
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            fontFamily="var(--font-display-stack)"
            fontSize="20"
            fill="var(--bg-primary)"
            fontStyle="italic"
          >
            {firstName(artisanName)}
          </text>
        </g>

        {/* Technique nodes */}
        {techniques.slice(0, 4).map((t, i) => {
          const p = positions[i];
          const isSelected = t.id === selectedId;
          const r = isSelected ? 30 : 24;
          return (
            <g
              key={t.id}
              className="cursor-pointer"
              onClick={() => onSelect(t.id)}
            >
              {/* Pulse halo when selected */}
              {isSelected ? (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r + 14}
                  fill="var(--season-gold)"
                  opacity="0.18"
                  className="dna-pulse"
                />
              ) : null}
              <circle
                cx={p.x}
                cy={p.y}
                r={r}
                fill={
                  isSelected ? "var(--season-deep)" : "var(--bg-secondary)"
                }
                stroke={
                  isSelected ? "var(--season-gold)" : "var(--season-deep)"
                }
                strokeWidth={isSelected ? 2 : 1.2}
              />
              <text
                x={p.x}
                y={p.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="var(--font-ui-stack)"
                fontSize="11"
                fontWeight="500"
                fill={
                  isSelected ? "var(--season-gold)" : "var(--season-deep)"
                }
              >
                {`T${i + 1}`}
              </text>
              {/* Label below the node */}
              <text
                x={p.x}
                y={p.y + r + 18}
                textAnchor="middle"
                fontFamily="var(--font-display-stack)"
                fontSize="13"
                fontStyle={isSelected ? "italic" : "normal"}
                fill="var(--text-primary)"
              >
                {truncate(t.name, 22)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute left-0 right-0 -bottom-8 hidden md:flex justify-center gap-3">
        {SUB_CATEGORIES.map((c) => (
          <span
            key={c.key}
            className="meta-mono inline-flex items-center gap-1.5"
          >
            <span
              className="inline-flex items-center justify-center size-4 rounded-full bg-paper border"
              style={{ borderColor: "var(--season-deep)" }}
            >
              <span
                className="text-[8px] font-ui font-medium"
                style={{ color: "var(--season-deep)" }}
              >
                {c.letter}
              </span>
            </span>
            {c.label}
          </span>
        ))}
      </div>

      {/* Inline keyframes — kept local since they're only used here */}
      <style>{`
        .dna-pulse { animation: dnaPulse 2400ms cubic-bezier(0.16, 1, 0.3, 1) infinite; transform-origin: center; transform-box: fill-box; }
        @keyframes dnaPulse {
          0%, 100% { opacity: 0.12; transform: scale(1); }
          50%      { opacity: 0.32; transform: scale(1.08); }
        }
        .dna-fade-in { animation: dnaFade 360ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes dnaFade {
          from { opacity: 0; transform: scale(0.94); transform-box: fill-box; transform-origin: center; }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

/* ───────────────────────────── Accordion ───────────────────────────── */

interface AccordionProps {
  technique: Technique;
  expanded: boolean;
  onToggle: () => void;
  artisanName: string;
}

function TechniqueAccordion({
  technique,
  expanded,
  onToggle,
  artisanName,
}: AccordionProps) {
  const r = rarityMeta(technique.rarity);
  return (
    <li className="surface-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between gap-4 p-5 md:p-6 text-left transition-colors hover:bg-paper-deep/40"
      >
        <span className="flex items-center gap-3 min-w-0">
          {/* Rarity pip */}
          <span
            className="inline-flex items-center justify-center size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: r.color }}
            aria-hidden="true"
          />
          <span className="font-display text-xl md:text-2xl text-ink truncate">
            {technique.name}
          </span>
        </span>

        <span className="flex items-center gap-3 shrink-0">
          <span
            className="meta-mono uppercase text-[10px]"
            style={{ color: r.color }}
          >
            {r.label}
          </span>
          <span
            className={`inline-flex items-center justify-center size-7 rounded-full border transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
            style={{
              borderColor: "var(--season-deep)",
              color: "var(--season-deep)",
            }}
            aria-hidden="true"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 6 L8 11 L13 6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
      </button>

      {expanded ? (
        <div className="px-5 md:px-6 pb-6 -mt-1 dna-fade-in border-t border-line/70">
          <blockquote className="mt-5">
            <p className="font-body italic text-base md:text-lg text-ink leading-relaxed">
              <span
                aria-hidden="true"
                className="font-display text-3xl leading-none align-top mr-1"
                style={{ color: "var(--season-deep)" }}
              >
                &ldquo;
              </span>
              {technique.vaultExcerpt}
            </p>
            <footer className="meta-mono mt-3">
              — {artisanName}, Vault Session · {technique.vaultSession}
            </footer>
          </blockquote>

          {/* Sub-category grid: T / M / E / F */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SubBlock title="Tools" items={technique.sub.tools} letter="T" />
            <SubBlock title="Materials" items={technique.sub.materials} letter="M" />
            <SubBlock title="Environmental tuning" items={technique.sub.tuning} letter="E" />
            <SubBlock title="Failure modes" items={technique.sub.failure} letter="F" />
          </div>

          {/* Vault clip stub */}
          <div className="mt-6 max-w-md">
            <VaultClipStub
              techniqueName={technique.name}
              sessionDate={technique.vaultSession}
            />
          </div>
        </div>
      ) : null}
    </li>
  );
}

function SubBlock({
  title,
  items,
  letter,
}: {
  title: string;
  items: string[];
  letter: string;
}) {
  return (
    <div className="rounded-craft border border-line/70 p-4 bg-paper-deep/40">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center justify-center size-5 rounded-full text-[10px] font-ui font-medium"
          style={{
            backgroundColor: "var(--season-deep)",
            color: "var(--season-gold)",
          }}
        >
          {letter}
        </span>
        <p className="label-ui text-ink-margin text-[10px]">{title}</p>
      </div>
      <ul className="mt-3 space-y-1.5">
        {items.map((it, i) => (
          <li
            key={i}
            className="font-body text-sm text-ink-faded leading-snug pl-3 relative"
          >
            <span
              aria-hidden="true"
              className="absolute left-0 top-2.5 size-1 rounded-full"
              style={{ backgroundColor: "var(--season-deep)" }}
            />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─────────────────────────────── utils ─────────────────────────────── */

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0];
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
