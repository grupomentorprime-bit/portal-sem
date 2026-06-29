"use client";

import dynamic from "next/dynamic";
import {
  CTASection,
  HeroInstitutional,
  InstitutionalGallery,
  StatsInstitution,
  VerseBlock,
} from "@/components/institutional";
import { Container, Section } from "@/components/layout";
import { InstitutionPresentation } from "@/components/blocks/InstitutionPresentation";
import { TextSection } from "@/components/blocks/TextSection";
import { ProgramsGrid } from "@/components/blocks/ProgramsGrid";
import { TeachersGrid } from "@/components/blocks/TeachersGrid";
import { NewsGrid } from "@/components/blocks/NewsGrid";
import { EventsGrid } from "@/components/blocks/EventsGrid";
import { LibraryGrid } from "@/components/blocks/LibraryGrid";
import { Testimonials } from "@/components/blocks/Testimonials";
import { ContactForm } from "@/components/blocks/ContactForm";
import { Divider } from "@/components/blocks/Divider";
import { asArray, asString, type GalleryItemSettings, type StatItemSettings } from "@/lib/cms/block-utils";
import { CMS_ASSET_PATHS } from "@/lib/cms/asset-paths";
import type { PageBlock } from "@/types/page";
import type { SiteConfig } from "@/types/cms";

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
}

export function BlockRenderer({ blocks, config, preview }: BlockRendererProps) {
  const visible = blocks.filter((b) => b.visible || preview);

  return (
    <>
      {visible.map((block) => (
        <BlockItem key={block.id} block={block} config={config} preview={preview} />
      ))}
    </>
  );
}

function BlockItem({
  block,
  config,
  preview,
}: {
  block: PageBlock;
  config: SiteConfig;
  preview?: boolean;
}) {
  const s = block.settings;
  const { institution, branding, contact } = config;

  if (!block.visible && !preview) return null;

  switch (block.type) {
    case "hero":
      return (
        <HeroInstitutional
          institutionName={asString(s.institutionName, institution.name)}
          motto={asString(s.motto)}
          heroImage={asString(s.heroImage, branding.heroImage || CMS_ASSET_PATHS.hero)}
          logoSrc={asString(s.logoSrc, branding.logo || CMS_ASSET_PATHS.logoSem)}
          ctaLabel={asString(s.ctaLabel, "Conoce nuestros programas")}
          ctaHref={asString(s.ctaHref, "/programas")}
        />
      );
    case "text":
      return <TextSection settings={s} />;
    case "presentation":
      return <InstitutionPresentation settings={s} />;
    case "programs":
      return <ProgramsGrid settings={s} />;
    case "teachers":
      return <TeachersGrid settings={s} />;
    case "news":
      return <NewsGrid settings={s} />;
    case "events":
      return <EventsGrid settings={s} />;
    case "library":
      return <LibraryGrid settings={s} />;
    case "cta":
      return (
        <CTASection
          title={asString(s.title)}
          description={asString(s.description) || undefined}
          primaryLabel={asString(s.primaryLabel, "Solicitar admisión")}
          primaryHref={asString(s.primaryHref, "/admision")}
          secondaryLabel={asString(s.secondaryLabel) || undefined}
          secondaryHref={asString(s.secondaryHref) || undefined}
          variant={asString(s.variant, "primary") as "default" | "primary"}
        />
      );
    case "testimonials":
      return <Testimonials settings={s} />;
    case "gallery":
      return (
        <Section padding="lg">
          <Container>
            <InstitutionalGallery items={asArray<GalleryItemSettings>(s.items)} />
          </Container>
        </Section>
      );
    case "stats":
      return (
        <Section padding="lg" className="bg-primary">
          <Container>
            <StatsInstitution stats={asArray<StatItemSettings>(s.items)} />
          </Container>
        </Section>
      );
    case "verse":
      return (
        <Section padding="lg">
          <Container size="md">
            <VerseBlock
              text={asString(s.text)}
              reference={asString(s.reference)}
            />
          </Container>
        </Section>
      );
    case "video":
      return <VideoSection settings={s} />;
    case "contact":
      return <ContactForm settings={s} contact={contact} />;
    case "divider":
      return <Divider settings={s} />;
    case "html":
      return <HtmlBlock settings={s} />;
    case "markdown":
      return <MarkdownBlock settings={s} />;
    default:
      return null;
  }
}
