import * as React from "react";

import { type Artisan, type Craft } from "../../../lib/data";
import { ChinarCorner, HashiaBorder } from "@/components/motifs";

/* -------------------------------------------------------------------------
 * <VaultPreview />
 *
 * The "Preserved in the Vault" card — styled like an aged
 * illuminated manuscript: paper background, gold ChinarCorner
 * ornaments in all four corners, Hashia borders top and bottom, and
 * four labelled sections of bullet-point notes drawn straight from
 * the artisan's vault excerpts in `lib/data`.
 *
 * The tone is intentionally archival — small uppercase labels in
 * Jost, body text in Lora italic. The footer shows a "private to
 * artisan & researchers" lock plus a "Request Research Access"
 * ghost button.
 * ----------------------------------------------------------------------- */

interface VaultPreviewProps {
  artisan: Artisan;
  craft: Craft;
}

const SECTIONS: Array<{
  key: keyof Artisan["vault"];
  label: string;
  caption: string;
}> = [
  { key: "lineage", label: "Lineage", caption: "Family · place · year" },
  { key: "technique", label: "Technique Walkthrough", caption: "How the work is made" },
  { key: "decision", label: "Decision Knowledge", caption: "When to start, when to stop" },
  { key: "supplier", label: "Supplier Graph", caption: "Where the materials begin" },
];

export function VaultPreview({ artisan }: VaultPreviewProps) {
  return (
    <div className="relative bg-paper border border-line rounded-craft-xl overflow-hidden">
      {/* Corner ornaments */}
      <ChinarCorner corner="tl" size={56} className="absolute top-2 left-2" />
      <ChinarCorner corner="tr" size={56} className="absolute top-2 right-2" />
      <ChinarCorner corner="bl" size={56} className="absolute bottom-2 left-2" />
      <ChinarCorner corner="br" size={56} className="absolute bottom-2 right-2" />

      {/* Top hashia */}
      <div className="px-8 pt-6">
        <HashiaBorder
          className="block w-full text-gold"
          color="var(--gold)"
          opacity={0.7}
          height={12}
        />
      </div>

      <div className="relative px-8 sm:px-12 py-8 sm:py-10 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8 sm:gap-y-10">
        {SECTIONS.map((section) => (
          <section key={section.key}>
            <header className="mb-3">
              <h3
                className="font-display text-[20px] text-ink leading-tight"
                style={{ color: "var(--season-deep)" }}
              >
                {section.label}
              </h3>
              <p className="meta-mono text-ink-margin">{section.caption}</p>
            </header>
            <ul className="flex flex-col gap-2">
              {artisan.vault[section.key].map((line, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 font-body italic text-[14px] leading-relaxed text-ink-faded"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2.5 inline-block w-1.5 h-1.5 rounded-full bg-gold/80 shrink-0"
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* Bottom hashia */}
      <div className="px-8">
        <HashiaBorder
          className="block w-full text-gold"
          color="var(--gold)"
          opacity={0.7}
          height={12}
        />
      </div>

      {/* Footer */}
      <footer className="px-8 sm:px-12 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-line">
        <p className="inline-flex items-center gap-2 font-ui text-[12px] tracking-wide uppercase text-ink-margin">
          <Lock />
          Full Vault — Private to {artisan.firstName} &amp; Researchers
        </p>
        <a
          href="mailto:research@hunarmand.example?subject=Vault%20access%20request"
          className="inline-flex items-center justify-center px-4 py-2 rounded-craft border border-line text-ink hover:border-brand hover:text-brand font-ui text-[12px] tracking-wide transition-colors"
        >
          Request Research Access
        </a>
      </footer>
    </div>
  );
}

function Lock() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true">
      <rect x="2.5" y="6" width="8" height="6" rx="1" />
      <path d="M4.5 6 V 4.2 a 2 2 0 1 1 4 0 V 6" />
    </svg>
  );
}
