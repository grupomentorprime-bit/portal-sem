import type { SiteConfig } from "@/types/cms";
import { SITE_CONFIG_ID } from "@/types/cms";

export function createDefaultSiteConfig(): SiteConfig {
  const now = new Date().toISOString();

  return {
    _id: SITE_CONFIG_ID,
    institution: {
      name: "",
      shortName: "",
      tenant: "",
      organization: "",
      website: "",
      status: "active",
    },
    branding: {
      logo: "",
      logoMediaId: "",
      secondaryLogo: "",
      secondaryLogoMediaId: "",
      favicon: "",
      faviconMediaId: "",
      heroImage: "",
      heroMediaId: "",
      primaryColor: "#002A47",
      secondaryColor: "#246AA1",
      backgroundColor: "#FFFFFF",
      textColor: "#141F29",
    },
    seo: {
      title: "",
      description: "",
      keywords: [],
    },
    contact: {
      email: "",
      phone: "",
      whatsapp: "",
      address: "",
      city: "",
      country: "",
    },
    social: {
      facebook: "",
      instagram: "",
      youtube: "",
      linkedin: "",
      tiktok: "",
    },
    features: {
      blog: false,
      news: false,
      events: false,
      store: false,
      library: false,
      forms: false,
      applications: false,
      onlinePayments: false,
    },
    createdAt: now,
    updatedAt: now,
  };
}
