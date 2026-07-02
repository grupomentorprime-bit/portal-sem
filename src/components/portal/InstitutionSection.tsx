/**
 * @deprecated
 *
 * Reemplazado por:
 * PortalBlockSection
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import "server-only";

import { createDefaultBlock } from "@/lib/cms/page-defaults";
import { resolveBlockContent } from "@/lib/content/block-queries";
import { getQueryLimit } from "@/lib/content/block-settings";
import { resolveMediaRef } from "@/core/media";
import {
  blockSettings,
  extractHighlights,
  extractModalityItems,
  extractStats,
  findBlock,
} from "@/lib/portal/blocks";
import {
  GallerySectionContent,
  ModalitySectionContent,
  StatsSectionContent,
  TestimonialsSectionContent,
  VerseSectionContent,
  WhyStudySectionContent,
} from "@/components/portal/institution/InstitutionSectionContent";
import type { GalleryItem, TestimonialItem } from "@/types/content";
import type { PageBlock } from "@/types/page";

interface InstitutionSectionProps {
  tenant: string;
  blocks?: PageBlock[];
}

function fallbackBlock(type: PageBlock["type"]): PageBlock {
  return createDefaultBlock(type, 0);
}

export async function InstitutionSection({ tenant, blocks }: InstitutionSectionProps) {
  const presentationBlock = findBlock(blocks, "presentation") ?? fallbackBlock("presentation");
  const modalityBlock = findBlock(blocks, "modality") ?? fallbackBlock("modality");
  const statsBlock = findBlock(blocks, "stats") ?? fallbackBlock("stats");
  const galleryBlock = findBlock(blocks, "gallery") ?? fallbackBlock("gallery");
  const testimonialsBlock = findBlock(blocks, "testimonials") ?? fallbackBlock("testimonials");
  const verseBlock = findBlock(blocks, "verse") ?? fallbackBlock("verse");

  const presentation = blockSettings<{
    overline?: string;
    title?: string;
    subtitle?: string;
    description?: string;
  }>(presentationBlock);

  const modality = blockSettings<{
    overline?: string;
    title?: string;
    subtitle?: string;
    description?: string;
    image?: string;
    imageMediaId?: string;
    buttonLabel?: string;
    buttonHref?: string;
  }>(modalityBlock);

  const statsSettings = blockSettings<{ overline?: string; title?: string }>(statsBlock);
  const gallerySettings = blockSettings<{
    overline?: string;
    title?: string;
    description?: string;
    showButton?: boolean;
    buttonLabel?: string;
    buttonHref?: string;
  }>(galleryBlock);

  const testimonialsSettings = blockSettings<{
    overline?: string;
    title?: string;
    description?: string;
  }>(testimonialsBlock);

  const verseSettings = blockSettings<{
    text?: string;
    reference?: string;
    background?: string;
    image?: string;
    imageMediaId?: string;
  }>(verseBlock);

  const highlights = extractHighlights(presentationBlock);
  const modalityItems = extractModalityItems(modalityBlock);
  const stats = extractStats(statsBlock);

  let testimonials: TestimonialItem[] = [];
  let gallery: GalleryItem[] = [];
  let testimonialsError = false;
  let galleryError = false;
  let modalityImage: string | undefined;
  let verseImage: string | undefined;

  try {
    const results = await Promise.all([
      resolveBlockContent(testimonialsBlock, tenant),
      resolveBlockContent(galleryBlock, tenant),
      resolveMediaRef(tenant, {
        mediaId: modality.imageMediaId,
        legacyUrl: modality.image,
      }),
      resolveMediaRef(tenant, {
        mediaId: verseSettings.imageMediaId,
        legacyUrl: verseSettings.image,
      }),
    ]);

    testimonials = (results[0] as TestimonialItem[]).slice(
      0,
      getQueryLimit(testimonialsBlock.settings, 3)
    );
    gallery = (results[1] as GalleryItem[]).slice(
      0,
      getQueryLimit(galleryBlock.settings, 4)
    );
    modalityImage = results[2] ?? undefined;
    verseImage = results[3] ?? undefined;
  } catch {
    testimonialsError = true;
    galleryError = true;
  }

  return (
    <>
      <WhyStudySectionContent
        overline={presentation.overline}
        title={presentation.title}
        subtitle={presentation.subtitle}
        description={presentation.description}
        highlights={highlights}
      />
      <ModalitySectionContent
        overline={modality.overline}
        title={modality.title}
        subtitle={modality.subtitle}
        description={modality.description}
        items={modalityItems}
        image={modalityImage}
        buttonLabel={modality.buttonLabel}
        buttonHref={modality.buttonHref}
      />
      <GallerySectionContent
        overline={gallerySettings.overline}
        title={gallerySettings.title}
        description={gallerySettings.description}
        items={gallery}
        showButton={gallerySettings.showButton}
        buttonLabel={gallerySettings.buttonLabel}
        buttonHref={gallerySettings.buttonHref}
        error={galleryError}
      />
      <StatsSectionContent
        overline={statsSettings.overline}
        title={statsSettings.title}
        stats={stats}
      />
      <TestimonialsSectionContent
        overline={testimonialsSettings.overline}
        title={testimonialsSettings.title}
        description={testimonialsSettings.description}
        items={testimonials}
        error={testimonialsError}
      />
      <VerseSectionContent
        text={verseSettings.text}
        reference={verseSettings.reference}
        background={verseSettings.background}
        image={verseImage}
      />
    </>
  );
}
