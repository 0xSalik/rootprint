"use client";

import * as React from "react";

import {
  type Artisan,
  type Craft,
  type TechniqueDef,
  paletteVars,
} from "../../../lib/data";

/* -------------------------------------------------------------------------
 * <CraftDNA />
 *
 * The interactive "What Only [Name] Knows" section. Two columns:
 *
 *   • Left  (40%) — SVG node graph. Centre node is the artisan;
 *     four orbiting nodes are the techniques; each technique connects
 *     to three sub-nodes (Tool / Material / Tuning). Clicking a
 *     technique node makes it active — the matching accordion item
 *     on the right opens, the active node enlarges, the sub-nodes
 *     fade in, and the connecting strand lights up.
 *   • Right (60%) — accordion of techniques. Each item shows a
 *     rarity pill and, when active, a 3-sentence description
 *     attributed to the master.
 *
 * The whole section is client-side because of the selection state;
 * it's the only client island on the artisan profile page.
 * ----------------------------------------------------------------------- */

interface CraftDNAProps {
  artisan: Artisan;
  craft: Craft;
  techniques: TechniqueDef[];
}

const RARITY_META: Record<
  TechniqueDef["rarity"],
  { dot: string; label: string; color: string }
> = {
  rare: { dot: "🔴", label: "Rare", color: "#8B1A1A" },
  endangered: { dot: "🟠", label: "Endangered", color: "#D4790A" },
  common: { dot: "🟢", label: "Common", color: "#2C4A3E" },
};

export function CraftDNA({ artisan, craft, techniques }: CraftDNAProps) {
  const [activeId, setActiveId] = React.useState<string>(techniques[0]?.id);
  const p = paletteVars(craft.palette);
  const active = techniques.find((t) => t.id === activeId) ?? techniques[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8 lg:gap-12 items-start">
      {/* ─── Left: the node graph ─── */}
      <div className="relative w-full">
        <DNAGraph
          artisan={artisan}
          techniques={techniques}
          activeId={activeId}
          onSelect={setActiveId}
          palette={p}
        />
      </div>

      {/* ─── Right: the accordion ─── */}
      <div className="flex flex-col gap-3">
        {techniques.map((t) => {
          const isActive = t.id === activeId;
          const r = RARITY_META[t.rarity];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveId(t.id)}
              aria-expanded={isActive}
              className={[
                "text-left rounded-craft-lg p-5 sm:p-6 transition-[border-color,background-color,box-shadow] duration-200",
                "border focus-visible:outline-none focus-visible:ring-2",
                isActive
                  ? "bg-paper border-transparent shadow-[0_18px_40px_-26px_rgba(28,20,16,0.4)]"
                  : "bg-paper/55 border-line hover:bg-paper",
              ].join(" ")}
              style={
                isActive
                  ? {
                      borderColor: p.deep,
                      boxShadow: `0 1px 0 0 ${p.deep}, 0 18px 36px -24px rgba(28,20,16,0.34)`,
                    }
                  : undefined
              }
            >
              <header className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="label-ui text-ink-margin">
                    Technique {String(techniques.indexOf(t) + 1).padStart(2, "0")}
                  </span>
                  <h4 className="font-display text-[20px] sm:text-[22px] text-ink leading-tight">
                    {t.name}
                  </h4>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-ui text-[11px] tracking-wide uppercase"
                  style={{
                    backgroundColor: `${r.color}15`,
                    color: r.color,
                  }}
                >
                  <span aria-hidden="true">{r.dot}</span>
                  {r.label}
                </span>
              </header>

              {/* Sub-attributes always visible */}
              <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-[12px]">
                <SubItem label="Tool" value={t.tool} color={p.deep} />
                <SubItem label="Material" value={t.material} color={p.deep} />
                <SubItem label="Tuning" value={t.tuning} color={p.deep} />
              </dl>

              {/* Description revealed when active */}
              <div
                className={[
                  "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  isActive
                    ? "grid-rows-[1fr] opacity-100 mt-4"
                    : "grid-rows-[0fr] opacity-0 mt-0",
                ].join(" ")}
              >
                <div className="overflow-hidden">
                  <blockquote className="font-body italic text-[15px] leading-relaxed text-ink-faded border-l-2 border-gold pl-4">
                    {t.description}
                    <footer className="block not-italic mt-3 font-ui text-[12px] tracking-wide uppercase text-ink-margin">
                      — {artisan.name}, Vault Session 2025
                    </footer>
                  </blockquote>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active node detail (mobile-only — desktop reads the accordion) */}
      <p className="lg:hidden font-ui text-[12px] tracking-wide uppercase text-ink-margin">
        Currently viewing · {active.name}
      </p>
    </div>
  );
}

/* ─────────────────────── SubItem (Tool/Material/Tuning) ───────── */

function SubItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div>
      <dt
        className="label-ui text-[10px]"
        style={{ color }}
      >
        {label}
      </dt>
      <dd className="font-body text-ink-faded mt-0.5">{value}</dd>
    </div>
  );
}

/* ────────────────────────── DNA Graph SVG ─────────────────────── */

interface DNAGraphProps {
  artisan: Artisan;
  techniques: TechniqueDef[];
  activeId: string;
  onSelect: (id: string) => void;
  palette: ReturnType<typeof paletteVars>;
}

const VIEW = 360;
const CENTER = VIEW / 2;
const TECHNIQUE_RADIUS = 130;
const SUB_RADIUS = 56;

function DNAGraph({
  artisan,
  techniques,
  activeId,
  onSelect,
  palette,
}: DNAGraphProps) {
  /* Position the four technique nodes evenly on a circle. */
  const positioned = techniques.map((t, i) => {
    const angle = (Math.PI * 2 * i) / techniques.length - Math.PI / 2;
    const x = CENTER + Math.cos(angle) * TECHNIQUE_RADIUS;
    const y = CENTER + Math.sin(angle) * TECHNIQUE_RADIUS;
    return { ...t, x, y, angle };
  });

  return (
    <div className="aspect-square w-full max-w-[420px] mx-auto">
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        role="img"
        aria-label={`Craft DNA graph for ${artisan.name}`}
        className="w-full h-full"
      >
        {/* Outer ring backdrop */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={TECHNIQUE_RADIUS + 28}
          fill="none"
          stroke={palette.gold}
          strokeOpacity="0.2"
          strokeDasharray="2 4"
        />

        {/* Connections from centre to each technique node */}
        {positioned.map((t) => {
          const isActive = t.id === activeId;
          return (
            <line
              key={`l-${t.id}`}
              x1={CENTER}
              y1={CENTER}
              x2={t.x}
              y2={t.y}
              stroke={palette.deep}
              strokeWidth={isActive ? 1.6 : 0.8}
              strokeOpacity={isActive ? 0.85 : 0.32}
              className="transition-[stroke-width,stroke-opacity] duration-300"
            />
          );
        })}

        {/* Sub-nodes (Tool / Material / Tuning) — rendered for the active node */}
        {positioned
          .filter((t) => t.id === activeId)
          .map((t) => {
            const subs = [
              { label: "Tool", value: t.tool, offset: -0.45 },
              { label: "Material", value: t.material, offset: 0 },
              { label: "Tuning", value: t.tuning, offset: 0.45 },
            ];
            return (
              <g key={`sub-${t.id}`}>
                {subs.map((s) => {
                  const subAngle = t.angle + s.offset;
                  const sx = t.x + Math.cos(subAngle) * SUB_RADIUS;
                  const sy = t.y + Math.sin(subAngle) * SUB_RADIUS;
                  return (
                    <g key={s.label} className="animate-[fade-in_320ms_var(--ease-warm)_both]">
                      <line
                        x1={t.x}
                        y1={t.y}
                        x2={sx}
                        y2={sy}
                        stroke={palette.gold}
                        strokeWidth="1"
                        strokeOpacity="0.55"
                      />
                      <circle cx={sx} cy={sy} r="6" fill={palette.gold} fillOpacity="0.85" />
                      <text
                        x={sx}
                        y={sy + 18}
                        textAnchor="middle"
                        fontSize="9"
                        fontFamily="var(--font-ui-stack)"
                        fill="var(--text-secondary)"
                        style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
                      >
                        {s.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

        {/* Technique nodes */}
        {positioned.map((t) => {
          const isActive = t.id === activeId;
          return (
            <g
              key={t.id}
              transform={`translate(${t.x} ${t.y})`}
              role="button"
              aria-label={t.name}
              tabIndex={0}
              onClick={() => onSelect(t.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(t.id);
                }
              }}
              className="cursor-pointer outline-none focus-visible:[&_circle]:stroke-[3px]"
            >
              <circle
                r={isActive ? 28 : 22}
                fill={isActive ? palette.deep : "var(--bg-primary)"}
                stroke={palette.deep}
                strokeWidth={isActive ? 2 : 1.2}
                className="transition-all duration-300"
              />
              {isActive ? (
                <circle
                  r={36}
                  fill="none"
                  stroke={palette.gold}
                  strokeWidth="1"
                  strokeOpacity="0.6"
                />
              ) : null}
              <text
                y="3"
                textAnchor="middle"
                fontSize={isActive ? 11 : 9}
                fontFamily="var(--font-ui-stack)"
                fill={isActive ? "var(--text-inverse)" : palette.deep}
                style={{ letterSpacing: "0.06em", fontWeight: 600 }}
              >
                T{positioned.indexOf(t) + 1}
              </text>
            </g>
          );
        })}

        {/* Centre node — the artisan */}
        <g>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={42}
            fill={palette.deep}
            stroke={palette.gold}
            strokeWidth="2"
          />
          <text
            x={CENTER}
            y={CENTER + 4}
            textAnchor="middle"
            fontSize="14"
            fontFamily="var(--font-display-stack)"
            fill="var(--text-inverse)"
            style={{ fontWeight: 600 }}
          >
            {initials(artisan.name)}
          </text>
        </g>
      </svg>

      {/* Caption under the graph */}
      <p className="text-center mt-4 font-ui text-[12px] tracking-wide uppercase text-ink-margin">
        Click a node — {techniques.length} techniques captured
      </p>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 3)
    .join("")
    .toUpperCase();
}
