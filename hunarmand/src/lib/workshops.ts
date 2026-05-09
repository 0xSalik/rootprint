/* -------------------------------------------------------------------------
 * Hunarmand — Workshops registry & extended metadata.
 *
 * The bare workshop offering (title, duration, price, capacity, languages,
 * blurb, nextDate) lives inside each Artisan record in `lib/artisans.ts`
 * because it appears on the artisan profile page first.
 *
 * The Workshop *experience* — what you'll learn, what you'll take home,
 * the session timeline, pricing tiers, add-ons, available dates — is
 * additive. We keep it here so we don't bloat the artisan data and so
 * the workshop discovery, detail, and booking pages share a single
 * canonical source.
 * ----------------------------------------------------------------------- */

import {
  type Artisan,
  type WorkshopOffering,
  ARTISANS,
  workshopKindMeta,
} from "./artisans";
import {
  type Craft,
  type Season,
  seasonForCraft,
  SEASON_META,
} from "./seasons";

/* ─────────────────────────── Types ────────────────────────────────── */

/** A timeline segment within a session. Multi-day workshops repeat the
 *  pattern across days; the `day` field disambiguates. */
export interface SessionSegment {
  start: string; /* "10:00" */
  end: string;   /* "11:30" */
  day?: number;  /* 1, 2, 3 for multi-day; omitted for single-day */
  label: string; /* "Warp prep · the loom is woken" */
  kind: "intro" | "demo" | "hands-on" | "tea" | "lunch" | "reflection" | "field";
}

/** One row of the 5-tier pricing comparison table. */
export interface PricingTier {
  id: string;
  label: string;
  blurb: string;
  pricePerPerson: number; /* INR */
  /** Bullet list of what's included at this tier. */
  includes: string[];
  /** Whether this tier is the recommended one for the demo. */
  highlight?: boolean;
}

/** Optional purchasable add-on at booking time. */
export interface WorkshopAddOn {
  id: string;
  label: string;
  /** Short helper line shown under the label. */
  helper: string;
  pricePerPerson: number; /* INR — 0 means included */
  /** When checked, this add-on lengthens the experience by N minutes. */
  addsMinutes?: number;
}

/** Extended metadata for a workshop, keyed by `WorkshopOffering.id`. */
export interface WorkshopExtended {
  /** Long-form description shown on the detail page hero. */
  longBlurb: string;
  /** Bulleted "What you will actually learn" — pulled from technique
   *  notes the master has recorded in the Vault. Each line is real. */
  learningOutcomes: string[];
  /** What the participant takes home — physical or recorded. */
  takeHome: string[];
  /** Session timeline (single or multi-day). */
  sessionStructure: SessionSegment[];
  /** 5-tier pricing comparison. The base tier should match
   *  `WorkshopOffering.pricePerPerson` so the cards stay in sync. */
  pricingTiers: PricingTier[];
  /** Add-ons offered at booking. */
  addOns: WorkshopAddOn[];
  /** All upcoming dates for this workshop (next ~3 months), ISO. */
  availableDates: string[];
  /** ISO time slots offered on each available date. */
  timeSlots: string[];
  /** Address of the venue. */
  location: { name: string; address: string };
  /** Sentence used as the "personal note from the master" on the
   *  confirmation certificate. */
  confirmationNote: string;
}

/** A workshop joined with its artisan and extended metadata. */
export interface WorkshopFull {
  offering: WorkshopOffering;
  artisan: Artisan;
  craft: Craft;
  season: Season;
  ext: WorkshopExtended;
}

/* ─────────────────────────── Extended seed ───────────────────────── */

const COMMON_TIME_SLOTS = ["10:00", "14:30"];
const SHORT_TIME_SLOTS = ["11:00", "16:00"];

/* Generate a small spread of upcoming available dates from a base
 * date. Workshops typically run Tue/Thu/Sat — we'll keep it predictable
 * for the demo so the calendar shows ~10–12 dates per workshop. */
function nextDates(baseIso: string, count: number): string[] {
  const base = new Date(baseIso);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    /* Cadence: Tue (2), Thu (4), Sat (6) of each week */
    d.setDate(base.getDate() + i * 5);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

const EXTENDED: Record<string, WorkshopExtended> = {
  /* ============================ YUSUF ============================== */
  "yusuf-half-day": {
    longBlurb:
      "Sit down at the loom that has been threaded by four generations of the Sheikh family. Mohammad Yusuf walks you through the 1940s Srinagar knot — asymmetric, almost forgotten — and stays beside you for every row of a corner you take home. This is not a tourist demonstration; it is the master sharing the working geometry of his craft.",
    learningOutcomes: [
      "How to read the warp tension by sound — when the loom is ready",
      "The 1940s asymmetric knot: warp once, weft twice (no book records this)",
      "Why an off-knot every twelfth row is a signature, not a mistake",
      "How a bowing weft tells the master to slow down before damage",
      "Tying off the cut so the corner survives a generation, not a season",
    ],
    takeHome: [
      "A small framed corner of carpet you knotted yourself, signed by the master",
      "A printed excerpt from Mohammad Yusuf's Craft DNA — your knot named in his ledger",
      "A Hunarmand certificate of attendance, sealed and serial-numbered",
    ],
    sessionStructure: [
      { start: "10:00", end: "10:20", label: "Tea, introductions, the room of the loom", kind: "intro" },
      { start: "10:20", end: "11:00", label: "Demonstration · the 1940s knot, slow", kind: "demo" },
      { start: "11:00", end: "12:30", label: "Hands-on · your first row", kind: "hands-on" },
      { start: "12:30", end: "13:00", label: "Kahwa break · stories from the loom", kind: "tea" },
      { start: "13:00", end: "13:50", label: "Hands-on · your corner takes shape", kind: "hands-on" },
      { start: "13:50", end: "14:00", label: "Reflection · what the master saw in your hands", kind: "reflection" },
    ],
    pricingTiers: [
      {
        id: "tier-witness",
        label: "Witness",
        blurb: "Sit beside the loom, observe the technique, ask questions. No knotting.",
        pricePerPerson: 2400,
        includes: ["4-hour observer seat", "Kahwa & Kashmiri lunch", "Take-home: signed printed excerpt"],
      },
      {
        id: "tier-classic",
        label: "Classic",
        blurb: "The full Half-Day Workshop — knot a corner you take home.",
        pricePerPerson: 6000,
        highlight: true,
        includes: [
          "Loom seat for 4 hours",
          "Knot one corner under master's hand",
          "Kahwa & Kashmiri lunch",
          "Hunarmand certificate + corner-of-carpet take-home",
        ],
      },
      {
        id: "tier-private",
        label: "Private Loom",
        blurb: "The same workshop, alone with the master. No other participants.",
        pricePerPerson: 14000,
        includes: ["Everything in Classic", "Master's full attention for 4 hours", "Personal selection of dye palette"],
      },
      {
        id: "tier-couple",
        label: "Two at the Loom",
        blurb: "Two participants, one loom, one piece — knotted together.",
        pricePerPerson: 9500,
        includes: ["Everything in Classic, paired", "A single shared corner of carpet", "Two Hunarmand certificates"],
      },
      {
        id: "tier-deep",
        label: "Master's Day",
        blurb: "Full day with Mohammad Yusuf — knot, dye-bath, and the family lineage wall.",
        pricePerPerson: 22000,
        includes: [
          "8 hours with the master, lunch & dinner",
          "Knot a complete border on a small piece",
          "Visit the dye-bath at the bottom of the workshop",
          "Sit with the lineage wall — the four generations, named",
        ],
      },
    ],
    addOns: [
      {
        id: "heritage-walk",
        label: "Add the Khanyar Heritage Walk",
        helper: "90-minute walk through three working carpet workshops in the old city, ending at Yusuf's loom.",
        pricePerPerson: 1500,
        addsMinutes: 90,
      },
      {
        id: "materials-kit",
        label: "Pre-shipped materials kit",
        helper: "We post a sample skein, a knotting hook, and the Talim sheet a week before so you arrive prepared.",
        pricePerPerson: 1200,
      },
      {
        id: "translation-earpiece",
        label: "Translation earpiece (live)",
        helper: "Live English / Japanese / French translation of every word the master speaks at the loom.",
        pricePerPerson: 800,
      },
    ],
    availableDates: nextDates("2026-12-14", 12),
    timeSlots: COMMON_TIME_SLOTS,
    location: {
      name: "The Sheikh Loom Hall",
      address: "Khanyar, Srinagar — 3 minutes from Khanyar Chowk",
    },
    confirmationNote:
      "I will brew the kahwa myself the morning you come. Bring nothing but your attention. — Yusuf",
  },

  "yusuf-master-session": {
    longBlurb:
      "An hour of conversation, an hour of demonstration. Bring the questions you have always wanted to ask a fourth-generation carpet master and watch his hands answer them at the loom.",
    learningOutcomes: [
      "How four generations of one family chose what to forget and what to keep",
      "The single decision that separates a 6-month carpet from a 6-year one",
      "Reading a finished carpet for the master who tied it",
    ],
    takeHome: [
      "A signed handwritten note answering the question you brought",
      "A photograph of you and the master at the loom",
    ],
    sessionStructure: [
      { start: "11:00", end: "12:00", label: "Conversation · your questions, his hands", kind: "intro" },
      { start: "12:00", end: "13:00", label: "Demonstration · the technique you asked about", kind: "demo" },
    ],
    pricingTiers: [
      { id: "tier-classic", label: "Classic", blurb: "The standard 2-hour 1-on-1 session.", pricePerPerson: 12000, highlight: true, includes: ["2 hours, 1-on-1", "Kahwa", "Signed handwritten note"] },
      { id: "tier-couple", label: "Two with the Master", blurb: "Bring one companion.", pricePerPerson: 18000, includes: ["Everything in Classic, for two", "Two signed notes"] },
      { id: "tier-recorded", label: "Recorded Session", blurb: "Take the conversation home — a private 90-min recording, transcribed.", pricePerPerson: 17000, includes: ["Classic +", "Audio recording, English transcript", "PDF of the session"] },
      { id: "tier-deep", label: "Master's Half-Day", blurb: "Extend to four hours with a working demonstration.", pricePerPerson: 24000, includes: ["4 hours, 1-on-1", "Loom demo", "Lunch with the family"] },
      { id: "tier-bundle", label: "Session + Heritage Walk", blurb: "Add the Khanyar walk before the session.", pricePerPerson: 13500, includes: ["Heritage walk + 2-hour session", "One signed note"] },
    ],
    addOns: [
      { id: "translation-earpiece", label: "Translation earpiece (live)", helper: "Live English translation of the master's Koshur.", pricePerPerson: 800 },
      { id: "audio-recording", label: "Take the audio home", helper: "We record the session and email an mp3 + transcript within 48 hours.", pricePerPerson: 1500 },
    ],
    availableDates: nextDates("2026-11-28", 10),
    timeSlots: SHORT_TIME_SLOTS,
    location: { name: "The Sheikh Loom Hall", address: "Khanyar, Srinagar" },
    confirmationNote:
      "Come with one question you have carried for a long time. I will sit with it. — Yusuf",
  },

  "yusuf-multi-day": {
    longBlurb:
      "Three days. Day one at the dyeing cauldron, day two cutting and tensioning your warp, day three knotting a small piece of your own. You sleep in a Dal Lake houseboat, walk to the workshop at dawn, and return home with a finished object and a body that has done the work.",
    learningOutcomes: [
      "How to mix a madder dye that holds for forty years",
      "Cutting and tying off a warp without snapping a single thread",
      "Building a small carpet from raw fleece to finished piece",
      "Reading the loom's mood across three days, not three hours",
    ],
    takeHome: [
      "A small completed carpet, knotted entirely by you under master supervision",
      "A jar of the madder dye you mixed",
      "A handwritten certificate from the lineage book",
    ],
    sessionStructure: [
      { day: 1, start: "09:30", end: "11:00", label: "Tea + the dye-bath, smelling the colours", kind: "intro" },
      { day: 1, start: "11:00", end: "13:30", label: "Hands-on · your dye batch", kind: "hands-on" },
      { day: 1, start: "13:30", end: "14:30", label: "Lunch with the family", kind: "lunch" },
      { day: 1, start: "14:30", end: "17:00", label: "Resting the dyed wool", kind: "reflection" },
      { day: 2, start: "09:00", end: "12:30", label: "Cutting and tensioning the warp", kind: "hands-on" },
      { day: 2, start: "12:30", end: "13:30", label: "Lunch", kind: "lunch" },
      { day: 2, start: "13:30", end: "17:30", label: "First rows of knotting", kind: "hands-on" },
      { day: 3, start: "09:00", end: "13:00", label: "Body of the piece", kind: "hands-on" },
      { day: 3, start: "13:00", end: "14:00", label: "Lunch", kind: "lunch" },
      { day: 3, start: "14:00", end: "16:30", label: "Tying off · finishing edges", kind: "hands-on" },
      { day: 3, start: "16:30", end: "17:00", label: "Reflection · master's notes for you", kind: "reflection" },
    ],
    pricingTiers: [
      { id: "tier-classic", label: "Classic Immersion", blurb: "The standard 3-day Masterclass.", pricePerPerson: 38000, highlight: true, includes: ["3 days at the workshop", "Houseboat stay", "All meals", "Finished piece"] },
      { id: "tier-private", label: "Private Immersion", blurb: "Just you and the master, three days.", pricePerPerson: 84000, includes: ["Everything in Classic, alone with the master"] },
      { id: "tier-couple", label: "Two at the Loom", blurb: "Two participants, side by side, one shared piece.", pricePerPerson: 64000, includes: ["3-day immersion for two", "Shared houseboat", "One shared piece"] },
      { id: "tier-shorter", label: "2-day variant", blurb: "Skip the dye day, begin at the warp.", pricePerPerson: 26000, includes: ["2 days, warp + body", "All meals", "Smaller piece"] },
      { id: "tier-extended", label: "5-day Extended", blurb: "Add two more days for a finished mid-size piece.", pricePerPerson: 62000, includes: ["5 days at the workshop", "Mid-size piece", "Houseboat for 5 nights"] },
    ],
    addOns: [
      { id: "heritage-walk", label: "Add the Khanyar Heritage Walk", helper: "Open the immersion with the morning walk on day one.", pricePerPerson: 1500, addsMinutes: 90 },
      { id: "private-houseboat", label: "Upgrade to a private houseboat", helper: "Solo houseboat across the immersion.", pricePerPerson: 8000 },
    ],
    availableDates: nextDates("2027-01-09", 6),
    timeSlots: ["09:00"],
    location: { name: "The Sheikh Loom Hall + Dal Lake", address: "Khanyar, Srinagar — houseboat moored at Nehru Park" },
    confirmationNote:
      "Three days will feel like three months. Come light. — Yusuf",
  },

  "yusuf-walk": {
    longBlurb:
      "Walk through three working carpet workshops in the old city of Srinagar, ending at the Sheikh family loom for tea. Hear how three different masters tension a warp, mix a dye, sign a piece. You will never look at a carpet the same way.",
    learningOutcomes: [
      "How to tell a 1940s knot from a 1970s knot at a glance",
      "Why three workshops 200 metres apart sound different from each other",
      "Where the Sanad seal sits on a real piece, and what to look for if it doesn't",
    ],
    takeHome: [
      "A small printed map of the old city's working looms — yours to walk again",
      "A Hunarmand attendance certificate",
    ],
    sessionStructure: [
      { start: "10:00", end: "10:20", label: "Meet at Khanyar Chowk · introductions", kind: "intro" },
      { start: "10:20", end: "11:00", label: "First workshop — Sufi family loom", kind: "field" },
      { start: "11:00", end: "11:30", label: "Second workshop — Naqashband loom", kind: "field" },
      { start: "11:30", end: "12:00", label: "Third workshop — Sheikh family loom", kind: "field" },
      { start: "12:00", end: "12:30", label: "Kahwa & questions at Yusuf's loom", kind: "tea" },
    ],
    pricingTiers: [
      { id: "tier-classic", label: "Classic Walk", blurb: "The standard 90-min walk.", pricePerPerson: 1500, highlight: true, includes: ["90-minute guided walk", "Kahwa at the final loom", "Printed map"] },
      { id: "tier-private", label: "Private Walk", blurb: "Same walk, just you and the guide.", pricePerPerson: 4500, includes: ["Everything in Classic, alone"] },
      { id: "tier-extended", label: "Extended Walk + Lunch", blurb: "Add a Wazwan-style lunch with the family after.", pricePerPerson: 3200, includes: ["Walk + 2-hour lunch", "Stories from the lineage book"] },
      { id: "tier-couple", label: "For Two", blurb: "Walk for two, one printed map.", pricePerPerson: 2700, includes: ["Walk for two", "Shared map"] },
      { id: "tier-mini", label: "Mini Walk (children-friendly)", blurb: "60-min, two workshops only.", pricePerPerson: 900, includes: ["Walk for one (or one + child)", "Shorter route"] },
    ],
    addOns: [
      { id: "lunch", label: "Add Wazwan-style family lunch", helper: "Eat at the loom hall with the Sheikh family after the walk.", pricePerPerson: 1700, addsMinutes: 120 },
      { id: "translation-earpiece", label: "Translation earpiece", helper: "Live English / Japanese / French.", pricePerPerson: 600 },
    ],
    availableDates: nextDates("2026-11-22", 14),
    timeSlots: ["10:00", "16:00"],
    location: { name: "Khanyar — meeting at Khanyar Chowk", address: "Old city, Srinagar" },
    confirmationNote:
      "I'll wait at the chowk in a brown phiran. You won't miss me. — Yusuf",
  },

  "yusuf-virtual": {
    longBlurb:
      "Live from the loom, with simultaneous translation. A camera fixed above the master's hands; you can interrupt with questions in your language at any time. The next best thing to being in Khanyar.",
    learningOutcomes: [
      "Watch a row of the 1940s knot in real time, from any country",
      "Ask questions and have them translated live to the master",
      "Receive a private link to re-watch your session for 30 days",
    ],
    takeHome: [
      "30-day re-watch link",
      "PDF transcript of your questions and the master's answers",
      "A digital Hunarmand attendance certificate",
    ],
    sessionStructure: [
      { start: "18:00", end: "18:10", label: "Connection check + introductions", kind: "intro" },
      { start: "18:10", end: "18:50", label: "Live demonstration · the 1940s knot", kind: "demo" },
      { start: "18:50", end: "19:00", label: "Q&A with the master", kind: "reflection" },
    ],
    pricingTiers: [
      { id: "tier-classic", label: "Classic Live", blurb: "Standard 60-min session.", pricePerPerson: 4000, highlight: true, includes: ["Live session", "30-day rewatch", "Q&A", "Digital certificate"] },
      { id: "tier-private", label: "Private Live", blurb: "Same session, no other audience.", pricePerPerson: 16000, includes: ["1-on-1 live session", "Recording included", "Personal questions only"] },
      { id: "tier-couple", label: "For Two", blurb: "Two participants on one screen.", pricePerPerson: 6500, includes: ["Live session for two", "Two certificates"] },
      { id: "tier-recorded", label: "Recording Only", blurb: "Watch a past session at your own pace.", pricePerPerson: 1500, includes: ["30-day rewatch of last session", "Transcript"] },
      { id: "tier-school", label: "Classroom (12 seats)", blurb: "For a school or studio audience of up to twelve.", pricePerPerson: 850, includes: ["12 seats", "Live Q&A", "Group certificate"] },
    ],
    addOns: [
      { id: "translation-earpiece", label: "Live translation", helper: "Choose English, Japanese, or French as your channel.", pricePerPerson: 600 },
      { id: "materials-kit", label: "Materials kit posted to you", helper: "A small skein and a knotting hook arrives a week before so you can follow along.", pricePerPerson: 1500 },
    ],
    availableDates: nextDates("2026-12-03", 10),
    timeSlots: ["18:00", "20:30"],
    location: { name: "Online · live from the Sheikh Loom Hall", address: "—" },
    confirmationNote:
      "If your connection drops, mine probably did too. We'll resume. — Yusuf",
  },

  /* ============================ BASHIR ============================== */
  "bashir-loom-day": {
    longBlurb:
      "A morning at the yinder spinning a few metres of pashm; an afternoon at the loom while the master weaves a row of your shawl with the yarn you spun. The whole craft, from fleece to fabric, in a single day at the family hall in Kanihama.",
    learningOutcomes: [
      "How to read pashm fibre length by sight, not by gauge",
      "Hand-feel warp tension — the technique only Bashir holds",
      "Why pashm is spun left-handed and what that does to the shawl",
      "Recognising a real Kanihama weave by the back of the cloth",
    ],
    takeHome: [
      "A small hank of pashm yarn you spun, sealed in cloth",
      "A signed swatch of the shawl Bashir wove using your yarn",
      "A printed page from his Vault — the warp-tension entry, in Koshur and English",
    ],
    sessionStructure: [
      { start: "09:30", end: "10:00", label: "Tea, introductions, the loom hall", kind: "intro" },
      { start: "10:00", end: "11:30", label: "Yinder · your hands learn to spin pashm", kind: "hands-on" },
      { start: "11:30", end: "12:00", label: "Kahwa break", kind: "tea" },
      { start: "12:00", end: "13:30", label: "At the loom · master weaves a row of your shawl", kind: "demo" },
      { start: "13:30", end: "14:30", label: "Lunch with the family", kind: "lunch" },
      { start: "14:30", end: "15:00", label: "Reflection · what your yarn told the loom", kind: "reflection" },
    ],
    pricingTiers: [
      { id: "tier-witness", label: "Witness", blurb: "Sit with the loom, spin a hank, no shawl row.", pricePerPerson: 3500, includes: ["5 hours observer + spin", "Lunch", "Hank of yarn"] },
      { id: "tier-classic", label: "Classic Loom Day", blurb: "Spin and weave one row in the master's shawl.", pricePerPerson: 8500, highlight: true, includes: ["Full 5-hour session", "Spin + weave one row", "Signed swatch", "Lunch"] },
      { id: "tier-private", label: "Private Loom", blurb: "The hall to yourself.", pricePerPerson: 22000, includes: ["Classic, alone with the master"] },
      { id: "tier-couple", label: "Two at the Loom", blurb: "Two participants, one shawl, two rows.", pricePerPerson: 14000, includes: ["Classic for two", "Two signed swatches"] },
      { id: "tier-deep", label: "Loom Day + Talim", blurb: "Add a Kani Talim Reading after lunch.", pricePerPerson: 12000, includes: ["Classic + 90-min Talim Reading", "A photographed talim sheet to take home"] },
    ],
    addOns: [
      { id: "heritage-walk", label: "Add the Kanihama Loom Walk", helper: "2-hour walk through four working looms in the village.", pricePerPerson: 1800, addsMinutes: 120 },
      { id: "translation-earpiece", label: "Translation earpiece", helper: "Live English / Japanese / French.", pricePerPerson: 800 },
      { id: "shawl-finish", label: "Finished shawl, posted later", helper: "Bashir completes the shawl, signs it, and posts to your address (8–10 weeks).", pricePerPerson: 38000 },
    ],
    availableDates: nextDates("2026-12-21", 12),
    timeSlots: COMMON_TIME_SLOTS,
    location: { name: "The Bhat Loom Hall", address: "Kanihama, Budgam — 35 minutes from Srinagar" },
    confirmationNote:
      "If your hands are cold from the drive, we'll warm them at the brazier first. — Bashir",
  },

  "bashir-talim": {
    longBlurb:
      "An original Mir-family talim sheet from the 1920s, decoded row by row with the only living master who can still read it. Ninety minutes that re-open a closed book.",
    learningOutcomes: [
      "How a single talim cell encodes colour, position, and knot count",
      "The diacritic marks that change a colour at the seventh row",
      "Why a misread cell becomes the next century's signature mistake",
    ],
    takeHome: [
      "A photograph of the original talim sheet (Bashir's hand-written copy)",
      "A printed translation page in your name",
    ],
    sessionStructure: [
      { start: "11:00", end: "11:15", label: "Tea + the table is set with the sheet", kind: "intro" },
      { start: "11:15", end: "12:15", label: "Reading · row by row, slowly", kind: "demo" },
      { start: "12:15", end: "12:30", label: "Q&A · the cells you marked", kind: "reflection" },
    ],
    pricingTiers: [
      { id: "tier-classic", label: "Classic Reading", blurb: "Standard 90-min reading session, up to 6 participants.", pricePerPerson: 7000, highlight: true, includes: ["90-min reading", "Photographed sheet", "Tea"] },
      { id: "tier-private", label: "Private Reading", blurb: "Just you, the master, the sheet.", pricePerPerson: 18000, includes: ["1-on-1 reading", "Personal annotations on your copy"] },
      { id: "tier-couple", label: "For Two", blurb: "Two readers, one sheet.", pricePerPerson: 11000, includes: ["Reading for two", "Two photographed copies"] },
      { id: "tier-extended", label: "Reading + Loom Visit", blurb: "After the reading, visit the loom that wove the original.", pricePerPerson: 9500, includes: ["Reading + 30-min loom visit", "One photographed copy"] },
      { id: "tier-archival", label: "Archival Tier", blurb: "Receive a museum-archival print of the sheet (A2, cotton paper).", pricePerPerson: 14500, includes: ["Reading + archival A2 print", "Master's signature on the print"] },
    ],
    addOns: [
      { id: "translation-earpiece", label: "Translation earpiece", helper: "Live English / Japanese / French.", pricePerPerson: 600 },
      { id: "archival-print", label: "Archival A2 print of the sheet", helper: "Sent to your address within 4 weeks.", pricePerPerson: 4500 },
    ],
    availableDates: nextDates("2027-01-11", 8),
    timeSlots: ["11:00", "16:30"],
    location: { name: "The Bhat Loom Hall", address: "Kanihama, Budgam" },
    confirmationNote:
      "Bring a sharp pencil. The cells will speak to you, but only if you write back. — Bashir",
  },

  "bashir-multi": {
    longBlurb:
      "Five days from raw fleece to a finished pashmina stole. You stay with the Bhat family in Kanihama, eat in the loom hall, walk the same morning route the master walks. By day five, you carry a stole back home that began as fleece on a goat in Changthang.",
    learningOutcomes: [
      "Grading raw pashm fleece by length, lustre, and crimp",
      "Spinning pashm on the yinder — left-handed, one-thumb-pressure",
      "Hand-feel warp tension — the master's signature technique",
      "Weaving a small piece across days, reading the loom's mood",
      "Finishing edges — the cut that makes a pashmina last forty years",
    ],
    takeHome: [
      "A finished small pashmina stole, woven by your own hands",
      "A jar of the natural dye you mixed",
      "A page from Bashir's Vault printed and signed in your name",
      "A Hunarmand certificate, sealed and serial-numbered",
    ],
    sessionStructure: [
      { day: 1, start: "09:30", end: "13:00", label: "Fleece-grading · learning to read pashm", kind: "intro" },
      { day: 1, start: "13:00", end: "14:00", label: "Lunch with the family", kind: "lunch" },
      { day: 1, start: "14:00", end: "17:00", label: "Yinder · first hour of spinning", kind: "hands-on" },
      { day: 2, start: "09:00", end: "13:00", label: "Spinning · your full hank", kind: "hands-on" },
      { day: 2, start: "14:00", end: "17:00", label: "Dye-bath · pomegranate skin", kind: "hands-on" },
      { day: 3, start: "09:00", end: "13:00", label: "Cutting and tensioning the warp", kind: "hands-on" },
      { day: 3, start: "14:00", end: "17:00", label: "First rows of weaving", kind: "hands-on" },
      { day: 4, start: "09:00", end: "17:00", label: "Body of the stole · day-long weaving", kind: "hands-on" },
      { day: 5, start: "09:00", end: "13:00", label: "Finishing edges · the cut", kind: "hands-on" },
      { day: 5, start: "14:00", end: "16:00", label: "Tying off · master's notes for you", kind: "reflection" },
    ],
    pricingTiers: [
      { id: "tier-classic", label: "Classic Immersion", blurb: "5-day immersion, family stay.", pricePerPerson: 56000, highlight: true, includes: ["5 days, family stay", "All meals", "Finished stole"] },
      { id: "tier-private", label: "Private Immersion", blurb: "Same five days, no other participants.", pricePerPerson: 124000, includes: ["Classic, alone with the master"] },
      { id: "tier-couple", label: "For Two", blurb: "Two participants, side by side.", pricePerPerson: 96000, includes: ["Classic for two", "Two finished stoles"] },
      { id: "tier-shorter", label: "3-day variant", blurb: "Skip fleece + dye, begin at the warp.", pricePerPerson: 32000, includes: ["3 days, smaller piece"] },
      { id: "tier-extended", label: "7-day Extended", blurb: "Add two days for a finished full shawl.", pricePerPerson: 84000, includes: ["7 days, full shawl"] },
    ],
    addOns: [
      { id: "heritage-walk", label: "Add the Kanihama Loom Walk on day one", helper: "Walk the village before the immersion begins.", pricePerPerson: 1800, addsMinutes: 120 },
      { id: "courier-stole", label: "Courier the finished piece home", helper: "If you can't carry it, we ship insured anywhere in the world.", pricePerPerson: 2500 },
    ],
    availableDates: nextDates("2027-02-04", 5),
    timeSlots: ["09:00"],
    location: { name: "The Bhat Loom Hall", address: "Kanihama, Budgam · family stay arranged on site" },
    confirmationNote:
      "Pack warm. The loom hall has braziers; the mornings do not. — Bashir",
  },

  "bashir-walk": {
    longBlurb:
      "Visit four working pashmina looms in Kanihama, ending at Bashir's hall for tea. Each loom is run by a different family; each shawl tells a different story. Two hours, one village, four masters.",
    learningOutcomes: [
      "How to spot a real Kanihama loom from across a courtyard",
      "Why each family's signature lives in the back of the cloth",
      "What the village does in winter that you cannot see in summer",
    ],
    takeHome: [
      "A printed map of the four looms",
      "A small pashm sample card",
      "A Hunarmand attendance certificate",
    ],
    sessionStructure: [
      { start: "10:00", end: "10:15", label: "Meet at Kanihama bus stand · introductions", kind: "intro" },
      { start: "10:15", end: "10:45", label: "First loom · Mir family", kind: "field" },
      { start: "10:45", end: "11:15", label: "Second loom · Lone family", kind: "field" },
      { start: "11:15", end: "11:45", label: "Third loom · Wani family", kind: "field" },
      { start: "11:45", end: "12:00", label: "Bhat loom · tea + Q&A", kind: "tea" },
    ],
    pricingTiers: [
      { id: "tier-classic", label: "Classic Walk", blurb: "Standard 2-hour walk.", pricePerPerson: 1800, highlight: true, includes: ["Walk + tea", "Printed map", "Sample card"] },
      { id: "tier-private", label: "Private Walk", blurb: "Same walk, just you and the guide.", pricePerPerson: 5500, includes: ["Classic, private"] },
      { id: "tier-extended", label: "Walk + Loom Day", blurb: "Stay on for the Loom Day workshop after lunch.", pricePerPerson: 9800, includes: ["Walk + lunch + half-day loom session"] },
      { id: "tier-couple", label: "For Two", blurb: "Walk for two.", pricePerPerson: 3200, includes: ["Walk for two"] },
      { id: "tier-mini", label: "Mini Walk (60 min)", blurb: "Two looms only — a glimpse.", pricePerPerson: 1100, includes: ["60-min walk", "Sample card"] },
    ],
    addOns: [
      { id: "lunch", label: "Add lunch with the Bhat family", helper: "After the walk, eat at the loom hall.", pricePerPerson: 1500, addsMinutes: 90 },
      { id: "translation-earpiece", label: "Translation earpiece", helper: "Live English / Japanese / French.", pricePerPerson: 600 },
    ],
    availableDates: nextDates("2026-12-06", 14),
    timeSlots: ["10:00", "14:30"],
    location: { name: "Kanihama village — meeting at the bus stand", address: "Kanihama, Budgam" },
    confirmationNote:
      "Wear shoes you can walk a courtyard's gravel in. — Bashir",
  },

  "bashir-virtual": {
    longBlurb:
      "Live camera at the loom while the master answers your questions in real time. Two screens — one on his hands, one on his face. Translation channels in English, Japanese, and French.",
    learningOutcomes: [
      "Watch a row of pashmina being woven in real time",
      "Ask questions and have them translated live to the master",
      "Receive a 30-day private re-watch link",
    ],
    takeHome: [
      "30-day re-watch link",
      "PDF transcript of your session",
      "A digital Hunarmand certificate",
    ],
    sessionStructure: [
      { start: "18:00", end: "18:05", label: "Connection check + introductions", kind: "intro" },
      { start: "18:05", end: "18:35", label: "Live weaving · master at the loom", kind: "demo" },
      { start: "18:35", end: "18:45", label: "Q&A with the master", kind: "reflection" },
    ],
    pricingTiers: [
      { id: "tier-classic", label: "Classic Live", blurb: "Standard 45-min session.", pricePerPerson: 3500, highlight: true, includes: ["Live session", "30-day rewatch", "Digital certificate"] },
      { id: "tier-private", label: "Private Live", blurb: "1-on-1 live, no audience.", pricePerPerson: 14000, includes: ["1-on-1 live", "Recording included"] },
      { id: "tier-couple", label: "For Two", blurb: "Two viewers, one screen.", pricePerPerson: 5500, includes: ["Live session for two", "Two certificates"] },
      { id: "tier-recorded", label: "Recording only", blurb: "Watch a past session.", pricePerPerson: 1200, includes: ["30-day rewatch of last session"] },
      { id: "tier-school", label: "Classroom (10 seats)", blurb: "For a studio or school audience.", pricePerPerson: 800, includes: ["10 seats", "Live Q&A", "Group certificate"] },
    ],
    addOns: [
      { id: "translation-earpiece", label: "Live translation channel", helper: "Choose English, Japanese, or French.", pricePerPerson: 500 },
      { id: "materials-kit", label: "Pashm sample posted to you", helper: "A small sample arrives a week before.", pricePerPerson: 1200 },
    ],
    availableDates: nextDates("2026-12-13", 10),
    timeSlots: ["18:00", "20:30"],
    location: { name: "Online · live from the Bhat Loom Hall", address: "—" },
    confirmationNote:
      "If the camera shakes, blame the brazier. — Bashir",
  },
};

/* ─────────────────────────── Helpers ──────────────────────────────── */

/** Index every workshop in every artisan, joined with its extended
 *  metadata. Returns null for any workshop that has no `EXTENDED`
 *  entry — the discovery page hides those gracefully. */
export function listWorkshops(): WorkshopFull[] {
  const out: WorkshopFull[] = [];
  for (const artisan of Object.values(ARTISANS)) {
    for (const offering of artisan.workshops) {
      const ext = EXTENDED[offering.id];
      if (!ext) continue;
      out.push({
        offering,
        artisan,
        craft: artisan.craft,
        season: seasonForCraft(artisan.craft),
        ext,
      });
    }
  }
  /* Stable sort: nearest upcoming date first */
  out.sort((a, b) => a.offering.nextDate.localeCompare(b.offering.nextDate));
  return out;
}

export function getWorkshop(id: string): WorkshopFull | null {
  for (const artisan of Object.values(ARTISANS)) {
    const offering = artisan.workshops.find((w) => w.id === id);
    if (!offering) continue;
    const ext = EXTENDED[offering.id];
    if (!ext) return null;
    return {
      offering,
      artisan,
      craft: artisan.craft,
      season: seasonForCraft(artisan.craft),
      ext,
    };
  }
  return null;
}

export function listWorkshopIds(): string[] {
  return listWorkshops().map((w) => w.offering.id);
}

export function workshopsBySeason(season: Season): WorkshopFull[] {
  return listWorkshops().filter((w) => w.season === season);
}

/** Workshops grouped by their season, in seasonal-calendar order. */
export function workshopsBucketedBySeason(): Array<{
  season: Season;
  meta: (typeof SEASON_META)[Season];
  workshops: WorkshopFull[];
}> {
  const all = listWorkshops();
  return (Object.keys(SEASON_META) as Season[]).map((s) => ({
    season: s,
    meta: SEASON_META[s],
    workshops: all.filter((w) => w.season === s),
  }));
}

/** Format INR with the Indian grouping convention. */
export function formatINR(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

/** Format an ISO date as "14 Dec 2026". */
export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** Format an ISO date as "Saturday, 14 December 2026". */
export function formatDateLong(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Re-export for convenience so consumers don't need two imports. */
export { workshopKindMeta };

/** Compute the live total (per-person × participants + add-ons +
 *  platform fee). The platform fee is deliberately transparent — it
 *  is shown line-item on every breakdown. */
export interface LineTotals {
  baseSubtotal: number;
  addOnsSubtotal: number;
  platformFee: number;
  taxes: number;
  total: number;
}

export const PLATFORM_FEE_RATE = 0.08; /* 8% */
export const TAX_RATE = 0.05;          /* 5% GST on services */

export function computeTotals(opts: {
  pricePerPerson: number;
  participants: number;
  addOnPricesPerPerson: number[];
}): LineTotals {
  const safeParticipants = Math.max(1, opts.participants);
  const baseSubtotal = opts.pricePerPerson * safeParticipants;
  const addOnsSubtotal =
    opts.addOnPricesPerPerson.reduce((s, p) => s + p, 0) * safeParticipants;
  const subtotal = baseSubtotal + addOnsSubtotal;
  const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE);
  const taxes = Math.round((subtotal + platformFee) * TAX_RATE);
  const total = subtotal + platformFee + taxes;
  return { baseSubtotal, addOnsSubtotal, platformFee, taxes, total };
}
