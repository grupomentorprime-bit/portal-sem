import type { ContactInfo, SiteConfig, SocialLinks } from "@/types/cms";

export interface PublicSiteImages {
  logo: string;
  hero: string;
}

export interface PublicSiteContent {
  tenantId: string;
  name: string;
  contact: Pick<
    ContactInfo,
    "email" | "phone" | "whatsapp" | "address" | "city" | "country" | "hours"
  >;
  social: Pick<SocialLinks, "facebook" | "instagram" | "youtube" | "linkedin" | "tiktok">;
  images: PublicSiteImages;
}

export function isPublicContentTenantId(raw: string): boolean {
  const tenant = raw.trim();
  if (tenant.length < 1 || tenant.length > 80) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(tenant);
}

export function publicSiteContentFromConfig(
  config: SiteConfig,
  images: PublicSiteImages
): PublicSiteContent {
  return {
    tenantId: config.institution.tenant,
    name: config.institution.name,
    contact: {
      email: config.contact.email,
      phone: config.contact.phone,
      whatsapp: config.contact.whatsapp,
      address: config.contact.address,
      city: config.contact.city,
      country: config.contact.country,
      hours: config.contact.hours,
    },
    social: {
      facebook: config.social.facebook,
      instagram: config.social.instagram,
      youtube: config.social.youtube,
      linkedin: config.social.linkedin,
      tiktok: config.social.tiktok,
    },
    images: {
      logo: images.logo.trim(),
      hero: images.hero.trim(),
    },
  };
}

export const PUBLIC_CONTENT_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
} as const;
