import * as React from "react";
import Link from "next/link";

import {
  type SanadLocale,
  SANAD_LOCALES,
  LOCALE_META,
  sanadHref,
} from "@/lib/sanad-i18n";

/* -------------------------------------------------------------------------
 * <LanguageSwitcher />
 *
 * Six anchor links to the pre-rendered locale variants. Pure HTML —
 * no JS. Anchors use `hreflang` so search engines and screen readers
 * understand each variant; `aria-current="true"` on the active one.
 * ----------------------------------------------------------------------- */

interface LanguageSwitcherProps {
  pieceId: string;
  current: SanadLocale;
  /** Caption ("Language") in the active locale, used as the visible
   *  label and the `aria-label` of the nav. */
  label: string;
  className?: string;
}

export function LanguageSwitcher({
  pieceId,
  current,
  label,
  className,
}: LanguageSwitcherProps) {
  return (
    <nav
      aria-label={label}
      className={`flex flex-wrap items-center gap-x-1 gap-y-1 ${className ?? ""}`}
    >
      <span className="meta-mono text-ink-margin pr-2 hidden sm:inline">
        {label}
      </span>
      {SANAD_LOCALES.map((code) => {
        const meta = LOCALE_META[code];
        const isCurrent = code === current;
        return (
          <Link
            key={code}
            href={sanadHref(pieceId, code)}
            hrefLang={code}
            aria-current={isCurrent ? "true" : undefined}
            title={meta.english}
            dir={meta.dir}
            className={[
              "inline-flex items-center justify-center px-2.5 py-1 rounded-craft border text-xs",
              "font-ui transition-colors duration-150",
              isCurrent
                ? "bg-walnut text-gold border-gold/60"
                : "border-line text-ink-faded hover:border-season-deep hover:text-season-deep",
            ].join(" ")}
          >
            {meta.native}
          </Link>
        );
      })}
    </nav>
  );
}
