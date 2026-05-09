import * as React from "react";

import {
  type Artisan,
  type SignedPiece,
  type SupplierOrigin,
  type Technique,
} from "@/lib/artisans";
import {
  type SanadDict,
  type SanadLocale,
  formatDateLocale,
} from "@/lib/sanad-i18n";

import {
  CompletedIcon,
  MaterialIcon,
  SignatureIcon,
  SignedIcon,
  TechniqueIcon,
} from "./provenance-icons";
import {
  SignatureBlock,
  groupHex,
  pseudoHex,
} from "./signature-block";

/* -------------------------------------------------------------------------
 * <ProvenanceChain />
 *
 * The vertical timeline. Reads like a blockchain explorer in feel —
 * sequential, time-ordered steps connected by a ledger thread — but
 * presented as a hand-bound register, not a black-and-green console.
 *
 * Steps:
 *   1. Material origin(s)        — one row per supplier (village + season)
 *   2. Technique applied         — title + Vault session reference
 *   3. Date of completion        — when the piece came off the loom
 *   4. Date of signing           — when the master signed it
 *   5. Cryptographic signature   — collapsible <details>
 *
 * The thread between steps is a single absolutely-positioned vertical
 * line; the icon medallions punch through it on each row.
 * ----------------------------------------------------------------------- */

interface ProvenanceChainProps {
  piece: SignedPiece;
  artisan: Artisan;
  technique: Technique | null;
  materialOrigins: SupplierOrigin[];
  dict: SanadDict;
  locale: SanadLocale;
}

export function ProvenanceChain({
  piece,
  artisan,
  technique,
  materialOrigins,
  dict,
  locale,
}: ProvenanceChainProps) {
  const publicKey = pseudoHex(`${artisan.slug}:pubkey`, 32);
  const signatureHex = pseudoHex(`${piece.pieceId}:sig`, 64);
  const fingerprint = publicKey.slice(0, 12);

  return (
    <section
      aria-labelledby="provenance-heading"
      className="bg-paper border border-line rounded-craft-lg p-6 sm:p-8"
    >
      <header className="mb-6 sm:mb-8">
        <p className="meta-mono text-ink-margin">{dict.step}</p>
        <h2
          id="provenance-heading"
          className="font-display text-3xl sm:text-4xl text-ink leading-tight mt-1"
        >
          {dict.provenanceChainTitle}
        </h2>
        <p className="font-body text-ink-faded mt-2 max-w-prose">
          {dict.provenanceChainBlurb}
        </p>
      </header>

      <ol className="relative">
        {/* The thread */}
        <span
          aria-hidden="true"
          className="absolute top-3 bottom-3 w-px bg-line"
          style={{ left: "calc(1.25rem - 0.5px)" }}
        />

        {/* 1 — Materials */}
        {materialOrigins.length > 0 && (
          <ChainStep
            icon={<MaterialIcon size={16} />}
            label={dict.stepMaterial}
            blurb={dict.stepMaterialBlurb}
            number="01"
          >
            <ul className="space-y-3">
              {materialOrigins.map((origin, i) => (
                <li key={origin.id} className="space-y-0.5">
                  <p className="font-serif text-ink leading-snug">
                    {origin.material} — {origin.place}
                  </p>
                  <p className="meta-mono text-ink-margin">
                    {origin.note}
                    {piece.materialSeasons?.[i]
                      ? ` · ${piece.materialSeasons[i]}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          </ChainStep>
        )}

        {/* 2 — Technique */}
        <ChainStep
          icon={<TechniqueIcon size={16} />}
          label={dict.stepTechnique}
          blurb={dict.stepTechniqueBlurb}
          number={materialOrigins.length > 0 ? "02" : "01"}
        >
          <p className="font-serif text-ink leading-snug">
            {technique?.name ?? piece.type}
          </p>
          {technique?.vaultExcerpt && (
            <p className="font-body italic text-ink-faded mt-1 max-w-prose">
              "{techniqueExcerpt(technique.vaultExcerpt)}"
            </p>
          )}
          {technique?.clipId && (
            <p className="meta-mono text-ink-margin mt-2" dir="ltr">
              {dict.vaultRef} · {technique.clipId} · {technique.vaultSession}
            </p>
          )}
        </ChainStep>

        {/* 3 — Completed on (if known) */}
        {piece.completedOn && (
          <ChainStep
            icon={<CompletedIcon size={16} />}
            label={dict.stepCompleted}
            number={materialOrigins.length > 0 ? "03" : "02"}
          >
            <p className="font-serif text-ink">
              {formatDateLocale(piece.completedOn, locale)}
            </p>
          </ChainStep>
        )}

        {/* 4 — Signed on */}
        <ChainStep
          icon={<SignedIcon size={16} />}
          label={dict.stepSigned}
          blurb={dict.stepSignedBlurb}
          number={
            (materialOrigins.length > 0 ? 1 : 0) +
            (piece.completedOn ? 1 : 0) +
            2 + ""
          }
        >
          <p className="font-serif text-ink">
            {formatDateLocale(piece.signedOn, locale)}
          </p>
        </ChainStep>

        {/* 5 — Cryptographic signature */}
        <ChainStep
          icon={<SignatureIcon size={16} />}
          label={dict.stepSignature}
          blurb={dict.stepSignatureBlurb}
          number={
            (materialOrigins.length > 0 ? 1 : 0) +
            (piece.completedOn ? 1 : 0) +
            3 + ""
          }
          isLast
        >
          <SignatureBlock
            pieceId={piece.pieceId}
            publicKey={groupHex(publicKey)}
            publicKeyFingerprint={fingerprint}
            signature={groupHex(signatureHex)}
            dict={dict}
          />
        </ChainStep>
      </ol>
    </section>
  );
}

/* ------------------------------ Step row ------------------------------- */

interface ChainStepProps {
  icon: React.ReactNode;
  label: string;
  blurb?: string;
  /** Two-digit step number shown next to the label. */
  number: string;
  isLast?: boolean;
  children: React.ReactNode;
}

function ChainStep({
  icon,
  label,
  blurb,
  number,
  isLast,
  children,
}: ChainStepProps) {
  return (
    <li
      className={[
        "relative pl-12 sm:pl-14",
        isLast ? "pb-0" : "pb-6 sm:pb-8",
      ].join(" ")}
    >
      {/* Medallion */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 inline-flex items-center justify-center size-10 rounded-full border bg-paper text-season-deep"
        style={{
          borderColor: "var(--season-gold)",
          boxShadow: "0 1px 0 0 rgba(28,20,16,0.04)",
        }}
      >
        {icon}
      </span>

      <div className="-mt-0.5">
        <p className="meta-mono text-ink-margin tracking-[0.16em]">
          {number} · {label}
        </p>
        {blurb && (
          <p className="font-body text-sm text-ink-faded mt-0.5 max-w-prose">
            {blurb}
          </p>
        )}
      </div>
      <div className="mt-3">{children}</div>
    </li>
  );
}

function techniqueExcerpt(text: string): string {
  const first = text.split(/(?<=[.?!])\s+/)[0] ?? text;
  return first.length > 220 ? first.slice(0, 217) + "…" : first;
}
