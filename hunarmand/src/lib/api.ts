/* =========================================================================
 * Typed HTTP client for the Hunarmand backend.
 *
 * Convention:
 *
 *   • All endpoints under /api/v1.
 *   • JSON in, JSON out.
 *   • JWT in the Authorization header for any endpoint that takes one;
 *     callers pass the token explicitly so the same client works for
 *     server components, client components, and hooks alike.
 *   • Every error becomes an `ApiError` with a status + message; the
 *     UI can match on status codes.
 * ========================================================================= */

import { API_BASE_URL } from "./env";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/* ─────────────────────────── Core fetch ─────────────────────────── */

interface RequestInitJson {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  /** Skip the default credentials handling (used for the auth endpoints). */
  noAuth?: boolean;
}

async function request<T>(path: string, init: RequestInitJson = {}): Promise<T> {
  const { method = "GET", body, token, query, signal } = init;

  const url = new URL(
    path.startsWith("http") ? path : `${API_BASE_URL}${path}`,
  );
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      cache: "no-store",
    });
  } catch (err) {
    throw new ApiError(
      err instanceof Error ? err.message : "Network error",
      0,
      null,
    );
  }

  let data: unknown = null;
  const ct = res.headers.get("content-type") ?? "";
  if (res.status !== 204 && ct.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : null) ?? res.statusText ?? `HTTP ${res.status}`;
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

/* ─────────────────────────── Types ─────────────────────────── */

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface MasterPublic {
  id: string;
  name: string;
  lineage_id?: string | null;
  workshop_location?: string | null;
  bio?: string | null;
  ed25519_public_key?: string | null;
  created_at: string;
}

export interface MasterPrivate extends MasterPublic {
  phone: string;
}

export interface WorkshopWithMaster {
  id: string;
  master_id: string;
  format?: string | null;
  price?: number | null;
  duration_mins?: number | null;
  description?: string | null;
  is_active: boolean;
  master_name: string;
  master_workshop_location?: string | null;
}

export interface BookingWithWorkshop {
  id: string;
  workshop_id: string;
  user_phone: string;
  booking_date: string;
  status?: string | null;
  payment_id?: string | null;
  num_participants: number;
  created_at: string;
  workshop_format?: string | null;
  workshop_price?: number | null;
  master_id?: string | null;
  master_name?: string | null;
}

export interface BundlePublic {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  sanad_ids: string[];
  created_at: string;
}

export interface OrderWithBundle {
  id: string;
  bundle_id?: string | null;
  user_phone: string;
  status?: string | null;
  shipping_address?: string | null;
  payment_id?: string | null;
  created_at: string;
  bundle_name?: string | null;
  bundle_price?: number | null;
}

export interface VaultPublic {
  id: string;
  master_id: string;
  media_s3_key?: string | null;
  status?: string | null;
  recorded_at?: string | null;
  created_at: string;
}

export interface SanadCard {
  id: string;
  piece_name: string;
  material_origin?: string | null;
  is_public: boolean;
  artisan_name?: string | null;
  artisan_id?: string | null;
  created_at: string;
}

export interface SanadSignPayload {
  sanad_id: string;
  piece_id: string;
  craft_category: string;
  technique_ids?: string[];
  technique_names?: string[];
  materials_summary?: string[];
  made_at_workshop?: string | null;
  completed_on: string;
  issued_at: string;
  lineage: {
    master_id: string;
    master_name: string;
    generation?: number | null;
    village?: string | null;
    lineage_chain?: string[];
  };
  short_summary: string;
  fair_price_band?: string | null;
  extras?: Record<string, string | number | boolean>;
}

export interface SanadEnvelope {
  header: { alg: string; kid: string; typ?: string };
  payload: SanadSignPayload;
  signature: string;
  qr_string: string;
  qr_image_base64?: string | null;
  public_url?: string | null;
  /** Backend-issued UUID for the local sanads row (post-PR mint flow). */
  sanad_db_id?: string | null;
  /** Convenience URL for the buyer-facing provenance page. */
  provenance_url?: string | null;
}

export interface FeedResponse {
  masters: Array<{
    id: string;
    name: string;
    workshop_location?: string | null;
    bio?: string | null;
  }>;
  workshops: Array<{
    id: string;
    master_id: string;
    master_name?: string | null;
    format?: string | null;
    price?: number | null;
    duration_mins?: number | null;
  }>;
  bundles: Array<{
    id: string;
    name: string;
    description?: string | null;
    price?: number | null;
  }>;
  sanads: Array<{
    id: string;
    piece_name: string;
    artisan_name?: string | null;
    material_origin?: string | null;
    created_at: string;
  }>;
}

/* ─────────────────────────── Endpoint helpers ─────────────────────────── */

export const api = {
  /* Auth */
  auth: {
    sendOtp: (phone: string) =>
      request<{ message: string }>("/api/v1/auth/send-otp", {
        method: "POST",
        body: { phone },
      }),
    verifyOtp: (phone: string, otp: string) =>
      request<{ access_token: string; token_type: string }>(
        "/api/v1/auth/verify-otp",
        { method: "POST", body: { phone, otp } },
      ),
    me: (token: string) =>
      request<MasterPublic>("/api/v1/auth/me", { token }),
  },

  /* Masters */
  masters: {
    list: (q?: string, limit = 20, offset = 0) =>
      request<Paginated<MasterPublic>>("/api/v1/masters", {
        query: { q, limit, offset },
      }),
    get: (id: string) => request<MasterPublic>(`/api/v1/masters/${id}`),
    meFull: (token: string) =>
      request<MasterPrivate>("/api/v1/masters/me/full", { token }),
    updateMe: (
      token: string,
      patch: Partial<{
        name: string;
        lineage_id: string;
        workshop_location: string;
        bio: string;
      }>,
    ) =>
      request<MasterPrivate>("/api/v1/masters/me", {
        method: "PUT",
        body: patch,
        token,
      }),
  },

  /* Workshops */
  workshops: {
    list: (params: { master_id?: string; limit?: number; offset?: number } = {}) =>
      request<Paginated<WorkshopWithMaster>>("/api/v1/workshops", {
        query: { master_id: params.master_id, limit: params.limit ?? 20, offset: params.offset ?? 0 },
      }),
    get: (id: string) => request<WorkshopWithMaster>(`/api/v1/workshops/${id}`),
    create: (
      token: string,
      body: { format: string; price: number; duration_mins: number; description?: string },
    ) =>
      request<WorkshopWithMaster>("/api/v1/workshops", {
        method: "POST",
        body,
        token,
      }),
    update: (
      token: string,
      id: string,
      patch: Partial<{
        format: string;
        price: number;
        duration_mins: number;
        description: string;
        is_active: boolean;
      }>,
    ) =>
      request<WorkshopWithMaster>(`/api/v1/workshops/${id}`, {
        method: "PUT",
        body: patch,
        token,
      }),
    delete: (token: string, id: string) =>
      request<void>(`/api/v1/workshops/${id}`, { method: "DELETE", token }),
  },

  /* Bookings */
  bookings: {
    listMine: (phone: string, limit = 20, offset = 0) =>
      request<Paginated<BookingWithWorkshop>>("/api/v1/bookings/me", {
        query: { phone, limit, offset },
      }),
    create: (workshop_id: string, user_phone: string, date: string, participants: number) =>
      request<{ status: string; booking_id: string; message: string; payment_status: string }>(
        "/api/v1/commerce/book",
        {
          method: "POST",
          body: { workshop_id, user_phone, date, participants },
        },
      ),
  },

  /* Bundles */
  bundles: {
    list: (limit = 20, offset = 0) =>
      request<Paginated<BundlePublic>>("/api/v1/bundles", {
        query: { limit, offset },
      }),
    get: (id: string) => request<BundlePublic>(`/api/v1/bundles/${id}`),
  },

  /* Orders */
  orders: {
    listMine: (phone: string, limit = 20, offset = 0) =>
      request<Paginated<OrderWithBundle>>("/api/v1/orders/me", {
        query: { phone, limit, offset },
      }),
    checkout: (bundle_id: string, user_phone: string) =>
      request<{
        status: string;
        order_id: string;
        total_amount_inr: number;
        split_breakdown: { artisan_receives_inr: number; platform_fee_inr: number };
        payment_gateway: { session_id: string; checkout_url: string };
      }>("/api/v1/commerce/checkout", {
        method: "POST",
        body: { bundle_id, user_phone },
      }),
  },

  /* Vaults */
  vaults: {
    listMine: (token: string, limit = 20, offset = 0) =>
      request<Paginated<VaultPublic>>("/api/v1/vaults/me", {
        token,
        query: { limit, offset },
      }),
  },

  /* Sanad */
  sanad: {
    listPublic: (master_id?: string, limit = 20, offset = 0) =>
      request<Paginated<SanadCard>>("/api/v1/sanad", {
        query: { master_id, limit, offset },
      }),
    keys: (token: string, version = 1) =>
      request<{
        master_id: string;
        key_version: number;
        public_key_b64: string;
        kid: string;
      }>("/api/v1/sanad/keys", {
        method: "POST",
        token,
        body: { version },
      }),
    sign: (
      token: string,
      payload: SanadSignPayload,
      include_qr_image = true,
    ) =>
      request<SanadEnvelope>("/api/v1/sanad/sign", {
        method: "POST",
        token,
        body: { payload, include_qr_image },
      }),
    verify: (qr_string: string, public_key_b64?: string) =>
      request<{
        valid: boolean;
        sanad_id?: string | null;
        master_id?: string | null;
        master_name?: string | null;
        reason?: string | null;
      }>("/api/v1/sanad/verify", {
        method: "POST",
        body: { qr_string, public_key_b64 },
      }),
    /** Per-piece DB lookup — drives the public provenance page. */
    detail: (id: string) =>
      request<{
        sanad_id: string;
        piece_name: string;
        material_origin?: string | null;
        signature_hex?: string | null;
        is_public: boolean;
        artisan: string;
        metadata_json?: Record<string, unknown> | null;
      }>(`/api/v1/sanad/${id}`),
    /** Absolute URL for the URL-style QR (PNG). The endpoint streams
     *  the image directly so we point an `<img>` tag at it. */
    qrUrl: (id: string) => `${API_BASE_URL}/api/v1/sanad/${id}/qr`,
  },

  /* Feed */
  feed: () => request<FeedResponse>("/api/v1/feed"),

  /* Health */
  healthz: () =>
    request<{
      status: string;
      embedding_dim: number;
      ai_core: { reachable: boolean; url: string };
    }>("/healthz"),
};
