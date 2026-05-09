import * as React from "react";

import { type SanadDict } from "@/lib/sanad-i18n";

/* -------------------------------------------------------------------------
 * <SignatureBlock />
 *
 * The Ed25519 signature panel. Presented inside a native HTML <details>
 * so it collapses without a single line of JavaScript. The summary
 * shows a short fingerprint; opening the disclosure reveals the full
 * public key + signature in IBM Plex Mono.
 *
 * Both values are derived deterministically from the pieceId so the
 * page is stable across pre-renders. In production these come from
 * the master's actual signing run — the wire format is identical.
 * ----------------------------------------------------------------------- */

interface SignatureBlockProps {
  pieceId: string;
  /** Compact public key fingerprint shown in the chain step (e.g.
   *  the first 12 hex chars). The full key sits inside the disclosure. */
  publicKeyFingerprint: string;
  publicKey: string;
  signature: string;
  dict: SanadDict;
}

export function SignatureBlock({
  pieceId,
  publicKey,
  signature,
  publicKeyFingerprint,
  dict,
}: SignatureBlockProps) {
  return (
    <details className="group surface-card border border-line/80 rounded-craft p-0 overflow-hidden">
      <summary
        className="cursor-pointer list-none px-4 py-3 sm:px-5 sm:py-4 flex items-start gap-3 hover:bg-paper-deep/40 transition-colors duration-150"
        // pure-CSS list marker hidden via list-none above
      >
        <span
          aria-hidden="true"
          className="meta-mono text-ink-margin pt-0.5 transition-transform duration-200 group-open:rotate-90"
        >
          ▸
        </span>
        <span className="flex-1 min-w-0">
          <span
            className="block font-mono text-xs sm:text-[13px] text-ink leading-snug truncate"
            dir="ltr"
          >
            ed25519:{publicKeyFingerprint}…
          </span>
          <span className="block meta-mono text-ink-margin mt-1">
            <span className="group-open:hidden">{dict.viewSignature}</span>
            <span className="hidden group-open:inline">{dict.hideSignature}</span>
          </span>
        </span>
      </summary>

      <div className="border-t border-line bg-paper-deep/40 px-4 py-4 sm:px-5 sm:py-5 space-y-4">
        <SignatureField label={dict.publicKey} value={publicKey} prefix="ed25519" />
        <SignatureField label={dict.signature} value={signature} prefix="sig" />
        <p className="meta-mono text-ink-margin">
          {dict.pieceId}: <span className="text-ink" dir="ltr">{pieceId}</span>
        </p>
      </div>
    </details>
  );
}

function SignatureField({
  label,
  value,
  prefix,
}: {
  label: string;
  value: string;
  prefix: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="meta-mono text-ink-faded">{label}</p>
      <pre
        dir="ltr"
        className="font-mono text-[11px] sm:text-xs leading-relaxed text-ink whitespace-pre-wrap break-all bg-parchment border border-line rounded-craft p-3"
      >
        <span className="text-ink-margin">{prefix}:</span>
        {value}
      </pre>
    </div>
  );
}

/* ------------------------- Deterministic pseudo-keys -------------------- */

/**
 * Generate a stable, plausible-looking hex string of N bytes (each byte
 * shown as two hex chars) derived deterministically from the seed. Used
 * to render Ed25519 public keys / signatures for the demo. This is NOT
 * a real cryptographic signature — when real signing is wired in, the
 * presentation layer stays identical.
 */
export function pseudoHex(seed: string, byteLength: number): string {
  let state =
    seed.split("").reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261) ||
    1;
  const out: string[] = [];
  for (let i = 0; i < byteLength; i++) {
    state = Math.imul(state, 1597) + 51749 >>> 0;
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    out.push((state & 0xff).toString(16).padStart(2, "0"));
  }
  return out.join("");
}

/** Group a hex string into space-separated 4-char blocks for legibility. */
export function groupHex(hex: string, blockSize = 4): string {
  const out: string[] = [];
  for (let i = 0; i < hex.length; i += blockSize) {
    out.push(hex.slice(i, i + blockSize));
  }
  return out.join(" ");
}
