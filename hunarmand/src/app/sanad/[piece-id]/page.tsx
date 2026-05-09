import * as React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSignedPiece, listSignedPieceIds } from "@/lib/artisans";
import { DEFAULT_LOCALE, getSanadDict } from "@/lib/sanad-i18n";
import { SanadView } from "@/components/sanad/sanad-view";

import {
  getArtisan as getPreviewArtisan,
  getCraft,
  getSanadPiece as getPreviewSanadPiece,
  getTechniqueById,
  listSanadPieceIds as listPreviewSanadPieceIds,
} from "../../../../lib/data";
import { SanadPreview } from "@/components/preview/sanad-preview";

/* -------------------------------------------------------------------------
 * /sanad/[piece-id] — DEFAULT LOCALE (English)
 *
 * Two parallel templates pick by piece-id:
 *
 *   • piece-001 / piece-002 / piece-003 — the new preview Sanad
 *     dataset in `lib/data`. Renders the editorial Sanad template
 *     with verified banner, identity card, artisan block, vertical
 *     provenance timeline, fair-price band, and collapsible Ed25519
 *     signature.
 *   • CRP-… / PSH-… — the original seed-driven Sanad dataset.
 *     Renders the existing SSR-only `<SanadView />` (which still
 *     carries the per-locale routes at /sanad/[id]/[lang]).
 *
 * Unknown piece IDs are still served — the original template's
 * "⚠ No Sanad found" warning state takes care of them.
 * ----------------------------------------------------------------------- */

export const dynamic = "force-static";
export const dynamicParams = true;
export const revalidate = false;

type Params = { "piece-id": string };

export async function generateStaticParams(): Promise<Params[]> {
  const seedIds = listSignedPieceIds();
  const previewIds = listPreviewSanadPieceIds();
  return Array.from(new Set([...seedIds, ...previewIds])).map((id) => ({
    "piece-id": id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { "piece-id": pieceId } = await params;

  const previewPiece = getPreviewSanadPiece(pieceId);
  if (previewPiece) {
    const artisan = getPreviewArtisan(previewPiece.artisanSlug);
    const craft = getCraft(previewPiece.craft);
    return {
      title: `${previewPiece.pieceName} · ${artisan?.name ?? "Master"} · Hunarmand Sanad`,
      description: `Hunarmand Sanad Verified. ${artisan?.name ?? ""}, ${craft?.name ?? ""}, ${artisan?.village ?? ""}.`.trim(),
      openGraph: {
        title: `${previewPiece.pieceName} — Hunarmand Sanad Verified`,
        description: `Signed by ${artisan?.name ?? "the master"}.`,
        type: "article",
      },
    };
  }

  const lookup = getSignedPiece(pieceId);
  const dict = getSanadDict(DEFAULT_LOCALE);

  if (!lookup) {
    return {
      title: `${dict.notFoundTitle} · Hunarmand Sanad`,
      description: dict.notFoundBody,
      robots: { index: false, follow: false },
    };
  }

  const { piece, artisan, technique } = lookup;
  return {
    title: `${piece.type} · ${artisan.name} · Hunarmand Sanad`,
    description: `${dict.verifiedTitle}. ${artisan.name}, ${artisan.craftEnglish}, ${artisan.village}. ${technique?.name ?? ""}`.trim(),
    openGraph: {
      title: `${piece.type} — Hunarmand Sanad Verified`,
      description: `Signed by ${artisan.name}, ${artisan.craftEnglish}.`,
      type: "article",
    },
    alternates: {
      canonical: `/sanad/${pieceId}`,
      languages: {
        en: `/sanad/${pieceId}`,
        hi: `/sanad/${pieceId}/hi`,
        ur: `/sanad/${pieceId}/ur`,
        ja: `/sanad/${pieceId}/ja`,
        fr: `/sanad/${pieceId}/fr`,
        de: `/sanad/${pieceId}/de`,
      },
    },
  };
}

export default async function SanadPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { "piece-id": pieceId } = await params;

  /* Preview piece dataset — render the editorial template. */
  const previewPiece = getPreviewSanadPiece(pieceId);
  if (previewPiece) {
    const artisan = getPreviewArtisan(previewPiece.artisanSlug);
    const craft = getCraft(previewPiece.craft);
    const technique = getTechniqueById(previewPiece.craft, previewPiece.techniqueId);
    if (!artisan || !craft || !technique) notFound();
    return (
      <SanadPreview
        piece={previewPiece}
        artisan={artisan}
        craft={craft}
        technique={technique}
      />
    );
  }

  /* Existing seed-driven Sanad — keep the original SSR-only view. */
  const lookup = getSignedPiece(pieceId);
  const dict = getSanadDict(DEFAULT_LOCALE);
  return (
    <SanadView
      pieceId={pieceId}
      lookup={lookup}
      locale={DEFAULT_LOCALE}
      dict={dict}
    />
  );
}
