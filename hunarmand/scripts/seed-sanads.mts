/* =============================================================================
 * scripts/seed-sanads.mts
 *
 * Pre-mints a couple of Sanads for the demo artisan
 * (+919999999999, Mohammad Yusuf Sheikh) so /sanad,
 * /studio (KPI tile), and the Bazaar provenance pages have
 * real, cryptographically-signed rows out of the box.
 *
 * Requires:
 *   • Backend on Render is up.
 *   • AI core on Hugging Face Spaces is reachable AND has its own tables
 *     (HUNARMAND_SKIP_AUTO_MIGRATE not set, or set to "0", on the Space).
 *     Without this, /sanad/keys returns 500.
 *
 * Idempotency: re-running adds new rows. To keep the dashboard tidy,
 * run once after a fresh `seed:demo-accounts`.
 * ========================================================================= */

const API_BASE = process.env.API_BASE ?? "https://hunarmand-backend.onrender.com";
const DEMO_OTP = "123456";
const ARTISAN_PHONE = "+919999999999";

interface MasterMe {
  id: string;
  name: string;
  workshop_location?: string | null;
  lineage_id?: string | null;
}

interface SanadEnvelope {
  signature: string;
  qr_string: string;
  sanad_db_id?: string | null;
  provenance_url?: string | null;
  payload: { sanad_id: string };
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
    throw new Error(`${init.method ?? "GET"} ${path} -> ${res.status} ${text.slice(0, 250)}`);
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

function todayIso(): string {
  return new Date().toISOString();
}

function dateStringDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

interface PieceSpec {
  short_summary: string;
  piece_id: string;
  sanad_id: string;
  craft_category: string;
  technique_names: string[];
  materials_summary: string[];
  made_at_workshop: string;
  completed_on: string;
  fair_price_band: string;
}

const PIECES: PieceSpec[] = [
  {
    short_summary: "Kani-buti pashmina shawl, Kanihama tradition",
    piece_id: "MYS-2026-001",
    sanad_id: "MYS-SANAD-2026-001",
    craft_category: "pashmina_weaving",
    technique_names: ["kani_weave", "buta_motif", "twill_finish"],
    materials_summary: ["Changthangi pashmina (Ladakh)", "natural walnut dye"],
    made_at_workshop: "Kanihama, Budgam",
    completed_on: dateStringDaysAgo(14),
    fair_price_band: "₹85,000 – ₹1,10,000",
  },
  {
    short_summary: "Shawl-e-Khasa, fine pashmina with lotus border",
    piece_id: "MYS-2026-002",
    sanad_id: "MYS-SANAD-2026-002",
    craft_category: "pashmina_weaving",
    technique_names: ["fine_pashmina", "lotus_border", "single_warp"],
    materials_summary: ["Changthangi pashmina (Ladakh)", "indigo dye"],
    made_at_workshop: "Kanihama, Budgam",
    completed_on: dateStringDaysAgo(31),
    fair_price_band: "₹65,000 – ₹85,000",
  },
];

async function main() {
  console.log(`Seeding sanads against ${API_BASE}…`);

  const health = await call<{ status: string; ai_core: { reachable: boolean } }>(
    "/healthz",
  );
  console.log(
    `  backend: ${health.status} · ai_core_reachable=${health.ai_core.reachable}`,
  );
  if (!health.ai_core.reachable) {
    console.warn(
      "  AI core not reachable — sanad minting will fail. " +
        "Check the Hugging Face Space and HUNARMAND_SKIP_AUTO_MIGRATE setting.",
    );
  }

  const token = await login(ARTISAN_PHONE);
  const me = await call<MasterMe>("/api/v1/masters/me/full", { token });
  console.log(`  artisan: ${me.name} (${me.id})`);

  // Idempotency: ensure the keypair exists. Same version twice is a no-op
  // server-side because the AI core uses ON CONFLICT DO NOTHING semantics.
  try {
    await call("/api/v1/sanad/keys", {
      method: "POST",
      token,
      body: { version: 1 },
    });
    console.log("  ✓ keypair ready");
  } catch (err) {
    console.error(
      "  ✗ /sanad/keys failed — flip HUNARMAND_SKIP_AUTO_MIGRATE off on the AI Space.",
      String(err).slice(0, 250),
    );
    process.exit(1);
  }

  let minted = 0;
  for (const piece of PIECES) {
    try {
      const env = await call<SanadEnvelope>("/api/v1/sanad/sign", {
        method: "POST",
        token,
        body: {
          payload: {
            ...piece,
            issued_at: todayIso(),
            lineage: {
              master_id: me.id,
              master_name: me.name,
              village: me.workshop_location ?? "Kanihama, Budgam",
              lineage_chain: [me.name, "Bashir Sheikh", "Mohammad Sheikh"],
            },
          },
          include_qr_image: true,
        },
      });
      minted += 1;
      console.log(
        `  ✓ sanad ${minted}: "${piece.short_summary}" (db=${env.sanad_db_id ?? "<not-persisted>"})`,
      );
    } catch (err) {
      console.warn(`  ✗ sanad ${piece.sanad_id}:`, String(err).slice(0, 250));
    }
  }

  // Print final state.
  const list = await call<{ total: number }>(
    `/api/v1/sanad?master_id=${me.id}&limit=10`,
  );
  console.log(`Artisan now has ${list.total} sanads on file.`);
}

main().catch((err) => {
  console.error("seed-sanads failed:", err);
  process.exit(1);
});
