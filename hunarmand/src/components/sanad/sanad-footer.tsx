import * as React from "react";

import { type SanadDict } from "@/lib/sanad-i18n";
import { HashiaBorder } from "@/components/motifs";
import { QrGlyph } from "@/components/artisan/qr-glyph";

/* -------------------------------------------------------------------------
 * <SanadFooter />
 *
 * Minimal walnut footer. Holds the brand wordmark, a small QR glyph
 * reminder ("scanned from a Hunarmand QR"), and links to terms /
 * verification documentation. No newsletter, no marketing — this is
 * the back of the certificate, and it should feel like one.
 * ----------------------------------------------------------------------- */

interface SanadFooterProps {
  dict: SanadDict;
}

export function SanadFooter({ dict }: SanadFooterProps) {
  return (
    <footer className="surface-walnut">
      <HashiaBorder height={6} color="var(--season-gold)" opacity={0.6} />
      <div className="mx-auto max-w-3xl px-5 sm:px-8 py-8 sm:py-10 grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-6 items-center">
        <div className="flex items-center gap-3 text-ink-inverse">
          <QrGlyph size={28} />
          <span className="meta-mono uppercase tracking-[0.18em]">
            {dict.scanToVerify}
          </span>
        </div>
        <p className="font-display text-lg sm:text-xl text-ink-inverse leading-tight">
          {dict.poweredBy}
        </p>
        <p className="meta-mono text-ink-inverse/60 sm:text-right">
          {dict.termsAndPrivacy}
        </p>
      </div>
    </footer>
  );
}
