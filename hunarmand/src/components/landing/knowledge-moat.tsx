import * as React from "react";

import { TalimTexture } from "@/components/motifs";

import { MoatTimeline } from "./moat-timeline";

/* -------------------------------------------------------------------------
 * <KnowledgeMoat />
 *
 * "The Knowledge Moat — Why This Is Urgent". Dark walnut section with a
 * dramatic centered pull-quote and the milestone craft-thread timeline
 * beneath.
 * ----------------------------------------------------------------------- */

export function KnowledgeMoat() {
  return (
    <section className="relative bg-walnut text-ink-inverse overflow-hidden">
      <TalimTexture opacity={0.05} />

      <div className="relative z-10 mx-auto max-w-5xl px-6 md:px-10 py-24 md:py-32 text-center">
        <p className="label-ui text-gold-light">The Knowledge Moat</p>

        <blockquote className="mt-6">
          <span
            className="font-display text-7xl leading-none text-gold/40 block"
            aria-hidden="true"
          >
            &ldquo;
          </span>
          <p className="display-italic text-2xl md:text-4xl leading-snug text-ink-inverse mt-2">
            Every season, an ustaad dies in Srinagar, Pampore, Kanihama.
            <br />
            <span className="text-gold-light">
              A tacit layer of knowledge goes with him.
            </span>
            <br />
            Hunarmand is cultural triage.
          </p>
        </blockquote>

        <p className="mt-10 font-body text-ink-inverse/65 text-base md:text-lg max-w-2xl mx-auto">
          We are not building another marketplace. We are racing the
          clock — recording the unrecorded — so that what survives the
          next decade isn't only the object, but the knowing.
        </p>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-10 pb-24 md:pb-32">
        <MoatTimeline />
      </div>
    </section>
  );
}
