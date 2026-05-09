/* -------------------------------------------------------------------------
 * Booking state — URL search-param model.
 *
 * The 3-step booking flow keeps everything the user has chosen so far
 * inside the URL. Each form on each step is a plain HTML <form> that
 * submits via GET to the next step; that turns the form fields into
 * search params on the next URL automatically.
 *
 * This module is the single decoder/encoder for that URL state. Both
 * server-rendered pages and the few client islands import from here.
 * ----------------------------------------------------------------------- */

import { type WorkshopFull } from "./workshops";

export interface BookingState {
  /** ISO yyyy-mm-dd of the chosen date (may be empty initially). */
  date: string;
  /** "10:00", may be empty initially. */
  timeSlot: string;
  /** Always at least 1. */
  participants: number;
  tierId: string;
  addOnIds: string[];
  /** ISO 639-ish language code chosen for the session. */
  language: string;
  /** Step 2 inputs — present once the user reaches /details */
  fullName: string;
  email: string;
  phone: string;
  notes: string;
  /** Hunarmand-issued booking reference (set on confirmation). */
  reference: string;
}

export const EMPTY_BOOKING_STATE: BookingState = {
  date: "",
  timeSlot: "",
  participants: 1,
  tierId: "",
  addOnIds: [],
  language: "en",
  fullName: "",
  email: "",
  phone: "",
  notes: "",
  reference: "",
};

/* ------------------------- decode from URL ------------------------- */

/** Parse the booking state out of `?date=...&participants=...&...`.
 *  Falls back to sensible defaults from the workshop when fields are
 *  missing — the user can land on step 1 with a bare URL and the form
 *  will still pre-fill correctly. */
export function decodeBookingState(
  workshop: WorkshopFull,
  searchParams: Record<string, string | string[] | undefined>,
): BookingState {
  const get = (key: string): string => {
    const v = searchParams[key];
    if (Array.isArray(v)) return v[0] ?? "";
    return v ?? "";
  };

  const defaultTier =
    workshop.ext.pricingTiers.find((t) => t.highlight)?.id ??
    workshop.ext.pricingTiers[0]?.id ??
    "";

  const defaultDate = workshop.ext.availableDates[0] ?? "";
  const defaultTime = workshop.ext.timeSlots[0] ?? "";
  const defaultLang = workshop.offering.languages[0] ?? "en";

  const participantsRaw = parseInt(get("participants") || "1", 10);
  const participants = Number.isFinite(participantsRaw)
    ? Math.min(Math.max(participantsRaw, 1), workshop.offering.capacity)
    : 1;

  const addOnIds = (get("addons") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    /* Drop unknown ids defensively. */
    .filter((id) => workshop.ext.addOns.some((a) => a.id === id));

  const tierId = get("tier") || defaultTier;
  const validTier = workshop.ext.pricingTiers.some((t) => t.id === tierId)
    ? tierId
    : defaultTier;

  return {
    date: get("date") || defaultDate,
    timeSlot: get("time") || defaultTime,
    participants,
    tierId: validTier,
    addOnIds,
    language: get("lang") || defaultLang,
    fullName: get("name"),
    email: get("email"),
    phone: get("phone"),
    notes: get("notes"),
    reference: get("ref"),
  };
}

/* ------------------------- encode to URL ------------------------- */

/** Serialise a partial state update into the next URL. Existing
 *  fields remain in place; the caller can override any of them. */
export function encodeBookingHref(args: {
  workshopId: string;
  step: "date" | "details" | "payment" | "confirmation";
  state: BookingState;
}): string {
  const p = new URLSearchParams();
  if (args.state.date) p.set("date", args.state.date);
  if (args.state.timeSlot) p.set("time", args.state.timeSlot);
  p.set("participants", String(args.state.participants));
  if (args.state.tierId) p.set("tier", args.state.tierId);
  if (args.state.addOnIds.length) p.set("addons", args.state.addOnIds.join(","));
  if (args.state.language) p.set("lang", args.state.language);
  if (args.state.fullName) p.set("name", args.state.fullName);
  if (args.state.email) p.set("email", args.state.email);
  if (args.state.phone) p.set("phone", args.state.phone);
  if (args.state.notes) p.set("notes", args.state.notes);
  if (args.state.reference) p.set("ref", args.state.reference);

  const base = `/booking/${args.workshopId}`;
  switch (args.step) {
    case "date":
      return `${base}?${p.toString()}`;
    case "details":
      return `${base}/details?${p.toString()}`;
    case "payment":
      return `${base}/payment?${p.toString()}`;
    case "confirmation":
      return `${base}/confirmation?${p.toString()}`;
  }
}

/** Generate a deterministic, plausible-looking booking reference from
 *  the workshop id and the booking state. Used on the confirmation
 *  certificate when no real backend has issued one. */
export function generateBookingReference(
  workshopId: string,
  state: BookingState,
): string {
  const seed = `${workshopId}|${state.date}|${state.timeSlot}|${state.fullName}|${state.email}`;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  }
  const block = (h: number) =>
    h.toString(36).toUpperCase().padStart(4, "0").slice(-4);
  const a = block(h);
  h = Math.imul(h, 1597) + 51749;
  const b = block(h >>> 0);
  return `HUN-${a}-${b}`;
}
