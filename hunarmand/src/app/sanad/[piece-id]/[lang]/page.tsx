import * as React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSignedPiece, listSignedPieceIds } from "@/lib/artisans";
import {
  DEFAULT_LOCALE,
  SANAD_LOCALES,
  getSanadDict,
  isSanadLocale,
} from "@/lib/sanad-i18n";
import { SanadView } from "@/components/sanad/sanad-view";

/* -------------------------------------------------------------------------
 * /sanad/[piece-id]/[lang]
 *
 * Explicit-locale variant. Each (pieceId × locale) combo is pre-rendered
 * statically. Unknown lang values return notFound() so we never serve
 * mis-typed locales as English by accident — the canonical English URL
 * lives at /sanad/[piece-id] without a lang segment.
 * ----------------------------------------------------------------------- */

export const dynamic = "force-static";
export const dynamicParams = true;
export const revalidate = false;

type Params = { "piece-id": string; lang: string };

export async function generateStaticParams(): Promise<Params[]> {
  const ids = listSignedPieceIds();
  const params: Params[] = [];
  for (const id of ids) {
    /* Skip the default locale — it lives on the parent route so
     * /sanad/[piece-id] and /sanad/[piece-id]/en don't both ship the
     * same page. */
    for (const lang of SANAD_LOCALES) {
      if (lang === DEFAULT_LOCALE) continue;
      params.push({ "piece-id": id, lang });
    }
  }
  return params;
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { "piece-id": pieceId, lang } = await params;
  if (!isSanadLocale(lang)) {
    return { title: "Hunarmand Sanad", robots: { index: false, follow: false } };
  }
  const lookup = getSignedPiece(pieceId);
  const dict = getSanadDict(lang);

  if (!lookup) {
    return {
      title: `${dict.notFoundTitle} · Hunarmand Sanad`,
      description: dict.notFoundBody,
      robots: { index: false, follow: false },
    };
  }

  const { piece, artisan } = lookup;
  return {
    title: `${piece.type} · ${artisan.name} · Hunarmand Sanad`,
    description: `${dict.verifiedTitle} — ${artisan.name}, ${artisan.craftEnglish}, ${artisan.village}.`,
    alternates: {
      canonical: `/sanad/${pieceId}/${lang}`,
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

export default async function SanadLocalePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { "piece-id": pieceId, lang } = await params;
  if (!isSanadLocale(lang)) notFound();

  const lookup = getSignedPiece(pieceId);
  const dict = getSanadDict(lang);

  return (
    <SanadView pieceId={pieceId} lookup={lookup} locale={lang} dict={dict} />
  );
}
