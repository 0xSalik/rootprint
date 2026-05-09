import * as React from "react";

import { type Palette, paletteVars } from "../../../lib/data";

/* -------------------------------------------------------------------------
 * <PreviewConfetti />
 *
 * Pure CSS confetti — small dots fall from the top of the viewport
 * in the craft's seasonal palette colours. Respects
 * `prefers-reduced-motion` (the keyframes are global; an extra rule
 * pauses the elements). Renders 30 dots — enough for a celebration,
 * cheap enough not to harm performance.
 * ----------------------------------------------------------------------- */

interface PreviewConfettiProps {
  palette: Palette;
  count?: number;
}

const KEYFRAMES_ID = "preview-confetti-keyframes";

const KEYFRAMES_CSS = `
@keyframes preview-confetti-fall {
  0% { transform: translate3d(0, -10vh, 0) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translate3d(var(--xshift, 0), 110vh, 0) rotate(540deg); opacity: 0.3; }
}
@media (prefers-reduced-motion: reduce) {
  .preview-confetti-dot {
    animation: none !important;
    display: none;
  }
}
`;

export function PreviewConfetti({ palette, count = 30 }: PreviewConfettiProps) {
  const p = paletteVars(palette);
  const colors = [p.deep, p.mid, p.accent, p.gold, "var(--brand)"];

  /* Deterministic positions seeded by index — so each render is the
   * same and Hydration doesn't fight us. */
  const dots = Array.from({ length: count }, (_, i) => {
    const left = (i * 137.5) % 100;
    const delay = (i % 12) * 280;
    const duration = 4200 + ((i * 311) % 2400);
    const size = 5 + (i % 4) * 2;
    const xshift = ((i * 53) % 200) - 100;
    const color = colors[i % colors.length];
    const round = i % 3 === 0;
    return { left, delay, duration, size, xshift, color, round };
  });

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
    >
      <style
        id={KEYFRAMES_ID}
        dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }}
      />
      {dots.map((d, i) => (
        <span
          key={i}
          className="preview-confetti-dot absolute top-0"
          style={{
            left: `${d.left}%`,
            width: d.size,
            height: d.size,
            backgroundColor: d.color,
            borderRadius: d.round ? "50%" : "1px",
            animation: `preview-confetti-fall ${d.duration}ms linear ${d.delay}ms infinite`,
            ["--xshift" as string]: `${d.xshift}px`,
          }}
        />
      ))}
    </div>
  );
}
