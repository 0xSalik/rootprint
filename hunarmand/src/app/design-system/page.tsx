import * as React from "react";

import { CraftColorProvider } from "@/components/theme/craft-color-provider";
import {
  ArabesqueQuarter,
  ChinarCorner,
  HashiaBorder,
  TalimTexture,
} from "@/components/motifs";
import { SEASON_META, type Season } from "@/lib/seasons";

/* -------------------------------------------------------------------------
 * Hunarmand — Design System Showcase
 *
 * This page is NOT a marketing page. It is a single-scroll inventory of
 * every primitive in the Hunarmand design system: surfaces, brand, gold,
 * the four seasonal palettes, typography, motion, and the four motif
 * SVG components. The product pages will replace this; this exists so B1
 * and B2 can verify the foundation in the browser.
 * ----------------------------------------------------------------------- */

const SEASON_ORDER: Season[] = ["bahar", "grism", "harud", "shishur"];

export default function DesignSystemPage() {
  return (
    <div className="bg-parchment text-ink min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-walnut text-ink-inverse">
        <TalimTexture opacity={0.07} />
        <div className="relative z-10 mx-auto max-w-6xl px-8 py-20">
          <p className="display-italic text-gold-light text-lg">
            The hand still remembers what the book never wrote.
          </p>
          <h1 className="display-hero mt-4 text-5xl md:text-6xl text-ink-inverse">
            Hunarmand · Design System
          </h1>
          <p className="font-body text-ink-inverse/70 mt-4 max-w-xl text-lg leading-relaxed">
            Every primitive on this page carries the weight of the masters
            it serves. Edit nothing here without reading the brief.
          </p>
          <div className="mt-8">
            <HashiaBorder height={12} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-8 py-16 space-y-24">
        {/* ── Section: Global tokens ────────────────────────────── */}
        <section>
          <SectionHeader
            kicker="01 · Foundation"
            title="Global Surface & Brand"
            blurb="The platform's base, regardless of season. Brand red is the thread that runs across every page; gold is the universal premium signal."
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            <Swatch name="Parchment" cssVar="--bg-primary" hex="#FAF7F2" />
            <Swatch name="Aged Paper" cssVar="--bg-secondary" hex="#F0EBE3" />
            <Swatch
              name="Walnut Black"
              cssVar="--bg-dark"
              hex="#1A1410"
              dark
            />
            <Swatch name="Walnut Ink" cssVar="--text-primary" hex="#1C1410" dark />
            <Swatch
              name="Brand · Rouge"
              cssVar="--brand"
              hex="#8B1A1A"
              dark
            />
            <Swatch
              name="Brand · Light"
              cssVar="--brand-light"
              hex="#C4454A"
              dark
            />
            <Swatch name="Gold" cssVar="--gold" hex="#C8975A" />
            <Swatch name="Gold Light" cssVar="--gold-light" hex="#E8C48A" />
          </div>
        </section>

        {/* ── Section: Seasonal palettes ────────────────────────── */}
        <section>
          <SectionHeader
            kicker="02 · The Four Seasons"
            title="Bahar · Grism · Harud · Shishur"
            blurb="Each palette maps to a season and to the craft most associated with it. <CraftColorProvider /> repaints --season-* on the wrapper subtree."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            {SEASON_ORDER.map((s) => (
              <SeasonCard key={s} season={s} />
            ))}
          </div>
        </section>

        {/* ── Section: Typography ───────────────────────────────── */}
        <section>
          <SectionHeader
            kicker="03 · Voice"
            title="Typography"
            blurb="Six families, each chosen for a single role. No Inter, no Roboto, no compromise."
          />

          <div className="space-y-10 mt-10 stagger-children">
            <TypeSample
              role="Display · Cormorant Garamond"
              note="Hero headings, page titles, italic pull-quotes"
              className="font-display"
            >
              <p className="text-5xl leading-tight">
                Kashmir's masters are dying.
                <br />
                Their knowledge dies with them.
              </p>
              <p className="display-italic text-2xl text-ink-faded mt-3">
                The hand still remembers what the book never wrote.
              </p>
            </TypeSample>

            <TypeSample
              role="Section serif · Libre Baskerville"
              note="H2/H3, printed-book feel"
              className="font-serif"
            >
              <h2 className="text-3xl">Meet a Master</h2>
              <p className="text-base text-ink-faded mt-2">
                Mohammad Yusuf Sheikh holds a 1940s Srinagar knot pattern no
                living master else carries.
              </p>
            </TypeSample>

            <TypeSample
              role="UI · Jost"
              note="Labels, navigation, badges"
              className="font-ui"
            >
              <div className="flex flex-wrap gap-3 items-center">
                <span className="label-ui text-brand">Sanad Verified</span>
                <span className="label-ui text-ink-margin">
                  4th Generation · Carpet Weaver · Khanyar, Srinagar
                </span>
              </div>
            </TypeSample>

            <TypeSample
              role="Body · Lora"
              note="Long-form prose, transcripts"
              className="font-body"
            >
              <p className="text-lg leading-relaxed max-w-2xl">
                In winter, the loom warps tighten. A young weaver will set the
                tension by sight. A master sets it by the way the room feels
                when he lays his palm on the wool — a knowledge no manual
                holds.
              </p>
            </TypeSample>

            <TypeSample
              role="Mono · IBM Plex Mono"
              note="Craft IDs, Ed25519 signatures, ledgers"
              className="font-mono"
            >
              <p className="text-sm">
                SANAD-CRP-04A-9F2B · ed25519:sha256:f2a1…c9d3
              </p>
            </TypeSample>

            <TypeSample
              role="Nastaliq · Noto Nastaliq Urdu"
              note="Koshur / Urdu, RTL, paired with English fallback"
              className="font-nastaliq"
            >
              <p dir="rtl" className="text-3xl leading-loose">
                آپ کا ہنر قیمتی ہے
              </p>
              <p className="font-body text-sm text-ink-margin mt-2">
                — Your craft is precious
              </p>
            </TypeSample>
          </div>
        </section>

        {/* ── Section: Motifs ───────────────────────────────────── */}
        <section>
          <SectionHeader
            kicker="04 · Visual Fingerprints"
            title="Motifs"
            blurb="Inline SVG components. Each accepts color and opacity props so they can be layered on any background without image assets."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            <MotifCard
              title="Hashia Border"
              caption="Section dividers, card top edges, page header underlines."
            >
              <div className="space-y-5">
                <HashiaBorder height={14} />
                <HashiaBorder
                  height={10}
                  variant="double"
                  color="var(--brand)"
                />
                <div className="loader-hashia">
                  <HashiaBorder height={14} />
                </div>
                <p className="meta-mono">
                  Variant: line · double · animated (loader)
                </p>
              </div>
            </MotifCard>

            <MotifCard
              title="Chinar Corner"
              caption="Corner embellishment for profile banners and Sanad certificates."
            >
              <div className="relative h-44 surface-card">
                <ChinarCorner corner="tl" size={72} />
                <ChinarCorner corner="tr" size={72} />
                <ChinarCorner corner="bl" size={72} />
                <ChinarCorner corner="br" size={72} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="font-display italic text-xl text-ink-faded">
                    Sanad No. 04A · 9F2B
                  </p>
                </div>
              </div>
            </MotifCard>

            <MotifCard
              title="Talim Texture"
              caption="Dark-surface grid texture. 5–7% opacity by default."
            >
              <div className="relative h-44 overflow-hidden bg-walnut rounded-md">
                <TalimTexture opacity={0.12} />
                <div className="relative z-10 p-5 text-ink-inverse">
                  <p className="display-italic text-gold-light">
                    Every knot a note in the score.
                  </p>
                </div>
              </div>
            </MotifCard>

            <MotifCard
              title="Arabesque Quarter"
              caption="Quarter-tile ornament. Place four mirror-symmetrically to form a tile."
            >
              <div className="relative h-44 surface-card bg-paper">
                <ArabesqueQuarter corner="tl" size={88} />
                <ArabesqueQuarter corner="tr" size={88} />
                <ArabesqueQuarter corner="bl" size={88} />
                <ArabesqueQuarter corner="br" size={88} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="font-serif text-base text-ink-faded">
                    Heritage Bundle
                  </p>
                </div>
              </div>
            </MotifCard>
          </div>
        </section>

        {/* ── Section: Provider in action ───────────────────────── */}
        <section>
          <SectionHeader
            kicker="05 · The Provider"
            title="<CraftColorProvider /> in action"
            blurb="The same surface element is repeated under each season — only the wrapper class changes. SSR-safe, no JS required."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            {SEASON_ORDER.map((s) => (
              <CraftColorProvider key={s} season={s}>
                <ProviderDemoCard />
              </CraftColorProvider>
            ))}
          </div>
        </section>

        {/* ── Section: Motion ───────────────────────────────────── */}
        <section>
          <SectionHeader
            kicker="06 · Motion"
            title="Animations"
            blurb="Deliberate. No bounce. No elastic. The platform deals with irreplaceable things."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            <MotionTile name="hover-lift" hint="Hover the card" lift />
            <MotionTile name="stagger-up" hint="Page-entry default" />
            <MotionTile name="unfurl" hint="Sanad scan reveal" />
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="bg-walnut text-ink-inverse mt-24 relative overflow-hidden">
        <TalimTexture opacity={0.05} />
        <div className="relative z-10 mx-auto max-w-6xl px-8 py-14">
          <HashiaBorder height={10} />
          <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="display-italic text-gold-light text-lg">
                Build Hunarmand like the masters built their crafts —
                <br />
                not for the season, but for the century.
              </p>
            </div>
            <p
              dir="rtl"
              className="font-nastaliq text-2xl text-ink-inverse/80"
            >
              ہنرمند
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────── primitives used by the showcase only ── */

function SectionHeader({
  kicker,
  title,
  blurb,
}: {
  kicker: string;
  title: string;
  blurb: string;
}) {
  return (
    <div className="space-y-3">
      <p className="label-ui text-brand">{kicker}</p>
      <h2 className="font-display text-4xl">{title}</h2>
      <p className="font-body text-ink-faded max-w-2xl">{blurb}</p>
      <div className="rule-hashia mt-4" />
    </div>
  );
}

function Swatch({
  name,
  cssVar,
  hex,
  dark = false,
}: {
  name: string;
  cssVar: string;
  hex: string;
  dark?: boolean;
}) {
  return (
    <div className="surface-card overflow-hidden hover-lift">
      <div
        className="h-24"
        style={{ backgroundColor: `var(${cssVar})` }}
        aria-hidden="true"
      />
      <div className="p-3">
        <p
          className={`font-ui text-sm ${dark ? "text-ink" : "text-ink"}`}
        >
          {name}
        </p>
        <p className="meta-mono">{cssVar}</p>
        <p className="meta-mono">{hex}</p>
      </div>
    </div>
  );
}

function SeasonCard({ season }: { season: Season }) {
  const meta = SEASON_META[season];
  return (
    <CraftColorProvider season={season}>
      <article className="surface-card overflow-hidden hover-lift craft-ribbon">
        <div className="p-5">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="label-ui text-ink-margin">
                {meta.glyph} {meta.englishName}
              </p>
              <h3 className="font-display text-3xl mt-1">{meta.name}</h3>
            </div>
            <span
              className="meta-mono"
              style={{ color: "var(--season-deep)" }}
            >
              theme-{season}
            </span>
          </div>

          <p className="font-serif text-sm text-ink-faded mt-3 max-w-md">
            {meta.tagline}
          </p>

          <div className="mt-5 grid grid-cols-5 gap-1">
            {(Object.keys(meta.swatches) as Array<keyof typeof meta.swatches>).map(
              (key) => (
                <div key={key} className="space-y-1">
                  <div
                    className="h-12 rounded-sm"
                    style={{ backgroundColor: meta.swatches[key] }}
                    aria-hidden="true"
                  />
                  <p className="meta-mono text-[10px] text-ink-margin truncate">
                    {key}
                  </p>
                </div>
              ),
            )}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded-sm text-xs font-ui"
              style={{
                backgroundColor: "var(--season-light)",
                color: "var(--season-deep)",
              }}
            >
              ◆ Season swatch
            </span>
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded-sm text-xs font-ui text-ink-inverse"
              style={{ backgroundColor: "var(--season-deep)" }}
            >
              Workshop ribbon
            </span>
          </div>
        </div>
      </article>
    </CraftColorProvider>
  );
}

function TypeSample({
  role,
  note,
  className,
  children,
}: {
  role: string;
  note: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-start">
      <div>
        <p className="label-ui text-brand">{role}</p>
        <p className="font-body text-sm text-ink-margin mt-1">{note}</p>
      </div>
      <div className={className}>{children}</div>
    </div>
  );
}

function MotifCard({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <article className="surface-card p-5 hover-lift">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-lg">{title}</h3>
        <span className="meta-mono">SVG · color, opacity</span>
      </div>
      <p className="font-body text-sm text-ink-faded mt-1">{caption}</p>
      <div className="mt-5">{children}</div>
    </article>
  );
}

function ProviderDemoCard() {
  return (
    <article className="surface-card overflow-hidden craft-ribbon hover-lift">
      <div className="p-5 flex items-start justify-between gap-4">
        <div>
          <p className="meta-mono">
            data-season &amp; theme-* class on wrapper
          </p>
          <p className="font-display text-2xl mt-2">Workshop Card</p>
          <p className="font-body text-sm text-ink-faded mt-1">
            Same component. Different season. Same source code.
          </p>
        </div>
        <div
          className="size-12 rounded-full"
          style={{ backgroundColor: "var(--season-deep)" }}
          aria-hidden="true"
        />
      </div>
      <div
        className="px-5 py-3 text-xs font-ui flex items-center justify-between"
        style={{
          backgroundColor: "var(--season-light)",
          color: "var(--season-deep)",
        }}
      >
        <span>◆ Season-light pill</span>
        <span style={{ color: "var(--season-accent)" }}>accent thread</span>
      </div>
    </article>
  );
}

function MotionTile({
  name,
  hint,
  lift = false,
}: {
  name: string;
  hint: string;
  lift?: boolean;
}) {
  return (
    <div
      className={`surface-card p-5 ${lift ? "hover-lift" : ""}`}
      style={
        !lift
          ? {
              animation:
                name === "unfurl"
                  ? "unfurl 600ms cubic-bezier(0.16, 1, 0.3, 1) infinite alternate"
                  : "stagger-up 1200ms cubic-bezier(0.16, 1, 0.3, 1) infinite alternate",
            }
          : undefined
      }
    >
      <p className="label-ui text-brand">{name}</p>
      <p className="font-body text-sm text-ink-faded mt-2">{hint}</p>
    </div>
  );
}
