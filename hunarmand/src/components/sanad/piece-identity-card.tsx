import * as React from "react";

import { ArabesqueQuarter } from "@/components/motifs";
import { type Artisan, type SignedPiece, type Technique } from "@/lib/artisans";
import {
  type SanadDict,
  type SanadLocale,
  formatDateLocale,
} from "@/lib/sanad-i18n";

import { PieceArt } from "./piece-art";

/* -------------------------------------------------------------------------
 * <PieceIdentityCard />
 *
 * The cream card that introduces the piece. Four corner arabesques,
 * a single close-up SVG of the piece, and the four canonical metadata
 * lines: name, craft, technique, signed date.
 *
 * The card has its own elevation and a subtle inner frame so it reads
 * as a certificate panel — distinct from the surrounding parchment.
 * ----------------------------------------------------------------------- */

interface PieceIdentityCardProps {
  piece: SignedPiece;
  artisan: Artisan;
  technique: Technique | null;
  dict: SanadDict;
  locale: SanadLocale;
}

export function PieceIdentityCard({
  piece,
  artisan,
  technique,
  dict,
  locale,
}: PieceIdentityCardProps) {
  return (
    <section
      aria-labelledby="piece-identity-heading"
      className="relative bg-paper border border-line rounded-craft-lg px-5 sm:px-10 pt-12 sm:pt-14 pb-8 sm:pb-10"
      style={{
        boxShadow:
          "0 1px 0 0 rgba(28, 20, 16, 0.04), 0 18px 40px -28px var(--shadow-strong)",
      }}
    >
      {/* Four corner ornaments */}
      <ArabesqueQuarter
        className="absolute top-3 left-3 sm:top-5 sm:left-5"
        corner="tl"
        size={56}
        opacity={0.7}
      />
      <ArabesqueQuarter
        className="absolute top-3 right-3 sm:top-5 sm:right-5"
        corner="tr"
        size={56}
        opacity={0.7}
      />
      <ArabesqueQuarter
        className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5"
        corner="br"
        size={56}
        opacity={0.55}
      />
      <ArabesqueQuarter
        className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5"
        corner="bl"
        size={56}
        opacity={0.55}
      />

      <div className="space-y-6 sm:space-y-8">
        {/* Title block */}
        <header className="text-center max-w-xl mx-auto">
          <p className="meta-mono text-ink-faded mb-2">{dict.piece}</p>
          <h2
            id="piece-identity-heading"
            className="font-display font-medium leading-tight text-ink"
            style={{ fontSize: "clamp(28px, 5vw, 40px)" }}
          >
            {piece.type}
          </h2>
          <p
            className="meta-mono text-ink-margin mt-3 tracking-[0.18em]"
            dir="ltr"
          >
            {piece.pieceId}
          </p>
        </header>

        {/* Close-up of the piece */}
        <PieceArt craft={artisan.craft} pieceId={piece.pieceId} />

        {/* Metadata grid */}
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 border-t border-line pt-6">
          <MetaCell label={dict.craft} value={artisan.craftEnglish} />
          <MetaCell
            label={dict.technique}
            value={technique?.name ?? piece.type}
            sub={technique ? excerptFirstLine(technique.vaultExcerpt) : undefined}
          />
          <MetaCell
            label={dict.signed}
            value={formatDateLocale(piece.signedOn, locale)}
            sub={
              piece.completedOn
                ? `${dict.completed} · ${formatDateLocale(piece.completedOn, locale)}`
                : undefined
            }
          />
        </dl>
      </div>
    </section>
  );
}

function MetaCell({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="space-y-1">
      <dt className="meta-mono text-ink-margin">{label}</dt>
      <dd className="font-serif text-ink leading-snug">{value}</dd>
      {sub ? (
        <p className="font-body text-sm text-ink-faded leading-snug">{sub}</p>
      ) : null}
    </div>
  );
}

function excerptFirstLine(text: string): string {
  const sentence = text.split(/(?<=[.?!])\s+/)[0] ?? text;
  return sentence.length > 110 ? sentence.slice(0, 107) + "…" : sentence;
}
