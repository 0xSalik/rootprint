"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  type Craft,
  type Season,
  type SeasonMeta,
  SEASON_META,
  metaForCraft,
  seasonForCraft,
  themeClassForSeason,
} from "@/lib/seasons";

/* -------------------------------------------------------------------------
 * <CraftColorProvider />
 *
 * Wraps a subtree in the correct seasonal palette by:
 *   1. Adding the `theme-{bahar|grism|harud|shishur}` class to a wrapper
 *      element (this re-paints the dynamic --season-* CSS variables, so
 *      anything inside that uses `bg-season-deep`, `text-season-gold`,
 *      etc. will follow the season — including SSR'd content with no JS).
 *   2. Exposing a small React context so deeply nested client components
 *      can branch on the active season without re-deriving it.
 *
 * Use one of:
 *   <CraftColorProvider craft="carpet">          // craft → season auto
 *   <CraftColorProvider season="shishur">        // explicit season
 *
 * The wrapper element defaults to <div>, but you can pass `as="section"`
 * (or any tag) when wrapping a semantic landmark.
 * ----------------------------------------------------------------------- */

interface CraftColorContextValue {
  season: Season;
  meta: SeasonMeta;
  craft: Craft | null;
}

const CraftColorContext = React.createContext<CraftColorContextValue | null>(
  null,
);

type AsTag = "div" | "section" | "main" | "article" | "header" | "footer";

interface CraftColorProviderProps {
  children: React.ReactNode;
  /** The craft whose intrinsic season should paint this subtree. */
  craft?: Craft;
  /** Or pass an explicit season (overrides `craft` if both are provided). */
  season?: Season;
  /** Optional class on the wrapper element. */
  className?: string;
  /** Render as something other than <div>. Defaults to "div". */
  as?: AsTag;
}

export function CraftColorProvider({
  children,
  craft,
  season,
  className,
  as = "div",
}: CraftColorProviderProps) {
  const resolvedSeason: Season =
    season ?? (craft ? seasonForCraft(craft) : "harud");
  const meta = craft ? metaForCraft(craft) : SEASON_META[resolvedSeason];

  const value = React.useMemo<CraftColorContextValue>(
    () => ({
      season: resolvedSeason,
      meta,
      craft: craft ?? null,
    }),
    [resolvedSeason, meta, craft],
  );

  const Tag = as as React.ElementType;

  return (
    <CraftColorContext.Provider value={value}>
      <Tag
        data-season={resolvedSeason}
        data-craft={craft ?? undefined}
        className={cn(themeClassForSeason(resolvedSeason), className)}
      >
        {children}
      </Tag>
    </CraftColorContext.Provider>
  );
}

/** Read the active season from anywhere inside a CraftColorProvider. */
export function useCraftColor(): CraftColorContextValue {
  const ctx = React.useContext(CraftColorContext);
  if (!ctx) {
    // Safe default — the platform always has a season, even at root.
    return {
      season: "harud",
      meta: SEASON_META.harud,
      craft: null,
    };
  }
  return ctx;
}
