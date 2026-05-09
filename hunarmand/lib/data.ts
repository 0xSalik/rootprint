/* =========================================================================
 * Hunarmand — Site Preview Dataset
 *
 * Self-contained mock data for the multi-page site preview:
 *
 *   • 6 crafts (papier-mâché, pashmina, sozni, walnut-carving,
 *     carpet, khatamband) — each painted in a seasonal palette
 *   • 18 artisans (3 per craft) — slug, bio, lineage, irreplaceable
 *     fact, plus per-craft technique + product catalogues
 *   • 3 workshop types (heritage walk · half-day · multi-day)
 *     shared across every artisan
 *   • 3 sample Sanad pieces (piece-001 / 002 / 003) wired to specific
 *     artisans + techniques
 *
 * Used by the new craft-entry routes at /craft/[slug],
 * /artisan/[slug], /sanad/[piece-id], and /booking/[artisan-slug]/
 * [workshop-type]. The richer canonical seed (`lib/seed.ts`) still
 * powers /bazaar, /demo, and the existing CRP-/PSH- Sanad pages.
 * ========================================================================= */

/* ─────────────────────────── Types ─────────────────────────────── */

export type CraftSlug =
  | "papier-mache"
  | "pashmina"
  | "sozni"
  | "walnut-carving"
  | "carpet"
  | "khatamband";

export type Palette = "autumn" | "winter" | "spring" | "summer";

export interface Craft {
  slug: CraftSlug;
  /** English name shown on the craft card title. */
  name: string;
  /** Koshur/Urdu name in Nastaliq script. */
  nameUrdu: string;
  /** Seasonal palette this craft inherits. */
  palette: Palette;
  /** One-line tagline shown on the home craft card. */
  description: string;
  /** Longer description shown on the craft hero. */
  longDescription: string;
  /** Glyph key consumed by <CraftIcon kind=… />. */
  iconKey: "naqashi" | "loom" | "needle" | "leaf" | "knot" | "lattice";
  /** "4 Verified Masters" copy on the home card. */
  mastersCount: number;
}

export type Rarity = "rare" | "endangered" | "common";

export interface TechniqueDef {
  id: string;
  name: string;
  rarity: Rarity;
  /** 3 sentences shown when the accordion item is expanded. */
  description: string;
  /** Sub-node labels for the Craft DNA graph. */
  tool: string;
  material: string;
  tuning: string;
}

export interface ProductDef {
  name: string;
  /** Technique that produced this product. Matches a TechniqueDef.name. */
  technique: string;
  /** INR. */
  price: number;
}

export interface Generation {
  name: string;
  era: string;
  /** True for the current master and any living predecessors. */
  alive: boolean;
}

export interface Artisan {
  slug: string;
  name: string;
  /** Convenience: first name only — used in section titles like
   *  "What Only Bashir Knows". */
  firstName: string;
  craft: CraftSlug;
  generation: number;
  village: string;
  district: string;
  /** 2-line bio shown on the listing card and below the banner portrait. */
  bio: string;
  /** The one irreplaceable fact only this master holds. */
  irreplaceable: string;
  piecesSigned: number;
  disputes: number;
  /** Open workshop slots in the next month. */
  workshopSlots: number;
  /** Era when the lineage was first recorded. */
  lineageEstYear: string;
  /** One entry per generation, oldest first. */
  lineage: Generation[];
  /** Vault preview content — 4 sections, 2-3 bullets each, in voice. */
  vault: {
    lineage: string[];
    technique: string[];
    decision: string[];
    supplier: string[];
  };
}

export type WorkshopType = "heritage-walk" | "half-day" | "multi-day";

export interface WorkshopOffering {
  type: WorkshopType;
  title: string;
  duration: string;
  pricePerPerson: number;
  capacity: number;
  description: string;
  /** Seasons this offering is available in. */
  seasons: ("Bahar" | "Grism" | "Harud" | "Shishur")[];
}

export interface SanadPiece {
  pieceId: string;
  pieceName: string;
  craft: CraftSlug;
  artisanSlug: string;
  /** Technique id from TECHNIQUES_BY_CRAFT[craft]. */
  techniqueId: string;
  signedDate: string;
  completedDate: string;
  /** Where the raw material came from + when. */
  materialOrigin: { material: string; origin: string; date: string };
  /** Fair price band in INR for pieces of this type. */
  fairPrice: { from: number; to: number };
  /** Pseudo Ed25519 signature (256 hex chars). */
  ed25519: string;
}

/* ─────────────────────────── Crafts ───────────────────────────── */

export const CRAFTS: Record<CraftSlug, Craft> = {
  "papier-mache": {
    slug: "papier-mache",
    name: "Papier-mâché / Naqashi",
    nameUrdu: "نقاشی",
    palette: "summer",
    description:
      "Layered papier-mâché painted in mineral pigment and fine-line gold leaf.",
    longDescription:
      "A 14th-century Persian craft, perfected in Srinagar — pulped paper bound, sun-cured, then painted in slow layers of mineral pigment and gold leaf by the family of one master at a time.",
    iconKey: "naqashi",
    mastersCount: 4,
  },
  pashmina: {
    slug: "pashmina",
    name: "Pashmina Weaving",
    nameUrdu: "پشمینہ",
    palette: "winter",
    description:
      "Hand-spun fleece from the Changthang plateau, woven by hand-feel through the winter.",
    longDescription:
      "Pashmina is woven from the down of the Changthang goat. The yarn is hand-spun, the loom is set by feel, the warp is checked daily through the cold months. Four inches a day, the slowest grade in the world.",
    iconKey: "loom",
    mastersCount: 4,
  },
  sozni: {
    slug: "sozni",
    name: "Sozni Embroidery",
    nameUrdu: "سوزنی",
    palette: "spring",
    description:
      "Needlework so fine the stitches must be counted under a magnifier.",
    longDescription:
      "Sozni needlework is set into the surface of a pashmina shawl. The finest masters work both faces of the shawl identically, an act that takes years per piece. The needle is the same one the master started with.",
    iconKey: "needle",
    mastersCount: 4,
  },
  "walnut-carving": {
    slug: "walnut-carving",
    name: "Walnut Wood Carving",
    nameUrdu: "اخروٹ نقاشی",
    palette: "autumn",
    description:
      "Century-old walnut, carved with chisels forged by the master's great-grandfather.",
    longDescription:
      "Kashmiri walnut is harvested from trees a century or older. The grain holds an undercut depth no other wood will. The chisels are inherited; the patterns are memorised; the workshop smells of resin and woodsmoke.",
    iconKey: "leaf",
    mastersCount: 4,
  },
  carpet: {
    slug: "carpet",
    name: "Hand-knotted Carpet",
    nameUrdu: "قالین",
    palette: "autumn",
    description:
      "Persian-Kashmiri carpets, knotted at 400+ knots per square inch.",
    longDescription:
      "A single 6×4 carpet is the work of eighteen months. The talim — the colour-coded weaving instruction — is read aloud across the loom from a sheet that has never been written down twice the same way.",
    iconKey: "knot",
    mastersCount: 4,
  },
  khatamband: {
    slug: "khatamband",
    name: "Khatamband Woodwork",
    nameUrdu: "خاتم بندی",
    palette: "summer",
    description:
      "Geometric ceiling panels — interlocked walnut, no nails, no glue.",
    longDescription:
      "Khatamband is the geometry of an interlocked ceiling. Hundreds of small wooden pieces fit together by precision alone. A master plans the angles by hand, never CAD; the panel breathes with the seasons and never lifts.",
    iconKey: "lattice",
    mastersCount: 4,
  },
};

export const CRAFT_SLUGS: CraftSlug[] = [
  "papier-mache",
  "pashmina",
  "sozni",
  "walnut-carving",
  "carpet",
  "khatamband",
];

/* ─────────────────────── Techniques per craft ─────────────────── */

export const TECHNIQUES_BY_CRAFT: Record<CraftSlug, TechniqueDef[]> = {
  "papier-mache": [
    {
      id: "naq-gold-leaf",
      name: "Layered Gold-Leaf Naqashi",
      rarity: "rare",
      description:
        "Fourteen layers of mineral pigment, sealed under a gold-leaf hairline. Each layer dries for a full night before the next is applied. The patience is the technique.",
      tool: "Squirrel-hair brush, 0.4 mm",
      material: "Mineral pigment + 22-carat gold leaf",
      tuning: "Painted in monsoon humidity 55–60%",
    },
    {
      id: "naq-cobalt",
      name: "Cobalt-Blue Pigment Recipe",
      rarity: "endangered",
      description:
        "A pigment recipe brought from Persia in the 1840s, lost everywhere except in two Srinagar workshops. Mixed with walnut oil and a pinch of saffron stamen for warmth.",
      tool: "Brass mortar, walnut pestle",
      material: "Discontinued cobalt-blue powder",
      tuning: "Ground at sunrise for the truest tone",
    },
    {
      id: "naq-pulping",
      name: "Hand-Pulped Paper Body",
      rarity: "common",
      description:
        "Used newsprint and rice straw, pulped by hand for three days. The body is set in mango-wood moulds and sun-cured for a full week before the first paint touches it.",
      tool: "Mango-wood moulds",
      material: "Recycled newsprint + rice straw",
      tuning: "Sun-cured 7 days, no wind",
    },
    {
      id: "naq-lacquer",
      name: "14-Layer Hand Lacquer",
      rarity: "rare",
      description:
        "After painting, the piece is sealed with fourteen passes of clear lacquer, hand-rubbed between each. The final surface holds a depth no machine finish will match.",
      tool: "Cotton swab, walnut-wood paddle",
      material: "Locally distilled clear lacquer",
      tuning: "Rubbed in winter — no dust, no fly",
    },
  ],
  pashmina: [
    {
      id: "psh-knot-1940",
      name: "1940s Srinagar Knot",
      rarity: "rare",
      description:
        "An asymmetric knot pattern set before Partition. The warp is taken once, the weft twice. The book never wrote it; it is held in three living hands.",
      tool: "Iron tikka comb, ca. 1962",
      material: "Aged cotton warp, 18 months rest",
      tuning: "Loom tension by hand-feel daily",
    },
    {
      id: "psh-gurez",
      name: "Gurez Wool Selection",
      rarity: "endangered",
      description:
        "Selected by smell first, then by the way it pulls between the fingers. Mill-graded fleece will not take the dye the same way a single-flock spring shear will.",
      tool: "Bare hands, burlap sack",
      material: "Single-flock Gurez fleece",
      tuning: "Sorted within 14 days of shear",
    },
    {
      id: "psh-warp",
      name: "Hand-Feel Warp Tension",
      rarity: "endangered",
      description:
        "The warp tension is set by laying the palm on the wool. A young weaver only feels this after ten winters; the loom and the room teach it together.",
      tool: "Brass tensioning peg",
      material: "Hand-spun cotton warp",
      tuning: "Re-checked every dawn in winter",
    },
    {
      id: "psh-natural-dye",
      name: "Walnut & Saffron Natural Dye",
      rarity: "common",
      description:
        "A dye recipe of walnut husk, indigo, and saffron stamen. Boiled in a brass cauldron for four hours, never more, never less. Cooled overnight in the same vessel.",
      tool: "Brass cauldron, 40 litre",
      material: "Walnut husk + saffron stamen",
      tuning: "Boil 4 hours, stir every 12 min",
    },
  ],
  sozni: [
    {
      id: "soz-fine-stitch",
      name: "Magnifier-Grade Sozni",
      rarity: "rare",
      description:
        "Stitches so fine the count must be checked under a magnifier. The needle is the same one the master began with forty years ago, sharpened by use alone.",
      tool: "Single 40-year-old needle",
      material: "Silk thread, hand-twisted",
      tuning: "Worked under daylight only",
    },
    {
      id: "soz-double-side",
      name: "Double-Sided Sozni",
      rarity: "endangered",
      description:
        "Both faces of the shawl are identical. The pull through must be perfect; one stray loop on the back face spoils the piece. Only three masters in Kashmir still hold this.",
      tool: "Reverse-pull needle",
      material: "Pure pashmina ground cloth",
      tuning: "Worked seated, both hands free",
    },
    {
      id: "soz-hashia",
      name: "Hashia Border Composition",
      rarity: "common",
      description:
        "The border is the spine of the piece. The motif repeats by hand-count, never by stencil. Mistakes are unpicked back to the slip and re-set, never patched.",
      tool: "Hand-count spacer",
      material: "Silk + pashmina blend",
      tuning: "Composed before any field stitch",
    },
    {
      id: "soz-modern",
      name: "Contemporary Composition",
      rarity: "common",
      description:
        "Traditional motifs arranged in modern asymmetric grids. Honoured by the elders, requested by the buyers — a quiet bridge between the old and the new.",
      tool: "Pencil composition sheet",
      material: "Field of any sozni-grade ground",
      tuning: "Drafted in spring, stitched all year",
    },
  ],
  "walnut-carving": [
    {
      id: "wal-century",
      name: "Century-Walnut Selection",
      rarity: "rare",
      description:
        "Only walnut harvested from trees a hundred years or older. The grain holds undercut depth that younger wood splits at.",
      tool: "Inherited mortising chisel",
      material: "Aged walnut heartwood",
      tuning: "Cut in late autumn only",
    },
    {
      id: "wal-undercut",
      name: "Undercut Carving",
      rarity: "endangered",
      description:
        "The carved layer is freed from the base wood — a leaf appears to float a quarter-inch above its branch. A single slip cracks the lift; the piece is started again.",
      tool: "Curved fish-tail gouge",
      material: "Single slab walnut, no joints",
      tuning: "Carved in cool morning hours",
    },
    {
      id: "wal-architectural",
      name: "Architectural Panel",
      rarity: "common",
      description:
        "Panels for ceilings, doors, and balconies — sized to the room before the first chisel. Three of his panels stand in heritage havelis in Srinagar's old city.",
      tool: "Long-handled flat chisel",
      material: "Quarter-sawn walnut planks",
      tuning: "Aligned to the room's wood grain",
    },
    {
      id: "wal-finish",
      name: "Walnut Oil Finish",
      rarity: "common",
      description:
        "No varnish, only walnut oil, hand-rubbed in over a week. The wood lifts from honey to umber by the third coat; the smell is the workshop.",
      tool: "Cotton paddle",
      material: "Cold-pressed walnut oil",
      tuning: "Rubbed 7 days, dry between coats",
    },
  ],
  carpet: [
    {
      id: "crp-persian",
      name: "Persian-Kashmiri Knot",
      rarity: "rare",
      description:
        "A blend of the Tabrizi pattern and the Srinagar knot density. Four hundred knots per square inch; one carpet is eighteen months at the loom for two weavers.",
      tool: "Two-shed beater, walnut handle",
      material: "Hand-spun wool, single-flock",
      tuning: "Knot density tuned to season",
    },
    {
      id: "crp-talim",
      name: "Hand-Read Talim",
      rarity: "endangered",
      description:
        "The colour-coded weaving instruction is read aloud across the loom from a sheet held by the senior weaver. Never written twice the same way; passed by voice.",
      tool: "Talim sheet, ink on paper",
      material: "Coloured wool bobbins",
      tuning: "Read fresh every morning",
    },
    {
      id: "crp-shah-abbas",
      name: "Shah Abbas Pattern",
      rarity: "rare",
      description:
        "A floral medallion last woven in Kashmir in the 1960s. Reconstructed from a single archived sheet found in the master's grandfather's trunk.",
      tool: "Archived pattern sheet",
      material: "Naturally dyed wool",
      tuning: "Set on a 9×6 loom only",
    },
    {
      id: "crp-finishing",
      name: "Hand-Sheared Pile",
      rarity: "common",
      description:
        "After cutting, the pile is sheared by hand to the master's chosen depth. Trimmed in cool morning hours, while the wool is still cool from the night.",
      tool: "Forged shearing scissor",
      material: "Finished carpet on tension frame",
      tuning: "Sheared at sunrise, never noon",
    },
  ],
  khatamband: [
    {
      id: "kha-eight-star",
      name: "8-Pointed Mughal Star",
      rarity: "rare",
      description:
        "A star pattern from the Mughal period, last set in a Srinagar mosque ceiling in 1890. Reconstructed from oral memory and a single black-and-white photograph.",
      tool: "Hand-marked angle gauge",
      material: "Walnut, deodar, mulberry",
      tuning: "Cut in low humidity for fit",
    },
    {
      id: "kha-precision",
      name: "0.5 mm Hand Precision",
      rarity: "endangered",
      description:
        "Every joint cut to half-millimetre tolerance — by hand, by eye, by feel. The master refuses CAD; he calculates every angle in his head before the first cut.",
      tool: "Inherited brass gauge",
      material: "Quarter-sawn timber blocks",
      tuning: "Worked at 18–22°C",
    },
    {
      id: "kha-seasonal",
      name: "Seasonal-Breath Joinery",
      rarity: "common",
      description:
        "No glue, no nails. The panels expand and contract with the Srinagar seasons by the half-millimetre. A century later, they will not lift.",
      tool: "Hand-press fitting block",
      material: "Walnut for the structure",
      tuning: "Set without adhesive",
    },
    {
      id: "kha-installation",
      name: "Site-Aligned Installation",
      rarity: "common",
      description:
        "Panels are aligned to the room's true vertical, not the wall's. A great khatamband ceiling reads as one motif, even when the room is not square.",
      tool: "Plumb line, brass weight",
      material: "Finished ceiling panels",
      tuning: "Installed with two assistants",
    },
  ],
};

/* ─────────────────────── Products per craft ───────────────────── */

export const PRODUCTS_BY_CRAFT: Record<CraftSlug, ProductDef[]> = {
  "papier-mache": [
    { name: "Naqashi Box (Gold Leaf)", technique: "Layered Gold-Leaf Naqashi", price: 4500 },
    { name: "Decorative Vase", technique: "Cobalt-Blue Pigment Recipe", price: 8200 },
    { name: "Jewellery Box", technique: "14-Layer Hand Lacquer", price: 6800 },
    { name: "Pen Stand", technique: "Hand-Pulped Paper Body", price: 2400 },
  ],
  pashmina: [
    { name: "Pure Pashmina Shawl", technique: "Hand-Feel Warp Tension", price: 18000 },
    { name: "Kani Shawl", technique: "1940s Srinagar Knot", price: 45000 },
    { name: "Pashmina Stole", technique: "Walnut & Saffron Natural Dye", price: 12000 },
    { name: "Ring Shawl", technique: "Gurez Wool Selection", price: 85000 },
  ],
  sozni: [
    { name: "Sozni Embroidered Shawl", technique: "Magnifier-Grade Sozni", price: 22000 },
    { name: "Sozni Kurta Fabric", technique: "Hashia Border Composition", price: 15000 },
    { name: "Double-Sided Shawl", technique: "Double-Sided Sozni", price: 55000 },
    { name: "Sozni Runner", technique: "Contemporary Composition", price: 8500 },
  ],
  "walnut-carving": [
    { name: "Carved Wall Panel", technique: "Architectural Panel", price: 35000 },
    { name: "Walnut Jewellery Box", technique: "Undercut Carving", price: 12000 },
    { name: "Coffee Table", technique: "Century-Walnut Selection", price: 120000 },
    { name: "Decorative Bowl", technique: "Walnut Oil Finish", price: 8000 },
  ],
  carpet: [
    { name: "6×4 Hand-knotted Carpet", technique: "Persian-Kashmiri Knot", price: 95000 },
    { name: "9×6 Persian Carpet", technique: "Shah Abbas Pattern", price: 250000 },
    { name: "Prayer Mat", technique: "Hand-Sheared Pile", price: 18000 },
    { name: "Wall Hanging", technique: "Hand-Read Talim", price: 42000 },
  ],
  khatamband: [
    { name: "Ceiling Panel (4×4)", technique: "8-Pointed Mughal Star", price: 75000 },
    { name: "Wall Frame", technique: "0.5 mm Hand Precision", price: 28000 },
    { name: "Decorative Box", technique: "Seasonal-Breath Joinery", price: 9500 },
    { name: "Table Top", technique: "Site-Aligned Installation", price: 22000 },
  ],
};

/* ─────────────────────── Workshop offerings ───────────────────── */

export const WORKSHOPS: WorkshopOffering[] = [
  {
    type: "heritage-walk",
    title: "Heritage Walk",
    duration: "2–3 hours",
    pricePerPerson: 2500,
    capacity: 8,
    description:
      "Visit the master's workshop and three nearby craft clusters with a Sanad-verified guide.",
    seasons: ["Bahar", "Grism", "Harud"],
  },
  {
    type: "half-day",
    title: "Half-Day Workshop",
    duration: "4 hours",
    pricePerPerson: 6000,
    capacity: 6,
    description:
      "Learn one foundational technique hands-on. Take home your attempt + a Hunarmand certificate.",
    seasons: ["Bahar", "Grism", "Harud", "Shishur"],
  },
  {
    type: "multi-day",
    title: "Multi-Day Masterclass",
    duration: "3 days",
    pricePerPerson: 45000,
    capacity: 2,
    description:
      "Advanced technique taught directly by the master. Limited to 2 participants.",
    seasons: ["Harud", "Shishur"],
  },
];

/* ─────────────────────────── Helpers ──────────────────────────── */

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const firstName = (full: string): string => full.split(/\s+/)[0];

/** Build a five-generation lineage for an artisan. The current
 *  master is alive; one generation earlier is also alive (helping at
 *  the loom); everyone older has passed. The names are constructed
 *  from the family's last name so they read as a real lineage. */
function makeLineage(
  fullName: string,
  generation: number,
  lineageEstYear: string,
): Generation[] {
  const parts = fullName.split(/\s+/);
  const surname = parts[parts.length - 1];
  /* A handful of plausible first names per region — picked
   * deterministically from generation index so the same artisan
   * always gets the same lineage. */
  const namesPool = [
    "Hyderullah",
    "Ghulam Mohammad",
    "Ali Mohammad",
    "Abdul Rahim",
    "Mohammad Ramzan",
    "Sultan Ali",
    "Mohammad Sultan",
    "Bashir Ahmad",
    "Mohammad Ibrahim",
    "Abdul Ghaffar",
  ];
  const out: Generation[] = [];
  for (let g = 1; g <= generation; g++) {
    const isCurrent = g === generation;
    out.push({
      name: isCurrent ? fullName : `${namesPool[(g * 3) % namesPool.length]} ${surname}`,
      era: eraFor(g, generation, lineageEstYear),
      alive: isCurrent || g === generation - 1,
    });
  }
  return out;
}

function eraFor(g: number, max: number, lineageEstYear: string): string {
  /* Anchor first generation to lineageEstYear, then step forward by
   * roughly 30 years per generation. Returns "ca. 1880s" / "1981 –
   * present" style strings. */
  const anchor = parseInt(lineageEstYear.replace(/[^0-9]/g, "")) || 1880;
  if (g === max) return "current — present";
  const decade = anchor + (g - 1) * 30;
  const tens = Math.floor(decade / 10) * 10;
  return `ca. ${tens}s`;
}

/* ─────────────────────────── Artisans ─────────────────────────── */

interface ArtisanSeed {
  name: string;
  craft: CraftSlug;
  generation: number;
  village: string;
  district: string;
  bio: string;
  irreplaceable: string;
  piecesSigned: number;
  workshopSlots: number;
  /** Lineage-est-year override (else ~1880s). */
  lineageEstYear?: string;
  /** Vault preview content. */
  vault: Artisan["vault"];
}

const SEEDS: ArtisanSeed[] = [
  /* ─ Papier-mâché / Naqashi ─ */
  {
    name: "Abdul Rashid Bhat",
    craft: "papier-mache",
    generation: 3,
    village: "Rainawari",
    district: "Srinagar",
    bio: "Master of layered gold-leaf naqashi. Uses mineral pigments his grandfather ground by hand.",
    irreplaceable:
      "Grinds three pigments his grandfather formulated; the recipes are not written down anywhere outside this workshop.",
    piecesSigned: 184,
    workshopSlots: 6,
    lineageEstYear: "1900",
    vault: {
      lineage: [
        "Three generations have worked the same Rainawari studio.",
        "Pigments are ground every Tuesday at sunrise.",
      ],
      technique: [
        "Each layer is rubbed until it shines like wet stone.",
        "The gold-leaf is always set on the seventh layer, not before.",
      ],
      decision: [
        "If the monsoon humidity drops below 50%, painting is paused for the day.",
        "A piece is never finished within four weeks of the next.",
      ],
      supplier: [
        "Pigment from a single Pulwama miner since 1962.",
        "Gold leaf from one Lucknow beater, posted twice a year.",
      ],
    },
  },
  {
    name: "Farooq Ahmad Mir",
    craft: "papier-mache",
    generation: 2,
    village: "Fateh Kadal",
    district: "Srinagar",
    bio: "Specialises in Persian floral motifs. Only artisan in Kashmir using a discontinued cobalt-blue pigment.",
    irreplaceable:
      "Holds the last pot of an 1840s cobalt-blue pigment — a recipe lost everywhere else.",
    piecesSigned: 96,
    workshopSlots: 4,
    lineageEstYear: "1950",
    vault: {
      lineage: [
        "Father painted Mughal-court reproductions; son carries the same brushwork.",
        "The Fateh Kadal studio is on the second floor of a 200-year-old wooden house.",
      ],
      technique: [
        "Cobalt is mixed with one drop of walnut oil for warmth.",
        "A floral motif is always drawn freehand, never traced.",
      ],
      decision: [
        "If the cobalt batch shifts more than half a tone, it is set aside for trial pieces.",
        "Smaller boxes are sold; larger panels are loaned to museums.",
      ],
      supplier: [
        "Two kilograms of cobalt remain — enough for fifteen years of work.",
        "Lacquer is distilled in a friend's distillery in Pampore.",
      ],
    },
  },
  {
    name: "Noor Mohammad Wani",
    craft: "papier-mache",
    generation: 4,
    village: "Nowhatta",
    district: "Srinagar",
    bio: "Trained under three masters. His papier-mâché boxes carry 14 layers of lacquer by hand.",
    irreplaceable:
      "The only master to apply fourteen lacquer passes by hand — each rubbed dry before the next.",
    piecesSigned: 244,
    workshopSlots: 5,
    lineageEstYear: "1880",
    vault: {
      lineage: [
        "Trained under Hyderullah Wani (his great-uncle) and two Mughal-era family friends.",
        "His son, twelve, sits at the side bench grinding pigment after school.",
      ],
      technique: [
        "Lacquer is rubbed with cotton-on-walnut for twenty minutes per layer.",
        "Boxes are kept in a glass cabinet between coats — no dust, no fly.",
      ],
      decision: [
        "A piece with even one bubble is opened, scraped, and started again from layer one.",
        "Customers wait nine months for a Wani box — there is no rush list.",
      ],
      supplier: [
        "Rice-straw pulp from a Pampore farmer.",
        "Newsprint sourced from Lal Chowk, two cycles old.",
      ],
    },
  },

  /* ─ Pashmina ─ */
  {
    name: "Mohammad Yusuf Sheikh",
    craft: "pashmina",
    generation: 4,
    village: "Kanihama",
    district: "Budgam",
    bio: "Holds a discontinued 1940s Srinagar knot pattern. Sources wool exclusively from Gurez Valley.",
    irreplaceable:
      "Last carrier of the 1940s Srinagar knot — an asymmetric pattern not held by any other living master.",
    piecesSigned: 312,
    workshopSlots: 12,
    lineageEstYear: "1880",
    vault: {
      lineage: [
        "Five generations of weavers from one wing of the Sheikh family.",
        "His son will inherit the loom this winter, if the knot can be passed.",
      ],
      technique: [
        "Warp is taken once, weft is taken twice — the asymmetric move is the signature.",
        "Knot density is tuned to the day's humidity by hand-feel.",
      ],
      decision: [
        "If summer humidity rises above 60%, the loom is paused.",
        "A knot is never re-done; if missed, the row is unpicked back to the slip.",
      ],
      supplier: [
        "Wool from the same Gurez shepherd family for thirty-eight years.",
        "Cotton warp from Habba Kadal, rested at least eighteen months.",
      ],
    },
  },
  {
    name: "Ghulam Hassan Lone",
    craft: "pashmina",
    generation: 5,
    village: "Kanihama",
    district: "Budgam",
    bio: "His family's loom has not stopped for 80 years. Weaves 4 inches per day — the slowest, finest grade.",
    irreplaceable:
      "Weaves at four inches per day — the finest commercially available pashmina grade in Kashmir.",
    piecesSigned: 408,
    workshopSlots: 8,
    lineageEstYear: "1860",
    vault: {
      lineage: [
        "Five generations on the same loom, set in the family's main room.",
        "Lone-family talim sheets fill three trunks, kept in a cold-room.",
      ],
      technique: [
        "Four inches a day; never more, never less.",
        "Each shawl is signed by hand on the inside fold with a single Lone monogram.",
      ],
      decision: [
        "If a day's weave shows uneven tension, the inches are unpicked at evening.",
        "The loom is rested on Fridays — the family's choice.",
      ],
      supplier: [
        "Wool from Changthang, posted in autumn from Leh.",
        "Indigo and madder from a Pampore dyer he has worked with for forty years.",
      ],
    },
  },
  {
    name: "Abdul Ahad Bhat",
    craft: "pashmina",
    generation: 3,
    village: "Pampore",
    district: "Pulwama",
    bio: "Specialises in natural dye Pashmina. Uses walnut husk, indigo, and saffron stamen for colour.",
    irreplaceable:
      "Mixes walnut husk, indigo, and saffron-stamen dye in a brass cauldron passed from his grandfather.",
    piecesSigned: 168,
    workshopSlots: 6,
    lineageEstYear: "1925",
    vault: {
      lineage: [
        "Pampore family of dyers; pashmina was taken up by his father.",
        "The cauldron has not left this house since 1925.",
      ],
      technique: [
        "Boil exactly four hours; cool in the same vessel overnight.",
        "Saffron stamen is added at the third hour for warmth.",
      ],
      decision: [
        "Aluminium is never used — only brass.",
        "Walnut husk batches are tasted (smelled) before sorting.",
      ],
      supplier: [
        "Walnut husk from an Anantnag farmer.",
        "Saffron stamen from his cousin's Pampore field.",
      ],
    },
  },

  /* ─ Sozni ─ */
  {
    name: "Bashir Ahmad Dar",
    craft: "sozni",
    generation: 4,
    village: "Downtown",
    district: "Srinagar",
    bio: "Sozni needle work so fine it requires a magnifying glass to count stitches. 40 years with the same needle.",
    irreplaceable:
      "Has stitched on the same single needle for forty years — sharpened only by use.",
    piecesSigned: 76,
    workshopSlots: 4,
    lineageEstYear: "1900",
    vault: {
      lineage: [
        "Father and uncle were sozni masters; the needle was passed in 1985.",
        "Workshop sits one floor above the river; the light is the source.",
      ],
      technique: [
        "Stitches are checked under a 10x magnifier every evening.",
        "The needle is wiped on the tongue between motifs to clean fibre.",
      ],
      decision: [
        "If the day's light is grey, the stitch density is reduced.",
        "A piece is never started in the second half of the day.",
      ],
      supplier: [
        "Silk thread from a Banaras spool maker.",
        "Pashmina ground cloth from his nephew, woven in Kanihama.",
      ],
    },
  },
  {
    name: "Mohammad Shafi Wani",
    craft: "sozni",
    generation: 3,
    village: "Habba Kadal",
    district: "Srinagar",
    bio: "Creates double-sided sozni where both faces of the shawl are identical — a near-extinct technique.",
    irreplaceable:
      "Holds the double-sided sozni technique — both faces identical, no stray loop.",
    piecesSigned: 38,
    workshopSlots: 3,
    lineageEstYear: "1930",
    vault: {
      lineage: [
        "Wani family began sozni in the 1930s; the double-sided technique was added in 1970.",
        "Three apprentices since 1995; one is now in Bombay running her own studio.",
      ],
      technique: [
        "Both faces are stitched by drawing the needle through and back along the same line.",
        "Each stitch is locked at three points — front, back, and at the slip.",
      ],
      decision: [
        "A double-sided shawl takes two years; orders are limited to four at a time.",
        "Mistakes are never patched — the shawl is reduced to silk and re-stitched.",
      ],
      supplier: [
        "Silk + pashmina blend from a single Kanihama loom.",
        "Indigo dye, no synthetic colour ever used.",
      ],
    },
  },
  {
    name: "Fayaz Ahmad Bhat",
    craft: "sozni",
    generation: 2,
    village: "Anantnag",
    district: "Anantnag",
    bio: "Youngest master in sozni. Combines traditional hashia border motifs with contemporary composition.",
    irreplaceable:
      "Composes traditional hashia motifs into modern asymmetric grids — a quiet bridge between centuries.",
    piecesSigned: 52,
    workshopSlots: 7,
    lineageEstYear: "1965",
    vault: {
      lineage: [
        "Father set up the Anantnag studio in 1965; Fayaz took over in 2018.",
        "Trained under Bashir Ahmad Dar in Downtown for three winters.",
      ],
      technique: [
        "Compositions are drafted on graph paper before any stitch.",
        "Hashia is set first, then the field — never the other way.",
      ],
      decision: [
        "Asymmetric layouts are tested on a small sample before the main piece.",
        "Modern motifs are always paired with at least one traditional border.",
      ],
      supplier: [
        "Pashmina ground from his cousin's Kanihama loom.",
        "Silk from a Banaras dealer his father met in 1980.",
      ],
    },
  },

  /* ─ Walnut carving ─ */
  {
    name: "Ghulam Mohammad Najar",
    craft: "walnut-carving",
    generation: 5,
    village: "Habbakadal",
    district: "Srinagar",
    bio: "Uses only century-old walnut wood. His chisels were forged by his great-grandfather.",
    irreplaceable:
      "Works only century-walnut — and with chisels his great-grandfather forged in 1908.",
    piecesSigned: 202,
    workshopSlots: 5,
    lineageEstYear: "1840",
    vault: {
      lineage: [
        "Five generations of carvers; the workshop is on the ground floor of the family house.",
        "His great-grandfather's chisels hang on the wall above the bench, oiled monthly.",
      ],
      technique: [
        "Wood is selected by smell and weight, never by appearance alone.",
        "Cuts are made in the cool morning, polishing in the warm afternoon.",
      ],
      decision: [
        "If a chisel slips, the panel is set aside for two weeks before re-cut.",
        "A panel is never finished in winter — the wood must move first.",
      ],
      supplier: [
        "Walnut from a Sopore orchard, harvested in late October.",
        "Walnut oil pressed by his uncle in Baramulla.",
      ],
    },
  },
  {
    name: "Abdul Gani Wani",
    craft: "walnut-carving",
    generation: 4,
    village: "Sopore",
    district: "Baramulla",
    bio: "Specialises in undercutting — a technique where the carved layer floats free of the base wood.",
    irreplaceable:
      "Holds the undercut technique — the carved leaf floats a quarter-inch above its branch.",
    piecesSigned: 124,
    workshopSlots: 4,
    lineageEstYear: "1900",
    vault: {
      lineage: [
        "Sopore-based carvers since 1900; the orchard supplies the wood directly.",
        "Two sons learn the chisel; one prefers the architectural panel work.",
      ],
      technique: [
        "Undercut depth is set before the first surface cut.",
        "Each curl is freed only after the surrounding leaf is fully shaped.",
      ],
      decision: [
        "If the wood shows a grain split, undercut work is abandoned for that piece.",
        "Pieces are signed only after the lift is tested by lightly pressing the freed layer.",
      ],
      supplier: [
        "Walnut from his own orchard.",
        "Tools forged by a Sopore blacksmith — the same family for ninety years.",
      ],
    },
  },
  {
    name: "Mohammad Yaqoob Mir",
    craft: "walnut-carving",
    generation: 3,
    village: "Kreeri",
    district: "Baramulla",
    bio: "Carves architectural panels. His work is in 3 heritage havelis in Srinagar's old city.",
    irreplaceable:
      "Three of his ceiling panels stand in heritage havelis in Srinagar's old city.",
    piecesSigned: 64,
    workshopSlots: 3,
    lineageEstYear: "1940",
    vault: {
      lineage: [
        "Started by his father in 1940; took over after father retired in 2002.",
        "His Kreeri workshop is on the road to Sopore.",
      ],
      technique: [
        "Panels are sized to the room before cutting, not after.",
        "The grain is aligned to the room's longest wall.",
      ],
      decision: [
        "A panel is never delivered without on-site adjustment.",
        "Walnut oil is applied at the install, not in the workshop.",
      ],
      supplier: [
        "Walnut planks from a Baramulla mill.",
        "Brass fittings from a Habba Kadal smith.",
      ],
    },
  },

  /* ─ Hand-knotted carpet ─ */
  {
    name: "Habibullah Najar",
    craft: "carpet",
    generation: 4,
    village: "Khanyar",
    district: "Srinagar",
    bio: "Persian-Kashmiri fusion carpet. 400 knots per square inch. One carpet takes 18 months.",
    irreplaceable:
      "Knots a Persian-Kashmiri fusion at 400 KPSI — the only living master with both pattern books.",
    piecesSigned: 86,
    workshopSlots: 4,
    lineageEstYear: "1880",
    vault: {
      lineage: [
        "Najar family, Khanyar — four generations on a single street.",
        "Talim books from his great-grandfather are kept in a cedar trunk.",
      ],
      technique: [
        "Knot density is set by the warp tension — re-checked every dawn.",
        "Pile depth is sheared to the master's chosen height after cutting.",
      ],
      decision: [
        "An 18-month carpet is never rushed — the loom rests on Fridays.",
        "Wool batches are tested for dye depth before the loom is set.",
      ],
      supplier: [
        "Wool from a single Gurez shepherd family.",
        "Madder from Pulwama, walnut husk from Rajouri.",
      ],
    },
  },
  {
    name: "Mohammad Ramzan Bhat",
    craft: "carpet",
    generation: 3,
    village: "Bhaderwah",
    district: "Doda",
    bio: "Uses a colour-coding system (talim) invented by his grandfather — never written down until now.",
    irreplaceable:
      "Uses his grandfather's invented talim notation — captured in our Vault for the first time.",
    piecesSigned: 52,
    workshopSlots: 3,
    lineageEstYear: "1920",
    vault: {
      lineage: [
        "Bhaderwah family carpet weavers — three generations.",
        "His grandfather's talim notation book is the only copy that exists.",
      ],
      technique: [
        "Talim is read aloud across the loom by the senior weaver.",
        "Colour calls are tracked on a wall slate, never paper.",
      ],
      decision: [
        "A new pattern is tested on a small sampler before the main loom is set.",
        "If the talim notation cannot be sung, the pattern is abandoned.",
      ],
      supplier: [
        "Wool from Bhaderwah shepherds.",
        "Dyes mixed in his cousin's small dye-house in Kishtwar.",
      ],
    },
  },
  {
    name: "Showkat Ahmad Dar",
    craft: "carpet",
    generation: 2,
    village: "Anantnag",
    district: "Anantnag",
    bio: "Youngest carpet master. Reviving the Shah Abbas pattern last woven in Kashmir in the 1960s.",
    irreplaceable:
      "Reviving the Shah Abbas pattern last woven in Kashmir in 1962 — reconstructed from a single archival sheet.",
    piecesSigned: 14,
    workshopSlots: 8,
    lineageEstYear: "1970",
    vault: {
      lineage: [
        "Father started the studio in 1970, weaving Tabrizi imports.",
        "Showkat trained at the Indian Institute of Carpet Technology, then returned home.",
      ],
      technique: [
        "Shah Abbas medallion is set on a 9×6 loom only.",
        "Pattern is reconstructed from a single 1962 archival sheet.",
      ],
      decision: [
        "Each Shah Abbas piece is photographed and recorded for the Vault.",
        "Only natural dyes are used — synthetic colour was tested and rejected.",
      ],
      supplier: [
        "Wool from Anantnag highland shepherds.",
        "Indigo from a Pampore dyer.",
      ],
    },
  },

  /* ─ Khatamband ─ */
  {
    name: "Abdul Khaliq Bhat",
    craft: "khatamband",
    generation: 4,
    village: "Zaina Kadal",
    district: "Srinagar",
    bio: "Geometric ceiling panels with 0.5mm precision. No nails, no glue — only interlocked wood.",
    irreplaceable:
      "Interlocks ceiling panels with half-millimetre precision — no nails, no glue, no CAD.",
    piecesSigned: 134,
    workshopSlots: 5,
    lineageEstYear: "1880",
    vault: {
      lineage: [
        "Bhat family of khatamband makers; great-grandfather worked on Hazratbal in 1908.",
        "Workshop is in Zaina Kadal, three rooms deep.",
      ],
      technique: [
        "Each angle is calculated mentally before the first cut.",
        "Joints are tested by fit alone — no glue, no nail.",
      ],
      decision: [
        "If a piece does not fit on first try, the bench cuts a fresh block.",
        "Panels rest 48 hours before delivery — to test the season's wood movement.",
      ],
      supplier: [
        "Walnut from Sopore.",
        "Deodar from a Doda mill.",
      ],
    },
  },
  {
    name: "Farooq Ahmad Najar",
    craft: "khatamband",
    generation: 3,
    village: "Sopore",
    district: "Baramulla",
    bio: "Calculates every angle by hand — refuses to use CAD. His panels expand and contract with seasons perfectly.",
    irreplaceable:
      "Calculates every angle by hand — his panels are still flat 25 years after install.",
    piecesSigned: 68,
    workshopSlots: 4,
    lineageEstYear: "1910",
    vault: {
      lineage: [
        "Najar family — three generations of khatamband.",
        "Father refused CAD; Farooq carries the same.",
      ],
      technique: [
        "Brass angle gauge is the only measuring tool.",
        "Every joint is fitted dry, then disassembled, then reassembled at install.",
      ],
      decision: [
        "Computer-aided drawings are not used — even for client previews.",
        "A panel is never installed without two assistants present.",
      ],
      supplier: [
        "Walnut from Sopore (his own family land).",
        "Mulberry from a Pulwama orchard.",
      ],
    },
  },
  {
    name: "Bashir Ahmad Wani",
    craft: "khatamband",
    generation: 5,
    village: "Old City",
    district: "Srinagar",
    bio: "Last master of the 8-pointed star Khatamband pattern from the Mughal period.",
    irreplaceable:
      "Last living master of the 8-pointed Mughal Khatamband star — last set in 1890 before him.",
    piecesSigned: 92,
    workshopSlots: 3,
    lineageEstYear: "1860",
    vault: {
      lineage: [
        "Wani family — five generations on the same Old City lane.",
        "His grandfather set the original 8-pointed star in 1890; Bashir reconstructed it in 2014.",
      ],
      technique: [
        "8-pointed star is built outward from a central single block.",
        "The pattern is held in memory; no drawing exists.",
      ],
      decision: [
        "A new ceiling cannot be commissioned without site visit first.",
        "Pieces are never sold to museums abroad — only to Kashmiri spaces.",
      ],
      supplier: [
        "Walnut from a Habba Kadal yard.",
        "Deodar from a Kashtwar mill.",
      ],
    },
  },
];

export const ARTISANS_DATA: Artisan[] = SEEDS.map((s) => ({
  slug: slugify(s.name),
  name: s.name,
  firstName: firstName(s.name),
  craft: s.craft,
  generation: s.generation,
  village: s.village,
  district: s.district,
  bio: s.bio,
  irreplaceable: s.irreplaceable,
  piecesSigned: s.piecesSigned,
  disputes: 0,
  workshopSlots: s.workshopSlots,
  lineageEstYear: s.lineageEstYear ?? "1880",
  lineage: makeLineage(s.name, s.generation, s.lineageEstYear ?? "1880"),
  vault: s.vault,
}));

/* ─────────────────────── Sample Sanad pieces ─────────────────── */
/* Three signed pieces wired to specific artisans, for the
 * /sanad/piece-001..003 routes called out in the prompt. */

export const SANAD_PIECES: SanadPiece[] = [
  {
    pieceId: "piece-001",
    pieceName: "Pure Pashmina Shawl — Hand-Feel Warp",
    craft: "pashmina",
    artisanSlug: "mohammad-yusuf-sheikh",
    techniqueId: "psh-warp",
    signedDate: "2026-04-12",
    completedDate: "2026-04-08",
    materialOrigin: {
      material: "Single-flock Gurez wool",
      origin: "Gurez Valley, Bandipora",
      date: "Spring 2024 shear",
    },
    fairPrice: { from: 16000, to: 22000 },
    ed25519:
      "9F2B4A1E0C7D8B3E5A6F2D9C1E4B0A7D8F3C5E2B1A9D7F4E0C6B8D3A5F1E2C0B" +
      "7D9E4F3C1B8A5D0F2E6C9B1A4D7F0E3C8B5A9D2F6E1C4B0A8D7E3F5C2B9A1D6F",
  },
  {
    pieceId: "piece-002",
    pieceName: "Naqashi Box (Gold Leaf) — 14-Layer Lacquer",
    craft: "papier-mache",
    artisanSlug: "abdul-rashid-bhat",
    techniqueId: "naq-gold-leaf",
    signedDate: "2026-03-20",
    completedDate: "2026-03-14",
    materialOrigin: {
      material: "Mineral pigment + 22-carat gold leaf",
      origin: "Pulwama miner + Lucknow gold beater",
      date: "Spring 2025 batch",
    },
    fairPrice: { from: 4200, to: 4800 },
    ed25519:
      "B3D8F2A0E4C9B1D7F5A8E2C0B6D4F9A1E3C8B0D5F7A2E6C4B9D1F8A3E5C0B7D2" +
      "F4A6E8C1B5D9F0A7E2C4B8D6F1A3E5C7B0D2F4A9E6C8B1D3F5A0E7C2B4D6F8A1",
  },
  {
    pieceId: "piece-003",
    pieceName: "Double-Sided Sozni Shawl — Hashia Border",
    craft: "sozni",
    artisanSlug: "mohammad-shafi-wani",
    techniqueId: "soz-double-side",
    signedDate: "2026-02-28",
    completedDate: "2026-02-22",
    materialOrigin: {
      material: "Pashmina + silk blend",
      origin: "Kanihama loom (M. Y. Sheikh family)",
      date: "Winter 2024 weave",
    },
    fairPrice: { from: 50000, to: 60000 },
    ed25519:
      "C7E2A4F8B1D9C0E3F6A2B5D8E1C4F7A0B3D6E9C2F5A8B1D4E7C0F3A6B9D2E5C8" +
      "F1A4B7D0E3C6F9A2B5D8E1C4F7A0B3D6E9C2F5A8B1D4E7C0F3A6B9D2E5C8F1A4",
  },
];

/* ─────────────────────────── Lookups ──────────────────────────── */

export function getCraft(slug: string): Craft | undefined {
  return (CRAFTS as Record<string, Craft>)[slug];
}

export function listCrafts(): Craft[] {
  return CRAFT_SLUGS.map((s) => CRAFTS[s]);
}

export function getArtisansByCraft(slug: CraftSlug): Artisan[] {
  return ARTISANS_DATA.filter((a) => a.craft === slug);
}

export function getArtisan(slug: string): Artisan | undefined {
  return ARTISANS_DATA.find((a) => a.slug === slug);
}

export function listArtisanSlugs(): string[] {
  return ARTISANS_DATA.map((a) => a.slug);
}

export function getTechniques(craft: CraftSlug): TechniqueDef[] {
  return TECHNIQUES_BY_CRAFT[craft];
}

export function getTechniqueById(craft: CraftSlug, id: string): TechniqueDef | undefined {
  return TECHNIQUES_BY_CRAFT[craft]?.find((t) => t.id === id);
}

export function getProducts(craft: CraftSlug): ProductDef[] {
  return PRODUCTS_BY_CRAFT[craft];
}

export function getWorkshops(): WorkshopOffering[] {
  return WORKSHOPS;
}

export function getWorkshopByType(type: string): WorkshopOffering | undefined {
  return WORKSHOPS.find((w) => w.type === type);
}

export function getSanadPiece(id: string): SanadPiece | undefined {
  return SANAD_PIECES.find((p) => p.pieceId === id);
}

export function listSanadPieceIds(): string[] {
  return SANAD_PIECES.map((p) => p.pieceId);
}

/* ─────────────────── Palette → CSS variable map ───────────────── */

export interface PaletteVars {
  deep: string;
  mid: string;
  light: string;
  accent: string;
  gold: string;
}

const PALETTE_VARS: Record<Palette, PaletteVars> = {
  autumn: {
    deep: "var(--autumn-deep)",
    mid: "var(--autumn-mid)",
    light: "var(--autumn-light)",
    accent: "var(--autumn-accent)",
    gold: "var(--autumn-gold)",
  },
  winter: {
    deep: "var(--winter-deep)",
    mid: "var(--winter-mid)",
    light: "var(--winter-light)",
    accent: "var(--winter-accent)",
    gold: "var(--winter-gold)",
  },
  spring: {
    deep: "var(--spring-deep)",
    mid: "var(--spring-mid)",
    light: "var(--spring-light)",
    accent: "var(--spring-accent)",
    gold: "var(--spring-gold)",
  },
  summer: {
    deep: "var(--summer-deep)",
    mid: "var(--summer-mid)",
    light: "var(--summer-light)",
    accent: "var(--summer-accent)",
    gold: "var(--summer-gold)",
  },
};

export function paletteVars(palette: Palette): PaletteVars {
  return PALETTE_VARS[palette];
}

/** Tailwind-style theme class for a palette — `theme-bahar` etc. */
export function themeClassForPalette(palette: Palette): string {
  switch (palette) {
    case "autumn":
      return "theme-harud";
    case "winter":
      return "theme-shishur";
    case "spring":
      return "theme-bahar";
    case "summer":
      return "theme-grism";
  }
}

/* ─────────────────────── Format helpers ───────────────────────── */

export function formatINR(n: number): string {
  return `Rs. ${n.toLocaleString("en-IN")}`;
}

export function formatDateLong(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ordinalGen(n: number): string {
  const suffix =
    n % 100 >= 11 && n % 100 <= 13
      ? "th"
      : n % 10 === 1
        ? "st"
        : n % 10 === 2
          ? "nd"
          : n % 10 === 3
            ? "rd"
            : "th";
  return `${n}${suffix} Generation`;
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
