import * as React from "react";
import Link from "next/link";

import {
  SEASONS,
  SEASON_META,
  CRAFT_LABEL,
  themeClassForSeason,
  type Craft,
  type Season,
} from "@/lib/seasons";
import { PRICE_BANDS, type PriceBandId } from "@/lib/bazaar";

/* -------------------------------------------------------------------------
 * <StorefrontFilter />
 *
 * Three filter rows (craft / season / price) above the masonry grid.
 * 100% server-rendered: every option is an anchor link that updates a
 * single search param, preserving the others. The active option is
 * styled solid; the rest are outline. No JS at all.
 *
 *   craft    [ all · carpet · pashmina · kani ]
 *   season   [ all · ❄ Shishur · ❦ Harud ]
 *   price    [ any · under 50K · 50K–2L · 2L–5L · above 5L ]
 *
 * The component is given the *current* active values plus the list
 * of crafts that actually appear in the storefront, so it never
 * shows a chip that yields zero results.
 * ----------------------------------------------------------------------- */

interface StorefrontFilterProps {
  /** All crafts that appear at least once in the storefront. */
  craftsAvailable: Craft[];
  /** Current filter state. */
  craft: Craft | null;
  season: Season | null;
  band: PriceBandId | null;
}

export function StorefrontFilter({
  craftsAvailable,
  craft,
  season,
  band,
}: StorefrontFilterProps) {
  /* Helper: build a /bazaar?… URL with one slot replaced. */
  function hrefWith(slot: "craft" | "season" | "band", value: string | null): string {
    const params = new URLSearchParams();
    const next = {
      craft: slot === "craft" ? value : craft,
      season: slot === "season" ? value : season,
      band: slot === "band" ? value : band,
    };
    if (next.craft) params.set("craft", String(next.craft));
    if (next.season) params.set("season", String(next.season));
    if (next.band) params.set("band", String(next.band));
    const q = params.toString();
    return q ? `/bazaar?${q}#storefront` : `/bazaar#storefront`;
  }

  return (
    <div className="border border-line rounded-craft-lg bg-paper px-5 sm:px-6 py-5 sm:py-6">
      {/* Header row — title + "clear" link, only when something is active */}
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
        <h3 className="font-display text-xl text-ink leading-none">
          Filter the storefront
        </h3>
        {craft || season || band ? (
          <Link
            href="/bazaar#storefront"
            className="meta-mono text-brand hover:text-brand-light transition-colors"
          >
            ✕ Clear all
          </Link>
        ) : (
          <p className="meta-mono text-ink-margin">All pieces visible</p>
        )}
      </div>

      <FilterRow label="Craft">
        <FilterChip href={hrefWith("craft", null)} active={craft === null}>
          All crafts
        </FilterChip>
        {craftsAvailable.map((c) => (
          <FilterChip
            key={c}
            href={hrefWith("craft", c)}
            active={craft === c}
          >
            {CRAFT_LABEL[c]?.en ?? c}
          </FilterChip>
        ))}
      </FilterRow>

      <FilterRow label="Season">
        <FilterChip href={hrefWith("season", null)} active={season === null}>
          Every season
        </FilterChip>
        {SEASONS.map((s) => {
          const meta = SEASON_META[s];
          return (
            <FilterChip
              key={s}
              href={hrefWith("season", s)}
              active={season === s}
              themeClass={themeClassForSeason(s)}
              variant="season"
            >
              <span className="mr-1.5" aria-hidden="true">{meta.glyph}</span>
              {meta.name}
              <span className="meta-mono ml-1.5 opacity-60 hidden sm:inline">
                · {meta.englishName}
              </span>
            </FilterChip>
          );
        })}
      </FilterRow>

      <FilterRow label="Price">
        <FilterChip href={hrefWith("band", null)} active={band === null}>
          Any price
        </FilterChip>
        {PRICE_BANDS.map((b) => (
          <FilterChip
            key={b.id}
            href={hrefWith("band", b.id)}
            active={band === b.id}
          >
            {b.label}
          </FilterChip>
        ))}
      </FilterRow>
    </div>
  );
}

/* ─────────────────────────── primitives ─────────────────────── */

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[110px_1fr] items-start gap-3 sm:gap-5 py-2 border-t border-line first-of-type:border-t-0 first-of-type:pt-0">
      <p className="label-ui text-ink-margin pt-2">{label}</p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
  themeClass,
  variant = "default",
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  themeClass?: string;
  variant?: "default" | "season";
}) {
  const base =
    "inline-flex items-center justify-center px-3 py-1.5 rounded-craft border text-[13px] font-ui transition-[background-color,border-color,color] duration-200 min-h-9";
  const styles = active
    ? variant === "season"
      ? "border-transparent text-ink-inverse"
      : "bg-walnut text-ink-inverse border-walnut"
    : "border-line text-ink hover:border-season-deep hover:text-season-deep";

  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={[themeClass ?? "", base, styles].join(" ")}
      style={
        active && variant === "season"
          ? { backgroundColor: "var(--season-deep)" }
          : undefined
      }
    >
      {children}
    </Link>
  );
}
