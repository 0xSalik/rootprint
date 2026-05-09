import type { Craft } from "./seasons";

/* -------------------------------------------------------------------------
 * Hunarmand — Artisan data layer.
 *
 * Two demo masters are loaded into the registry:
 *
 *   • Mohammad Yusuf Sheikh — the *canonical demo seed*. His record
 *     is NOT defined in this file; it lives in the project-root
 *     `lib/seed.ts` so the same authoritative seed object can be
 *     loaded from a CLI script (`npm run seed:check`), a CI fixture,
 *     or a future database migration. We import it from `@seed/seed`
 *     and bind it into the registry below.
 *
 *   • Bashir Ahmad Bhat — defined inline here as a second demo master
 *     so the spotlight grid, bazaar, and lineage navigator have more
 *     than one face to render.
 *
 * The Artisan Profile page is data-driven from this module: change a
 * field on the seed and the page updates. The shape is deliberately
 * rich — it mirrors what a Vault session actually captures (technique,
 * lineage, supplier graph, signed pieces, workshop offerings,
 * testimonials).
 * ----------------------------------------------------------------------- */

import { MOHAMMAD_YUSUF } from "@seed/seed";

/** Rarity of a technique surfaced from the Vault. */
export type Rarity = "rare" | "endangered" | "common";

/** A single technique node on the Craft DNA graph. */
export interface Technique {
  id: string;
  name: string;
  rarity: Rarity;
  /** 2–3 sentences pulled from the Vault transcript. */
  vaultExcerpt: string;
  /** Vault session ISO date, used for attribution. */
  vaultSession: string;
  /** Sub-categories the spec asks for: tools, materials, environmental
   *  tunings, and failure modes. Each is a short bullet list. */
  sub: {
    tools: string[];
    materials: string[];
    tuning: string[];
    failure: string[];
  };
  /** A 30-second Vault clip stub — `id` is enough to render a player
   *  placeholder; we have no real video assets in the demo. */
  clipId: string;
}

/** One entry in the artisan's lineage chain. */
export interface LineageEntry {
  name: string;
  era: string;
  /** A one-line note about what they were known for. */
  note: string;
  /** True if alive today — controls the lineage-dot fill style. */
  alive: boolean;
}

/** A piece signed by the artisan and recorded on the Sanad ledger. */
export interface SignedPiece {
  pieceId: string;
  type: string;
  /** ISO date of signing. */
  signedOn: string;
  /** ISO date the piece was finished off the loom (typically a few
   *  days before signing). Optional — falls back to signedOn. */
  completedOn?: string;
  techniqueId: string;
  status: "in transit" | "with buyer" | "in workshop" | "in bazaar";
  /** Optional fair-price band, in INR. */
  priceFrom?: number;
  priceTo?: number;
  /** Supplier IDs whose material went into this piece. Drives the
   *  "Material origin" entries on the Sanad provenance chain. */
  materials?: string[];
  /** Optional human label of the source season/year for the material
   *  (e.g. "Spring 2024 wool"). One per `materials` entry. */
  materialSeasons?: string[];
}

export interface WorkshopOffering {
  id: string;
  /** "Heritage Walk" | "Master Session" | "Half-Day Workshop" |
   *  "Multi-Day Masterclass" | "Virtual Live" */
  kind:
    | "heritage-walk"
    | "master-session"
    | "half-day"
    | "multi-day"
    | "virtual";
  title: string;
  duration: string;
  /** Per-person price in INR. 0 means "by donation". */
  pricePerPerson: number;
  capacity: number;
  /** Languages the master can conduct in (ISO-ish short codes). */
  languages: Array<"ks" | "ur" | "hi" | "en" | "ja" | "fr">;
  blurb: string;
  /** Next available date as ISO. */
  nextDate: string;
}

/** A material origin shown on the small Supplier Graph. The point on
 *  the J&K outline is given as relative coordinates 0..1 within the
 *  schematic SVG (not real geography — a stylised map). */
export interface SupplierOrigin {
  id: string;
  place: string;
  material: string;
  note: string;
  /** Position within the schematic 0..1. (0,0) = top-left. */
  x: number;
  y: number;
}

/** A handwritten "Letter" testimonial — the spec's substitute for
 *  star reviews. */
export interface Letter {
  id: string;
  /** Buyer name + city/country. */
  from: string;
  /** Which piece this letter is about. */
  piece: string;
  /** The body of the letter — written in the buyer's voice. */
  body: string;
  /** Approximate ISO date of writing. */
  written: string;
}

/** Top-level shape of an Artisan record. */
export interface Artisan {
  slug: string;
  name: string;
  /** Craft name in Koshur/Urdu — Nastaliq script. */
  craftUrdu: string;
  craft: Craft;
  craftEnglish: string;
  generation: number;
  village: string;
  district: string;
  /** Verification level — drives the Sanad badge. */
  sanadLevel: "verified" | "guild" | "master";
  /** The one irreplaceable thing only this master holds. */
  irreplaceable: string;
  /** Era when the lineage was first recorded. */
  lineageEstYear: string;
  piecesSigned: number;
  disputes: number;
  /** Open workshop slots for the upcoming month. */
  openSlots: number;
  /** ISO date of the next available workshop. */
  nextWorkshop: string;

  techniques: Technique[];
  lineage: LineageEntry[];
  signedPieces: SignedPiece[];
  workshops: WorkshopOffering[];
  suppliers: SupplierOrigin[];
  letters: Letter[];
}

/* ─────────────────────────── Demo masters ───────────────────────────── */

/* Mohammad Yusuf is the canonical demo seed; his record lives in
 * `/lib/seed.ts` so the same data can be loaded by a CLI script,
 * a CI fixture, or a future database migration.
 *
 * If you find yourself wanting to edit Yusuf's data, edit it in the
 * seed file — this binding is intentionally one line. */
const yusuf: Artisan = MOHAMMAD_YUSUF.artisan;


const bashir: Artisan = {
  slug: "bashir-ahmad-bhat",
  name: "Bashir Ahmad Bhat",
  craftUrdu: "پشمینہ بافی",
  craft: "pashmina",
  craftEnglish: "Pashmina Weaving",
  generation: 5,
  village: "Kanihama",
  district: "Budgam",
  sanadLevel: "master",
  irreplaceable:
    "Sets Pashmina warp tension by hand-sense, a calibration no manual records.",
  lineageEstYear: "~1850s",
  piecesSigned: 198,
  disputes: 0,
  openSlots: 6,
  nextWorkshop: "2026-12-21",

  techniques: [
    {
      id: "warp-tension-feel",
      name: "Hand-feel Warp Tension",
      rarity: "rare",
      vaultExcerpt:
        "I do not measure. I lay my palm on the warp and the room tells me what tension it wants. In winter the threads tighten themselves; in summer they ask to be eased.",
      vaultSession: "2025-09-21",
      clipId: "bashir-warp-tension",
      sub: {
        tools: ["Bare palm", "Loom side-knob, walnut", "Single brass tensioner"],
        materials: ["Hand-spun pashm", "Cotton secondary warp"],
        tuning: [
          "Re-feel at sunrise and at sunset",
          "Adjust before the loom is touched, never during weaving",
        ],
        failure: [
          "If a tensioner is added during weaving, the row reads loose forever",
          "Synthetic warp does not respond to hand-sense — the technique fails",
        ],
      },
    },
    {
      id: "kani-talim",
      name: "Kani Talim Reading",
      rarity: "endangered",
      vaultExcerpt:
        "The talim is a coded score. Each colour-letter is two warp threads, each row a single weft pass. I learned to read it before I learned to read Urdu.",
      vaultSession: "2025-09-21",
      clipId: "bashir-talim",
      sub: {
        tools: ["Talim sheet, cotton-paper", "Reed, 28-dent"],
        materials: ["Naturally dyed pashm in 14 colours"],
        tuning: ["Read each row twice before passing the weft"],
        failure: [
          "A misread row cannot be undone — the entire shawl must be unwound by hand",
        ],
      },
    },
    {
      id: "pashm-spinning",
      name: "Pashm Spinning",
      rarity: "endangered",
      vaultExcerpt:
        "We spin on the yinder — a small wooden wheel my mother spun on. The pashm is a thirteen-micron fibre, finer than human hair. A power loom snaps it within minutes.",
      vaultSession: "2025-10-04",
      clipId: "bashir-spin",
      sub: {
        tools: ["Yinder (hand-spinning wheel)", "Walnut spindle"],
        materials: ["Raw pashm from Changthangi goats, Ladakh"],
        tuning: ["Twist count: 800–900 turns per metre"],
        failure: [
          "Over-twisted yarn breaks at the loom",
          "Under-twisted pashm pills within a season of wear",
        ],
      },
    },
    {
      id: "natural-dye-pashm",
      name: "Cold-Dye Pashm",
      rarity: "rare",
      vaultExcerpt:
        "Pashm cannot tolerate heat — I cold-dye in spring water for three nights, with crushed pomegranate skin and a thread of saffron. Hot dye makes the fibre brittle within five years.",
      vaultSession: "2025-10-04",
      clipId: "bashir-cold-dye",
      sub: {
        tools: ["Brass-lined dye pit, 60 litre", "Sieve, willow"],
        materials: [
          "Pomegranate skin (Sept harvest)",
          "Saffron stamen, single thread per litre",
        ],
        tuning: [
          "Water temperature ≤ 14°C throughout",
          "Steep 72 hours, no agitation",
        ],
        failure: [
          "Heat above 25°C felts the fibre",
          "Iron utensils blacken the dye irreversibly",
        ],
      },
    },
  ],

  lineage: [
    { name: "Bhat Habibullah", era: "ca. 1850s", note: "Founded the Kanihama loom collective.", alive: false },
    { name: "Bhat Ghulam Nabi", era: "ca. 1880s", note: "First to weave a Kani shawl for export.", alive: false },
    { name: "Bhat Abdul Khaliq", era: "ca. 1910s", note: "Trained twelve weavers across three villages.", alive: false },
    { name: "Bhat Mohammad Sultan", era: "ca. 1940s", note: "Reintroduced cold-dye after the Partition disruption.", alive: false },
    { name: "Bhat Ahmad", era: "ca. 1970s", note: "Codified hand-feel tension; first to teach women in the village.", alive: false },
    { name: "Bashir Ahmad Bhat", era: "1969 – present", note: "Last reader of the original Mir family talim sheets.", alive: true },
  ],

  signedPieces: [
    { pieceId: "PSH-05B-7A11", type: "Pashmina shawl, 80×200 cm", signedOn: "2026-04-30", completedOn: "2026-04-22", techniqueId: "warp-tension-feel", status: "with buyer", priceFrom: 320000, priceTo: 380000, materials: ["pashm-changthang", "cotton-budgam"], materialSeasons: ["Winter-shorn 2025 pashm", "Hand-spun cotton, Mar 2025"] },
    { pieceId: "PSH-05B-7A0F", type: "Kani shawl, 90×220 cm", signedOn: "2026-03-12", completedOn: "2026-03-04", techniqueId: "kani-talim", status: "in bazaar", priceFrom: 580000, priceTo: 660000, materials: ["pashm-changthang", "saffron-pampore", "pomegranate-shopian"], materialSeasons: ["Winter 2024 pashm", "Saffron 2024 harvest", "Sept 2024 pomegranate"] },
    { pieceId: "PSH-05B-7A0C", type: "Pashmina stole, 70×190 cm", signedOn: "2026-02-04", completedOn: "2026-01-30", techniqueId: "natural-dye-pashm", status: "in transit", priceFrom: 145000, priceTo: 175000, materials: ["pashm-changthang", "pomegranate-shopian"], materialSeasons: ["Winter 2024 pashm", "Sept 2024 pomegranate"] },
    { pieceId: "PSH-05B-7A07", type: "Pashmina shawl, 80×200 cm", signedOn: "2025-12-19", completedOn: "2025-12-12", techniqueId: "warp-tension-feel", status: "with buyer", priceFrom: 305000, priceTo: 360000, materials: ["pashm-changthang", "cotton-budgam"], materialSeasons: ["Winter 2023 pashm", "Hand-spun cotton, Apr 2024"] },
    { pieceId: "PSH-05B-79FE", type: "Kani shawl, 100×230 cm", signedOn: "2025-10-22", completedOn: "2025-10-12", techniqueId: "kani-talim", status: "with buyer", priceFrom: 720000, priceTo: 820000, materials: ["pashm-changthang", "saffron-pampore", "pomegranate-shopian"], materialSeasons: ["Winter 2022 pashm", "Saffron 2023 harvest", "Sept 2023 pomegranate"] },
    { pieceId: "PSH-05B-79F0", type: "Pashm yarn, 200 g hank", signedOn: "2025-08-08", completedOn: "2025-08-06", techniqueId: "pashm-spinning", status: "in workshop", priceFrom: 14000, priceTo: 18000, materials: ["pashm-changthang"], materialSeasons: ["Winter 2024 pashm"] },
  ],

  workshops: [
    {
      id: "bashir-loom-day",
      kind: "half-day",
      title: "A Day on the Pashmina Loom",
      duration: "5 hours",
      pricePerPerson: 8500,
      capacity: 4,
      languages: ["ks", "ur", "en"],
      blurb:
        "Spin a few metres of pashm on the yinder, then sit at the loom while the master weaves a row of your shawl.",
      nextDate: "2026-12-21",
    },
    {
      id: "bashir-talim",
      kind: "master-session",
      title: "Kani Talim Reading Session",
      duration: "90 minutes",
      pricePerPerson: 7000,
      capacity: 6,
      languages: ["ks", "ur", "en"],
      blurb:
        "Decode an original Mir-family talim sheet from the 1920s, row by row, with the only living reader.",
      nextDate: "2027-01-11",
    },
    {
      id: "bashir-multi",
      kind: "multi-day",
      title: "Five-Day Pashmina Immersion",
      duration: "5 days",
      pricePerPerson: 56000,
      capacity: 3,
      languages: ["ur", "en"],
      blurb:
        "From raw fleece to a finished stole. Stay with the family in Kanihama; eat at the loom hall.",
      nextDate: "2027-02-04",
    },
    {
      id: "bashir-walk",
      kind: "heritage-walk",
      title: "Kanihama Loom Walk",
      duration: "2 hours",
      pricePerPerson: 1800,
      capacity: 10,
      languages: ["ur", "hi", "en"],
      blurb:
        "Visit four working Pashmina looms in the village, ending at Bashir's hall for tea.",
      nextDate: "2026-12-06",
    },
    {
      id: "bashir-virtual",
      kind: "virtual",
      title: "Virtual Loom-side Session",
      duration: "45 minutes",
      pricePerPerson: 3500,
      capacity: 24,
      languages: ["ks", "ur", "en", "ja", "fr"],
      blurb:
        "Live camera at the loom; the master answers your questions while weaving.",
      nextDate: "2026-12-13",
    },
  ],

  suppliers: [
    { id: "pashm-changthang", place: "Changthang, Ladakh", material: "Raw pashm fleece", note: "Sourced once a year, hand-graded.", x: 0.78, y: 0.32 },
    { id: "saffron-pampore", place: "Pampore", material: "Saffron stamen for dye", note: "One thread per litre of dye bath.", x: 0.5, y: 0.6 },
    { id: "pomegranate-shopian", place: "Shopian", material: "Pomegranate skin", note: "Sept harvest only — older skins lose their colour.", x: 0.38, y: 0.7 },
    { id: "cotton-budgam", place: "Budgam", material: "Cotton secondary warp", note: "Local mill, hand-finished spool.", x: 0.4, y: 0.45 },
  ],

  letters: [
    {
      id: "l-anushka",
      from: "Anushka Iyer — Bangalore, India",
      piece: "Pashmina stole (PSH-05B-7A0C)",
      written: "2026-05-04",
      body: "I gifted my mother her first verified Pashmina last week. She asked who Bashir Ahmad was. We sat together and watched his Vault clip. She said 'I want to send him a letter.' I am writing it for her.",
    },
    {
      id: "l-marc",
      from: "Marc Lefèvre — Geneva, Switzerland",
      piece: "Kani shawl (PSH-05B-7A0F)",
      written: "2026-04-22",
      body: "I have collected shawls for twenty years. The talim attached to this piece — a copy of the original — is now in a frame in my study. The shawl is on my wife's shoulders today.",
    },
    {
      id: "l-haruka",
      from: "Haruka Mori — Tokyo, Japan",
      piece: "Pashmina shawl (PSH-05B-7A11)",
      written: "2026-03-30",
      body: "ありがとうございます、バシール先生。 The fibre is so fine I can fold it into my hand. The Sanad is on my wall, the shawl is on my shoulders.",
    },
  ],
};

/* ───────────────────────────── Registry ─────────────────────────────── */

export const ARTISANS: Record<string, Artisan> = {
  [yusuf.slug]: yusuf,
  [bashir.slug]: bashir,
};

export function listArtisanSlugs(): string[] {
  return Object.keys(ARTISANS);
}

export function getArtisan(slug: string): Artisan | null {
  return ARTISANS[slug] ?? null;
}

/** Resolve a SignedPiece by its public pieceId, walking every artisan
 *  in the registry. Returns the piece, the artisan who signed it, and
 *  the technique used. Returns null if no record exists — the Sanad
 *  page renders the "⚠ No Sanad found" warning state in that case. */
export interface SignedPieceLookup {
  piece: SignedPiece;
  artisan: Artisan;
  technique: Technique | null;
  /** Resolved supplier records for `piece.materials`, in the same order. */
  materialOrigins: SupplierOrigin[];
}

export function getSignedPiece(pieceId: string): SignedPieceLookup | null {
  for (const artisan of Object.values(ARTISANS)) {
    const piece = artisan.signedPieces.find((p) => p.pieceId === pieceId);
    if (!piece) continue;
    const technique =
      artisan.techniques.find((t) => t.id === piece.techniqueId) ?? null;
    const supplierIndex = new Map(artisan.suppliers.map((s) => [s.id, s]));
    const materialOrigins = (piece.materials ?? [])
      .map((id) => supplierIndex.get(id))
      .filter((s): s is SupplierOrigin => Boolean(s));
    return { piece, artisan, technique, materialOrigins };
  }
  return null;
}

/** Every signed pieceId in the registry, used by `generateStaticParams`. */
export function listSignedPieceIds(): string[] {
  const ids: string[] = [];
  for (const artisan of Object.values(ARTISANS)) {
    for (const piece of artisan.signedPieces) ids.push(piece.pieceId);
  }
  return ids;
}

/* ───────────────────────────── Helpers ──────────────────────────────── */

const RARITY_META: Record<
  Rarity,
  { label: string; dot: string; color: string }
> = {
  rare: { label: "Rare", dot: "●", color: "#8B1A1A" },
  endangered: { label: "Endangered", dot: "●", color: "#D4790A" },
  common: { label: "Common", dot: "●", color: "#2C4A3E" },
};

export function rarityMeta(r: Rarity) {
  return RARITY_META[r];
}

const LANG_LABEL: Record<
  WorkshopOffering["languages"][number],
  { label: string; native: string; flag: string }
> = {
  ks: { label: "Koshur", native: "كٲشُر", flag: "🪶" },
  ur: { label: "Urdu", native: "اردو", flag: "🪶" },
  hi: { label: "Hindi", native: "हिंदी", flag: "🪶" },
  en: { label: "English", native: "English", flag: "🪶" },
  ja: { label: "Japanese", native: "日本語", flag: "🪶" },
  fr: { label: "French", native: "Français", flag: "🪶" },
};

export function languageLabel(code: WorkshopOffering["languages"][number]) {
  return LANG_LABEL[code];
}

const WORKSHOP_KIND_META: Record<
  WorkshopOffering["kind"],
  { label: string; tag: string }
> = {
  "heritage-walk": { label: "Heritage Walk", tag: "Walk" },
  "master-session": { label: "Master Session", tag: "1-on-1" },
  "half-day": { label: "Half-Day Workshop", tag: "Hands-on" },
  "multi-day": { label: "Multi-Day Masterclass", tag: "Immersion" },
  virtual: { label: "Virtual Live Workshop", tag: "Online" },
};

export function workshopKindMeta(kind: WorkshopOffering["kind"]) {
  return WORKSHOP_KIND_META[kind];
}

/** Format an ISO date as e.g. "14 Dec 2026". */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Format a price in INR with the rupee symbol and Indian grouping. */
export function formatINR(n: number): string {
  return `Rs. ${n.toLocaleString("en-IN")}`;
}
