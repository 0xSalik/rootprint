import * as React from "react";
import Link from "next/link";

import {
  SEASON_META,
  themeClassForSeason,
  CRAFT_LABEL,
} from "@/lib/seasons";
import {
  type HeritageBundle,
  type BundleInclude,
  formatINR,
} from "@/lib/bazaar";
import { HashiaBorder } from "@/components/motifs";

/* -------------------------------------------------------------------------
 * <BundleCard />
 *
 * Heritage bundle feature card. Wider than a product card, two-column
 * inside: a "composite image" pane on the left (a mini scene built
 * from the bundle's item glyphs), and an editorial pane on the right
 * with the name, narrative, item list, bundle Sanad badge, and price.
 *
 * Painted in the bundle's seasonal palette.
 *
 * Used on the home /bazaar in a horizontal scroll strip.
 * ----------------------------------------------------------------------- */

interface BundleCardProps {
  bundle: HeritageBundle;
}

export function BundleCard({ bundle }: BundleCardProps) {
  const meta = SEASON_META[bundle.season];
  return (
    <article
      className={[
        themeClassForSeason(bundle.season),
        "group relative overflow-hidden rounded-craft-xl border border-line bg-paper",
        "min-w-[320px] sm:min-w-[640px] sm:max-w-[680px] snap-start hover-lift",
      ].join(" ")}
    >
      <div className="grid grid-cols-1 sm:grid-cols-[260px_1fr]">
        {/* Composite image pane */}
        <div
          className="relative h-[200px] sm:h-auto border-b sm:border-b-0 sm:border-r border-line overflow-hidden"
          style={{
            backgroundImage:
              "linear-gradient(160deg, var(--season-light) 0%, color-mix(in oklab, var(--season-light) 50%, var(--season-mid) 50%) 100%)",
          }}
        >
          {/* Soft watermark glyph */}
          <span
            aria-hidden="true"
            className="absolute -right-3 -bottom-4 select-none font-display leading-none"
            style={{
              fontSize: "150px",
              color: "var(--season-deep)",
              opacity: 0.18,
            }}
          >
            {meta.glyph}
          </span>

          {/* Composite scene of the bundle's items */}
          <BundleComposite items={bundle.includes} />

          {/* Bundle Sanad badge sits over the image */}
          <span
            className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-craft text-[10px] font-ui tracking-[0.16em] uppercase"
            style={{
              backgroundColor: "rgba(28, 20, 16, 0.78)",
              color: "var(--gold-light)",
            }}
            aria-label="Composite Sanad"
          >
            <ShieldGlyph />
            Bundle Sanad
          </span>
        </div>

        {/* Editorial pane */}
        <div className="p-5 sm:p-6 flex flex-col gap-3">
          <header>
            <p className="meta-mono text-season-deep mb-1">
              {meta.glyph} {meta.englishName} · {CRAFT_LABEL[bundle.craft]?.en ?? bundle.craft}
            </p>
            <h3 className="font-display text-2xl sm:text-3xl text-ink leading-tight">
              {bundle.name}
            </h3>
          </header>

          <p className="font-serif italic text-ink-faded leading-snug">
            {bundle.narrative}
          </p>

          {/* Includes list */}
          <ul className="mt-1 space-y-1.5">
            {bundle.includes.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm font-body text-ink-faded">
                <BundleItemGlyph kind={item.glyph} />
                <span>
                  <span className="text-ink">{item.label}</span>
                  <span className="text-ink-margin"> · {item.masterName}</span>
                </span>
              </li>
            ))}
          </ul>

          {/* Hashia divider */}
          <div className="mt-2">
            <HashiaBorder height={6} color="var(--season-gold)" opacity={0.7} />
          </div>

          {/* Footer — Sanad ref, price, CTA */}
          <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="meta-mono text-ink-margin">Bundle Sanad ref</p>
              <p className="font-mono text-sm text-ink mt-0.5">{bundle.bundleSanad}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl text-ink leading-none">
                {formatINR(bundle.price)}
              </p>
              <p className="meta-mono text-ink-margin mt-1">composite</p>
            </div>
            <Link
              href={`/bazaar/bundles/${bundle.id}`}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-craft font-ui text-sm tracking-wide min-h-11 transition-colors duration-200 ml-auto"
              style={{
                backgroundColor: "var(--season-deep)",
                color: "var(--text-inverse)",
              }}
            >
              View bundle <span className="ml-1.5" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ─────────────────── composite scene ─────────────────────────── */

function BundleComposite({ items }: { items: BundleInclude[] }) {
  /* The composite is a small triptych — at most three glyphs, side
     by side, slightly overlapping like objects in a still-life. */
  const visible = items.slice(0, 3);
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-[220px] h-[160px]">
        {visible.map((it, idx) => {
          const baseLeft = 30 + idx * 60;
          const top = idx === 1 ? 18 : 32;
          const scale = idx === 1 ? 1 : 0.92;
          return (
            <div
              key={idx}
              className="absolute"
              style={{
                left: `${baseLeft}px`,
                top: `${top}px`,
                transform: `scale(${scale})`,
                zIndex: idx === 1 ? 3 : 2,
              }}
            >
              <BundleGlyphLarge kind={it.glyph} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────── glyph library ───────────────────────── */

function BundleItemGlyph({ kind }: { kind: BundleInclude["glyph"] }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="var(--season-deep)"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-0.5 shrink-0"
    >
      {SmallGlyphPaths(kind)}
    </svg>
  );
}

function SmallGlyphPaths(kind: BundleInclude["glyph"]) {
  switch (kind) {
    case "carpet":
      return (
        <>
          <rect x="2" y="3.5" width="12" height="9" rx="0.6" />
          <rect x="3.6" y="5" width="8.8" height="6" />
          <circle cx="8" cy="8" r="1" />
        </>
      );
    case "rug":
      return (
        <>
          <rect x="3" y="3" width="10" height="10" rx="0.6" />
          <rect x="4.6" y="4.6" width="6.8" height="6.8" />
        </>
      );
    case "shawl":
      return (
        <>
          <path d="M2.5 4 L13.5 4 L12 12 L4 12 Z" />
          <path d="M5 12 L4.5 14 M11 12 L11.5 14 M8 12 L8 14" />
        </>
      );
    case "kani-shawl":
      return (
        <>
          <path d="M2.5 4 L13.5 4 L12 12 L4 12 Z" />
          <line x1="3.5" y1="6" x2="12.5" y2="6" />
          <line x1="3.5" y1="8.5" x2="12.5" y2="8.5" />
          <line x1="6" y1="4" x2="5.5" y2="12" />
          <line x1="10" y1="4" x2="10.5" y2="12" />
        </>
      );
    case "stole":
      return (
        <>
          <path d="M2.5 5 L13.5 5 L12.5 11 L3.5 11 Z" />
          <line x1="2.5" y1="5" x2="13.5" y2="5" strokeWidth="0.8" />
        </>
      );
    case "yarn":
      return (
        <>
          <ellipse cx="8" cy="8" rx="5.5" ry="3.5" />
          <ellipse cx="8" cy="8" rx="5.5" ry="1.5" />
          <line x1="6" y1="11" x2="5.5" y2="14" />
          <line x1="10" y1="11" x2="10.5" y2="14" />
        </>
      );
    case "saffron":
      return (
        <>
          <path d="M5 3 L11 3 L10.5 5 L5.5 5 Z" />
          <rect x="4.5" y="5.5" width="7" height="8.5" rx="0.7" />
          <line x1="6" y1="8" x2="7" y2="11" />
          <line x1="9" y1="9" x2="8" y2="12" />
          <line x1="7.5" y1="7" x2="9" y2="9.5" />
        </>
      );
  }
}

function BundleGlyphLarge({ kind }: { kind: BundleInclude["glyph"] }) {
  /* Larger, filled-in version used in the composite scene. */
  switch (kind) {
    case "carpet":
    case "rug":
      return (
        <svg width="120" height="80" viewBox="0 0 120 80" aria-hidden="true">
          <rect x="2" y="2" width="116" height="76" rx="3" fill="var(--season-deep)" stroke="var(--season-gold)" strokeWidth="0.8" />
          <rect x="10" y="10" width="100" height="60" fill="none" stroke="var(--season-gold)" strokeWidth="0.6" />
          <circle cx="60" cy="40" r="14" fill="var(--season-mid)" stroke="var(--season-gold)" strokeWidth="0.8" />
          <circle cx="60" cy="40" r="5" fill="var(--season-gold)" />
        </svg>
      );
    case "shawl":
    case "stole":
      return (
        <svg width="100" height="120" viewBox="0 0 100 120" aria-hidden="true">
          <path d="M10 10 L90 10 L80 110 L20 110 Z" fill="var(--season-mid)" stroke="var(--season-deep)" strokeWidth="0.8" />
          <line x1="14" y1="22" x2="86" y2="22" stroke="var(--season-gold)" strokeWidth="0.7" />
          <line x1="18" y1="100" x2="82" y2="100" stroke="var(--season-gold)" strokeWidth="0.7" />
          {[28, 38, 48, 58, 68, 78].map((y) => (
            <circle key={y} cx="50" cy={y} r="2" fill="var(--season-gold)" />
          ))}
          <g stroke="var(--season-gold)" strokeWidth="0.6">
            {Array.from({ length: 14 }).map((_, i) => (
              <line key={i} x1={20 + i * 4.5} y1="111" x2={20 + i * 4.5} y2="118" />
            ))}
          </g>
        </svg>
      );
    case "kani-shawl":
      return (
        <svg width="100" height="120" viewBox="0 0 100 120" aria-hidden="true">
          <path d="M10 10 L90 10 L80 110 L20 110 Z" fill="var(--season-deep)" stroke="var(--season-gold)" strokeWidth="0.8" />
          {[
            ["var(--season-gold)", 16],
            ["var(--brand)", 28],
            ["var(--season-mid)", 40],
            ["var(--season-gold)", 52],
            ["var(--brand)", 64],
            ["var(--season-mid)", 76],
            ["var(--season-gold)", 88],
            ["var(--brand)", 100],
          ].map(([c, y], i) => (
            <line key={i} x1="14" y1={y as number} x2="86" y2={y as number} stroke={c as string} strokeWidth="2.4" opacity="0.85" />
          ))}
        </svg>
      );
    case "yarn":
      return (
        <svg width="120" height="80" viewBox="0 0 120 80" aria-hidden="true">
          <ellipse cx="60" cy="40" rx="48" ry="22" fill="var(--season-mid)" stroke="var(--season-deep)" strokeWidth="0.8" />
          {Array.from({ length: 14 }).map((_, i) => (
            <ellipse
              key={i}
              cx="60"
              cy="40"
              rx="48"
              ry={4 + i * 1.5}
              fill="none"
              stroke="var(--season-gold)"
              strokeWidth="0.4"
              opacity="0.55"
            />
          ))}
        </svg>
      );
    case "saffron":
      return (
        <svg width="80" height="120" viewBox="0 0 80 120" aria-hidden="true">
          <rect x="22" y="10" width="36" height="8" rx="1.5" fill="var(--season-deep)" />
          <path
            d="M14 18 Q8 60 18 110 L62 110 Q72 60 66 18 Z"
            fill="var(--season-mid)"
            opacity="0.85"
            stroke="var(--season-deep)"
            strokeWidth="0.8"
          />
          <rect x="22" y="40" width="36" height="20" fill="var(--season-light)" stroke="var(--season-deep)" strokeWidth="0.6" />
          <text x="40" y="53" fontSize="6.5" textAnchor="middle" fill="var(--season-deep)" fontFamily="var(--font-mono-stack)">PAMPORE</text>
          <g stroke="var(--brand)" strokeWidth="1.2" strokeLinecap="round">
            {Array.from({ length: 18 }).map((_, i) => (
              <line
                key={i}
                x1={22 + (i * 7) % 36}
                y1={70 + (i * 5) % 32}
                x2={22 + (i * 7) % 36 + (i % 2 ? 4 : -3)}
                y2={70 + (i * 5) % 32 + (i % 3 ? -3 : 4)}
              />
            ))}
          </g>
        </svg>
      );
  }
}

/* ─────────────────────────── seal glyph ───────────────────── */

function ShieldGlyph() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 1 L10.4 2.6 V6 Q10.4 9.2 6 11 Q1.6 9.2 1.6 6 V2.6 Z" />
      <path d="M4 6 L5.6 7.6 L8.4 4.4" />
    </svg>
  );
}
