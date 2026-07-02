import "server-only";

import { ProgramsSection } from "@/components/portal/ProgramsSection";
import { AcademicOfferBlockSection } from "@/components/portal/blocks/AcademicOfferBlockSection";
import { AudienceProfilesBlockSection } from "@/components/portal/blocks/AudienceProfilesBlockSection";
import { SeminariosHomeBlockSection } from "@/components/portal/blocks/SeminariosHomeBlockSection";
import { TeachersSection } from "@/components/portal/TeachersSection";
import { HeroBlockSection } from "@/components/portal/blocks/HeroBlockSection";
import { PresentationBlockSection } from "@/components/portal/blocks/PresentationBlockSection";
import { FeatureGridBlockSection } from "@/components/portal/blocks/FeatureGridBlockSection";
import { TimelineBlockSection } from "@/components/portal/blocks/TimelineBlockSection";
import { ModalityBlockSection } from "@/components/portal/blocks/ModalityBlockSection";
import { GalleryBlockSection } from "@/components/portal/blocks/GalleryBlockSection";
import { StatsBlockSection } from "@/components/portal/blocks/StatsBlockSection";
import { TestimonialsBlockSection } from "@/components/portal/blocks/TestimonialsBlockSection";
import { VerseBlockSection } from "@/components/portal/blocks/VerseBlockSection";
import { NewsBlockSection } from "@/components/portal/blocks/NewsBlockSection";
import { PeopleBlockSection } from "@/components/portal/blocks/PeopleBlockSection";
import { EventsBlockSection } from "@/components/portal/blocks/EventsBlockSection";
import { AcademicAgendaBlockSection } from "@/components/portal/blocks/AcademicAgendaBlockSection";
import { InstitutionalNoticesBlockSection } from "@/components/portal/blocks/InstitutionalNoticesBlockSection";
import { LibraryBlockSection } from "@/components/portal/blocks/LibraryBlockSection";
import { ResourcesBlockSection } from "@/components/portal/blocks/ResourcesBlockSection";
import { AdmissionProcessBlockSection } from "@/components/portal/blocks/AdmissionProcessBlockSection";
import { ScholarshipsBlockSection } from "@/components/portal/blocks/ScholarshipsBlockSection";
import { FaqBlockSection } from "@/components/portal/blocks/FaqBlockSection";
import { QuickContactBlockSection } from "@/components/portal/blocks/QuickContactBlockSection";
import { ContactHubBlockSection } from "@/components/portal/blocks/ContactHubBlockSection";
import { ExperienceFormBlockSection } from "@/components/portal/blocks/ExperienceFormBlockSection";
import { AllianceBlockSection } from "@/components/portal/blocks/AllianceBlockSection";
import { CtaBlockSection } from "@/components/portal/blocks/CtaBlockSection";
import { CtaPremiumBlockSection } from "@/components/portal/blocks/CtaPremiumBlockSection";
import { GenericContentBlockSection } from "@/components/portal/blocks/GenericContentBlockSection";
import { publishBlockRendered, publishCtaViewed } from "@/core/portal";
import { blockSettings } from "@/lib/portal/blocks";
import { asString } from "@/lib/cms/block-utils";
import type { PortalContext } from "@/lib/portal/site";
import type { PageBlock } from "@/types/page";

interface PortalBlockSectionProps {
  block: PageBlock;
  tenant: string;
  ctx: PortalContext;
  allBlocks: PageBlock[];
  pageSlug?: string;
}

export async function PortalBlockSection({
  block,
  tenant,
  ctx,
  allBlocks,
  pageSlug = "/",
}: PortalBlockSectionProps) {
  if (!block.visible) return null;

  publishBlockRendered({
    tenantId: tenant,
    pageSlug,
    blockId: block.id,
    blockType: block.type,
  });

  switch (block.type) {
    case "hero":
      return <HeroBlockSection block={block} ctx={ctx} allBlocks={allBlocks} tenant={tenant} />;
    case "programs":
      return <ProgramsSection tenant={tenant} block={block} />;
    case "academic_offer":
      return <AcademicOfferBlockSection tenant={tenant} block={block} pageSlug={pageSlug} />;
    case "seminarios_home":
      return <SeminariosHomeBlockSection block={block} pageSlug={pageSlug} />;
    case "audience_profiles":
      return <AudienceProfilesBlockSection block={block} tenant={tenant} pageSlug={pageSlug} />;
    case "presentation":
      return <PresentationBlockSection block={block} />;
    case "feature_grid":
      return <FeatureGridBlockSection block={block} pageSlug={pageSlug} />;
    case "modality":
      return <ModalityBlockSection block={block} tenant={tenant} pageSlug={pageSlug} />;
    case "stats":
      return <StatsBlockSection block={block} />;
    case "gallery":
      return <GalleryBlockSection block={block} tenant={tenant} />;
    case "testimonials":
      return <TestimonialsBlockSection block={block} tenant={tenant} pageSlug={pageSlug} />;
    case "verse":
      return <VerseBlockSection block={block} tenant={tenant} />;
    case "teachers":
      return <TeachersSection tenant={tenant} block={block} />;
    case "people":
      return <PeopleBlockSection block={block} tenant={tenant} pageSlug={pageSlug} />;
    case "news":
      return <NewsBlockSection block={block} tenant={tenant} pageSlug={pageSlug} />;
    case "events":
      return <EventsBlockSection block={block} tenant={tenant} />;
    case "academic_agenda":
      return <AcademicAgendaBlockSection block={block} tenant={tenant} />;
    case "institutional_notices":
      return <InstitutionalNoticesBlockSection block={block} tenant={tenant} />;
    case "library":
      return <LibraryBlockSection block={block} tenant={tenant} />;
    case "resources":
      return <ResourcesBlockSection block={block} />;
    case "admission_process":
      return <AdmissionProcessBlockSection block={block} />;
    case "timeline":
      return <TimelineBlockSection block={block} pageSlug={pageSlug} />;
    case "scholarships":
      return <ScholarshipsBlockSection block={block} />;
    case "faq":
      return <FaqBlockSection block={block} pageSlug={pageSlug} />;
    case "quick_contact":
      return <QuickContactBlockSection block={block} contact={ctx.config.contact} social={ctx.config.social} />;
    case "contact_hub":
      return (
        <ContactHubBlockSection
          block={block}
          contact={ctx.config.contact}
          social={ctx.config.social}
        />
      );
    case "experience_form":
      return <ExperienceFormBlockSection block={block} tenant={tenant} />;
    case "alliance":
      return (
        <AllianceBlockSection
          block={block}
          organization={ctx.config.institution.organization}
          logoSecondary={ctx.logos.secondary}
        />
      );
    case "cta": {
      const ctaSettings = blockSettings<{
        primaryLabel?: string;
        primaryHref?: string;
      }>(block);
      publishCtaViewed({
        tenantId: tenant,
        pageSlug,
        blockId: block.id,
        ctaLabel: asString(ctaSettings.primaryLabel),
        ctaHref: asString(ctaSettings.primaryHref),
      });
      return <CtaBlockSection block={block} navigation={ctx.navigation} />;
    }
    case "cta_premium": {
      const ctaSettings = blockSettings<{
        buttons?: Array<{ label?: string; href?: string }>;
        primaryLabel?: string;
        primaryHref?: string;
      }>(block);
      const firstButton = ctaSettings.buttons?.[0];
      publishCtaViewed({
        tenantId: tenant,
        pageSlug,
        blockId: block.id,
        ctaLabel: asString(firstButton?.label, asString(ctaSettings.primaryLabel)),
        ctaHref: asString(firstButton?.href, asString(ctaSettings.primaryHref)),
      });
      return <CtaPremiumBlockSection block={block} navigation={ctx.navigation} pageSlug={pageSlug} />;
    }
    case "text":
    case "contact":
    case "video":
    case "divider":
    case "html":
    case "markdown":
      return (
        <GenericContentBlockSection
          block={block}
          tenant={tenant}
          contact={ctx.config.contact}
        />
      );
    default:
      return null;
  }
}
