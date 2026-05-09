/**
 * Hunarmand — Season & Craft taxonomy.
 *
 * Every craft on the platform belongs to a season. The season decides
 * which palette paints the surface (cards, ribbons, calendars, hero
 * gradients). This file is the single source of truth for that mapping;
 * the <CraftColorProvider /> uses it to flip seasonal CSS variables.
 *
 * Design rule: a craft's season is intrinsic to the craft, NOT to the
 * current month. A carpet workshop in summer is still painted Harud.
 * The platform's *ambient* season (landing page, "what's on now") is
 * derived from the calendar via `getCurrentSeason()`.
 */

export const SEASONS = ["bahar", "grism", "harud", "shishur"] as const;
export type Season = (typeof SEASONS)[number];

/** The four crafts the seasons map onto (extend freely). */
export type Craft =
  | "sozni"
  | "shawl"
  | "naqashi"
  | "papier-mache"
  | "copper"
  | "heritage-walk"
  | "carpet"
  | "saffron"
  | "walnut"
  | "khatamband"
  | "pashmina"
  | "kani"
  | "wicker";

export interface SeasonMeta {
  /** Programmatic key used by CSS class `theme-{key}` */
  key: Season;
  /** Koshur season name in English transliteration */
  name: string;
  /** Display name in English */
  englishName: string;
  /** Glyph/emoji used inline in pills, calendars */
  glyph: string;
  /** One-line season tagline shown above seasonal sections */
  tagline: string;
  /** The five palette swatches as hex (mirrors globals.css) */
  swatches: {
    deep: string;
    mid: string;
    light: string;
    accent: string;
    gold: string;
  };
}

export const SEASON_META: Record<Season, SeasonMeta> = {
  bahar: {
    key: "bahar",
    name: "Bahar",
    englishName: "Spring",
    glyph: "✿",
    tagline: "Tulip light, rose madder, the first thread of the year.",
    swatches: {
      deep: "#7B2D3E",
      mid: "#C2667A",
      light: "#F2D4D9",
      accent: "#2C4A3E",
      gold: "#C8975A",
    },
  },
  grism: {
    key: "grism",
    name: "Grism",
    englishName: "Summer",
    glyph: "☀",
    tagline: "Lapis afternoons, copper warmth, the bazaar before Eid.",
    swatches: {
      deep: "#1A3C5E",
      mid: "#2E6B9E",
      light: "#E8F2F8",
      accent: "#D4790A",
      gold: "#F0C040",
    },
  },
  harud: {
    key: "harud",
    name: "Harud",
    englishName: "Autumn",
    glyph: "❦",
    tagline: "Saffron at dawn, walnut heartwood, chinar leaves turning.",
    swatches: {
      deep: "#5C2D0A",
      mid: "#9B4A1A",
      light: "#F5E6D3",
      accent: "#6B0F1A",
      gold: "#D4A017",
    },
  },
  shishur: {
    key: "shishur",
    name: "Shishur",
    englishName: "Winter",
    glyph: "❄",
    tagline: "First snow on Zabarwan, Pheran warmth, raw Pashmina.",
    swatches: {
      deep: "#1C2B3A",
      mid: "#4A6B8A",
      light: "#EEF2F5",
      accent: "#8B5E3C",
      gold: "#C4A882",
    },
  },
};

/** Authoritative craft -> season map. Add new crafts here only. */
export const CRAFT_SEASON: Record<Craft, Season> = {
  sozni: "bahar",
  shawl: "bahar",

  naqashi: "grism",
  "papier-mache": "grism",
  copper: "grism",
  "heritage-walk": "grism",

  carpet: "harud",
  saffron: "harud",
  walnut: "harud",
  khatamband: "harud",

  pashmina: "shishur",
  kani: "shishur",
  wicker: "shishur",
};

/** Human-readable label for a craft (English + Koshur/Urdu accent). */
export const CRAFT_LABEL: Record<Craft, { en: string; ur: string }> = {
  sozni: { en: "Sozni Embroidery", ur: "سوزنی" },
  shawl: { en: "Kashmiri Shawl", ur: "شال" },
  naqashi: { en: "Naqashi", ur: "نقاشی" },
  "papier-mache": { en: "Papier-mâché", ur: "کاغذ ساز" },
  copper: { en: "Copper Craft", ur: "تانبہ" },
  "heritage-walk": { en: "Heritage Walk", ur: "ورثہ گشت" },
  carpet: { en: "Hand-knotted Carpet", ur: "قالین بافی" },
  saffron: { en: "Saffron Harvest", ur: "زعفران" },
  walnut: { en: "Walnut Wood Carving", ur: "اخروٹ نقاشی" },
  khatamband: { en: "Khatamband Ceiling", ur: "خاتم بند" },
  pashmina: { en: "Pashmina Weaving", ur: "پشمینہ" },
  kani: { en: "Kani Loom", ur: "کنی" },
  wicker: { en: "Willow Wicker", ur: "بید" },
};

/** Look up the season for any craft. Falls back to Harud (the demo). */
export function seasonForCraft(craft: Craft): Season {
  return CRAFT_SEASON[craft] ?? "harud";
}

/** Resolve metadata directly from a craft. */
export function metaForCraft(craft: Craft): SeasonMeta {
  return SEASON_META[seasonForCraft(craft)];
}

/**
 * Resolve the *ambient* season from a date (defaults to "now").
 * Northern-hemisphere Kashmiri calendar — adjust at will.
 *   Spring  = Mar – May
 *   Summer  = Jun – Aug
 *   Autumn  = Sep – Nov
 *   Winter  = Dec – Feb
 */
export function getCurrentSeason(date: Date = new Date()): Season {
  const m = date.getMonth(); // 0-indexed
  if (m >= 2 && m <= 4) return "bahar";
  if (m >= 5 && m <= 7) return "grism";
  if (m >= 8 && m <= 10) return "harud";
  return "shishur";
}

/** Tailwind class fragment that paints the wrapper subtree in a season. */
export function themeClassForSeason(season: Season): string {
  return `theme-${season}`;
}
