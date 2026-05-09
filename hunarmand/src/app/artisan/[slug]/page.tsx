import * as React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LandingFooter } from "@/components/landing/landing-footer";
import { CraftColorProvider } from "@/components/theme/craft-color-provider";

/* Existing rich-template pieces — used as a fallback for the
 * seed-driven artisans (e.g. /artisan/bashir-ahmad-bhat) that are
 * not in the new lib/data.ts dataset. */
import { CraftDNA as RichCraftDNA } from "@/components/artisan/craft-dna";
import { CraftIdentityBar as RichIdentityBar } from "@/components/artisan/identity-bar";
import { LettersSection as RichLettersSection } from "@/components/artisan/letters-section";
import { LineageWall as RichLineageWall } from "@/components/artisan/lineage-wall";
import { ProfileBanner as RichProfileBanner } from "@/components/artisan/profile-banner";
import { ProvenanceLedger as RichProvenanceLedger } from "@/components/artisan/provenance-ledger";
import { SupplierGraph as RichSupplierGraph } from "@/components/artisan/supplier-graph";
import { WorkshopsSection as RichWorkshopsSection } from "@/components/artisan/workshops-section";
import {
  getArtisan as getRichArtisan,
  listArtisanSlugs as listRichArtisanSlugs,
} from "@/lib/artisans";

/* New craft-entry-point preview pieces — used for every artisan in
 * lib/data.ts. */
import {
  ARTISANS_DATA,
  SANAD_PIECES,
  getArtisan as getPreviewArtisan,
  getCraft,
  getProducts,
  getTechniques,
  getWorkshops,
  themeClassForPalette,
} from "../../../../lib/data";
import { ArtisanBanner } from "@/components/preview/artisan-banner";
import { CraftDNA } from "@/components/preview/craft-dna";
import { IdentityBar } from "@/components/preview/identity-bar";
import { LineageWall } from "@/components/preview/lineage-wall";
import { ProductTile } from "@/components/preview/product-tile";
import { SiteFooter } from "@/components/site/site-footer";
import { VaultPreview } from "@/components/preview/vault-preview";
import { WorkshopTile } from "@/components/preview/workshop-tile";
import { HashiaBorder } from "@/components/motifs";

/* -------------------------------------------------------------------------
 * /artisan/[slug] — Artisan Profile
 *
 * Two parallel templates live behind this single route, picked by
 * which dataset the slug lives in:
 *
 *   • lib/data.ts (the 18-master craft-entry-point dataset) →
 *     new template (Banner · Identity · DNA · Products · Workshops
 *     · Vault · Lineage)
 *   • lib/artisans.ts (the canonical seed) → original rich template
 *     (ProfileBanner · CraftIdentityBar · ProvenanceLedger · etc.)
 *
 * Slugs that exist in both (notably mohammad-yusuf-sheikh) resolve
 * to the new preview template; the rich seed-driven page is still
 * exposed via /demo and /bazaar.
 * ----------------------------------------------------------------------- */

export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const previewSlugs = ARTISANS_DATA.map((a) => a.slug);
  const richSlugs = listRichArtisanSlugs();
  /* Union — preview slugs win when both exist. */
  const all = Array.from(new Set([...previewSlugs, ...richSlugs]));
  return all.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const preview = getPreviewArtisan(slug);
  if (preview) {
    const craft = getCraft(preview.craft);
    return {
      title: `${preview.name} — ${craft?.name ?? "Master craftsman"}`,
      description: `${preview.name}, ${preview.generation}-generation ${craft?.name.toLowerCase() ?? "master"} from ${preview.village}, ${preview.district}. ${preview.irreplaceable}`,
    };
  }

  const rich = getRichArtisan(slug);
  if (rich) {
    return {
      title: `${rich.name} — ${rich.craftEnglish}`,
      description: `${rich.name}, ${rich.generation}th-generation ${rich.craftEnglish.toLowerCase()} master from ${rich.village}, ${rich.district}. ${rich.irreplaceable}`,
    };
  }

  return { title: "Artisan not found" };
}

export default async function ArtisanProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const preview = getPreviewArtisan(slug);
  if (preview) {
    return <PreviewProfile slug={slug} />;
  }

  /* Fallback to the rich seed-driven template. */
  const rich = getRichArtisan(slug);
  if (!rich) notFound();

  const firstName = rich.name.split(/\s+/)[0];
  return (
    <CraftColorProvider craft={rich.craft} as="article">
      <RichProfileBanner artisan={rich} />
      <RichIdentityBar artisan={rich} />
      <RichCraftDNA artisanName={rich.name} techniques={rich.techniques} />
      <RichProvenanceLedger artisan={rich} />
      <RichWorkshopsSection artisan={rich} />
      <RichLineageWall lineage={rich.lineage} />
      <RichSupplierGraph suppliers={rich.suppliers} />
      <RichLettersSection letters={rich.letters} artisanFirstName={firstName} />
      <LandingFooter />
    </CraftColorProvider>
  );
}

/* ────────────────────────── Preview profile ───────────────────── */

function PreviewProfile({ slug }: { slug: string }) {
  const artisan = getPreviewArtisan(slug)!;
  const craft = getCraft(artisan.craft)!;
  const techniques = getTechniques(artisan.craft);
  const products = getProducts(artisan.craft);
  const workshops = getWorkshops();
  const themeClass = themeClassForPalette(craft.palette);

  /* For each product, find the matching sample piece (if one exists)
   * so the "Scan Sanad QR" button deep-links to /sanad/piece-XYZ. */
  const productPieceMap = new Map<string, string>();
  SANAD_PIECES.filter((p) => p.artisanSlug === artisan.slug).forEach((p) => {
    /* Match a piece to a product by technique name. */
    const tech = techniques.find((t) => t.id === p.techniqueId);
    if (!tech) return;
    const product = products.find((pr) => pr.technique === tech.name);
    if (product) productPieceMap.set(product.name, p.pieceId);
  });

  return (
    <article className={themeClass}>
      <ArtisanBanner artisan={artisan} craft={craft} />
      <IdentityBar artisan={artisan} />

      {/* ────── Craft DNA ────── */}
      <section className="bg-parchment py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <header className="text-center mb-10 sm:mb-14">
            <p className="label-ui text-ink-margin mb-3">
              The hand still remembers
            </p>
            <h2 className="font-display text-[32px] sm:text-[40px] text-ink leading-tight">
              What Only {artisan.firstName} Knows
            </h2>
            <p className="font-body italic text-[15px] text-ink-faded mt-3 max-w-2xl mx-auto">
              Captured from his Vault — knowledge that exists nowhere else.
            </p>
            <div className="mt-5 flex justify-center">
              <HashiaBorder
                className="w-32 text-gold"
                color="var(--gold)"
                opacity={0.7}
                height={12}
              />
            </div>
          </header>

          <CraftDNA artisan={artisan} craft={craft} techniques={techniques} />
        </div>
      </section>

      {/* ────── Products ────── */}
      <section className="bg-paper-deep/50 py-16 sm:py-24 border-y border-line">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <header className="text-center mb-10 sm:mb-14">
            <p className="label-ui text-ink-margin mb-3">His work</p>
            <h2 className="font-display text-[32px] sm:text-[40px] text-ink leading-tight">
              Pieces by {artisan.firstName}
            </h2>
            <p className="font-body italic text-[15px] text-ink-faded mt-3 max-w-xl mx-auto">
              Every piece signed, signed pieces verifiable on the Sanad.
            </p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 stagger-children">
            {products.map((product) => (
              <ProductTile
                key={product.name}
                product={product}
                craft={craft}
                artisanSlug={artisan.slug}
                pieceId={productPieceMap.get(product.name)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ────── Workshops ────── */}
      <section className="bg-parchment py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <header className="text-center mb-10 sm:mb-14">
            <p className="label-ui text-ink-margin mb-3">Sit beside him</p>
            <h2 className="font-display text-[32px] sm:text-[40px] text-ink leading-tight">
              Book Time With {artisan.firstName}
            </h2>
            <p className="font-body italic text-[15px] text-ink-faded mt-3 max-w-xl mx-auto">
              {artisan.workshopSlots} open slots in the next month.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 stagger-children">
            {workshops.map((w) => (
              <WorkshopTile
                key={w.type}
                workshop={w}
                craft={craft}
                artisanSlug={artisan.slug}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ────── Vault preview ────── */}
      <section className="bg-paper-deep/50 py-16 sm:py-24 border-y border-line">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <header className="text-center mb-10 sm:mb-14">
            <p className="label-ui text-ink-margin mb-3">
              The preserved knowledge
            </p>
            <h2 className="font-display text-[32px] sm:text-[40px] text-ink leading-tight">
              Preserved in the Vault
            </h2>
            <p className="font-body italic text-[15px] text-ink-faded mt-3 max-w-2xl mx-auto">
              This is {artisan.firstName}&apos;s Craft DNA — knowledge
              captured for researchers, apprentices, and future generations.
            </p>
          </header>

          <VaultPreview artisan={artisan} craft={craft} />
        </div>
      </section>

      {/* ────── Lineage wall ────── */}
      <section className="bg-parchment py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <header className="text-center mb-10 sm:mb-14">
            <p className="label-ui text-ink-margin mb-3">
              The thread, generation by generation
            </p>
            <h2 className="font-display text-[32px] sm:text-[40px] text-ink leading-tight">
              The {artisan.name.split(/\s+/).slice(-1)[0]} Lineage
            </h2>
            <p className="font-body italic text-[15px] text-ink-faded mt-3 max-w-xl mx-auto">
              {artisan.generation} generations on the same craft, since{" "}
              {artisan.lineageEstYear}.
            </p>
          </header>

          <LineageWall artisan={artisan} craft={craft} />
        </div>
      </section>

      <SiteFooter />
    </article>
  );
}
