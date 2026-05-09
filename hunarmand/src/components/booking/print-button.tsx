"use client";

import * as React from "react";

/* -------------------------------------------------------------------------
 * <PrintButton />
 *
 * Tiny client island. Triggers `window.print()` for the booking
 * certificate. Lives in its own file so the surrounding certificate
 * + actions can stay as server components.
 * ----------------------------------------------------------------------- */

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined") window.print();
      }}
      className="inline-flex items-center gap-2 px-5 py-3 rounded-craft bg-brand text-ink-inverse font-ui text-sm hover:bg-brand-light transition-colors min-h-12"
    >
      Download / print certificate
    </button>
  );
}
