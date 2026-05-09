import * as React from "react";
import Link from "next/link";

import { ChinarCorner, HashiaBorder } from "@/components/motifs";

/* =============================================================================
 * <LiveSanadView />
 *
 * Renders a Sanad freshly minted through the studio (and persisted in the
 * backend's `sanads` table) when the static seed / preview datasets don't
 * carry the piece. The visual register matches the curated Sanad pages:
 * a verified banner, an identity card, the artisan block, the signed
 * payload (techniques + materials + workshop + lineage), the fair-price
 * band, and the Ed25519 signature in a collapsible footer.
 *
 * Pure server component. Accepts the JSON shape returned by
 * GET /api/v1/sanad/{id}.
 * ========================================================================== */

export interface LiveSanadDetails {
  sanad_id: string;
  public_sanad_id?: string | null;
  piece_name: string;
  material_origin?: string | null;
  signature_hex?: string | null;
  is_public: boolean;
  artisan: string;
  artisan_id?: string | null;
  issued_at?: string | null;
  metadata_json?: Record<string, unknown> | null;
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function asStringList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];
}

function fmtDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function prettifyCraft(value?: string | null): string | null {
  if (!value) return null;
  return value
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export function LiveSanadView({ piece }: { piece: LiveSanadDetails }) {
  const meta = (piece.metadata_json ?? {}) as Record<string, unknown>;
  const lineage = (meta.lineage ?? {}) as Record<string, unknown>;

  const publicId = piece.public_sanad_id ?? asString(meta.sanad_id);
  const pieceCode = asString(meta.piece_id);
  const summary = asString(meta.short_summary) ?? piece.piece_name;
  const craft = prettifyCraft(asString(meta.craft_category));
  const techniques = asStringList(meta.technique_names);
  const materials = asStringList(meta.materials_summary);
  const workshop =
    asString(meta.made_at_workshop) ?? asString(lineage.village) ?? null;
  const lineageChain = asStringList(lineage.lineage_chain);
  const fairPrice = asString(meta.fair_price_band);
  const completedOn = fmtDate(asString(meta.completed_on));
  const issuedOn =
    fmtDate(asString(meta.issued_at)) ?? fmtDate(piece.issued_at ?? null);
  const signature = piece.signature_hex ?? null;
  const masterName = piece.artisan;
  const masterIdLabel = asString(lineage.master_id) ?? piece.artisan_id ?? null;

  return (
    <article
      lang="en"
      data-piece-id={publicId ?? piece.sanad_id}
      data-verified="1"
      className="theme-harud min-h-screen flex flex-col bg-parchment text-ink animate-unfurl"
    >
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="font-display text-[18px] tracking-tight text-ink hover:text-brand"
          >
            Hunarmand
          </Link>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faded">
            Sanad · live
          </span>
        </div>
      </header>

      <section className="relative bg-gold-light/30">
        <ChinarCorner className="pointer-events-none absolute -top-2 right-3 h-12 w-12 text-gold/60" />
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.24em] text-gold">
            Verified · Ed25519 · RFC 8785 JCS
          </div>
          <h1 className="mt-1 font-display text-[28px] leading-tight text-ink sm:text-[34px]">
            Authenticated Heritage Piece
          </h1>
          <p className="mt-2 max-w-2xl font-body text-[14px] text-ink-faded">
            This Sanad was cryptographically signed by the master under their own
            Ed25519 key. The payload below was canonicalised under RFC 8785 and
            persisted to Hunarmand&rsquo;s registry. Any verifier with the master&rsquo;s
            public key can validate the signature offline.
          </p>
          <HashiaBorder className="mt-4 h-3 w-full text-gold" />
        </div>
      </section>

      <main className="flex-1">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:space-y-8 sm:px-6 sm:py-12">
          <section className="rounded-craft border border-line bg-paper px-5 py-5 sm:px-6 sm:py-6">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-faded">
              Piece
            </div>
            <h2 className="mt-1 font-display text-[22px] leading-tight text-ink">
              {summary}
            </h2>
            <dl className="mt-4 grid gap-3 font-body text-[14px] text-ink sm:grid-cols-2">
              {craft ? (
                <Cell label="Craft">{craft}</Cell>
              ) : null}
              {publicId ? (
                <Cell label="Sanad ID">
                  <code className="font-mono text-[12.5px]">{publicId}</code>
                </Cell>
              ) : null}
              {pieceCode ? (
                <Cell label="Piece ID">
                  <code className="font-mono text-[12.5px]">{pieceCode}</code>
                </Cell>
              ) : null}
              {completedOn ? (
                <Cell label="Completed on">{completedOn}</Cell>
              ) : null}
              {issuedOn ? (
                <Cell label="Sanad issued on">{issuedOn}</Cell>
              ) : null}
              {fairPrice ? (
                <Cell label="Fair price band">{fairPrice}</Cell>
              ) : null}
            </dl>
          </section>

          <section className="rounded-craft border border-line bg-paper px-5 py-5 sm:px-6 sm:py-6">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-faded">
              Issued by
            </div>
            <div className="mt-1 font-display text-[20px] leading-tight text-ink">
              {masterName}
            </div>
            {workshop ? (
              <div className="mt-1 font-body text-[13.5px] text-ink-faded">
                {workshop}
              </div>
            ) : null}
            {lineageChain.length ? (
              <div className="mt-3 font-body text-[13px] text-ink-faded">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-faded">
                  Lineage:
                </span>{" "}
                {lineageChain.join(" · ")}
              </div>
            ) : null}
            {masterIdLabel ? (
              <div className="mt-2 font-mono text-[11px] text-ink-faded">
                kid · <span className="text-ink">{masterIdLabel}:1</span>
              </div>
            ) : null}
          </section>

          {techniques.length || materials.length ? (
            <section className="grid gap-5 rounded-craft border border-line bg-paper px-5 py-5 sm:grid-cols-2 sm:px-6 sm:py-6">
              {techniques.length ? (
                <div>
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-faded">
                    Techniques
                  </div>
                  <ul className="mt-2 space-y-1 font-body text-[14px] text-ink">
                    {techniques.map((t) => (
                      <li key={t}>· {t}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {materials.length ? (
                <div>
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-faded">
                    Materials
                  </div>
                  <ul className="mt-2 space-y-1 font-body text-[14px] text-ink">
                    {materials.map((m) => (
                      <li key={m}>· {m}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          {signature ? (
            <section className="rounded-craft border border-dashed border-line bg-parchment px-5 py-5 sm:px-6 sm:py-6">
              <details>
                <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faded hover:text-ink">
                  Show Ed25519 signature
                </summary>
                <pre className="mt-3 max-h-40 overflow-auto break-all rounded-craft border border-line bg-paper px-3 py-2 font-mono text-[11.5px] text-ink-faded">
                  {signature}
                </pre>
                <p className="mt-2 font-body text-[12.5px] text-ink-faded">
                  Base64URL-encoded Ed25519 signature over the canonical
                  JSON payload, generated by the master&rsquo;s private key on the
                  Hunarmand AI core. A verifier with the master&rsquo;s public key
                  (lookup by <code className="font-mono">kid</code>) can
                  validate this signature without any network access.
                </p>
              </details>
            </section>
          ) : null}

          <footer className="pt-2 text-center font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-faded">
            Sanad · row {piece.sanad_id.slice(0, 8)}…
          </footer>
        </div>
      </main>
    </article>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-faded">
        {label}
      </dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
