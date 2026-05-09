import * as React from "react";
import Link from "next/link";

import {
  type Artisan,
  type Craft,
  type SanadPiece,
  type TechniqueDef,
  formatDateLong,
  formatINR,
  initialsFor,
  ordinalGen,
  paletteVars,
  themeClassForPalette,
} from "../../../lib/data";
import { ArabesqueQuarter } from "@/components/motifs";
import { CraftIcon } from "./craft-icons";
import { SiteFooter } from "@/components/site/site-footer";

/* -------------------------------------------------------------------------
 * <SanadPreview />
 *
 * The /sanad/[piece-001..003] template — the QR landing page.
 *
 * Sections (top → bottom):
 *
 *   • Verified banner (full-width, brand red, gold seal)
 *   • Language toggle pills (6 locales, EN active by default — this
 *     is a visual demonstration; the real i18n machinery for the
 *     existing seed-driven Sanad lives at /sanad/[id]/[lang])
 *   • Piece identity card (paper, arabesque corners, craft top
 *     border, styled placeholder image)
 *   • Artisan block (avatar · name · gen · location · 2-line bio +
 *     a Vault quote and a "their full story →" link)
 *   • Provenance chain (5-step vertical timeline)
 *   • Fair-price band (gradient gold-light → gold)
 *   • Ed25519 signature (native <details>, collapsed by default)
 *   • Site footer
 *
 * Server component — the only interactive piece is the native
 * <details> element. The whole tree paints in the craft's seasonal
 * palette by wrapping in `themeClassForPalette(craft.palette)`.
 * ----------------------------------------------------------------------- */

interface SanadPreviewProps {
  piece: SanadPiece;
  artisan: Artisan;
  craft: Craft;
  technique: TechniqueDef;
}

const LOCALES: Array<{ code: string; label: string; dir: "ltr" | "rtl" }> = [
  { code: "en", label: "EN", dir: "ltr" },
  { code: "hi", label: "हिन्दी", dir: "ltr" },
  { code: "ur", label: "اردو", dir: "rtl" },
  { code: "ja", label: "日本語", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "de", label: "Deutsch", dir: "ltr" },
];

export function SanadPreview({
  piece,
  artisan,
  craft,
  technique,
}: SanadPreviewProps) {
  const themeClass = themeClassForPalette(craft.palette);

  return (
    <article className={themeClass}>
      {/* ───────────── Verified banner ───────────── */}
      <header
        className="relative isolate text-ink-inverse pt-20 sm:pt-24"
        style={{ backgroundColor: "var(--brand-light)" }}
      >
        <div className="mx-auto max-w-5xl px-5 sm:px-8 py-6 sm:py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <GoldSeal />
            <p className="font-display text-[20px] sm:text-[22px] leading-tight">
              <span className="font-semibold">✓ Hunarmand Sanad Verified</span>
              <span className="block font-body italic text-[14px] sm:text-[15px] text-ink-inverse/85 mt-0.5">
                This piece is authentic.
              </span>
            </p>
          </div>

          {/* Language toggle pills */}
          <nav
            aria-label="Language"
            className="flex flex-wrap gap-1.5 self-start sm:self-auto"
          >
            {LOCALES.map((l) => {
              const active = l.code === "en";
              return (
                <span
                  key={l.code}
                  dir={l.dir}
                  lang={l.code}
                  className={[
                    "inline-flex items-center px-2.5 py-1 rounded-full font-ui text-[11px] tracking-wide",
                    active
                      ? "bg-ink-inverse text-brand"
                      : "bg-ink-inverse/15 text-ink-inverse/85 hover:bg-ink-inverse/25",
                    "transition-colors cursor-default",
                  ].join(" ")}
                >
                  {l.label}
                </span>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ───────────── Page body ───────────── */}
      <div className="bg-parchment">
        <div className="mx-auto max-w-5xl px-5 sm:px-8 py-12 sm:py-16 flex flex-col gap-12 sm:gap-16 animate-[unfurl_600ms_var(--ease-out-craft)_both]">
          {/* — Piece identity card — */}
          <PieceIdentityCard piece={piece} craft={craft} technique={technique} />

          {/* — Artisan block — */}
          <ArtisanBlock artisan={artisan} craft={craft} />

          {/* — Provenance chain — */}
          <ProvenanceChain
            piece={piece}
            artisan={artisan}
            technique={technique}
            craftName={craft.name}
          />

          {/* — Fair price band — */}
          <FairPriceBand piece={piece} craftName={craft.name} />

          {/* — Ed25519 signature — */}
          <SignatureBlock piece={piece} />
        </div>
      </div>

      <SiteFooter />
    </article>
  );
}

/* ───────────────────── Piece identity card ────────────────────── */

function PieceIdentityCard({
  piece,
  craft,
  technique,
}: {
  piece: SanadPiece;
  craft: Craft;
  technique: TechniqueDef;
}) {
  const p = paletteVars(craft.palette);

  return (
    <section className="relative">
      <div
        className="relative bg-paper border border-line rounded-craft-xl overflow-hidden"
        style={{ borderTop: `6px solid ${p.deep}` }}
      >
        {/* Arabesque corner ornaments */}
        <ArabesqueQuarter
          corner="tl"
          size={64}
          className="absolute top-3 left-3"
          color="var(--gold)"
          opacity={0.7}
        />
        <ArabesqueQuarter
          corner="tr"
          size={64}
          className="absolute top-3 right-3"
          color="var(--gold)"
          opacity={0.7}
        />
        <ArabesqueQuarter
          corner="bl"
          size={64}
          className="absolute bottom-3 left-3"
          color="var(--gold)"
          opacity={0.7}
        />
        <ArabesqueQuarter
          corner="br"
          size={64}
          className="absolute bottom-3 right-3"
          color="var(--gold)"
          opacity={0.7}
        />

        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8 p-8 sm:p-12">
          {/* Left: meta */}
          <div className="flex flex-col gap-3 justify-center">
            <p className="label-ui" style={{ color: p.deep }}>
              Sanad ID · {piece.pieceId.toUpperCase()}
            </p>
            <h1 className="font-display text-[28px] sm:text-[32px] leading-tight text-ink">
              {piece.pieceName}
            </h1>
            <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <Meta label="Craft" value={craft.name} />
              <Meta label="Technique" value={technique.name} />
              <Meta label="Completed" value={formatDateLong(piece.completedDate)} />
              <Meta label="Signed" value={formatDateLong(piece.signedDate)} />
            </dl>
          </div>

          {/* Right: styled placeholder image */}
          <div
            className="relative aspect-[4/5] rounded-craft-lg overflow-hidden flex items-center justify-center"
            style={{
              background: `linear-gradient(160deg, ${p.deep} 0%, ${p.mid} 60%, ${p.accent} 100%)`,
            }}
          >
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
              size={140}
              strokeWidth={1.1}
              className="text-ink-inverse/85"
            />
            <span
              className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-ui text-[10px] tracking-[0.1em] uppercase"
              style={{
                backgroundColor: "rgba(250, 247, 242, 0.92)",
                color: p.deep,
              }}
            >
              {piece.pieceId.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label-ui text-ink-margin">{label}</dt>
      <dd className="font-body text-[15px] text-ink mt-0.5">{value}</dd>
    </div>
  );
}

/* ───────────────────────── Artisan block ──────────────────────── */

function ArtisanBlock({
  artisan,
  craft,
}: {
  artisan: Artisan;
  craft: Craft;
}) {
  const p = paletteVars(craft.palette);

  return (
    <section className="bg-paper border border-line rounded-craft-xl p-8 sm:p-10">
      <div className="grid grid-cols-1 sm:grid-cols-[112px_1fr] gap-6 items-start">
        {/* Avatar */}
        <div
          className="rounded-full p-1 mx-auto sm:mx-0"
          style={{ width: 112, height: 112, backgroundColor: p.gold }}
        >
          <div
            className="rounded-full w-full h-full flex items-center justify-center font-display text-[28px] text-ink-inverse"
            style={{ backgroundColor: p.deep }}
          >
            {initialsFor(artisan.name)}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-2 text-center sm:text-left">
          <h2 className="font-display text-[24px] text-ink leading-tight">
            {artisan.name}
          </h2>
          <p
            className="font-ui text-[12px] tracking-wide uppercase"
            style={{ color: p.deep }}
          >
            {ordinalGen(artisan.generation)} · {craft.name} ·{" "}
            {artisan.village}, {artisan.district}
          </p>
          <p className="font-body italic text-[14px] leading-relaxed text-ink-faded mt-1">
            {artisan.bio}
          </p>

          {/* Vault quote */}
          <blockquote
            className="mt-4 border-l-2 pl-4 font-body italic text-[14px] leading-relaxed text-ink-faded text-left"
            style={{ borderColor: p.gold }}
          >
            &ldquo;{artisan.vault.technique[0]}&rdquo;
            <footer className="block not-italic mt-2 font-ui text-[11px] tracking-wide uppercase text-ink-margin">
              — {artisan.firstName}, Vault Session
            </footer>
          </blockquote>

          <Link
            href={`/artisan/${artisan.slug}`}
            className="inline-flex items-center gap-1.5 mt-3 font-ui text-[13px] tracking-wide self-center sm:self-start"
            style={{ color: p.deep }}
          >
            Their full story
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────── Provenance chain ──────────────────────── */

function ProvenanceChain({
  piece,
  artisan,
  technique,
  craftName,
}: {
  piece: SanadPiece;
  artisan: Artisan;
  technique: TechniqueDef;
  craftName: string;
}) {
  const steps: Array<{ title: string; body: React.ReactNode; meta?: string }> = [
    {
      title: "Material Origin",
      body: (
        <>
          <strong className="font-medium text-ink">{piece.materialOrigin.material}</strong>
          {" — "}sourced from {piece.materialOrigin.origin}
        </>
      ),
      meta: piece.materialOrigin.date,
    },
    {
      title: "Technique Applied",
      body: (
        <>
          <strong className="font-medium text-ink">{technique.name}</strong>
          {" — "}see Vault clip <span className="meta-mono">[t-2025-04-08-12:14]</span>
        </>
      ),
    },
    {
      title: "Completion",
      body: <>Piece completed by {artisan.name} in {artisan.village}.</>,
      meta: formatDateLong(piece.completedDate),
    },
    {
      title: "Signed",
      body: (
        <>
          Cryptographically signed (Ed25519) by{" "}
          <strong className="font-medium text-ink">{artisan.name}</strong>.
        </>
      ),
      meta: formatDateLong(piece.signedDate),
    },
    {
      title: "Verified",
      body: (
        <>
          Cross-checked against the {craftName} master ledger by Hunarmand.
        </>
      ),
      meta: formatDateLong(piece.signedDate),
    },
  ];

  return (
    <section>
      <header className="mb-6">
        <h2 className="font-display text-[24px] sm:text-[28px] text-ink leading-tight">
          Provenance Chain
        </h2>
        <p className="meta-mono text-ink-margin">
          Every step from material to verification.
        </p>
      </header>

      <ol className="relative pl-4 sm:pl-6">
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-2 left-[6px] sm:left-[10px] w-px bg-gold/45"
        />
        {steps.map((s, i) => (
          <li key={i} className="relative pb-6 last:pb-0 pl-6 sm:pl-8">
            <span
              aria-hidden="true"
              className="absolute -left-[3px] top-2 w-3.5 h-3.5 rounded-full border-2 border-gold bg-parchment"
              style={{
                boxShadow: i === steps.length - 1 ? "0 0 0 4px rgba(200,151,90,0.18)" : "none",
              }}
            />
            <h3 className="font-display text-[18px] text-ink leading-tight">
              {s.title}
            </h3>
            <p className="font-body text-[14px] leading-relaxed text-ink-faded mt-1">
              {s.body}
            </p>
            {s.meta ? (
              <p className="meta-mono text-ink-margin mt-1">{s.meta}</p>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ──────────────────────── Fair price band ─────────────────────── */

function FairPriceBand({
  piece,
  craftName,
}: {
  piece: SanadPiece;
  craftName: string;
}) {
  return (
    <section className="bg-paper border border-line rounded-craft-xl p-8 sm:p-10">
      <header className="mb-4">
        <p className="label-ui text-ink-margin">Fair Price Band</p>
        <h2 className="font-display text-[22px] text-ink leading-tight mt-1">
          Pieces of this {craftName.toLowerCase()} type are valued at
        </h2>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-3 sm:gap-5 items-center">
        <p className="font-display text-[20px] text-brand whitespace-nowrap">
          {formatINR(piece.fairPrice.from)}
        </p>
        <div
          aria-hidden="true"
          className="h-3 rounded-full overflow-hidden"
          style={{
            background:
              "linear-gradient(90deg, var(--gold-light) 0%, var(--gold) 100%)",
            boxShadow: "inset 0 0 0 1px var(--gold-dark, var(--gold))",
          }}
        />
        <p className="font-display text-[20px] text-brand whitespace-nowrap text-right">
          {formatINR(piece.fairPrice.to)}
        </p>
      </div>

      <p className="font-body italic text-[13px] text-ink-faded mt-4">
        Range determined by Hunarmand-verified masters across Kashmir.
      </p>
    </section>
  );
}

/* ───────────────────── Ed25519 signature block ────────────────── */

function SignatureBlock({ piece }: { piece: SanadPiece }) {
  /* Format the 256-char hex string into 4-char groups for legibility. */
  const sig = piece.ed25519;
  const grouped = sig.match(/.{1,4}/g)?.join(" ") ?? sig;

  return (
    <section className="bg-paper border border-line rounded-craft-xl p-6 sm:p-8">
      <details className="group">
        <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <p className="label-ui text-ink-margin">Cryptographic signature</p>
            <p className="font-display text-[18px] text-ink leading-tight mt-1">
              Verifiable offline by any phone — Ed25519
            </p>
          </div>
          <span
            aria-hidden="true"
            className="font-ui text-[12px] tracking-wide uppercase text-ink-margin transition-transform group-open:rotate-180"
          >
            ▼
          </span>
        </summary>

        <div className="mt-5 bg-walnut text-ink-inverse rounded-craft-lg p-5">
          <p className="meta-mono text-ink-inverse/55 mb-3">SIGNATURE · 64 BYTES</p>
          <pre className="font-mono text-[11px] sm:text-[12px] leading-relaxed text-ink-inverse whitespace-pre-wrap break-all">
            {grouped}
          </pre>
          <p className="meta-mono text-ink-inverse/55 mt-3">
            ED25519 · CURVE25519 · NO TRUST CHAIN REQUIRED
          </p>
        </div>
      </details>
    </section>
  );
}

/* ───────────────────────── Gold seal SVG ──────────────────────── */

function GoldSeal() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Hunarmand Sanad gold seal"
      className="shrink-0"
    >
      <circle cx="20" cy="20" r="17.5" fill="var(--gold)" />
      <circle
        cx="20"
        cy="20"
        r="14"
        fill="none"
        stroke="var(--ink-inverse, #FAF7F2)"
        strokeOpacity="0.55"
        strokeWidth="1"
      />
      <path
        d="M12 20.5 L 18 26 L 28.5 14"
        fill="none"
        stroke="var(--text-inverse, #FAF7F2)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
