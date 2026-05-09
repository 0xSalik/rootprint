/* =============================================================================
 * scripts/seed-backend.mts
 *
 * Idempotent loader that walks every artisan in `lib/data.ts`, signs them
 * in via the mock OTP path, and creates their three canonical workshops
 * (heritage walk / half-day / multi-day) on the live backend.
 *
 * Why not a SQL script? The frontend's `lib/data.ts` is the single source
 * of truth for the showcase content. Using the backend's own auth + REST
 * API to seed proves the integration end-to-end and means the demo flow
 * the patron uses (book a workshop, see it in /account) goes through the
 * exact same code paths as a real customer.
 *
 * Run:
 *
 *   cd hunarmand
 *   npm run seed:backend
 *   # or, against a different backend:
 *   API_BASE=https://hunarmand-backend.onrender.com npm run seed:backend
 *
 * Each artisan gets a deterministic phone derived from their slug
 * so re-running the seed updates the same master rows in place.
 *
 * Phone for the canonical "demo artisan" stays at +919999999999 (matches
 * `backend/scripts/reset_demo.py`) so the dashboard / login flow keeps
 * working.
 * ========================================================================= */

import { ARTISANS_DATA, CRAFTS, WORKSHOPS, type Artisan, type WorkshopOffering } from "../lib/data.ts";

const API_BASE = process.env.API_BASE ?? "https://hunarmand-backend.onrender.com";
const DEMO_OTP = "123456";
const DEMO_ARTISAN_SLUG = "mohammad-yusuf-sheikh";
const DEMO_ARTISAN_PHONE = "+919999999999";

interface AuthToken {
  access_token: string;
  token_type: string;
}

interface BackendWorkshop {
  id: string;
  master_id: string;
  format: string | null;
  price: number | null;
  duration_mins: number | null;
  description: string | null;
  is_active: boolean;
}

interface Page<T> {
  items: T[];
  total: number;
}

/* --------------------------- Helpers ------------------------------ */

/** Deterministic phone for any artisan slug. The demo artisan keeps the
 *  canonical +919999999999. Everyone else gets +91 + a 10-digit hash. */
function phoneFor(slug: string): string {
  if (slug === DEMO_ARTISAN_SLUG) return DEMO_ARTISAN_PHONE;
  // FNV-1a 32-bit. Plain JS numbers; collision risk is fine for a demo seed.
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  const tail = (h % 1_000_000_000).toString().padStart(9, "0");
  const first = ((h >>> 28) % 3) + 7; // 7, 8, or 9 (Indian mobile prefixes)
  return `+91${first}${tail}`;
}

function durationMinutes(duration: string): number {
  /* "2–3 hours" → 180; "4 hours" → 240; "3 days" → 720 (2 working days * 6h) */
  if (duration.includes("day")) {
    const m = duration.match(/(\d+)/);
    const days = m ? Number(m[1]) : 1;
    return days * 360; // 6 hour days
  }
  const m = duration.match(/(\d+)(?:[–-](\d+))?\s*hour/);
  if (!m) return 120;
  const lo = Number(m[1]);
  const hi = m[2] ? Number(m[2]) : lo;
  return Math.round(((lo + hi) / 2) * 60);
}

function workshopDescription(artisan: Artisan, offering: WorkshopOffering): string {
  const craft = CRAFTS[artisan.craft];
  return [
    offering.description,
    `With ${artisan.name}, ${artisan.generation === 1 ? "1st" : artisan.generation === 2 ? "2nd" : artisan.generation === 3 ? "3rd" : `${artisan.generation}th`} generation ${craft.name.toLowerCase()} master in ${artisan.village}.`,
    `Capacity ${offering.capacity} guest${offering.capacity === 1 ? "" : "s"}. Available in: ${offering.seasons.join(", ")}.`,
  ].join("\n\n");
}

async function api<T>(
  path: string,
  init: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (init.token) headers["Authorization"] = `Bearer ${init.token}`;
  const res = await fetch(url, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${init.method ?? "GET"} ${path} → ${res.status} ${text.slice(0, 200)}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function login(phone: string): Promise<string> {
  await api("/api/v1/auth/send-otp", { method: "POST", body: { phone } });
  const tok = await api<AuthToken>("/api/v1/auth/verify-otp", {
    method: "POST",
    body: { phone, otp: DEMO_OTP },
  });
  return tok.access_token;
}

async function updateProfile(token: string, artisan: Artisan): Promise<void> {
  const craft = CRAFTS[artisan.craft];
  const bio = [
    artisan.bio,
    artisan.irreplaceable,
    `${craft.name} · ${artisan.generation}${artisan.generation === 1 ? "st" : artisan.generation === 2 ? "nd" : artisan.generation === 3 ? "rd" : "th"} generation · est. ${artisan.lineageEstYear}`,
  ].join(" — ");
  await api("/api/v1/masters/me", {
    method: "PUT",
    token,
    body: {
      name: artisan.name,
      lineage_id: artisan.slug,
      workshop_location: `${artisan.village}, ${artisan.district}, J&K`,
      bio,
    },
  });
}

async function clearExistingWorkshops(token: string, masterId: string): Promise<void> {
  const page = await api<Page<BackendWorkshop>>(
    `/api/v1/workshops?master_id=${masterId}&is_active=true&limit=100`,
  );
  // Try with is_active=false too so we hard-delete soft-deleted ones from
  // a previous run as well — the list endpoint defaults to is_active=true,
  // so we only get the live ones here, which is fine.
  for (const w of page.items) {
    try {
      await api(`/api/v1/workshops/${w.id}`, { method: "DELETE", token });
    } catch {
      /* swallow — soft-delete may already be in place */
    }
  }
}

async function createWorkshops(token: string, artisan: Artisan): Promise<number> {
  let count = 0;
  for (const offering of WORKSHOPS) {
    await api("/api/v1/workshops", {
      method: "POST",
      token,
      body: {
        format: `${offering.title} · ${CRAFTS[artisan.craft].name.split(" / ")[0]}`,
        price: offering.pricePerPerson,
        duration_mins: durationMinutes(offering.duration),
        description: workshopDescription(artisan, offering),
      },
    });
    count++;
  }
  return count;
}

/* --------------------------- Driver ------------------------------- */

async function main() {
  console.log(`Seeding ${ARTISANS_DATA.length} artisans against ${API_BASE}…`);

  // Sanity probe: backend must be live.
  const health = await fetch(`${API_BASE}/healthz`).then((r) => r.json());
  console.log(
    `Backend healthz: status=${health.status}, ai_core_reachable=${health.ai_core?.reachable ?? "?"}`,
  );

  let totalWorkshops = 0;
  let totalArtisans = 0;
  const fails: Array<{ slug: string; error: string }> = [];

  for (const artisan of ARTISANS_DATA) {
    const phone = phoneFor(artisan.slug);
    try {
      const token = await login(phone);
      const me = await api<{ id: string }>("/api/v1/auth/me", { token });
      await updateProfile(token, artisan);
      await clearExistingWorkshops(token, me.id);
      const made = await createWorkshops(token, artisan);
      totalWorkshops += made;
      totalArtisans += 1;
      console.log(`  ✓ ${artisan.name} (${phone}) — ${made} workshops`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      fails.push({ slug: artisan.slug, error: msg });
      console.warn(`  ✗ ${artisan.name} (${phone}) — ${msg}`);
    }
  }

  console.log("");
  console.log(`Done. ${totalArtisans}/${ARTISANS_DATA.length} artisans seeded, ${totalWorkshops} workshops total.`);
  if (fails.length) {
    console.log(`Failures: ${fails.length}`);
    for (const f of fails) console.log(`  ${f.slug}: ${f.error}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
