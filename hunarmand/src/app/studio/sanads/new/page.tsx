"use client";

import * as React from "react";
import Link from "next/link";

import { useRequireAuth } from "@/lib/auth";
import {
  api,
  ApiError,
  type SanadEnvelope,
  type SanadSignPayload,
} from "@/lib/api";
import { HashiaBorder } from "@/components/motifs";

/* -------------------------------------------------------------------------
 * /studio/sanads/new — mint a Sanad for a finished piece
 *
 * The cryptographic flow:
 *
 *   1. Ensure the master has a keypair on the AI core. We POST
 *      /api/v1/sanad/keys (idempotent on the same version) before the
 *      first sign of the session.
 *   2. POST /api/v1/sanad/sign with the piece metadata. The AI core
 *      canonicalises the payload (RFC 8785 JCS), signs with the
 *      master's Ed25519 private key, and returns the QR-encodable
 *      JWS-compact envelope plus a PNG of the QR. The backend
 *      mirrors the row into its own `sanads` table and returns a
 *      DB UUID we use as the public provenance link.
 *
 * After a successful mint we render two QRs side by side:
 *
 *   • The cryptographic JWS QR (offline-verifiable; any phone with the
 *     master's public key in cache can validate without internet).
 *   • The URL QR (points at /api/v1/sanad/<uuid>; what a buyer in the
 *     bazaar would scan to see the piece's provenance page).
 * ----------------------------------------------------------------------- */

const TODAY = new Date().toISOString().slice(0, 10);

interface FormState {
  short_summary: string;
  craft_category: string;
  piece_id: string;
  sanad_id: string;
  technique_names: string;
  materials_summary: string;
  made_at_workshop: string;
  completed_on: string;
  fair_price_band: string;
}

const INITIAL_FORM: FormState = {
  short_summary: "",
  craft_category: "pashmina_weaving",
  piece_id: "",
  sanad_id: "",
  technique_names: "",
  materials_summary: "",
  made_at_workshop: "",
  completed_on: TODAY,
  fair_price_band: "",
};

const CRAFT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "pashmina_weaving", label: "Pashmina Weaving" },
  { value: "sozni_embroidery", label: "Sozni Embroidery" },
  { value: "kani_weaving", label: "Kani Weaving" },
  { value: "naqashi_papier_mache", label: "Papier-mâché / Naqashi" },
  { value: "walnut_wood_carving", label: "Walnut Wood Carving" },
  { value: "khatamband", label: "Khatamband" },
  { value: "carpet_hand_knotted", label: "Hand-knotted Carpet" },
];

const PIECE_PRESETS: Array<Pick<FormState, "short_summary" | "craft_category" | "technique_names" | "materials_summary" | "fair_price_band">> = [
  {
    short_summary: "Kani-buti pashmina shawl, 4th-gen Kanihama lineage",
    craft_category: "pashmina_weaving",
    technique_names: "Kani-buti twill-tapestry, 1940s Srinagar knot",
    materials_summary: "Changthangi pashmina wool, Banarasi silk warp, natural madder dye",
    fair_price_band: "INR 38,000 - 55,000",
  },
  {
    short_summary: "Sozni-embroidered pashmina stole, hand-count hashia",
    craft_category: "sozni_embroidery",
    technique_names: "Magnifier-grade sozni, hashia border composition",
    materials_summary: "Hand-spun pashmina ground, hand-twisted silk thread",
    fair_price_band: "INR 22,000 - 35,000",
  },
  {
    short_summary: "Naqashi papier-mâché box, gold-leaf on cobalt",
    craft_category: "naqashi_papier_mache",
    technique_names: "Layered gold-leaf naqashi, 14-layer hand lacquer",
    materials_summary: "Hand-pulped paper body, mineral pigment, 22-carat gold leaf",
    fair_price_band: "INR 8,500 - 14,000",
  },
];

function generatePieceId(slugLike: string): string {
  const random = Math.floor(Math.random() * 9000) + 1000;
  const date = new Date();
  const yymm = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const prefix = (slugLike || "PCE").toUpperCase().slice(0, 3);
  return `${prefix}-${yymm}-${random}`;
}

function generateSanadId(prefix: string): string {
  const random = Math.floor(Math.random() * 9000) + 1000;
  const date = new Date();
  const yyyy = date.getFullYear();
  return `${prefix.toUpperCase().slice(0, 3)}-${yyyy}-${String(random).padStart(4, "0")}`;
}

export default function MintSanadPage() {
  const auth = useRequireAuth();
  const [form, setForm] = React.useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [envelope, setEnvelope] = React.useState<SanadEnvelope | null>(null);

  // Default workshop_location, generated piece IDs, etc. — populate
  // once the master profile is loaded.
  React.useEffect(() => {
    if (!auth.master) return;
    setForm((prev) => ({
      ...prev,
      made_at_workshop: prev.made_at_workshop || (auth.master?.workshop_location ?? ""),
      piece_id: prev.piece_id || generatePieceId(auth.master?.lineage_id ?? "PCE"),
      sanad_id: prev.sanad_id || generateSanadId(auth.master?.lineage_id ?? "SND"),
    }));
  }, [auth.master]);

  function applyPreset(preset: typeof PIECE_PRESETS[number]) {
    setForm((prev) => ({
      ...prev,
      ...preset,
      // keep IDs + completion date + workshop intact
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!auth.token || !auth.master) return;
    setSubmitting(true);
    setError(null);
    setEnvelope(null);

    try {
      // Step 1: ensure the master has a keypair on the AI core.
      // Re-issuing for the same version is generally cheap; AI core
      // tolerates re-runs idempotently within the same KEK fingerprint.
      try {
        await api.sanad.keys(auth.token, 1);
      } catch (err) {
        // If keys already exist with a different version we still
        // proceed; the sign endpoint resolves the active key.
        if (
          !(err instanceof ApiError) ||
          (err.status !== 400 && err.status !== 409)
        ) {
          // Fall through; the sign call will surface the real error.
        }
      }

      // Always mint a fresh (sanad_id, piece_id) pair at submit time.
      // The form fields are auto-populated for display, but the AI core
      // enforces a unique index on sanad_id_public — reusing the field's
      // stale value across two submits would 500 the second mint. We
      // also push the freshly-minted ids back into form state so the
      // visible inputs reflect what we actually signed.
      const sanadIdForThisMint = generateSanadId(
        auth.master?.lineage_id ?? "SND",
      );
      const pieceIdForThisMint = generatePieceId(
        auth.master?.lineage_id ?? "PCE",
      );
      setForm((prev) => ({
        ...prev,
        sanad_id: sanadIdForThisMint,
        piece_id: pieceIdForThisMint,
      }));

      const payload: SanadSignPayload = {
        sanad_id: sanadIdForThisMint,
        piece_id: pieceIdForThisMint,
        craft_category: form.craft_category,
        technique_names: form.technique_names
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        materials_summary: form.materials_summary
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        made_at_workshop: form.made_at_workshop.trim() || null,
        completed_on: new Date(form.completed_on + "T00:00:00Z").toISOString(),
        issued_at: new Date().toISOString(),
        lineage: {
          master_id: auth.master.id,
          master_name: auth.master.name,
          village: auth.master.workshop_location ?? null,
          lineage_chain: [],
        },
        short_summary: form.short_summary.trim() || "Authenticated heritage piece.",
        fair_price_band: form.fair_price_band.trim() || null,
      };

      const result = await api.sanad.sign(auth.token, payload, true);
      setEnvelope(result);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.status === 0
            ? "Cannot reach the backend. Check your network."
            : err.message
          : err instanceof Error
            ? err.message
            : "Mint failed.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function startNew() {
    setEnvelope(null);
    setError(null);
    setForm({
      ...INITIAL_FORM,
      made_at_workshop: auth.master?.workshop_location ?? "",
      piece_id: generatePieceId(auth.master?.lineage_id ?? "PCE"),
      sanad_id: generateSanadId(auth.master?.lineage_id ?? "SND"),
      completed_on: TODAY,
    });
  }

  if (!auth.hydrated || !auth.token) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center pt-24 text-ink-faded">
        <span className="font-mono text-[12px] uppercase tracking-[0.22em]">Loading…</span>
      </main>
    );
  }

  return (
    <main className="bg-parchment pt-24 pb-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="mb-2 flex items-center gap-3 text-ink-faded">
          <Link
            href="/studio"
            className="font-mono text-[11px] uppercase tracking-[0.22em] hover:text-brand"
          >
            ← Studio
          </Link>
        </div>
        <h1 className="font-display text-[40px] leading-tight text-ink">
          Mint a Sanad
        </h1>
        <p className="mt-1 font-body text-[14px] text-ink-faded">
          Cryptographically authenticate a finished piece. The Sanad is signed
          under your Ed25519 master keypair using RFC 8785 canonicalisation,
          then mirrored into the public registry so a buyer scanning the QR
          can verify it offline.
        </p>
        <HashiaBorder className="mt-5 h-3 w-full text-gold" />

        {envelope ? (
          <SuccessPanel envelope={envelope} onMintAnother={startNew} />
        ) : (
          <FormPanel
            form={form}
            setForm={setForm}
            applyPreset={applyPreset}
            submitting={submitting}
            error={error}
            onSubmit={submit}
          />
        )}
      </div>
    </main>
  );
}

/* ─────────────────────────── form panel ─────────────────────────── */

function FormPanel({
  form,
  setForm,
  applyPreset,
  submitting,
  error,
  onSubmit,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  applyPreset: (p: typeof PIECE_PRESETS[number]) => void;
  submitting: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <>
      <section className="mt-10 rounded-craft border border-line bg-paper px-6 py-6">
        <h2 className="font-display text-[22px] leading-tight text-ink">
          Quick presets
        </h2>
        <p className="mt-1 font-body text-[13px] text-ink-faded">
          Pre-fill the form for a typical piece, then edit anything.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {PIECE_PRESETS.map((preset) => (
            <button
              key={preset.short_summary}
              type="button"
              onClick={() => applyPreset(preset)}
              className="group rounded-craft border border-line bg-parchment px-4 py-3 text-left transition-colors hover:border-brand"
            >
              <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-faded">
                {preset.craft_category.replace(/_/g, " ")}
              </span>
              <div className="mt-1.5 font-display text-[16px] leading-tight text-ink">
                {preset.short_summary}
              </div>
              <div className="mt-1 font-body text-[12px] text-ink-faded">
                {preset.fair_price_band}
              </div>
            </button>
          ))}
        </div>
      </section>

      <form
        onSubmit={onSubmit}
        className="mt-8 grid gap-5 rounded-craft border border-line bg-paper px-6 py-6"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Short summary" full>
            <input
              required
              type="text"
              maxLength={240}
              value={form.short_summary}
              onChange={(e) => setForm({ ...form, short_summary: e.target.value })}
              className="w-full rounded-craft border border-line bg-paper px-3.5 py-2.5 font-body text-[14px] text-ink outline-none focus:border-brand"
              placeholder="One sentence the buyer reads on the provenance page."
            />
          </Field>

          <Field label="Craft category">
            <select
              required
              value={form.craft_category}
              onChange={(e) => setForm({ ...form, craft_category: e.target.value })}
              className="w-full rounded-craft border border-line bg-paper px-3.5 py-2.5 font-body text-[14px] text-ink outline-none focus:border-brand"
            >
              {CRAFT_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Completed on">
            <input
              required
              type="date"
              value={form.completed_on}
              onChange={(e) => setForm({ ...form, completed_on: e.target.value })}
              className="w-full rounded-craft border border-line bg-paper px-3.5 py-2.5 font-mono text-[13.5px] text-ink outline-none focus:border-brand"
            />
          </Field>

          <Field label="Piece ID (auto)">
            <input
              type="text"
              value={form.piece_id}
              readOnly
              className="w-full cursor-not-allowed rounded-craft border border-line bg-parchment px-3.5 py-2.5 font-mono text-[13px] text-ink-faded outline-none"
              placeholder="auto-generated on mint"
            />
          </Field>

          <Field label="Sanad ID (auto)">
            <input
              type="text"
              value={form.sanad_id}
              readOnly
              className="w-full cursor-not-allowed rounded-craft border border-line bg-parchment px-3.5 py-2.5 font-mono text-[13px] text-ink-faded outline-none"
              placeholder="auto-generated on mint"
            />
          </Field>

          <Field label="Techniques used (comma-separated)" full>
            <input
              type="text"
              value={form.technique_names}
              onChange={(e) => setForm({ ...form, technique_names: e.target.value })}
              className="w-full rounded-craft border border-line bg-paper px-3.5 py-2.5 font-body text-[14px] text-ink outline-none focus:border-brand"
              placeholder="Kani-buti twill-tapestry, 1940s Srinagar knot"
            />
          </Field>

          <Field label="Materials (comma-separated)" full>
            <input
              type="text"
              value={form.materials_summary}
              onChange={(e) => setForm({ ...form, materials_summary: e.target.value })}
              className="w-full rounded-craft border border-line bg-paper px-3.5 py-2.5 font-body text-[14px] text-ink outline-none focus:border-brand"
              placeholder="Changthangi pashmina wool, natural madder dye"
            />
          </Field>

          <Field label="Made at (workshop)" full>
            <input
              type="text"
              value={form.made_at_workshop}
              onChange={(e) => setForm({ ...form, made_at_workshop: e.target.value })}
              className="w-full rounded-craft border border-line bg-paper px-3.5 py-2.5 font-body text-[14px] text-ink outline-none focus:border-brand"
              placeholder="Kanihama, Budgam"
            />
          </Field>

          <Field label="Fair price band" full>
            <input
              type="text"
              value={form.fair_price_band}
              onChange={(e) => setForm({ ...form, fair_price_band: e.target.value })}
              className="w-full rounded-craft border border-line bg-paper px-3.5 py-2.5 font-mono text-[13.5px] text-ink outline-none focus:border-brand"
              placeholder="INR 38,000 - 55,000"
            />
          </Field>
        </div>

        {error ? (
          <div className="rounded-craft border border-brand/30 bg-brand-subtle px-4 py-3 font-body text-[13px] text-brand">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-craft bg-brand px-5 py-2.5 font-ui text-[14px] tracking-wide text-ink-inverse hover:bg-brand-light disabled:opacity-60"
          >
            {submitting ? "Signing…" : "Mint Sanad"}
          </button>
        </div>
      </form>

      <section className="mt-10 rounded-craft border border-dashed border-line bg-parchment px-6 py-6">
        <h3 className="font-display text-[18px] leading-tight text-ink">
          What happens when you click "Mint Sanad"
        </h3>
        <ol className="mt-3 grid gap-2 font-body text-[13.5px] text-ink-faded">
          <li>
            <span className="font-mono text-ink">1.</span> The backend confirms
            you have an Ed25519 keypair on file. If not, one is minted under
            your master ID and stored encrypted at rest.
          </li>
          <li>
            <span className="font-mono text-ink">2.</span> The piece metadata is
            canonicalised (RFC 8785 JCS) and signed under your private key.
          </li>
          <li>
            <span className="font-mono text-ink">3.</span> The signed envelope
            is mirrored into the public registry. The QR encodes the
            JWS-compact triple <code>header.payload.signature</code>; any
            verifier with your public key can validate it offline.
          </li>
        </ol>
      </section>
    </>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={["grid gap-1.5", full ? "md:col-span-2" : ""].join(" ")}>
      <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-faded">
        {label}
      </span>
      {children}
    </label>
  );
}

/* ─────────────────────────── success panel ─────────────────────────── */

function SuccessPanel({
  envelope,
  onMintAnother,
}: {
  envelope: SanadEnvelope;
  onMintAnother: () => void;
}) {
  const [copied, setCopied] = React.useState<"none" | "qr" | "url">("none");

  const provenanceUrl = envelope.sanad_db_id
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/sanad/${envelope.sanad_db_id}`
    : null;
  const urlQrSrc = envelope.sanad_db_id
    ? api.sanad.qrUrl(envelope.sanad_db_id)
    : null;

  function copy(value: string, which: "qr" | "url") {
    if (typeof navigator === "undefined") return;
    navigator.clipboard.writeText(value).then(
      () => {
        setCopied(which);
        setTimeout(() => setCopied("none"), 1800);
      },
      () => {
        /* ignore */
      },
    );
  }

  return (
    <section className="mt-10 grid gap-7">
      <div className="rounded-craft border border-gold/40 bg-gold-light/30 px-5 py-4 font-body text-[14px] text-ink">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-faded">
          Signed
        </span>
        <div className="mt-1">
          <span className="font-display text-[20px] leading-tight">
            {envelope.payload.short_summary}
          </span>
        </div>
        <div className="mt-1 font-mono text-[12px] text-ink-faded">
          Sanad <span className="text-ink">{envelope.payload.sanad_id}</span>{" "}
          · piece <span className="text-ink">{envelope.payload.piece_id}</span>
        </div>
      </div>

      <div className="grid gap-7 md:grid-cols-2">
        <QrPanel
          title="Cryptographic QR"
          subtitle={
            <>
              Encodes the full <code>header.payload.signature</code>{" "}
              triple. Any verifier with this master&rsquo;s Ed25519 public key
              can validate it offline. Use this on the physical piece tag.
            </>
          }
          imageSrc={
            envelope.qr_image_base64
              ? `data:image/png;base64,${envelope.qr_image_base64}`
              : null
          }
          actions={
            <button
              type="button"
              onClick={() => copy(envelope.qr_string, "qr")}
              className="rounded-craft border border-line bg-paper px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faded hover:border-brand hover:text-brand"
            >
              {copied === "qr" ? "Copied" : "Copy QR string"}
            </button>
          }
          footer={
            <details className="mt-3">
              <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faded hover:text-ink">
                Show signed bytes
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto rounded-craft border border-line bg-parchment px-3 py-2 font-mono text-[10.5px] text-ink-faded">
                {envelope.qr_string}
              </pre>
            </details>
          }
        />

        <QrPanel
          title="Provenance URL QR"
          subtitle={
            <>
              Points at the buyer-facing provenance page hosted on the
              backend. Useful as a quick scan in shop or showroom; the
              cryptographic QR above is the security primitive.
            </>
          }
          imageSrc={urlQrSrc}
          actions={
            provenanceUrl ? (
              <button
                type="button"
                onClick={() => copy(provenanceUrl, "url")}
                className="rounded-craft border border-line bg-paper px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faded hover:border-brand hover:text-brand"
              >
                {copied === "url" ? "Copied" : "Copy URL"}
              </button>
            ) : null
          }
          footer={
            provenanceUrl ? (
              <p className="mt-2 break-all font-mono text-[11px] text-ink-faded">
                {provenanceUrl}
              </p>
            ) : (
              <p className="mt-2 font-body text-[12px] text-ink-faded">
                The backend did not return a database row for this Sanad. The
                cryptographic QR on the left is still valid.
              </p>
            )
          }
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/studio"
          className="rounded-craft border border-line bg-paper px-4 py-2 font-ui text-[13px] tracking-wide text-ink hover:border-brand"
        >
          ← Back to studio
        </Link>
        <button
          type="button"
          onClick={onMintAnother}
          className="rounded-craft bg-brand px-5 py-2.5 font-ui text-[13.5px] tracking-wide text-ink-inverse hover:bg-brand-light"
        >
          Mint another Sanad
        </button>
      </div>
    </section>
  );
}

function QrPanel({
  title,
  subtitle,
  imageSrc,
  actions,
  footer,
}: {
  title: string;
  subtitle: React.ReactNode;
  imageSrc: string | null;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <article className="rounded-craft border border-line bg-paper px-5 py-5">
      <h3 className="font-display text-[20px] leading-tight text-ink">{title}</h3>
      <p className="mt-1 font-body text-[13px] text-ink-faded">{subtitle}</p>

      <div className="mt-4 flex justify-center">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={`${title} for the signed Sanad`}
            className="h-64 w-64 rounded-craft border border-line bg-white object-contain p-3"
          />
        ) : (
          <div className="flex h-64 w-64 items-center justify-center rounded-craft border border-dashed border-line bg-parchment text-ink-faded font-mono text-[10.5px] uppercase tracking-[0.18em]">
            Not available
          </div>
        )}
      </div>

      {actions ? <div className="mt-4 flex justify-end">{actions}</div> : null}
      {footer}
    </article>
  );
}
