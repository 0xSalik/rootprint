import * as React from "react";
import Link from "next/link";

import { HashiaBorder } from "@/components/motifs";
import {
  type Artisan,
  type SignedPiece,
  type Technique,
  formatDate,
  formatINR,
} from "@/lib/artisans";

import { QrGlyph } from "./qr-glyph";

/* -------------------------------------------------------------------------
 * <ProvenanceLedger /> — section 3d.
 *
 * A bank-statement-style register of pieces the artisan has
 * cryptographically signed. Thin horizontal rules, IBM Plex Mono for
 * the piece IDs and dates, a small QR glyph that links to the public
 * Sanad page for that piece. Warm but austere — like a master's
 * own handwritten register, not a SaaS table.
 * ----------------------------------------------------------------------- */

interface ProvenanceLedgerProps {
  artisan: Artisan;
}

const STATUS_COLOR: Record<SignedPiece["status"], string> = {
  "with buyer": "var(--spring-accent)",
  "in transit": "var(--summer-accent)",
  "in workshop": "var(--season-deep)",
  "in bazaar": "var(--brand)",
};

export function ProvenanceLedger({ artisan }: ProvenanceLedgerProps) {
  const techIndex = new Map<string, Technique>(
    artisan.techniques.map((t) => [t.id, t]),
  );

  return (
    <section className="bg-paper-deep/35 border-y border-line">
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-20 md:py-24">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="label-ui text-brand">The Provenance Ledger</p>
            <h2 className="display-hero text-3xl md:text-5xl text-ink mt-3">
              Signed pieces.
            </h2>
            <p className="font-body text-ink-faded text-base md:text-lg mt-4 max-w-xl">
              Every piece below carries a cryptographically signed
              Sanad. Scan the QR glyph to open the piece's public
              provenance page.
            </p>
          </div>

          <dl className="flex items-end gap-8 meta-mono">
            <div>
              <dt className="text-ink-margin">Total signed</dt>
              <dd className="font-display text-2xl text-ink leading-none mt-1">
                {artisan.piecesSigned}
              </dd>
            </div>
            <div>
              <dt className="text-ink-margin">Disputes</dt>
              <dd className="font-display text-2xl text-ink leading-none mt-1">
                {artisan.disputes}
              </dd>
            </div>
            <div>
              <dt className="text-ink-margin">Verified by</dt>
              <dd className="font-display text-base text-ink leading-none mt-1">
                Hunarmand
              </dd>
            </div>
          </dl>
        </header>

        <div className="mt-6">
          <HashiaBorder height={8} color="var(--season-deep)" opacity={0.45} />
        </div>

        {/* Header row */}
        <div className="hidden md:grid grid-cols-12 gap-4 mt-6 pb-3 border-b border-line label-ui text-ink-margin text-[10px]">
          <span className="col-span-3">Piece ID</span>
          <span className="col-span-3">Type</span>
          <span className="col-span-2">Signed</span>
          <span className="col-span-2">Technique</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-1 text-right">Sanad</span>
        </div>

        <ul className="divide-y divide-line/70">
          {artisan.signedPieces.map((p) => {
            const tech = techIndex.get(p.techniqueId);
            return (
              <li
                key={p.pieceId}
                className="grid grid-cols-12 gap-4 py-4 items-center hover:bg-paper-deep/40 transition-colors"
              >
                {/* ID */}
                <span className="col-span-12 md:col-span-3 font-mono text-sm text-ink leading-tight">
                  {p.pieceId}
                  {p.priceFrom && p.priceTo ? (
                    <span className="block meta-mono mt-0.5">
                      {formatINR(p.priceFrom)} – {formatINR(p.priceTo)}
                    </span>
                  ) : null}
                </span>

                {/* Type */}
                <span className="col-span-7 md:col-span-3">
                  <span className="md:hidden label-ui text-ink-margin block text-[10px]">
                    Type
                  </span>
                  <span className="font-serif text-sm text-ink">{p.type}</span>
                </span>

                {/* Signed */}
                <span className="col-span-5 md:col-span-2">
                  <span className="md:hidden label-ui text-ink-margin block text-[10px]">
                    Signed
                  </span>
                  <span className="font-mono text-sm text-ink">
                    {formatDate(p.signedOn)}
                  </span>
                </span>

                {/* Technique */}
                <span className="col-span-7 md:col-span-2">
                  <span className="md:hidden label-ui text-ink-margin block text-[10px]">
                    Technique
                  </span>
                  <span className="font-body italic text-sm text-ink-faded">
                    {tech ? tech.name : p.techniqueId}
                  </span>
                </span>

                {/* Status */}
                <span className="col-span-3 md:col-span-1">
                  <span
                    className="inline-flex items-center gap-1.5 font-ui text-[10px] uppercase tracking-[0.14em]"
                    style={{ color: STATUS_COLOR[p.status] }}
                  >
                    <span
                      className="inline-block size-1.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLOR[p.status] }}
                      aria-hidden="true"
                    />
                    {p.status}
                  </span>
                </span>

                {/* QR — links to /sanad/[pieceId] */}
                <span className="col-span-2 md:col-span-1 flex md:justify-end">
                  <Link
                    href={`/sanad/${p.pieceId}`}
                    aria-label={`Open Sanad page for ${p.pieceId}`}
                    className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-craft border border-line text-ink-faded hover:border-season-deep hover:text-season-deep transition-colors"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <QrGlyph size={16} />
                    <span className="meta-mono">Open</span>
                  </Link>
                </span>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="meta-mono">
            Showing {artisan.signedPieces.length} of {artisan.piecesSigned}
            &nbsp;signed pieces · register continues
          </p>
          <Link
            href={`/artisan/${artisan.slug}/ledger`}
            className="font-ui text-xs uppercase tracking-[0.18em] text-brand hover:text-brand-light"
          >
            View full register →
          </Link>
        </div>
      </div>
    </section>
  );
}
