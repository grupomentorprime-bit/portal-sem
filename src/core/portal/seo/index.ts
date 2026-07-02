import { extractFaqItems } from "@/lib/portal/blocks";
import type { SiteConfig } from "@/types/cms";
import type { PageBlock } from "@/types/page";
import type { PortalPageModel, PortalSeoPayload } from "@/types/portal";

export function consolidatePageSeo(
  page: PortalPageModel,
  config: SiteConfig,
  visibleBlocks: PageBlock[]
): PortalSeoPayload {
  const { institution, seo, contact, branding } = config;

  const title = page.seo.title ?? page.title ?? seo.title;
  const description = page.seo.description ?? seo.description;

  const sameAs = [
    config.social.facebook,
    config.social.instagram,
    config.social.youtube,
    config.social.linkedin,
    config.social.tiktok,
    config.social.spotify,
  ].filter(Boolean);

  const organization: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: institution.name,
    alternateName: institution.shortName || undefined,
    url: institution.website || undefined,
    description: description || undefined,
    logo: branding.logo || undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    address: contact.address
      ? {
          "@type": "PostalAddress",
          streetAddress: contact.address,
          addressLocality: contact.city || undefined,
          addressCountry: contact.country || undefined,
        }
      : undefined,
    email: contact.email || undefined,
    telephone: contact.phone || undefined,
  };

  const faqBlock = visibleBlocks.find((b) => b.type === "faq");
  const faqItems = faqBlock ? extractFaqItems(faqBlock) : [];

  const faqSchema =
    faqItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }
      : null;

  const jsonLd = [organization, faqSchema].filter(Boolean) as Record<string, unknown>[];

  return {
    title,
    description,
    keywords: page.seo.keywords ?? seo.keywords,
    jsonLd,
    openGraph: {
      title,
      description,
      image: branding.heroImage || branding.logo || undefined,
    },
  };
}

export function seoToMetadata(seo: PortalSeoPayload): {
  title?: string;
  description?: string;
  keywords?: string[];
} {
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
  };
}
