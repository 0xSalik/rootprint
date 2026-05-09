import * as React from "react";
import Link from "next/link";

import { ChinarCorner, HashiaBorder } from "@/components/motifs";
import { type SignedPieceLookup } from "@/lib/artisans";
import {
  type SanadDict,
  type SanadLocale,
  LOCALE_META,
  sanadHref,
} from "@/lib/sanad-i18n";
import { seasonForCraft, themeClassForSeason } from "@/lib/seasons";

import { LanguageSwitcher } from "./language-switcher";
import { VerificationBanner } from "./verification-banner";
import { PieceIdentityCard } from "./piece-identity-card";
import { ArtisanBlock } from "./artisan-block";
import { ProvenanceChain } from "./provenance-chain";
import { FairPriceBand } from "./fair-price-band";
import { SanadFooter } from "./sanad-footer";

/* -------------------------------------------------------------------------
 * <SanadView />
 *
 * The root of the Sanad provenance certificate. Pure server component —
 * no "use client" anywhere in the subtree, no event handlers, no React
 * state. Even the seasonal palette is applied via a static class
 * (themeClassForSeason) on the <article> rather than the client-side
 * <CraftColorProvider />, so this page ships zero JavaScript.
 *
 *   lookup = null  →  unverified state. Banner is brand red, only the
 *                     pieceId, the language switcher, and a quiet
 *                     "what to do next" panel are shown.
 *   lookup ≠ null  →  full certificate, themed by the artisan's craft.
 * ----------------------------------------------------------------------- */

interface SanadViewProps {
  pieceId: string;
  lookup: SignedPieceLookup | null;
  locale: SanadLocale;
  dict: SanadDict;
}

export function SanadView({ pieceId, lookup, locale, dict }: SanadViewProps) {
  const localeMeta = LOCALE_META[locale];
  const verified = !!lookup;

  /* Apply the seasonal theme class statically — no client provider. */
  const themeClass = verified
    ? themeClassForSeason(seasonForCraft(lookup!.artisan.craft))
    : "theme-harud"; /* sane default for the unverified screen */

  return (
    <article
      lang={locale}
      dir={localeMeta.dir}
      data-piece-id={pieceId}
      data-verified={verified ? "1" : "0"}
      className={`${themeClass} min-h-screen flex flex-col bg-parchment text-ink animate-unfurl`}
    >
      <TopBar pieceId={pieceId} locale={locale} dict={dict} />

      <VerificationBanner
        verified={verified}
        title={verified ? dict.verifiedTitle : dict.notFoundTitle}
        body={verified ? dict.verifiedBody : dict.notFoundBody}
        sealLabel={verified ? dict.verifiedTitle : dict.notFoundTitle}
      />

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 sm:py-12 space-y-6 sm:space-y-8">
        {lookup ? (
          <>
            <PieceIdentityCard
              piece={lookup.piece}
              artisan={lookup.artisan}
              technique={lookup.technique}
              dict={dict}
              locale={locale}
            />
            <ArtisanBlock
              artisan={lookup.artisan}
              technique={lookup.technique}
              dict={dict}
            />
            <ProvenanceChain
              piece={lookup.piece}
              artisan={lookup.artisan}
              technique={lookup.technique}
              materialOrigins={lookup.materialOrigins}
              dict={dict}
              locale={locale}
            />
            <FairPriceBand piece={lookup.piece} dict={dict} locale={locale} />
          </>
        ) : (
          <NoRecordPanel pieceId={pieceId} dict={dict} />
        )}
      </main>

      <SanadFooter dict={dict} />
    </article>
  );
}

/* -------------------------- Top header bar ----------------------------- */

function TopBar({
  pieceId,
  locale,
  dict,
}: {
  pieceId: string;
  locale: SanadLocale;
  dict: SanadDict;
}) {
  return (
    <div className="border-b border-line bg-paper">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-3 flex items-center gap-4 justify-between">
        <Link
          href={sanadHref(pieceId, "en")}
          className="inline-flex items-baseline gap-2 group"
        >
          <span className="font-display text-xl text-ink leading-none">
            Hunarmand
          </span>
          <span className="meta-mono text-ink-margin">· Sanad</span>
        </Link>

        <LanguageSwitcher
          pieceId={pieceId}
          current={locale}
          label={dict.language}
        />
      </div>
    </div>
  );
}

/* -------------------------- No-record panel ---------------------------- */

function NoRecordPanel({
  pieceId,
  dict,
}: {
  pieceId: string;
  dict: SanadDict;
}) {
  return (
    <section className="relative bg-paper border border-line rounded-craft-lg p-6 sm:p-10 overflow-hidden">
      <ChinarCorner
        corner="tl"
        size={140}
        opacity={0.18}
        className="absolute -top-4 -left-4 pointer-events-none"
      />
      <ChinarCorner
        corner="br"
        size={140}
        opacity={0.18}
        className="absolute -bottom-4 -right-4 pointer-events-none"
      />
      <div className="relative space-y-4">
        <p className="meta-mono text-ink-margin">{dict.pieceId}</p>
        <p className="font-mono text-2xl text-ink tracking-[0.16em]" dir="ltr">
          {pieceId}
        </p>
        <HashiaBorder height={6} color="var(--brand)" opacity={0.6} />
        <p className="font-serif text-ink leading-snug max-w-prose">
          {dict.notFoundHint}
        </p>
      </div>
    </section>
  );
}
