import * as React from "react";
import Link from "next/link";

import { type Artisan, type Technique } from "@/lib/artisans";
import { type SanadDict } from "@/lib/sanad-i18n";
import { PortraitAvatar } from "@/components/artisan/portrait-avatar";
import { TalimTexture } from "@/components/motifs";

/* -------------------------------------------------------------------------
 * <ArtisanBlock />
 *
 * Portrait + name + generation + location, paired with a still-frame
 * "Vault clip" preview of the technique used on this piece.
 *
 * Because the page must work without JavaScript, the Vault preview is
 * not an interactive video player — it is a beautiful still-frame
 * surface that says "scan to play in the Hunarmand app". A real video
 * player would live behind progressive enhancement.
 * ----------------------------------------------------------------------- */

interface ArtisanBlockProps {
  artisan: Artisan;
  technique: Technique | null;
  dict: SanadDict;
}

export function ArtisanBlock({ artisan, technique, dict }: ArtisanBlockProps) {
  return (
    <section
      aria-labelledby="artisan-heading"
      className="bg-paper border border-line rounded-craft-lg p-6 sm:p-8"
    >
      <p className="meta-mono text-ink-margin mb-4">{dict.master}</p>

      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 sm:gap-8 items-start">
        <PortraitAvatar name={artisan.name} size={132} />

        <div className="space-y-2 min-w-0">
          <h2
            id="artisan-heading"
            className="font-display text-3xl sm:text-4xl leading-tight text-ink"
          >
            {artisan.name}
          </h2>
          <p className="font-serif italic text-ink-faded">
            {dict.generationOrdinal(artisan.generation)} {dict.generation.toLowerCase()}
            {" · "}
            {artisan.craftEnglish}
          </p>
          <p className="font-body text-ink-faded">
            {artisan.village}, {artisan.district}
          </p>

          <p
            className="font-nastaliq text-ink-faded mt-3 text-lg leading-snug"
            dir="rtl"
          >
            {artisan.craftUrdu}
          </p>

          <div className="pt-4">
            <Link
              href={`/artisan/${artisan.slug}`}
              className="inline-flex items-center gap-2 text-brand hover:text-brand-light font-ui font-medium tracking-wide transition-colors duration-200"
            >
              {dict.seeFullProfile}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Vault clip — static, no JS */}
      <VaultClipPreview
        artisanName={artisan.name}
        techniqueTitle={technique?.name ?? artisan.craftEnglish}
        title={dict.vaultClipTitle}
        body={dict.vaultClipBody}
      />
    </section>
  );
}

/* ------------------------------- Static clip ---------------------------- */

function VaultClipPreview({
  artisanName,
  techniqueTitle,
  title,
  body,
}: {
  artisanName: string;
  techniqueTitle: string;
  title: string;
  body: string;
}) {
  return (
    <figure className="mt-7 surface-walnut rounded-craft-lg overflow-hidden border border-line/40">
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {/* Talim glow */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 35%, var(--season-deep) 0%, #1a1410 70%)",
          }}
        />
        <TalimTexture color="var(--season-gold)" opacity={0.12} />

        {/* Filmic vignettes */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
        </div>

        {/* Threads & a single hand silhouette suggestion */}
        <svg
          className="absolute inset-0 size-full"
          viewBox="0 0 800 450"
          aria-hidden="true"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Vertical warp */}
          <g stroke="var(--season-gold)" strokeOpacity="0.32" strokeWidth="0.6">
            {Array.from({ length: 24 }).map((_, i) => (
              <line key={i} x1={i * 35 + 10} y1="0" x2={i * 35 + 10} y2="450" />
            ))}
          </g>
          {/* Hand-like silhouette */}
          <path
            d="M520 250 C 540 220, 580 210, 620 220 C 660 230, 700 245, 720 270 L 720 320 L 520 320 Z"
            fill="rgba(0,0,0,0.55)"
          />
          {/* A traveling thread */}
          <path
            d="M 60 280 Q 200 260, 360 290 Q 520 320, 700 280"
            stroke="var(--season-gold)"
            strokeWidth="2"
            fill="none"
            opacity="0.85"
          />
        </svg>

        {/* Centre play disc — purely decorative, not a button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative inline-flex items-center justify-center size-16 sm:size-20 rounded-full"
            style={{
              background: "rgba(255, 247, 230, 0.94)",
              boxShadow: "0 6px 22px -4px rgba(0,0,0,0.45)",
            }}
            aria-hidden="true"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              aria-hidden="true"
            >
              <path d="M7 5 L17 11 L7 17 Z" fill="var(--season-deep)" />
            </svg>
          </div>
        </div>

        {/* Bottom captions */}
        <figcaption className="absolute left-4 right-4 bottom-4 sm:left-6 sm:right-6 sm:bottom-5 text-ink-inverse">
          <p
            className="meta-mono"
            style={{ color: "var(--season-gold)", letterSpacing: "0.16em" }}
          >
            00:00 / 00:30 · VAULT
          </p>
          <p className="font-display text-lg sm:text-xl leading-tight mt-1">
            {techniqueTitle}
          </p>
          <p className="font-body text-xs text-ink-inverse/75 mt-0.5">
            — {artisanName}
          </p>
        </figcaption>
      </div>
      <div className="px-5 py-4 sm:px-6 sm:py-5 border-t border-line/20 text-ink-inverse">
        <p className="font-serif text-sm sm:text-base leading-snug">{title}</p>
        <p className="font-body text-xs sm:text-sm text-ink-inverse/70 mt-1">{body}</p>
      </div>
    </figure>
  );
}
