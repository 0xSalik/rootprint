/* -------------------------------------------------------------------------
 * Hunarmand — Bazaar data layer.
 *
 * Three data shapes power /bazaar:
 *
 *   BazaarEvent     — a seasonal pop-up bazaar (live or upcoming),
 *                     painted in its season's palette
 *   BazaarProduct   — a single Sanad-verified product on the always-on
 *                     storefront. Linked to a real signed pieceId on
 *                     the artisan ledger when one exists, so "View
 *                     piece" jumps straight to /sanad/[piece-id]
 *   HeritageBundle  — a curated multi-master set with its own
 *                     composite Sanad (e.g. "The Pampore Saffron Trio")
 *
 * Filters on the storefront route through ?craft=&season=&price= URL
 * params; everything else is data + helpers.
 * ----------------------------------------------------------------------- */

import { type Craft, type Season, seasonForCraft } from "./seasons";
import { ARTISANS, type Artisan } from "./artisans";
import { MOHAMMAD_YUSUF } from "@seed/seed";

/* ─────────────────────────── Events ───────────────────────────────── */

export interface BazaarEvent {
  id: string;
  name: string;
  season: Season;
  city: string;
  venue: string;
  /** ISO yyyy-mm-dd. */
  startsOn: string;
  endsOn: string;
  /** Display tagline shown on the card. */
  blurb: string;
  /** Short editorial line — the "why this exists" sentence. */
  curatorial: string;
  /** Crafts featured at this event. */
  featuredCrafts: Craft[];
  /** Number of masters confirmed to participate. */
  artisanCount: number;
  /** Seats / day-passes available. */
  seatsLeft: number;
  /** Marked live for the demo so the pulsing indicator shows. */
  isLive?: boolean;
}

const EVENTS: BazaarEvent[] = [
  {
    id: "winter-pashmina-2026",
    name: "Winter Pashmina Bazaar",
    season: "shishur",
    city: "Srinagar",
    venue: "Polo View, opposite the Residency",
    startsOn: "2026-12-12",
    endsOn: "2026-12-21",
    blurb:
      "Twenty-two pashmina masters, ten loom-side demonstrations a day, kahwa on the house.",
    curatorial:
      "The first cold week. The looms have warmed up, the new shawls are off the bobbin. Come early — the kani pieces sell out by the third afternoon.",
    featuredCrafts: ["pashmina", "kani"],
    artisanCount: 22,
    seatsLeft: 84,
    isLive: true,
  },
  /* The Khanyar event is hosted by Mohammad Yusuf — sourced from
   * the canonical seed so changing it there updates the bazaar. */
  MOHAMMAD_YUSUF.hostedEvent,
  {
    id: "tulip-bahar-2027",
    name: "Tulip Festival Bazaar",
    season: "bahar",
    city: "Srinagar",
    venue: "Indira Gandhi Memorial Tulip Garden",
    startsOn: "2027-04-01",
    endsOn: "2027-04-15",
    blurb:
      "Sozni, shawls, the first saffron-stamen embroidery of the year, beside the tulip beds.",
    curatorial:
      "The valley's biggest spring gathering. Sixty-thousand visitors over two weeks; thirty-eight masters on a stretched-canvas pavilion at the garden's southern edge.",
    featuredCrafts: ["sozni", "shawl"],
    artisanCount: 38,
    seatsLeft: 0, /* tickets free */
    isLive: false,
  },
  {
    id: "grism-copper-2027",
    name: "Grism Copper & Naqashi Mela",
    season: "grism",
    city: "Srinagar",
    venue: "Old Town — the copper bazaar lane",
    startsOn: "2027-06-18",
    endsOn: "2027-06-25",
    blurb:
      "Hammered copper, naqashi-painted papier-mâché, and a kahwa pavilion at the lane's end.",
    curatorial:
      "An Eid-week bazaar in the old copper lane, with naqashi masters opening their painting halls for the public.",
    featuredCrafts: ["copper", "naqashi", "papier-mache"],
    artisanCount: 26,
    seatsLeft: 60,
    isLive: false,
  },
  {
    id: "kanihama-loom-week-2027",
    name: "Kanihama Loom Week",
    season: "shishur",
    city: "Kanihama, Budgam",
    venue: "Around the village — the four working loom halls",
    startsOn: "2027-01-22",
    endsOn: "2027-01-29",
    blurb:
      "A week the village opens every loom hall — buy direct from the family that wove the piece.",
    curatorial:
      "The whole village turns into the bazaar. Bashir Ahmad Bhat coordinates; the Mir, Lone, and Wani families host on alternate days. Cash, UPI, and Sanad-linked invoicing accepted on the spot.",
    featuredCrafts: ["pashmina", "kani"],
    artisanCount: 14,
    seatsLeft: 40,
    isLive: false,
  },
];

export function listEvents(): BazaarEvent[] {
  /* Live first, then nearest upcoming, then the rest. */
  return EVENTS.slice().sort((a, b) => {
    if (a.isLive && !b.isLive) return -1;
    if (!a.isLive && b.isLive) return 1;
    return a.startsOn.localeCompare(b.startsOn);
  });
}

/* ─────────────────────────── Products ───────────────────────────── */

export type ProductRatio = "tall" | "portrait" | "square" | "wide";

export interface BazaarProduct {
  id: string;
  name: string;
  craft: Craft;
  season: Season;
  /** Slug of the artisan whose hands made this. */
  masterSlug: string;
  /** Cached display name + village so we don't re-walk artisans. */
  masterName: string;
  masterVillage: string;
  /** INR. */
  price: number;
  /** When set, the product card "View piece" link jumps straight to
   *  the live Sanad page. The bazaar visually distinguishes verified
   *  pieces from "Reserve from master" inventory. */
  pieceId?: string;
  sanadVerified: boolean;
  /** One-liner for the card. */
  shortBlurb: string;
  /** Drives the card image's aspect ratio in the masonry grid. */
  ratio: ProductRatio;
  /** Inventory hint shown as a small ribbon. */
  limitedTo?: number;
  inStock: boolean;
}

/** Pre-resolve the demo masters so the seed below stays terse. */
const yusuf: Artisan = ARTISANS["mohammad-yusuf-sheikh"];
const bashir: Artisan = ARTISANS["bashir-ahmad-bhat"];

const PRODUCTS: BazaarProduct[] = [
  /* ─ Yusuf — Carpet (autumn / Harud) ───────────────────────────────
   * The five verified pieces + one commission below all live in the
   * canonical Mohammad Yusuf seed (lib/seed.ts) so editing prices,
   * blurbs, or which signed-piece a card links to is a one-file
   * change. */
  ...MOHAMMAD_YUSUF.storefront,

  /* ─ Bashir — Pashmina (winter / Shishur) ───────────────────────── */
  {
    id: "p-psh-7A11",
    name: "Pashmina Shawl · 80×200 cm",
    craft: "pashmina",
    season: "shishur",
    masterSlug: bashir.slug,
    masterName: bashir.name,
    masterVillage: bashir.village,
    price: 348000,
    pieceId: "PSH-05B-7A11",
    sanadVerified: true,
    shortBlurb: "Hand-feel warp tension. Changthang fleece, hand-spun cotton secondary warp.",
    ratio: "portrait",
    inStock: true,
  },
  {
    id: "p-psh-7A0F",
    name: "Kani Shawl · 90×220 cm",
    craft: "kani",
    season: "shishur",
    masterSlug: bashir.slug,
    masterName: bashir.name,
    masterVillage: bashir.village,
    price: 612000,
    pieceId: "PSH-05B-7A0F",
    sanadVerified: true,
    shortBlurb: "Five-month talim. Saffron-stamen yellow, pomegranate-skin red.",
    ratio: "tall",
    limitedTo: 1,
    inStock: true,
  },
  {
    id: "p-psh-7A0C",
    name: "Pashmina Stole · 70×190 cm",
    craft: "pashmina",
    season: "shishur",
    masterSlug: bashir.slug,
    masterName: bashir.name,
    masterVillage: bashir.village,
    price: 159000,
    pieceId: "PSH-05B-7A0C",
    sanadVerified: true,
    shortBlurb: "Natural-dyed pashmina, woven across the coldest week of January.",
    ratio: "wide",
    inStock: true,
  },
  {
    id: "p-psh-79FE",
    name: "Kani Shawl · 100×230 cm",
    craft: "kani",
    season: "shishur",
    masterSlug: bashir.slug,
    masterName: bashir.name,
    masterVillage: bashir.village,
    price: 770000,
    pieceId: "PSH-05B-79FE",
    sanadVerified: true,
    shortBlurb: "Largest kani of the year — saffron yellow, pomegranate red, walnut brown.",
    ratio: "tall",
    limitedTo: 1,
    inStock: true,
  },
  {
    id: "p-psh-79F0",
    name: "Pashm Yarn · 200 g hank",
    craft: "pashmina",
    season: "shishur",
    masterSlug: bashir.slug,
    masterName: bashir.name,
    masterVillage: bashir.village,
    price: 16000,
    pieceId: "PSH-05B-79F0",
    sanadVerified: true,
    shortBlurb: "Spin your own. Hand-graded Changthang fleece, posted with a knotting hook.",
    ratio: "square",
    inStock: true,
  },

  /* ─ Reserve-from-master (no Sanad piece yet) ─────────────────────
   * Yusuf's commission card is bundled into MOHAMMAD_YUSUF.storefront
   * above, so only Bashir's commission lives inline here. */
  {
    id: "p-psh-bashir-comm-1",
    name: "Commissioned Kani Shawl · made to order",
    craft: "kani",
    season: "shishur",
    masterSlug: bashir.slug,
    masterName: bashir.name,
    masterVillage: bashir.village,
    price: 680000,
    sanadVerified: false,
    shortBlurb:
      "Reserve a five-month talim slot. Sanad signed when the loom releases.",
    ratio: "portrait",
    inStock: true,
  },
];

/* ──────────────────────── Product helpers ──────────────────────── */

export function listProducts(): BazaarProduct[] {
  return PRODUCTS;
}

/** Filter products by URL search params. All filters compose. */
export interface ProductFilter {
  craft?: Craft | null;
  season?: Season | null;
  /** Price band id. See `PRICE_BANDS` below. */
  band?: PriceBandId | null;
}

export function filterProducts(
  filter: ProductFilter,
  source: BazaarProduct[] = PRODUCTS,
): BazaarProduct[] {
  return source.filter((p) => {
    if (filter.craft && p.craft !== filter.craft) return false;
    if (filter.season && p.season !== filter.season) return false;
    if (filter.band) {
      const band = PRICE_BANDS.find((b) => b.id === filter.band);
      if (band && (p.price < band.min || p.price > band.max)) return false;
    }
    return true;
  });
}

/** Distinct craft codes that appear in the storefront — used by the
 *  craft filter row. */
export function listCraftsInStorefront(): Craft[] {
  const seen = new Set<Craft>();
  for (const p of PRODUCTS) seen.add(p.craft);
  return Array.from(seen);
}

/* ─────────────────────────── Price bands ─────────────────────── */

export type PriceBandId =
  | "under-50k"
  | "50-200k"
  | "200-500k"
  | "above-500k";

export interface PriceBand {
  id: PriceBandId;
  label: string;
  /** Inclusive INR bounds. */
  min: number;
  max: number;
}

export const PRICE_BANDS: PriceBand[] = [
  { id: "under-50k", label: "Under Rs. 50K", min: 0, max: 49999 },
  { id: "50-200k", label: "Rs. 50K – Rs. 2L", min: 50000, max: 199999 },
  { id: "200-500k", label: "Rs. 2L – Rs. 5L", min: 200000, max: 499999 },
  { id: "above-500k", label: "Above Rs. 5L", min: 500000, max: Number.MAX_SAFE_INTEGER },
];

/* ─────────────────────────── Bundles ─────────────────────────── */

export interface BundleInclude {
  /** Display name of the item. */
  label: string;
  /** Master who made this item. */
  masterSlug: string;
  masterName: string;
  /** Optional Sanad piece id, if it's already signed. */
  pieceId?: string;
  /** "carpet", "shawl", "saffron jar" etc. — drives the SVG glyph. */
  glyph: "carpet" | "shawl" | "yarn" | "saffron" | "stole" | "kani-shawl" | "rug";
}

export interface HeritageBundle {
  id: string;
  name: string;
  /** A single editorial line shown beneath the title. */
  narrative: string;
  /** A second sentence used in the bundle's expanded card. */
  story: string;
  season: Season;
  craft: Craft;
  /** Composite Sanad reference assigned to the bundle as a whole. */
  bundleSanad: string;
  price: number;
  /** Items in the bundle. */
  includes: BundleInclude[];
}

const BUNDLES: HeritageBundle[] = [
  {
    id: "kanihama-shawl-trio",
    name: "The Kanihama Shawl Trio",
    narrative:
      "One pashmina shawl, one kani shawl, one stole — all from the Bhat loom.",
    story:
      "Three pieces from the same loom in the same winter. The shawl in plain weave, the kani in five-month talim, the stole in pomegranate-dye. A composite Sanad covers all three.",
    season: "shishur",
    craft: "pashmina",
    bundleSanad: "BNDL-KAN-7A11",
    price: 1180000,
    includes: [
      { label: "Pashmina Shawl, 80×200 cm", masterSlug: bashir.slug, masterName: bashir.name, pieceId: "PSH-05B-7A11", glyph: "shawl" },
      { label: "Kani Shawl, 90×220 cm", masterSlug: bashir.slug, masterName: bashir.name, pieceId: "PSH-05B-7A0F", glyph: "kani-shawl" },
      { label: "Pashmina Stole, 70×190 cm", masterSlug: bashir.slug, masterName: bashir.name, pieceId: "PSH-05B-7A0C", glyph: "stole" },
    ],
  },
  /* The Khanyar Carpet Pair is anchored in two of Yusuf's signed
   * pieces; sourced from the canonical seed so the bundle's Sanad
   * ref + price + included pieceIds stay in lockstep with his ledger. */
  MOHAMMAD_YUSUF.bundle,
  {
    id: "pampore-saffron-trio",
    name: "The Pampore Saffron Trio",
    narrative:
      "A pashmina stole dyed in saffron, a kani shawl with saffron-stamen yellow, and a sealed jar of the source.",
    story:
      "Three objects from the 2024 Pampore harvest — the dye in the pashmina, the colour woven into the kani, and the spice itself in a sealed glass jar with a Hunarmand serial.",
    season: "harud",
    craft: "saffron",
    bundleSanad: "BNDL-SAF-2024",
    price: 184000,
    includes: [
      { label: "Pashmina Stole, saffron-dyed", masterSlug: bashir.slug, masterName: bashir.name, pieceId: "PSH-05B-7A0C", glyph: "stole" },
      { label: "Kani Shawl, saffron-yellow weft", masterSlug: bashir.slug, masterName: bashir.name, pieceId: "PSH-05B-79FE", glyph: "kani-shawl" },
      { label: "Sealed jar · 5 g, Pampore 2024", masterSlug: yusuf.slug, masterName: yusuf.name, glyph: "saffron" },
    ],
  },
  {
    id: "first-loom-set",
    name: "The First-Loom Set",
    narrative:
      "Spin your own pashm yarn, then receive a stole woven from it by the master.",
    story:
      "A 200-gram hank of fleece for you to spin at home, paired with a workshop seat at the Bhat loom hall and a finished stole posted to your door eight weeks later. One Sanad covers the whole journey.",
    season: "shishur",
    craft: "pashmina",
    bundleSanad: "BNDL-FRST-79F0",
    price: 84000,
    includes: [
      { label: "Pashm yarn, 200 g hank", masterSlug: bashir.slug, masterName: bashir.name, pieceId: "PSH-05B-79F0", glyph: "yarn" },
      { label: "Workshop seat · A Day on the Pashmina Loom", masterSlug: bashir.slug, masterName: bashir.name, glyph: "stole" },
      { label: "Stole woven from your yarn (posted)", masterSlug: bashir.slug, masterName: bashir.name, glyph: "shawl" },
    ],
  },
];

export function listBundles(): HeritageBundle[] {
  return BUNDLES;
}

/* ─────────────────────────── Formatting ───────────────────────── */

export function formatINR(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

/** "Rs. 2.7 L" / "Rs. 5.5 K" — used on tight cards. */
export function formatINRShort(amount: number): string {
  if (amount >= 100000) return `Rs. ${(amount / 100000).toFixed(amount >= 1000000 ? 1 : 1)} L`;
  if (amount >= 1000) return `Rs. ${Math.round(amount / 1000)}K`;
  return `Rs. ${amount}`;
}

export function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const sameYear = start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${start.getDate()}–${end.getDate()} ${start.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`;
  }
  if (sameYear) {
    return `${start.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} – ${end.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;
  }
  return `${start.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} – ${end.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;
}

/* Re-export the season helper for convenience. */
export { seasonForCraft };
