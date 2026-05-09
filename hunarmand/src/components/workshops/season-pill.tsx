import * as React from "react";
import Link from "next/link";

import {
  type Season,
  SEASONS,
  SEASON_META,
  themeClassForSeason,
} from "@/lib/seasons";

/* -------------------------------------------------------------------------
 * <SeasonPills />
 *
 * The four-season pill selector at the top of /workshops. Pure server
 * component — pills are anchor links that update the `?season=` query
 * parameter, so navigation works without JS and the back button is
 * meaningful.
 *
 * Each pill is painted in *its own* season's palette so the row
 * actually looks like four colours, not four greys with one accent.
 * ----------------------------------------------------------------------- */

interface SeasonPillsProps {
  /** The currently active season, or null if "All seasons". */
  current: Season | null;
  /** Optional path the pills link into. Defaults to /workshops. */
  basePath?: string;
}

export function SeasonPills({ current, basePath = "/workshops" }: SeasonPillsProps) {
  return (
    <nav
      aria-label="Filter by season"
      className="flex flex-wrap items-center gap-2 sm:gap-3"
    >
      <PillLink href={basePath} active={current === null} variant="all">
        All seasons
      </PillLink>
      {SEASONS.map((s) => {
        const meta = SEASON_META[s];
        return (
          <PillLink
            key={s}
            href={`${basePath}?season=${s}`}
            active={current === s}
            season={s}
          >
            <span className="mr-1.5" aria-hidden="true">{meta.glyph}</span>
            <span className="font-display">{meta.name}</span>
            <span className="ml-1.5 meta-mono text-current opacity-60 hidden sm:inline">
              · {meta.englishName}
            </span>
          </PillLink>
        );
      })}
    </nav>
  );
}

/* ---------------------------------------------------------------------- */

interface PillLinkProps {
  href: string;
  active: boolean;
  variant?: "all" | "season";
  season?: Season;
  children: React.ReactNode;
}

function PillLink({ href, active, season, variant, children }: PillLinkProps) {
  /* When this is a season pill, scope the season palette to the pill
   * itself by attaching the theme class — that way each pill renders
   * in its own colour even when the page is filtered to a different
   * one. The active pill swaps to a filled style. */
  const seasonClass = season ? themeClassForSeason(season) : "";

  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={[
        seasonClass,
        "inline-flex items-center justify-center px-4 py-2 rounded-craft border text-sm",
        "transition-[background-color,border-color,color] duration-200",
        "min-h-11", /* 44px tap target */
        active
          ? variant === "all"
            ? "bg-walnut text-ink-inverse border-walnut"
            : "text-ink-inverse border-transparent shadow-[0_3px_0_0_rgba(28,20,16,0.18)]"
          : variant === "all"
            ? "border-line text-ink hover:border-walnut"
            : "border-line text-ink hover:border-season-deep hover:text-season-deep",
      ].join(" ")}
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
