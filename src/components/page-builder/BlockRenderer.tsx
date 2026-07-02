"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { HeroPremiumSection } from "@/components/portal/sections/HeroPremiumSection";
import {
  StatsSectionContent,
  VerseSectionContent,
} from "@/components/portal/institution/InstitutionSectionContent";
import { FeatureGridPreview } from "@/components/blocks/FeatureGridPreview";
import { TimelinePreview } from "@/components/blocks/TimelinePreview";
import { TextSection } from "@/components/blocks/TextSection";
import { ProgramsGrid } from "@/components/blocks/ProgramsGrid";
import { AcademicOfferGrid } from "@/components/blocks/AcademicOfferGrid";
import { ModalitySection } from "@/components/blocks/ModalitySection";
import { GalleryGrid } from "@/components/blocks/GalleryGrid";
import { TestimonialsGrid } from "@/components/blocks/TestimonialsGrid";
import { NewsGrid } from "@/components/blocks/NewsGrid";
import { PeopleGrid } from "@/components/blocks/PeopleGrid";
import { CtaPremiumGrid } from "@/components/blocks/CtaPremiumGrid";
import { EventsGrid } from "@/components/blocks/EventsGrid";
import { LibraryGrid } from "@/components/blocks/LibraryGrid";
import { ResourcesGrid } from "@/components/blocks/ResourcesGrid";
import { ContactForm } from "@/components/blocks/ContactForm";
import { Divider } from "@/components/blocks/Divider";
import { ScholarshipsSection } from "@/components/portal/conversion/ScholarshipsSection";
import { FaqSection } from "@/components/portal/conversion/FaqSection";
import { QuickContactSection } from "@/components/portal/conversion/QuickContactSection";
import { ContactHubGrid } from "@/components/blocks/ContactHubGrid";
import { ExperienceFormGrid } from "@/components/blocks/ExperienceFormGrid";
import { FooterPremiumGrid } from "@/components/blocks/FooterPremiumGrid";
import { AllianceSection } from "@/components/portal/conversion/AllianceSection";
import { asBoolean, asString } from "@/lib/cms/block-utils";
import {
  extractFaqItems,
  extractScholarshipItems,
} from "@/lib/portal/blocks";
import { CMS_ASSET_PATHS } from "@/lib/cms/asset-paths";
import type { PageBlock } from "@/types/page";
import type { SiteConfig } from "@/types/cms";
import {
  buildLegacyHeroPreviewSlide,
  mapLegacyStatItems,
} from "./preview-adapters";
import { AudienceProfilesPreview } from "./AudienceProfilesPreview";

const VideoSection = dynamic(
  () => import("@/components/blocks/VideoSection").then((m) => m.VideoSection),
  { loading: () => null }
);
const HtmlBlock = dynamic(
  () => import("@/components/blocks/HtmlBlock").then((m) => m.HtmlBlock),
  { loading: () => null }
);
const MarkdownBlock = dynamic(
  () => import("@/components/blocks/MarkdownBlock").then((m) => m.MarkdownBlock),
  { loading: () => null }
);

interface BlockRendererProps {
  blocks: PageBlock[];
  config: SiteConfig;
  preview?: boolean;
  pageSlug?: string;
  selectedBlockId?: string | null;
  onSelectBlock?: (id: string) => void;
  selectable?: boolean;
}

export function BlockRenderer({
  blocks,
  config,
  preview,
  pageSlug,
  selectedBlockId,
  onSelectBlock,
  selectable,
}: BlockRendererProps) {
  const visible = blocks.filter((b) => b.visible || preview);

  return (
    <>
      {visible.map((block) => (
        <BlockItem
          key={block.id}
          block={block}
          config={config}
          preview={preview}
          pageSlug={pageSlug}
          selectedBlockId={selectedBlockId}
          onSelectBlock={onSelectBlock}
          selectable={selectable}
        />
      ))}
    </>
  );
}

function SelectableWrap({
  block,
  selected,
  selectable,
  onSelect,
  children,
}: {
  block: PageBlock;
  selected: boolean;
  selectable?: boolean;
  onSelect?: (id: string) => void;
  children: ReactNode;
}) {
  if (!selectable) return <>{children}</>;

  return (
    <div
      data-studio-block-id={block.id}
      className={selected ? "studio-canvas__block studio-canvas__block--selected" : "studio-canvas__block"}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.(block.id);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.(block.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Seleccionar bloque ${block.id}`}
      aria-pressed={selected}
    >
      {children}
    </div>
  );
}

function BlockItem({
  block,
  config,
  preview,
  pageSlug,
  selectedBlockId,
  onSelectBlock,
  selectable,
}: {
  block: PageBlock;
  config: SiteConfig;
  preview?: boolean;
  pageSlug?: string;
  selectedBlockId?: string | null;
  onSelectBlock?: (id: string) => void;
  selectable?: boolean;
}) {
  const s = block.settings;
  const { institution, branding, contact } = config;
  const selected = selectedBlockId === block.id;
  const wrap = (node: ReactNode) => (
    <SelectableWrap
      block={block}
      selected={selected}
      selectable={selectable}
      onSelect={onSelectBlock}
    >
      {node}
    </SelectableWrap>
  );

  if (!block.visible && !preview) return null;

  let content: ReactNode = null;

  switch (block.type) {
    case "hero":
      content = (
        <HeroPremiumSection
          slides={[
            buildLegacyHeroPreviewSlide(s, {
              institutionName: asString(s.institutionName, institution.name),
              heroImage: asString(s.heroImage, branding.heroImage || CMS_ASSET_PATHS.hero),
              ctaLabel: asString(s.ctaLabel, "Conoce nuestros programas"),
              ctaHref: asString(s.ctaHref, "/programas"),
            }),
          ]}
          type="image"
        />
      );
      break;
    case "text":
      content = <TextSection settings={s} />;
      break;
    case "presentation":
      content = <FeatureGridPreview settings={{ ...s, features: s.highlights ?? s.features }} />;
      break;
    case "feature_grid":
      content = <FeatureGridPreview settings={s} />;
      break;
    case "audience_profiles":
      content = <AudienceProfilesPreview settings={s} pageSlug={pageSlug} />;
      break;
    case "modality":
      content = <ModalitySection settings={s} />;
      break;
    case "programs":
      content = <ProgramsGrid settings={s} />;
      break;
    case "academic_offer":
      content = <AcademicOfferGrid settings={s} />;
      break;
    case "teachers":
      content = <PeopleGrid settings={s} />;
      break;
    case "people":
      content = <PeopleGrid settings={s} />;
      break;
    case "news":
      content = <NewsGrid settings={s} />;
      break;
    case "events":
      content = <EventsGrid settings={s} />;
      break;
    case "library":
      content = <LibraryGrid settings={s} />;
      break;
    case "resources":
      content = <ResourcesGrid settings={s} />;
      break;
    case "cta":
    case "cta_premium":
      content = <CtaPremiumGrid settings={s} />;
      break;
    case "testimonials":
      content = <TestimonialsGrid settings={s} />;
      break;
    case "gallery":
      content = <GalleryGrid settings={s} />;
      break;
    case "stats":
      content = (
        <StatsSectionContent
          overline={asString(s.overline) || undefined}
          title={asString(s.title) || undefined}
          stats={mapLegacyStatItems(s)}
        />
      );
      break;
    case "verse":
      content = (
        <VerseSectionContent
          text={asString(s.text)}
          reference={asString(s.reference)}
        />
      );
      break;
    case "video":
      content = <VideoSection settings={s} />;
      break;
    case "contact":
      content = <ContactForm settings={s} contact={contact} />;
      break;
    case "admission_process":
      content = <TimelinePreview settings={{ ...s, variant: "process", layout: "auto" }} />;
      break;
    case "timeline":
      content = <TimelinePreview settings={s} />;
      break;
    case "scholarships":
      content = (
        <ScholarshipsSection
          overline={asString(s.overline) || undefined}
          title={asString(s.title)}
          description={asString(s.description) || undefined}
          items={extractScholarshipItems(block)}
        />
      );
      break;
    case "faq":
      content = (
        <FaqSection
          overline={asString(s.overline) || undefined}
          title={asString(s.title)}
          description={asString(s.description) || undefined}
          items={extractFaqItems(block)}
        />
      );
      break;
    case "quick_contact":
      content = (
        <QuickContactSection
          overline={asString(s.overline) || undefined}
          title={asString(s.title)}
          description={asString(s.description) || undefined}
          contact={contact}
          social={config.social}
        />
      );
      break;
    case "contact_hub":
      content = <ContactHubGrid settings={s} contact={contact} social={config.social} />;
      break;
    case "experience_form":
      content = <ExperienceFormGrid settings={s} />;
      break;
    case "footer_premium":
      content = (
        <FooterPremiumGrid
          settings={s}
          config={config}
          footerColumns={[]}
          legalLinks={[]}
          programs={[]}
          logos={{
            primary: branding.logo || CMS_ASSET_PATHS.logoSem,
            secondary: branding.secondaryLogo,
          }}
        />
      );
      break;
    case "alliance":
      content = (
        <AllianceSection
          title={asString(s.title) || undefined}
          description={asString(s.description) || undefined}
          organization={institution.organization}
          logoSecondary={branding.secondaryLogo}
        />
      );
      break;
    case "divider":
      content = <Divider settings={s} />;
      break;
    case "html":
      content = <HtmlBlock settings={s} />;
      break;
    case "markdown":
      content = <MarkdownBlock settings={s} />;
      break;
    default:
      content = null;
  }

  if (!content) return null;
  return wrap(content);
}
