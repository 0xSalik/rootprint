"use client";

import * as React from "react";

/* -------------------------------------------------------------------------
 * <CountUp />
 *
 * The Craft Counter Strip uses this. A number ticks from 0 to `value`
 * once it scrolls into view, then stops. Pure rAF, no deps.
 *
 * If `static` is true, no animation runs and the raw `display` text is
 * shown — used for entries like "< 1%" where the value is qualitative.
 * ----------------------------------------------------------------------- */

interface CountUpProps {
  value?: number;
  /** Pre-formatted label shown when `static` is true (e.g. "< 1%"). */
  display?: string;
  prefix?: string;
  suffix?: string;
  /** Animation duration in ms. */
  duration?: number;
  /** Skip animation, render `display` (or `value`) verbatim. */
  static?: boolean;
  className?: string;
}

const easeOutCraft = (t: number): number => 1 - Math.pow(1 - t, 4);

export function CountUp({
  value = 0,
  display,
  prefix = "",
  suffix = "",
  duration = 1600,
  static: isStatic = false,
  className,
}: CountUpProps) {
  const ref = React.useRef<HTMLSpanElement | null>(null);
  const [shown, setShown] = React.useState<string>(
    isStatic ? (display ?? `${prefix}${value}${suffix}`) : `${prefix}0${suffix}`,
  );

  React.useEffect(() => {
    if (isStatic || typeof IntersectionObserver === "undefined") return;
    const el = ref.current;
    if (!el) return;

    let rafId = 0;
    let started = false;

    const start = () => {
      if (started) return;
      started = true;
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / duration);
        const eased = easeOutCraft(t);
        const n = Math.round(eased * value);
        setShown(`${prefix}${n}${suffix}`);
        if (t < 1) rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            start();
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [value, prefix, suffix, duration, isStatic]);

  return (
    <span ref={ref} className={className}>
      {shown}
    </span>
  );
}
