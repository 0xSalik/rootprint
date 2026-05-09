/* =========================================================================
 * Hunarmand — DEMO SEED · Mohammad Yusuf Sheikh
 *
 * The single, authoritative record for the jury demo. Every page that
 * mentions Mohammad Yusuf — the landing spotlight, his artisan profile,
 * the Sanad pages of his signed pieces, his workshops, his bazaar
 * listings, the Khanyar Carpet Pair bundle, the Harud Carpet Sundays
 * event — derives its data from this file.
 *
 * This module ships pure data only:
 *
 *   • MOHAMMAD_YUSUF — typed `MasterSeed` literal
 *   • validateSeed() — deterministic referential-integrity check
 *   • summarizeSeed() — formats a human-readable digest (used by
 *                       `npm run seed:check`)
 *
 * Section 8 of the brief calls out a single seed for the end-to-end
 * demo. This is that seed.
 *
 * Refer to /AGENTS.md before editing.
 * ========================================================================= */

import type {
  Artisan,
  Letter,
  LineageEntry,
  SignedPiece,
  SupplierOrigin,
  Technique,
  WorkshopOffering,
} from "../src/lib/artisans";
import type {
  BazaarEvent,
  BazaarProduct,
  HeritageBundle,
} from "../src/lib/bazaar";

/* ─────────────────────────── Shape ─────────────────────────────────── */

/** Top-level shape of a master's seed. Wraps the canonical Artisan
 *  record alongside the cross-cuts (storefront, bundle, hosted event)
 *  so the bazaar layer can pull from the same single source. */
export interface MasterSeed {
  /** The canonical Artisan profile. */
  artisan: Artisan;
  /** Standalone bazaar listings keyed off this master. */
  storefront: BazaarProduct[];
  /** A heritage bundle that uses this master's signed pieces. */
  bundle: HeritageBundle;
  /** A seasonal pop-up event hosted at this master's workshop. */
  hostedEvent: BazaarEvent;
}

/* ─────────────────────────── Techniques ─────────────────────────── */

const TECHNIQUES: Technique[] = [
  {
    id: "knot-1940s",
    name: "1940s Srinagar Knot",
    rarity: "rare",
    vaultExcerpt:
      "My grandfather's father set this knot before Partition. It is asymmetric — the warp is taken once, the weft twice. The book never wrote it. I have 312 pieces in it. If I do not give it to my son this winter, no one will hold it again.",
    vaultSession: "2025-08-12",
    clipId: "yusuf-knot-1940s",
    sub: {
      tools: [
        "Iron tikka comb (forged in Habba Kadal, ca. 1962)",
        "Two-shed beater, walnut handle",
        "Tongue-shaped finishing scissor",
      ],
      materials: [
        "Aged cotton warp (≥ 18 months rest)",
        "Gurez Valley wool weft, single-spun",
        "Natural madder dye for the field",
      ],
      tuning: [
        "Winter humidity 35–45% — never above 60%",
        "Loom tension calibrated by hand-feel, daily",
        "Knot density 280/inch only when warp is dry",
      ],
      failure: [
        "Knot slips at 280+/inch in summer humidity",
        "Synthetic-dyed weft refuses to take the second pass",
      ],
    },
  },
  {
    id: "gurez-wool",
    name: "Gurez Wool Selection",
    rarity: "endangered",
    vaultExcerpt:
      "Gurez wool has a longer staple than any other in J&K. I select by smell first, then by the way it pulls between my fingers. Mill-graded wool will not take the dye the same way.",
    vaultSession: "2025-08-12",
    clipId: "yusuf-gurez-wool",
    sub: {
      tools: ["Bare hands", "Burlap sack for sorting", "Wooden grading rake"],
      materials: [
        "Spring-shorn fleece (Apr–May)",
        "Single-flock origin (mixed flocks reject the comb)",
      ],
      tuning: [
        "Sort within 14 days of shearing",
        "Hand-wash in mountain-stream water only",
      ],
      failure: [
        "Mixed-flock wool produces colour-shift across the field",
        "Late-summer fleece is too coarse for the 1940s knot",
      ],
    },
  },
  {
    id: "winter-tension",
    name: "Winter Tension Adjustment",
    rarity: "endangered",
    vaultExcerpt:
      "When the room cools, the warp shortens. A young weaver does not feel this until the carpet is cut and ten centimetres are missing on one side. I retune every morning between mid-November and February.",
    vaultSession: "2025-08-19",
    clipId: "yusuf-winter-tension",
    sub: {
      tools: ["Tension gauge, brass, pre-1970", "Loom mallet"],
      materials: ["Cotton warp", "Brass tensioning pegs"],
      tuning: [
        "Daily check at sunrise",
        "Hand-palm test: warp must give 2 mm under firm press",
      ],
      failure: [
        "Over-tension cracks the warp",
        "Under-tension produces a wavy edge that no finishing can fix",
      ],
    },
  },
  {
    id: "natural-dye",
    name: "Natural Dye Ratios",
    rarity: "rare",
    vaultExcerpt:
      "The madder must boil for four hours, never more. The brass cauldron, never aluminium. We add a pinch of crushed walnut husk for the depth — this is the ratio my mother taught my wife.",
    vaultSession: "2025-09-02",
    clipId: "yusuf-natural-dye",
    sub: {
      tools: ["Brass cauldron, 40 litre", "Wooden stirring paddle"],
      materials: [
        "Madder root, dried (Pulwama)",
        "Walnut husk, crushed",
        "Alum mordant",
      ],
      tuning: [
        "Boil exactly 4 hours, stirring every 12 minutes",
        "Cool overnight in the same vessel",
      ],
      failure: [
        "Aluminium vessel turns the dye brown-grey",
        "Over-boiled madder loses the rose tone permanently",
      ],
    },
  },
];

/* ─────────────────────────── Lineage ───────────────────────────── */

const LINEAGE: LineageEntry[] = [
  {
    name: "Sheikh Hyderullah",
    era: "ca. 1880s",
    note: "Founded the Khanyar workshop after migrating from Pulwama.",
    alive: false,
  },
  {
    name: "Sheikh Ghulam Mohammad",
    era: "ca. 1910s",
    note: "Codified the 1940s knot, first to weave for the Maharaja's court.",
    alive: false,
  },
  {
    name: "Sheikh Ali Mohammad",
    era: "ca. 1940s",
    note: "Survived the 1947 disruption; kept the loom running through the floods.",
    alive: false,
  },
  {
    name: "Sheikh Abdul Rahim",
    era: "ca. 1970s",
    note: "Trained eight apprentices; introduced single-flock Gurez wool.",
    alive: false,
  },
  {
    name: "Mohammad Yusuf Sheikh",
    era: "1981 – present",
    note: "Currently the only carrier of the 1940s Srinagar knot.",
    alive: true,
  },
];

/* ─────────────────────────── Suppliers ─────────────────────────── */

const SUPPLIERS: SupplierOrigin[] = [
  {
    id: "wool-gurez",
    place: "Gurez Valley",
    material: "Single-flock spring wool",
    note: "Sourced from one shepherd family for 38 years.",
    x: 0.32,
    y: 0.18,
  },
  {
    id: "dye-pulwama",
    place: "Pulwama",
    material: "Madder root, dried",
    note: "Harvested in October, rested 6 months before grinding.",
    x: 0.55,
    y: 0.62,
  },
  {
    id: "warp-srinagar",
    place: "Srinagar bazaar",
    material: "Aged cotton warp thread",
    note: "Hand-spun in Habba Kadal, rested ≥ 18 months.",
    x: 0.46,
    y: 0.38,
  },
  {
    id: "pigment-rajouri",
    place: "Rajouri",
    material: "Walnut husk pigment",
    note: "For dye depth. One sack lasts the full winter.",
    x: 0.18,
    y: 0.78,
  },
];

/* ─────────────────────────── Signed pieces ─────────────────────── */

const SIGNED_PIECES: SignedPiece[] = [
  {
    pieceId: "CRP-04A-9F2B",
    type: "Carpet, 6×4 ft",
    signedOn: "2026-04-08",
    completedOn: "2026-04-04",
    techniqueId: "knot-1940s",
    status: "with buyer",
    priceFrom: 240000,
    priceTo: 280000,
    materials: ["wool-gurez", "warp-srinagar", "dye-pulwama"],
    materialSeasons: ["Spring 2024 fleece", "1.5-yr aged warp", "Oct 2024 madder"],
  },
  {
    pieceId: "CRP-04A-9F2C",
    type: "Prayer rug, 4×3 ft",
    signedOn: "2026-03-22",
    completedOn: "2026-03-18",
    techniqueId: "knot-1940s",
    status: "in bazaar",
    priceFrom: 86000,
    priceTo: 95000,
    materials: ["wool-gurez", "dye-pulwama"],
    materialSeasons: ["Spring 2025 fleece", "Oct 2024 madder"],
  },
  {
    pieceId: "CRP-04A-9F2D",
    type: "Carpet, 8×5 ft",
    signedOn: "2026-02-14",
    completedOn: "2026-02-10",
    techniqueId: "natural-dye",
    status: "in transit",
    priceFrom: 410000,
    priceTo: 460000,
    materials: ["wool-gurez", "dye-pulwama", "pigment-rajouri"],
    materialSeasons: [
      "Spring 2023 fleece",
      "Oct 2023 madder",
      "Walnut husk, autumn 2024",
    ],
  },
  {
    pieceId: "CRP-04A-9F1F",
    type: "Runner, 9×2 ft",
    signedOn: "2025-12-30",
    completedOn: "2025-12-26",
    techniqueId: "knot-1940s",
    status: "with buyer",
    priceFrom: 180000,
    priceTo: 210000,
    materials: ["wool-gurez", "warp-srinagar"],
    materialSeasons: ["Spring 2024 fleece", "2-yr aged warp"],
  },
  {
    pieceId: "CRP-04A-9F1E",
    type: "Carpet, 6×4 ft",
    signedOn: "2025-11-18",
    completedOn: "2025-11-14",
    techniqueId: "winter-tension",
    status: "with buyer",
    priceFrom: 245000,
    priceTo: 285000,
    materials: ["wool-gurez", "warp-srinagar"],
    materialSeasons: ["Spring 2024 fleece", "1.5-yr aged warp"],
  },
  {
    pieceId: "CRP-04A-9F19",
    type: "Prayer rug, 3×2 ft",
    signedOn: "2025-09-04",
    completedOn: "2025-09-01",
    techniqueId: "knot-1940s",
    status: "in workshop",
    priceFrom: 65000,
    priceTo: 78000,
    materials: ["wool-gurez"],
    materialSeasons: ["Spring 2024 fleece"],
  },
  {
    pieceId: "CRP-04A-9F12",
    type: "Carpet, 10×6 ft",
    signedOn: "2025-07-21",
    completedOn: "2025-07-16",
    techniqueId: "natural-dye",
    status: "with buyer",
    priceFrom: 520000,
    priceTo: 580000,
    materials: ["wool-gurez", "dye-pulwama", "pigment-rajouri"],
    materialSeasons: [
      "Spring 2022 fleece",
      "Oct 2022 madder",
      "Walnut husk, autumn 2023",
    ],
  },
];

/* ─────────────────────────── Workshops ─────────────────────────── */

const WORKSHOPS: WorkshopOffering[] = [
  {
    id: "yusuf-half-day",
    kind: "half-day",
    title: "Half-Day Carpet Knotting at the Loom",
    duration: "4 hours",
    pricePerPerson: 6000,
    capacity: 6,
    languages: ["ks", "ur", "en"],
    blurb:
      "Sit at the master's own loom, learn the 1940s knot for one corner of a small piece you take home.",
    nextDate: "2026-12-14",
  },
  {
    id: "yusuf-master-session",
    kind: "master-session",
    title: "One-on-one Master Session",
    duration: "2 hours",
    pricePerPerson: 12000,
    capacity: 1,
    languages: ["ks", "ur", "hi", "en"],
    blurb:
      "An hour of conversation, an hour of demonstration. Your questions, his hands. No piece — only knowing.",
    nextDate: "2026-11-28",
  },
  {
    id: "yusuf-multi-day",
    kind: "multi-day",
    title: "Three-Day Carpet Masterclass",
    duration: "3 days",
    pricePerPerson: 38000,
    capacity: 4,
    languages: ["ks", "ur", "en"],
    blurb:
      "Begin at the dyeing cauldron on day one, weave a small piece by day three. Sleep at a houseboat nearby.",
    nextDate: "2027-01-09",
  },
  {
    id: "yusuf-walk",
    kind: "heritage-walk",
    title: "Khanyar Carpet Heritage Walk",
    duration: "90 minutes",
    pricePerPerson: 1500,
    capacity: 12,
    languages: ["ur", "hi", "en"],
    blurb:
      "Walk through three working carpet workshops in the old city, ending at Mohammad Yusuf's loom.",
    nextDate: "2026-11-22",
  },
  {
    id: "yusuf-virtual",
    kind: "virtual",
    title: "Virtual Live Session",
    duration: "60 minutes",
    pricePerPerson: 4000,
    capacity: 30,
    languages: ["ks", "ur", "hi", "en", "ja", "fr"],
    blurb:
      "Live from the loom, with simultaneous translation. Audience can interrupt with questions.",
    nextDate: "2026-12-03",
  },
];

/* ─────────────────────────── Letters ───────────────────────────── */

const LETTERS: Letter[] = [
  {
    id: "l-yumiko",
    from: "Yumiko Tanaka — Kyoto, Japan",
    piece: "Carpet, 6×4 ft (CRP-04A-9F2B)",
    written: "2026-05-02",
    body: "I scanned the QR on the back of the rug and watched a 30-second video of Mohammad-san at his loom. My husband and I cried. We have placed it under the alcove, where the morning light reaches it first.",
  },
  {
    id: "l-rohan",
    from: "Rohan Mehta — Bombay, India",
    piece: "Prayer rug, 4×3 ft (CRP-04A-9F2C)",
    written: "2026-04-15",
    body: "I have bought four carpets in my life. This is the first one where I know the wool's village, the dye's month, the master's name. It feels less like a purchase and more like an inheritance.",
  },
  {
    id: "l-claire",
    from: "Claire Mounier — Lyon, France",
    piece: "Runner, 9×2 ft (CRP-04A-9F1F)",
    written: "2026-03-08",
    body: "Merci, Mohammad. La fibre est si chaude que je l'ai installée dans le couloir, là où les enfants courent pieds nus chaque matin. Le Sanad est encadré au-dessus.",
  },
];

/* ─────────────────────────── Artisan ───────────────────────────── */

const ARTISAN: Artisan = {
  slug: "mohammad-yusuf-sheikh",
  name: "Mohammad Yusuf Sheikh",
  craftUrdu: "قالین بافی",
  craft: "carpet",
  craftEnglish: "Hand-knotted Carpet",
  generation: 4,
  village: "Khanyar",
  district: "Srinagar",
  sanadLevel: "master",
  irreplaceable:
    "Holds a discontinued 1940s Srinagar knot pattern no living master else carries.",
  lineageEstYear: "~1880s",
  piecesSigned: 312,
  disputes: 0,
  openSlots: 12,
  nextWorkshop: "2026-12-14",
  techniques: TECHNIQUES,
  lineage: LINEAGE,
  signedPieces: SIGNED_PIECES,
  workshops: WORKSHOPS,
  suppliers: SUPPLIERS,
  letters: LETTERS,
};

/* ─────────────────────────── Storefront ─────────────────────────── */
/* The bazaar listings keyed off this master. Each card either points
 * to a real signed piece on the Sanad ledger ("Add to cart" → /sanad/…)
 * or is a made-to-order commission ("Reserve" → /artisan/…). */

const STOREFRONT: BazaarProduct[] = [
  {
    id: "p-crp-9F2B",
    name: "Hand-knotted Carpet · 6×4 ft",
    craft: "carpet",
    season: "harud",
    masterSlug: ARTISAN.slug,
    masterName: ARTISAN.name,
    masterVillage: ARTISAN.village,
    price: 268000,
    pieceId: "CRP-04A-9F2B",
    sanadVerified: true,
    shortBlurb: "1940s Srinagar knot · Gurez wool · madder & walnut dye.",
    ratio: "portrait",
    inStock: true,
  },
  {
    id: "p-crp-9F2C",
    name: "Prayer Rug · 4×3 ft",
    craft: "carpet",
    season: "harud",
    masterSlug: ARTISAN.slug,
    masterName: ARTISAN.name,
    masterVillage: ARTISAN.village,
    price: 92000,
    pieceId: "CRP-04A-9F2C",
    sanadVerified: true,
    shortBlurb: "Tight-knot prayer rug, knotted across forty winter mornings.",
    ratio: "tall",
    inStock: true,
  },
  {
    id: "p-crp-9F1F",
    name: "Runner · 9×2 ft",
    craft: "carpet",
    season: "harud",
    masterSlug: ARTISAN.slug,
    masterName: ARTISAN.name,
    masterVillage: ARTISAN.village,
    price: 198000,
    pieceId: "CRP-04A-9F1F",
    sanadVerified: true,
    shortBlurb: "Two-year aged warp · for a long passage that never gets noticed.",
    ratio: "wide",
    inStock: true,
  },
  {
    id: "p-crp-9F19",
    name: "Small Prayer Rug · 3×2 ft",
    craft: "carpet",
    season: "harud",
    masterSlug: ARTISAN.slug,
    masterName: ARTISAN.name,
    masterVillage: ARTISAN.village,
    price: 72000,
    pieceId: "CRP-04A-9F19",
    sanadVerified: true,
    shortBlurb: "From the corner of the loom hall — for a child's first prayer.",
    ratio: "square",
    limitedTo: 2,
    inStock: true,
  },
  {
    id: "p-crp-9F12",
    name: "Carpet · 10×6 ft",
    craft: "carpet",
    season: "harud",
    masterSlug: ARTISAN.slug,
    masterName: ARTISAN.name,
    masterVillage: ARTISAN.village,
    price: 545000,
    pieceId: "CRP-04A-9F12",
    sanadVerified: true,
    shortBlurb:
      "Master's largest 2025 piece. Wool from a single Spring 2022 fleece batch.",
    ratio: "portrait",
    limitedTo: 1,
    inStock: true,
  },
  {
    id: "p-crp-yusuf-comm-1",
    name: "Commissioned Carpet · made to order",
    craft: "carpet",
    season: "harud",
    masterSlug: ARTISAN.slug,
    masterName: ARTISAN.name,
    masterVillage: ARTISAN.village,
    price: 220000,
    sanadVerified: false,
    shortBlurb:
      "Reserve a slot on Mohammad Yusuf's loom for next winter. Sanad signed on completion.",
    ratio: "wide",
    inStock: true,
  },
];

/* ─────────────────────────── Heritage bundle ─────────────────────── */

const BUNDLE: HeritageBundle = {
  id: "khanyar-carpet-pair",
  name: "The Khanyar Carpet Pair",
  narrative:
    "A 6×4 carpet and a matching prayer rug, hand-knotted at Mohammad Yusuf's loom.",
  story:
    "Two pieces dyed from one madder bath, knotted with the 1940s asymmetric knot. Hung side-by-side they read as one piece in two scales.",
  season: "harud",
  craft: "carpet",
  bundleSanad: "BNDL-KHN-9F2B",
  price: 348000,
  includes: [
    {
      label: "Carpet, 6×4 ft",
      masterSlug: ARTISAN.slug,
      masterName: ARTISAN.name,
      pieceId: "CRP-04A-9F2B",
      glyph: "carpet",
    },
    {
      label: "Prayer Rug, 4×3 ft",
      masterSlug: ARTISAN.slug,
      masterName: ARTISAN.name,
      pieceId: "CRP-04A-9F2C",
      glyph: "rug",
    },
  ],
};

/* ─────────────────────────── Hosted event ─────────────────────────── */

const HOSTED_EVENT: BazaarEvent = {
  id: "harud-carpet-2026",
  name: "Harud Carpet Sundays",
  season: "harud",
  city: "Srinagar",
  venue: "Khanyar — three workshops, one courtyard",
  startsOn: "2026-11-08",
  endsOn: "2026-11-29",
  blurb:
    "Four Sundays of carpet-knotting demonstrations and a small bazaar at the loom hall.",
  curatorial:
    "Mohammad Yusuf and three other Khanyar masters open their workshops. The courtyard becomes the bazaar between two and six in the afternoon.",
  featuredCrafts: ["carpet"],
  artisanCount: 4,
  seatsLeft: 36,
  isLive: false,
};

/* ─────────────────────────── Export ─────────────────────────────── */

export const MOHAMMAD_YUSUF: MasterSeed = {
  artisan: ARTISAN,
  storefront: STOREFRONT,
  bundle: BUNDLE,
  hostedEvent: HOSTED_EVENT,
};

/* Convenience constants — useful for tests and demo navigation. */
export const SEED_SLUG = MOHAMMAD_YUSUF.artisan.slug;
export const SEED_HERO_PIECE_ID = "CRP-04A-9F2B"; /* the 6×4 carpet */
export const SEED_HERO_WORKSHOP_ID = "yusuf-master-session";
export const SEED_BUNDLE_ID = MOHAMMAD_YUSUF.bundle.id;
export const SEED_EVENT_ID = MOHAMMAD_YUSUF.hostedEvent.id;

/* ─────────────────────────── Validation ─────────────────────────── */

export interface SeedValidation {
  ok: boolean;
  /** Plain-text issues (empty when ok). */
  issues: string[];
  /** Counts that the summary uses. */
  counts: {
    techniques: number;
    lineage: number;
    signedPieces: number;
    workshops: number;
    suppliers: number;
    letters: number;
    storefront: number;
    bundleItems: number;
  };
}

/**
 * Walk the seed and confirm referential integrity:
 *
 *   • every signedPiece.techniqueId exists on .techniques
 *   • every signedPiece.materials[] id exists on .suppliers
 *   • every storefront product (with a pieceId) references a real
 *     signed piece on the master
 *   • every bundle.includes (with a pieceId) references a real
 *     signed piece on the master
 *   • piecesSigned >= signedPieces.length (the ledger is a sample
 *     of the lifetime total — should never exceed it)
 *
 * Pure function; safe to call at runtime or from a CLI.
 */
export function validateSeed(seed: MasterSeed): SeedValidation {
  const issues: string[] = [];
  const techniqueIds = new Set(seed.artisan.techniques.map((t) => t.id));
  const supplierIds = new Set(seed.artisan.suppliers.map((s) => s.id));
  const pieceIds = new Set(seed.artisan.signedPieces.map((p) => p.pieceId));

  for (const piece of seed.artisan.signedPieces) {
    if (!techniqueIds.has(piece.techniqueId)) {
      issues.push(
        `signed piece ${piece.pieceId} → unknown techniqueId "${piece.techniqueId}"`,
      );
    }
    for (const mat of piece.materials ?? []) {
      if (!supplierIds.has(mat)) {
        issues.push(
          `signed piece ${piece.pieceId} → unknown material supplier "${mat}"`,
        );
      }
    }
    if (
      piece.materialSeasons &&
      piece.materials &&
      piece.materialSeasons.length !== piece.materials.length
    ) {
      issues.push(
        `signed piece ${piece.pieceId} → materialSeasons (${piece.materialSeasons.length}) length differs from materials (${piece.materials.length})`,
      );
    }
  }

  for (const product of seed.storefront) {
    if (product.masterSlug !== seed.artisan.slug) {
      issues.push(
        `storefront product ${product.id} → masterSlug ${product.masterSlug} does not match seed slug ${seed.artisan.slug}`,
      );
    }
    if (product.pieceId && !pieceIds.has(product.pieceId)) {
      issues.push(
        `storefront product ${product.id} → pieceId ${product.pieceId} not on this master's ledger`,
      );
    }
  }

  for (const item of seed.bundle.includes) {
    if (item.pieceId && !pieceIds.has(item.pieceId)) {
      issues.push(
        `bundle ${seed.bundle.id} → pieceId ${item.pieceId} not on this master's ledger`,
      );
    }
  }

  if (seed.artisan.piecesSigned < seed.artisan.signedPieces.length) {
    issues.push(
      `lifetime piecesSigned (${seed.artisan.piecesSigned}) is smaller than the ledger length (${seed.artisan.signedPieces.length})`,
    );
  }

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      techniques: seed.artisan.techniques.length,
      lineage: seed.artisan.lineage.length,
      signedPieces: seed.artisan.signedPieces.length,
      workshops: seed.artisan.workshops.length,
      suppliers: seed.artisan.suppliers.length,
      letters: seed.artisan.letters.length,
      storefront: seed.storefront.length,
      bundleItems: seed.bundle.includes.length,
    },
  };
}

/* ─────────────────────────── Summary ─────────────────────────── */

/** Human-readable digest. Prints fine in the terminal. */
export function summarizeSeed(seed: MasterSeed): string {
  const v = validateSeed(seed);
  const a = seed.artisan;
  const lines: string[] = [];

  lines.push("─".repeat(64));
  lines.push(`  Hunarmand seed · ${a.name}`);
  lines.push(`  ${a.craftEnglish}  ·  ${a.village}, ${a.district}`);
  lines.push("─".repeat(64));
  lines.push(`  craft.urdu     ${a.craftUrdu}`);
  lines.push(`  generation     ${a.generation}`);
  lines.push(`  sanad level    ${a.sanadLevel}`);
  lines.push(`  irreplaceable  ${a.irreplaceable}`);
  lines.push(`  lineage from   ${a.lineageEstYear}`);
  lines.push(`  pieces signed  ${a.piecesSigned}  (disputes: ${a.disputes})`);
  lines.push(`  next workshop  ${a.nextWorkshop}  (open slots: ${a.openSlots})`);
  lines.push("");
  lines.push(`  techniques     ${v.counts.techniques}`);
  for (const t of a.techniques) {
    lines.push(`    · ${t.name}  [${t.rarity}]`);
  }
  lines.push("");
  lines.push(`  lineage        ${v.counts.lineage} generations`);
  for (const l of a.lineage) {
    lines.push(`    · ${l.alive ? "●" : "○"} ${l.name}  (${l.era})`);
  }
  lines.push("");
  lines.push(`  signed ledger  ${v.counts.signedPieces} pieces`);
  for (const p of a.signedPieces) {
    const price = p.priceFrom
      ? ` Rs. ${(p.priceFrom / 1000).toFixed(0)}K – ${(p.priceTo! / 1000).toFixed(0)}K`
      : "";
    lines.push(
      `    · ${p.pieceId}  ${p.signedOn}  ${p.status.padEnd(12)} ${p.type}${price}`,
    );
  }
  lines.push("");
  lines.push(`  workshops      ${v.counts.workshops}`);
  for (const w of a.workshops) {
    lines.push(
      `    · ${w.id.padEnd(20)} Rs. ${w.pricePerPerson.toLocaleString("en-IN")}/p · ${w.duration} · cap ${w.capacity}`,
    );
  }
  lines.push("");
  lines.push(`  suppliers      ${v.counts.suppliers}`);
  for (const s of a.suppliers) {
    lines.push(`    · ${s.id.padEnd(18)} ${s.material} (${s.place})`);
  }
  lines.push("");
  lines.push(`  letters        ${v.counts.letters}`);
  for (const l of a.letters) {
    lines.push(`    · ${l.from}`);
  }
  lines.push("");
  lines.push(`  storefront     ${v.counts.storefront} listings`);
  for (const p of seed.storefront) {
    const tag = p.sanadVerified ? "verified" : "made-to-order";
    lines.push(
      `    · ${p.id.padEnd(22)} ${p.name.padEnd(38)} Rs. ${p.price.toLocaleString("en-IN").padStart(10)}  [${tag}]`,
    );
  }
  lines.push("");
  lines.push(`  bundle         ${seed.bundle.name}`);
  lines.push(
    `                 ${seed.bundle.bundleSanad} · Rs. ${seed.bundle.price.toLocaleString("en-IN")} · ${v.counts.bundleItems} items`,
  );
  for (const item of seed.bundle.includes) {
    lines.push(`    · ${item.label}  (${item.pieceId ?? "made-to-order"})`);
  }
  lines.push("");
  lines.push(
    `  hosted event   ${seed.hostedEvent.name}  ·  ${seed.hostedEvent.startsOn} → ${seed.hostedEvent.endsOn}`,
  );
  lines.push("");
  lines.push("─".repeat(64));
  if (v.ok) {
    lines.push(`  ✓ validation OK — all ${v.counts.signedPieces} pieces resolve to a technique & supplier`);
  } else {
    lines.push(`  ✕ validation FAILED — ${v.issues.length} issue${v.issues.length === 1 ? "" : "s"}:`);
    for (const issue of v.issues) lines.push(`    · ${issue}`);
  }
  lines.push("─".repeat(64));

  return lines.join("\n");
}
