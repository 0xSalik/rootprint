import * as React from "react";

import { CountUp } from "./count-up";

/* -------------------------------------------------------------------------
 * <CraftCounterStrip />
 *
 * Narrow band of four animated counters that scroll-into-view, framed by
 * a single line in Jost: "These numbers are why Hunarmand exists." Sits
 * directly under the hero on aged paper.
 * ----------------------------------------------------------------------- */

interface CounterCfg {
  value?: number;
  display?: string;
  prefix?: string;
  suffix?: string;
  static?: boolean;
  unit: string;
  caption: string;
  source: string;
}

const COUNTERS: CounterCfg[] = [
  {
    value: 4,
    suffix: " lakh+",
    unit: "Artisans",
    caption: "Living artisans across Kashmir",
    source: "J&K Handicrafts Dept., 2023",
  },
  {
    value: 60,
    suffix: "%+",
    unit: "Counterfeit",
    caption: "Of \u201cKashmiri\u201d goods sold globally are fakes",
    source: "Crafts Council of India estimate",
  },
  {
    value: 55,
    suffix: "+",
    unit: "Avg. master age",
    caption: "Up from 36 in the 1980s",
    source: "Field surveys, 2022",
  },
  {
    display: "< 1%",
    static: true,
    unit: "Documented",
    caption: "Of master techniques are recorded anywhere",
    source: "Hunarmand audit, 2025",
  },
];

export function CraftCounterStrip() {
  return (
    <section className="bg-paper border-b border-line">
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-14 md:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
          {COUNTERS.map((c, i) => (
            <CounterTile key={i} cfg={c} />
          ))}
        </div>

        <p className="mt-12 text-center font-ui text-xs md:text-sm uppercase tracking-[0.18em] text-ink-margin">
          These numbers are why Hunarmand exists.
        </p>
      </div>
    </section>
  );
}

function CounterTile({ cfg }: { cfg: CounterCfg }) {
  return (
    <div className="relative">
      <div className="flex items-baseline gap-2">
        <CountUp
          value={cfg.value}
          display={cfg.display}
          prefix={cfg.prefix}
          suffix={cfg.suffix}
          static={cfg.static}
          className="font-display text-5xl md:text-6xl text-ink leading-none tracking-tight"
        />
      </div>
      <p className="label-ui text-brand mt-3">{cfg.unit}</p>
      <p className="font-body text-sm text-ink-faded mt-2 max-w-[18rem]">
        {cfg.caption}
      </p>
      <p className="meta-mono mt-2 text-[11px]">— {cfg.source}</p>
    </div>
  );
}
