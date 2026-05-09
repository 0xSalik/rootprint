import * as React from "react";

import type { SupplierOrigin } from "@/lib/artisans";

/* -------------------------------------------------------------------------
 * <SupplierGraph /> — section 3g.
 *
 * A small schematic of J&K with labelled supplier dots — material
 * origins. The map is a hand-drawn outline (not a real geographic
 * polygon) anchored to a 1000×600 viewBox; supplier coordinates are
 * stored as relative 0..1 values on each origin and projected here.
 *
 * Shown as a "public excerpt" — only the place + material is exposed,
 * never the supplier's name.
 * ----------------------------------------------------------------------- */

interface SupplierGraphProps {
  suppliers: SupplierOrigin[];
}

const VW = 1000;
const VH = 600;

/** A simplified, stylised outline of J&K. Not surveyed geography —
 *  just a tasteful schematic that reads as "the region". */
const OUTLINE =
  "M 80 120 Q 160 60, 280 80 Q 380 100, 440 70 Q 540 40, 660 80 Q 760 110, 820 100 Q 900 90, 940 160 Q 960 240, 920 320 Q 880 420, 800 470 Q 700 530, 580 540 Q 460 550, 360 510 Q 260 470, 200 420 Q 130 360, 100 280 Q 70 200, 80 120 Z";

export function SupplierGraph({ suppliers }: SupplierGraphProps) {
  return (
    <section className="bg-paper-deep/40 border-y border-line">
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-20 md:py-24">
        <header className="max-w-3xl">
          <p className="label-ui text-brand">The Supplier Graph</p>
          <h2 className="display-hero text-3xl md:text-5xl text-ink mt-3">
            Where the material comes from.
          </h2>
          <p className="font-body text-ink-faded text-base md:text-lg mt-4 max-w-2xl">
            A public excerpt from the master's Vault. Place and
            material are visible; the supplier's name is private.
          </p>
        </header>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Map */}
          <div className="lg:col-span-7">
            <div className="surface-card p-4 md:p-6 relative overflow-hidden">
              <p
                className="meta-mono mb-3 inline-flex items-center gap-2"
                style={{ color: "var(--season-deep)" }}
              >
                ◆ Schematic of Jammu &amp; Kashmir · not to scale
              </p>
              <svg
                viewBox={`0 0 ${VW} ${VH}`}
                className="w-full h-auto"
                role="img"
                aria-label="Supplier origins on a stylised J&K map"
              >
                <defs>
                  <linearGradient id="map-fill" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--season-light)" />
                    <stop offset="100%" stopColor="var(--paper)" />
                  </linearGradient>
                  <pattern
                    id="map-talim"
                    width="10"
                    height="10"
                    patternUnits="userSpaceOnUse"
                  >
                    <rect
                      width="2"
                      height="2"
                      fill="var(--season-deep)"
                      opacity="0.18"
                    />
                  </pattern>
                </defs>

                <path
                  d={OUTLINE}
                  fill="url(#map-fill)"
                  stroke="var(--season-deep)"
                  strokeWidth="1.4"
                />
                <path d={OUTLINE} fill="url(#map-talim)" />

                {/* Mountains — quick triangle scatter to suggest terrain */}
                <g
                  fill="none"
                  stroke="var(--season-deep)"
                  strokeOpacity="0.4"
                  strokeWidth="0.8"
                >
                  <path d="M 140 250 L 170 200 L 200 250 Z" />
                  <path d="M 240 220 L 280 160 L 320 220 Z" />
                  <path d="M 580 200 L 620 150 L 660 200 Z" />
                  <path d="M 720 230 L 770 170 L 820 230 Z" />
                </g>

                {/* Supplier dots + labels */}
                {suppliers.map((s, i) => {
                  const x = s.x * VW;
                  const y = s.y * VH;
                  const labelLeft = s.x > 0.55;
                  return (
                    <g key={s.id}>
                      {/* Halo */}
                      <circle
                        cx={x}
                        cy={y}
                        r={14}
                        fill="var(--season-gold)"
                        opacity="0.18"
                      />
                      {/* Outer ring */}
                      <circle
                        cx={x}
                        cy={y}
                        r={9}
                        fill="none"
                        stroke="var(--season-gold)"
                        strokeWidth="1.4"
                      />
                      {/* Knot */}
                      <circle
                        cx={x}
                        cy={y}
                        r={4.5}
                        fill="var(--season-deep)"
                      />
                      {/* Label connector */}
                      <line
                        x1={x}
                        y1={y}
                        x2={labelLeft ? x - 60 : x + 60}
                        y2={y - 28}
                        stroke="var(--season-deep)"
                        strokeWidth="0.8"
                        strokeOpacity="0.5"
                      />
                      <text
                        x={labelLeft ? x - 64 : x + 64}
                        y={y - 32}
                        textAnchor={labelLeft ? "end" : "start"}
                        fontFamily="var(--font-display-stack)"
                        fontStyle="italic"
                        fontSize="18"
                        fill="var(--text-primary)"
                      >
                        {s.place}
                      </text>
                      <text
                        x={labelLeft ? x - 64 : x + 64}
                        y={y - 16}
                        textAnchor={labelLeft ? "end" : "start"}
                        fontFamily="var(--font-mono-stack)"
                        fontSize="11"
                        fill="var(--text-secondary)"
                      >
                        {s.material}
                      </text>
                      <text
                        x={x}
                        y={y + 24}
                        textAnchor="middle"
                        fontFamily="var(--font-ui-stack)"
                        fontSize="10"
                        letterSpacing="2"
                        fill="var(--season-deep)"
                        style={{ textTransform: "uppercase" }}
                      >
                        Origin {String.fromCharCode(65 + i)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Origins list */}
          <ul className="lg:col-span-5 space-y-3">
            {suppliers.map((s, i) => (
              <li
                key={s.id}
                className="surface-card p-5 hover-lift"
                style={{ borderLeft: "3px solid var(--season-deep)" }}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p
                    className="meta-mono"
                    style={{ color: "var(--season-deep)" }}
                  >
                    Origin {String.fromCharCode(65 + i)}
                  </p>
                  <p className="meta-mono">{s.place}</p>
                </div>
                <p className="font-display italic text-xl text-ink mt-1.5">
                  {s.material}
                </p>
                <p className="font-body text-sm text-ink-faded mt-2 leading-relaxed">
                  {s.note}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
