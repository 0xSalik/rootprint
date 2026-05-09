import * as React from "react";
import Link from "next/link";

import { CraftColorProvider } from "@/components/theme/craft-color-provider";
import { type Craft, CRAFT_LABEL } from "@/lib/seasons";

import { SpotlightArt } from "./spotlight-art";

/* -------------------------------------------------------------------------
 * <ArtisanSpotlight />
 *
 * Two featured masters in alternating left/right layouts. Each block is
 * wrapped in <CraftColorProvider> so the season palette of the artisan's
 * craft paints the spotlight art tile.
 * ----------------------------------------------------------------------- */

interface SpotlightArtisan {
  slug: string;
  name: string;
  craft: Craft;
  generation: number;
  location: string;
  /** A 2-line quote from their Vault. */
  quote: string;
  /** The "irreplaceable thing" only this master holds. */
  irreplaceable: string;
  /** Variant for the spotlight art tile. */
  artVariant: "knot" | "loom";
}

const ARTISANS: SpotlightArtisan[] = [
  {
    slug: "mohammad-yusuf-sheikh",
    name: "Mohammad Yusuf Sheikh",
    craft: "carpet",
    generation: 4,
    location: "Khanyar, Srinagar",
    quote:
      "The 1940s knot — my grandfather's father knew it. The book never wrote it down. If I do not give it to my son this winter, no one will hold it again.",
    irreplaceable:
      "Holds a discontinued 1940s Srinagar knot pattern no living master else carries.",
    artVariant: "knot",
  },
  {
    slug: "bashir-ahmad-bhat",
    name: "Bashir Ahmad Bhat",
    craft: "pashmina",
    generation: 5,
    location: "Kanihama, Budgam",
    quote:
      "In winter, the loom warps tighten. A young weaver sets the tension by sight. I set it by the way the room feels when I lay my palm on the wool.",
    irreplaceable:
      "Sets Pashmina warp tension by hand-sense, a calibration no manual records.",
    artVariant: "loom",
  },
];

export function ArtisanSpotlight() {
  return (
    <section className="bg-parchment">
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="label-ui text-brand">The Masters</p>
          <h2 className="display-hero text-3xl md:text-5xl text-ink mt-3">
            Meet a master.
          </h2>
          <p className="font-body text-ink-faded text-base md:text-lg mt-4 max-w-2xl">
            These are not biographies. They are doorways into workshops
            that have stood for four, five, six generations.
          </p>
        </div>

        <div className="mt-16 space-y-20 md:space-y-28">
          {ARTISANS.map((a, i) => (
            <CraftColorProvider key={a.slug} craft={a.craft}>
              <SpotlightBlock artisan={a} reverse={i % 2 === 1} />
            </CraftColorProvider>
          ))}
        </div>
      </div>
    </section>
  );
}

function SpotlightBlock({
  artisan,
  reverse,
}: {
  artisan: SpotlightArtisan;
  reverse: boolean;
}) {
  const craftLabel = CRAFT_LABEL[artisan.craft];

  return (
    <article className="grid md:grid-cols-12 gap-8 md:gap-12 items-center">
      {/* Art tile */}
      <div
        className={`md:col-span-5 ${reverse ? "md:order-2" : ""}`}
      >
        <SpotlightArt variant={artisan.artVariant} />
      </div>

      {/* Text column */}
      <div
        className={`md:col-span-7 ${reverse ? "md:order-1 md:pr-10" : "md:pl-6"}`}
      >
        <p
          className="meta-mono"
          style={{ color: "var(--season-deep)" }}
        >
          {craftLabel.en}
          <span className="mx-2">·</span>
          <span dir="rtl" className="font-nastaliq text-base align-middle">
            {craftLabel.ur}
          </span>
        </p>

        <h3 className="display-italic text-3xl md:text-5xl text-ink mt-3 leading-tight">
          {artisan.name}
        </h3>

        <p className="font-ui text-xs uppercase tracking-[0.18em] text-ink-margin mt-3">
          {ordinal(artisan.generation)} Generation · {artisan.location}
        </p>

        <blockquote className="mt-7 max-w-xl">
          {/* Opening flourish */}
          <span
            className="font-display text-5xl leading-none align-top mr-1"
            style={{ color: "var(--season-deep)" }}
            aria-hidden="true"
          >
            &ldquo;
          </span>
          <span className="font-body italic text-lg md:text-xl text-ink leading-relaxed">
            {artisan.quote}
          </span>
        </blockquote>

        <p className="mt-6 font-body text-sm text-ink-faded max-w-xl">
          <span
            className="font-ui uppercase text-[10px] tracking-[0.18em] mr-2"
            style={{ color: "var(--season-deep)" }}
          >
            ✦ Only he holds
          </span>
          {artisan.irreplaceable}
        </p>

        <Link
          href={`/artisan/${artisan.slug}`}
          className="group mt-8 inline-flex items-center gap-2 font-ui text-sm uppercase tracking-[0.18em] text-brand hover:text-brand-light"
        >
          See full profile
          <span
            className="transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden="true"
          >
            →
          </span>
        </Link>
      </div>
    </article>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
