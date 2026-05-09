/* =============================================================================
 * scripts/seed-demo-accounts.mts
 *
 * Pre-fills the two demo accounts so /account and /studio show real data
 * the moment a judge logs in.
 *
 *   • Patron (+918888888888) — three workshop bookings + two orders.
 *   • Artisan (+919999999999, Mohammad Yusuf Sheikh) — a couple of
 *     bundles he owns + one minted Sanad.
 *
 * Idempotent enough: re-running adds more rows but never duplicates a
 * masters / workshops row (those come from `seed-backend.mts`). For a
 * clean state, use `backend/scripts/reset_demo.py` to wipe Neon and
 * then re-run both seeds.
 * ========================================================================= */

const API_BASE = process.env.API_BASE ?? "https://hunarmand-backend.onrender.com";
const DEMO_OTP = "123456";

const PATRON_PHONE = "+918888888888";
const ARTISAN_PHONE = "+919999999999";

interface Master {
  id: string;
  name: string;
  lineage_id?: string | null;
  workshop_location?: string | null;
}

interface Workshop {
  id: string;
  master_id: string;
  format: string | null;
  price: number | null;
  duration_mins: number | null;
}

interface Page<T> {
  items: T[];
  total: number;
}

async function call<T>(
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
    throw new Error(`${init.method ?? "GET"} ${path} -> ${res.status} ${text.slice(0, 200)}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function login(phone: string): Promise<string> {
  await call("/api/v1/auth/send-otp", { method: "POST", body: { phone } });
  const tok = await call<{ access_token: string }>("/api/v1/auth/verify-otp", {
    method: "POST",
    body: { phone, otp: DEMO_OTP },
  });
  return tok.access_token;
}

function isoDateInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/* --------------------------- Patron seed -------------------------- */

async function seedPatron() {
  console.log("Seeding patron bookings + orders…");

  // Pick a few workshops to book — variety across crafts looks better
  // on the dashboard than three of the same.
  const masterPage = await call<Page<Master>>(`/api/v1/masters?limit=20`);
  const candidates = [
    "mohammad-yusuf-sheikh",
    "abdul-rashid-bhat",
    "fayaz-ahmad-bhat",
  ];
  const masters = candidates
    .map((slug) => masterPage.items.find((m) => (m.lineage_id ?? "") === slug))
    .filter((m): m is Master => Boolean(m));

  if (masters.length === 0) {
    console.warn("  No seeded masters found; have you run `npm run seed:backend` first?");
    return;
  }

  let bookingsMade = 0;
  for (const [i, master] of masters.entries()) {
    const wsPage = await call<Page<Workshop>>(
      `/api/v1/workshops?master_id=${master.id}&limit=5`,
    );
    if (wsPage.items.length === 0) continue;
    // Spread across different formats and dates so the dashboard
    // looks lived-in.
    const workshop = wsPage.items[i % wsPage.items.length];
    const date = isoDateInDays(7 + i * 11);
    try {
      const r = await call<{ booking_id: string; message: string }>(
        "/api/v1/commerce/book",
        {
          method: "POST",
          body: {
            workshop_id: workshop.id,
            user_phone: PATRON_PHONE,
            date,
            participants: i === 0 ? 2 : 1,
          },
        },
      );
      bookingsMade += 1;
      console.log(
        `  ✓ booking ${bookingsMade}: ${workshop.format} with ${master.name} (${r.booking_id.slice(0, 8)}…)`,
      );
    } catch (err) {
      console.warn(`  ✗ booking ${i}:`, String(err).slice(0, 200));
    }
  }

  // Create / pick a bundle, then check it out under the patron's phone.
  let bundlesCreated = 0;
  let ordersMade = 0;

  // The artisan logs in to create their bundle (auth required for POST).
  try {
    const artisanToken = await login(ARTISAN_PHONE);
    const sanads = await call<Page<{ id: string; piece_name: string }>>(
      `/api/v1/sanad?limit=5`,
    );
    const sanadIds = sanads.items.map((s) => s.id);

    const bundleNames = [
      {
        name: "The Kanihama Heritage Set",
        description: "Hand-knotted pashmina shawl + walnut-wood gift box, both signed.",
        price: 54000,
      },
      {
        name: "Naqashi & Pashmina Diptych",
        description: "A papier-mâché box paired with a Kanihama pashmina stole.",
        price: 32000,
      },
    ];

    for (const b of bundleNames) {
      try {
        const created = await call<{ id: string; name: string }>(
          "/api/v1/bundles",
          {
            method: "POST",
            token: artisanToken,
            body: { ...b, sanad_ids: sanadIds.slice(0, 1) },
          },
        );
        bundlesCreated += 1;
        console.log(`  ✓ bundle: ${created.name} (${created.id.slice(0, 8)}…)`);
      } catch (err) {
        console.warn(`  ✗ bundle ${b.name}:`, String(err).slice(0, 200));
      }
    }
  } catch (err) {
    console.warn("  ✗ artisan login for bundles:", String(err).slice(0, 200));
  }

  // Now check out one or two bundles as the patron.
  try {
    const bundlesPage = await call<Page<{ id: string; name: string }>>(
      `/api/v1/bundles?limit=10`,
    );
    const toBuy = bundlesPage.items.slice(0, 2);
    for (const bundle of toBuy) {
      try {
        const order = await call<{ order_id: string; total_amount_inr: number }>(
          "/api/v1/commerce/checkout",
          {
            method: "POST",
            body: { bundle_id: bundle.id, user_phone: PATRON_PHONE },
          },
        );
        ordersMade += 1;
        console.log(
          `  ✓ order ${ordersMade}: ${bundle.name} (₹${order.total_amount_inr}, ${order.order_id.slice(0, 8)}…)`,
        );
      } catch (err) {
        console.warn(`  ✗ order ${bundle.name}:`, String(err).slice(0, 200));
      }
    }
  } catch (err) {
    console.warn("  ✗ bundle listing:", String(err).slice(0, 200));
  }

  console.log(
    `Patron seed: ${bookingsMade} bookings, ${bundlesCreated} bundles, ${ordersMade} orders.`,
  );
}

/* --------------------------- Driver ------------------------------- */

async function main() {
  console.log(`Seeding demo accounts against ${API_BASE}…`);
  const health = await call<{ status: string; ai_core: { reachable: boolean } }>(
    "/healthz",
  );
  console.log(
    `  backend: ${health.status} · ai_core_reachable=${health.ai_core.reachable}`,
  );

  await seedPatron();

  // Quick state print so the operator knows what landed.
  const b = await call<Page<unknown>>(
    `/api/v1/bookings/me?phone=${encodeURIComponent(PATRON_PHONE)}`,
  );
  const o = await call<Page<unknown>>(
    `/api/v1/orders/me?phone=${encodeURIComponent(PATRON_PHONE)}`,
  );
  console.log(
    `Patron now has ${b.total} bookings and ${o.total} orders on file.`,
  );
}

main().catch((err) => {
  console.error("seed-demo-accounts failed:", err);
  process.exit(1);
});
