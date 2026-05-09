import * as React from "react";

import {
  BazaarIcon,
  SanadIcon,
  UstaadIcon,
  VaultIcon,
} from "./layer-icons";

/* -------------------------------------------------------------------------
 * <FourLayersSection />
 *
 * "One platform. Four layers. One flywheel."
 * Cards in a 2×2 grid (desktop) / stacked (mobile). Each card has a
 * delicate craft-ink line icon, a Jost-caps layer name, one sentence,
 * and the Kashmiri/Urdu word watermarked behind the content.
 * ----------------------------------------------------------------------- */

interface Layer {
  name: string;
  urdu: string;
  description: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** Connects this layer to the next in the flywheel — used in the small
   *  meta-mono caption beneath the heading. */
  hint: string;
}

const LAYERS: Layer[] = [
  {
    name: "Vault",
    urdu: "خزانہ",
    description:
      "Captures every master's tacit knowledge — technique, lineage, decisions — before it's gone.",
    Icon: VaultIcon,
    hint: "01 · The capture",
  },
  {
    name: "Sanad",
    urdu: "سند",
    description:
      "Each piece carries a cryptographically signed record of provenance, scannable from anywhere in the world.",
    Icon: SanadIcon,
    hint: "02 · The proof",
  },
  {
    name: "Ustaad",
    urdu: "استاد",
    description:
      "Book time directly with masters — workshops, heritage walks, virtual masterclasses — from their own chair.",
    Icon: UstaadIcon,
    hint: "03 · The encounter",
  },
  {
    name: "Bazaar",
    urdu: "بازار",
    description:
      "A storefront of authenticated craft, with seasonal pop-ups and curated heritage bundles.",
    Icon: BazaarIcon,
    hint: "04 · The market",
  },
];

export function FourLayersSection() {
  return (
    <section className="bg-parchment">
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="label-ui text-brand">The Architecture</p>
          <h2 className="display-hero mt-3 text-3xl md:text-5xl text-ink">
            One platform. Four layers.
            <span className="text-brand"> One flywheel.</span>
          </h2>
          <p className="font-body text-ink-faded text-base md:text-lg mt-5 max-w-2xl">
            Each layer feeds the next. Every Vault recorded becomes a
            Sanad on a piece. Every Sanad found becomes an Ustaad
            booked. Every Ustaad met fills the Bazaar. Every Bazaar
            sale funds the next Vault.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
          {LAYERS.map((layer) => (
            <LayerCard key={layer.name} layer={layer} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LayerCard({ layer }: { layer: Layer }) {
  const { Icon } = layer;
  return (
    <article className="relative overflow-hidden surface-card hover-lift p-7 md:p-9 group">
      {/* Urdu watermark — sits behind, anchored bottom-right */}
      <span
        dir="rtl"
        aria-hidden="true"
        className="font-nastaliq absolute bottom-2 right-4 text-[7rem] md:text-[9rem] leading-none text-ink/[0.05] select-none pointer-events-none"
      >
        {layer.urdu}
      </span>

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="text-brand">
            <Icon width={56} height={56} />
          </div>
          <p className="meta-mono">{layer.hint}</p>
        </div>

        <p className="label-ui text-ink-margin mt-8">
          The {layer.name} layer
        </p>
        <h3 className="display-hero text-3xl md:text-4xl text-ink mt-2">
          {layer.name}
        </h3>

        <p className="font-body text-ink-faded text-base mt-4 max-w-md leading-relaxed">
          {layer.description}
        </p>

        <div className="mt-6 flex items-center gap-3">
          <span className="meta-mono">{layer.urdu}</span>
          <span className="meta-mono">/</span>
          <span className="meta-mono">{layer.name.toLowerCase()}.hunarmand</span>
        </div>
      </div>
    </article>
  );
}
