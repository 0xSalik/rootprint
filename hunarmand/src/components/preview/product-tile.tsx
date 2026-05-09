import * as React from "react";
import Link from "next/link";

import {
  type Craft,
  type ProductDef,
  formatINR,
  paletteVars,
} from "../../../lib/data";
import { CraftIcon } from "./craft-icons";

/* -------------------------------------------------------------------------
 * <ProductTile />
 *
 * One product card on the artisan profile — styled placeholder
 * "image" (a CSS gradient in the craft's palette with the craft icon
 * dropped in the centre), title, technique attribution, price, the
 * Sanad pill, and two CTAs ("View Piece" + "Scan Sanad QR").
 *
 * If the optional `pieceId` prop is set, the Scan-Sanad button
 * deep-links to /sanad/[pieceId]; otherwise it falls back to the
 * artisan profile page so no link in the grid is broken.
 * ----------------------------------------------------------------------- */

interface ProductTileProps {
  product: ProductDef;
  craft: Craft;
  artisanSlug: string;
  pieceId?: string;
}

export function ProductTile({
  product,
  craft,
  artisanSlug,
  pieceId,
}: ProductTileProps) {
  const p = paletteVars(craft.palette);

  return (
    <article className="group flex flex-col rounded-craft-lg overflow-hidden surface-card hover-lift">
      {/* Styled "image" — gradient + centered craft icon */}
      <div
        className="relative aspect-[4/3] flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${p.deep} 0%, ${p.mid} 60%, ${p.accent} 100%)`,
        }}
      >
        {/* Diagonal stripe wash */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, ${p.gold}10 0 8px, transparent 8px 18px)`,
            mixBlendMode: "overlay",
          }}
        />

        <CraftIcon
          kind={craft.iconKey}
          size={120}
          strokeWidth={1.1}
          className="text-ink-inverse/85 transition-transform duration-300 group-hover:scale-105"
        />

        {/* Sanad pill — bottom-right corner of the image */}
        <span
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-ui text-[10px] tracking-[0.1em] uppercase"
          style={{
            backgroundColor: "rgba(250, 247, 242, 0.92)",
            color: "var(--brand)",
          }}
        >
          <Seal />
          Sanad
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-5 flex flex-col gap-2">
        <h4 className="font-display text-[18px] leading-tight text-ink">
          {product.name}
        </h4>
        <p className="font-body italic text-[13px] text-ink-margin">
          {product.technique}
        </p>
        <p className="font-display text-[20px] text-brand mt-1">
          {formatINR(product.price)}
        </p>

        <div className="flex flex-wrap gap-2 mt-3">
          <Link
            href={pieceId ? `/sanad/${pieceId}` : `/artisan/${artisanSlug}`}
            className="inline-flex items-center justify-center px-3.5 py-2 rounded-craft border border-line text-ink hover:border-brand hover:text-brand font-ui text-[12px] tracking-wide transition-colors"
          >
            View Piece
          </Link>
          <Link
            href={pieceId ? `/sanad/${pieceId}` : `/artisan/${artisanSlug}`}
            className="inline-flex items-center justify-center px-3.5 py-2 rounded-craft bg-paper-deep text-ink hover:bg-gold-light/40 font-ui text-[12px] tracking-wide transition-colors"
          >
            Scan Sanad QR
          </Link>
        </div>
      </div>
    </article>
  );
}

function Seal() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1" />
      <path d="M3.6 5.7 L4.9 7 L7.6 4.2" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
