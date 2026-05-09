import * as React from "react";

import type { Letter } from "@/lib/artisans";
import { formatDate } from "@/lib/artisans";

import { ChinarCorner } from "@/components/motifs";

/* -------------------------------------------------------------------------
 * <LettersSection /> — section 3h.
 *
 * Trust section. NOT star reviews. Each testimonial is a handwritten
 * letter on cream card, with the buyer's name, city/country, and the
 * piece they purchased. Body text is set in a handwriting-adjacent
 * font (Caveat) so the letters feel personal and tactile.
 * ----------------------------------------------------------------------- */

interface LettersSectionProps {
  letters: Letter[];
  artisanFirstName: string;
}

export function LettersSection({
  letters,
  artisanFirstName,
}: LettersSectionProps) {
  return (
    <section className="bg-parchment">
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-20 md:py-24">
        <header className="max-w-3xl">
          <p className="label-ui text-brand">What buyers write</p>
          <h2 className="display-hero text-3xl md:text-5xl text-ink mt-3">
            Letters to {artisanFirstName}.
          </h2>
          <p className="font-body text-ink-faded text-base md:text-lg mt-4 max-w-2xl">
            We do not run star ratings. Each piece sold to a verified
            buyer earns the right to one letter — passed straight to the
            master, kept here for the record.
          </p>
        </header>

        <ul className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {letters.map((l, i) => (
            <li key={l.id}>
              <LetterCard letter={l} index={i} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ──────────────────────────── card ────────────────────────────── */

const LETTER_TILTS = ["-rotate-1", "rotate-[0.5deg]", "rotate-[1.2deg]", "-rotate-[1.4deg]"];

function LetterCard({ letter, index }: { letter: Letter; index: number }) {
  const tilt = LETTER_TILTS[index % LETTER_TILTS.length];

  return (
    <article
      className={`relative h-full surface-card hover-lift overflow-hidden p-6 md:p-7 ${tilt} transition-transform duration-300 hover:rotate-0`}
      style={{
        background:
          "linear-gradient(180deg, var(--bg-primary) 0%, var(--paper) 100%)",
      }}
    >
      {/* Faint Chinar corners as the letter's stationery decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <div className="absolute top-1 left-1">
          <ChinarCorner corner="tl" size={42} color="var(--season-gold)" opacity={0.5} />
        </div>
        <div className="absolute bottom-1 right-1">
          <ChinarCorner corner="br" size={42} color="var(--season-gold)" opacity={0.4} />
        </div>
      </div>

      {/* Stamp / postmark in the top-right */}
      <span
        className="absolute top-5 right-5 inline-flex flex-col items-center justify-center size-14 rounded-full border-2 text-center pointer-events-none rotate-[-12deg]"
        style={{
          borderColor: "var(--brand)",
          color: "var(--brand)",
        }}
      >
        <span
          className="font-ui text-[8px] uppercase tracking-[0.18em] leading-none"
          style={{ color: "var(--brand)" }}
        >
          Sanad
        </span>
        <span
          className="font-display italic text-[10px] leading-none mt-0.5"
          style={{ color: "var(--brand)" }}
        >
          ✓ verified
        </span>
      </span>

      <div className="relative z-10">
        <p className="meta-mono">
          {formatDate(letter.written)}
        </p>

        <p className="font-handwriting text-2xl md:text-[1.6rem] text-ink mt-4 leading-snug">
          &ldquo;{letter.body}&rdquo;
        </p>

        <div className="mt-6 pt-4 border-t border-line/70">
          <p className="font-display italic text-base text-ink">
            {letter.from}
          </p>
          <p className="meta-mono mt-1">
            On: <span className="text-ink-faded">{letter.piece}</span>
          </p>
        </div>
      </div>
    </article>
  );
}
