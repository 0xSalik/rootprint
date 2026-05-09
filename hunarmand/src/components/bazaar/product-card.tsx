import * as React from "react";
import Link from "next/link";

import {
  SEASON_META,
  themeClassForSeason,
  CRAFT_LABEL,
} from "@/lib/seasons";
import {
  type BazaarProduct,
  formatINR,
  formatINRShort,
} from "@/lib/bazaar";

import { ProductArt } from "./product-art";

/* -------------------------------------------------------------------------
 * <ProductCard />
 *
 * Pinterest-masonry product card. The card lives inside CSS columns
 * so its height is intrinsic to the art's aspect ratio + body content.
 *
 * Visual signature:
 *   • A small Sanad badge (gold leaf) sits at the top-right of the
 *     image when the piece is verified. Reserve-from-master cards
 *     get a neutral "made-to-order" tag instead.
 *   • The bottom row is always a price + a link. We don't ship a
 *     real cart, so the "Add to cart" CTA goes either to the live
 *     Sanad page (verified) or to the master's profile (made-to-order).
 *   • The whole card is themed in *its own* season palette regardless
 *     of the storefront's filter.
 * ----------------------------------------------------------------------- */

interface ProductCardProps {
  product: BazaarProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const meta = SEASON_META[product.season];
  const craftLabel = CRAFT_LABEL[product.craft]?.en ?? product.craft;
  const isVerified = product.sanadVerified && product.pieceId;
  const ctaHref = isVerified
    ? `/sanad/${product.pieceId}`
    : `/artisan/${product.masterSlug}`;

  return (
    <article
      className={[
        themeClassForSeason(product.season),
        "group relative bg-paper border border-line rounded-craft-lg overflow-hidden",
        "mb-6 break-inside-avoid hover-lift",
      ].join(" ")}
    >
      {/* Image block */}
      <Link
        href={ctaHref}
        aria-label={`View ${product.name} by ${product.masterName}`}
        className="block relative"
      >
        <ProductArt craft={product.craft} ratio={product.ratio} />

        {/* Top-right ribbon: Sanad seal or "Made to order" tag */}
        {isVerified ? <SanadSeal /> : <MadeToOrderTag />}

        {/* Limited-stock pip in the top-left when applicable */}
        {product.limitedTo && product.inStock ? (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-craft text-[10px] font-ui tracking-[0.16em] uppercase bg-walnut/80 text-gold-light">
            Only {product.limitedTo} left
          </span>
        ) : null}

        {/* Soft season ribbon along the very top */}
        <span
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ backgroundColor: "var(--season-deep)" }}
        />
      </Link>

      {/* Body */}
      <div className="px-4 pt-4 pb-5 flex flex-col gap-2.5">
        {/* Top row — craft label + price (small) */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="meta-mono text-season-deep">
            {meta.glyph} {craftLabel}
          </span>
          <span className="meta-mono text-ink-margin">
            {formatINRShort(product.price)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display text-[18px] text-ink leading-snug">
          <Link
            href={ctaHref}
            className="hover:text-season-deep transition-colors"
          >
            {product.name}
          </Link>
        </h3>

        {/* Master line */}
        <p className="font-body text-sm text-ink-faded leading-snug">
          By{" "}
          <Link
            href={`/artisan/${product.masterSlug}`}
            className="text-ink hover:text-brand transition-colors"
          >
            {product.masterName}
          </Link>
          <span className="text-ink-margin"> · {product.masterVillage}</span>
        </p>

        {/* Blurb */}
        <p className="font-body text-sm text-ink-faded leading-snug line-clamp-2">
          {product.shortBlurb}
        </p>

        {/* Footer row — full price + CTA */}
        <div className="mt-2 pt-3 border-t border-line flex items-center justify-between gap-2">
          <p className="font-display text-xl text-ink leading-none">
            {formatINR(product.price)}
          </p>
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center px-3.5 py-2 rounded-craft bg-brand text-ink-inverse font-ui text-xs tracking-wide hover:bg-brand-light transition-colors min-h-10"
          >
            {isVerified ? "Add to cart" : "Reserve"}
            <span className="ml-1.5" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ───────────────────────── small badges ───────────────────────── */

function SanadSeal() {
  return (
    <span
      className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-craft text-[10px] font-ui tracking-[0.16em] uppercase"
      style={{
        backgroundColor: "rgba(28, 20, 16, 0.78)",
        color: "var(--gold-light)",
      }}
      aria-label="Sanad verified"
    >
      <SealGlyph />
      Sanad
    </span>
  );
}

function MadeToOrderTag() {
  return (
    <span
      className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-craft text-[10px] font-ui tracking-[0.16em] uppercase bg-walnut/80 text-ink-inverse/80"
      aria-label="Made to order"
    >
      Made to order
    </span>
  );
}

function SealGlyph() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="6" cy="6" r="4.6" />
      <circle cx="6" cy="6" r="1.6" fill="currentColor" stroke="none" />
      <line x1="6" y1="0.4" x2="6" y2="1.8" />
      <line x1="6" y1="10.2" x2="6" y2="11.6" />
      <line x1="0.4" y1="6" x2="1.8" y2="6" />
      <line x1="10.2" y1="6" x2="11.6" y2="6" />
    </svg>
  );
}
