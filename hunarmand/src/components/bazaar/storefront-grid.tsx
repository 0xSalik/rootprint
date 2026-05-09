import * as React from "react";

import type { BazaarProduct } from "@/lib/bazaar";
import { ProductCard } from "./product-card";

/* -------------------------------------------------------------------------
 * <StorefrontGrid />
 *
 * The Pinterest-style masonry. Implemented in pure CSS via multi-
 * column layout — every card is `break-inside: avoid` and lives
 * inside a `columns-1 sm:columns-2 lg:columns-3` parent.
 *
 * The cards are *visual order = column order* (not row-first), which
 * is the intentional Pinterest cadence.
 * ----------------------------------------------------------------------- */

interface StorefrontGridProps {
  products: BazaarProduct[];
}

export function StorefrontGrid({ products }: StorefrontGridProps) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
