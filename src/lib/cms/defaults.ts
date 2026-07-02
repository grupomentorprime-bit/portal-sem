import { createDefaultHeroPortal } from "@/lib/cms/hero-portal-defaults";
import { colorDefaults } from "@/design/tokens/colors";
import {
  createDefaultSiteConfigModules,
  SITE_CONFIG_SCHEMA_VERSION,
} from "@/lib/cms/schema-versions";
import { DEFAULT_PORTAL_CURSOR } from "@/lib/portal/cursor-defaults";
import type { SiteConfig } from "@/types/cms";
import { SITE_CONFIG_ID } from "@/types/cms";

export function createDefaultSiteConfig(): SiteConfig {
  const now = new Date().toISOString();

  return {
    _id: SITE_CONFIG_ID,
    schemaVersion: SITE_CONFIG_SCHEMA_VERSION,
    modules: createDefaultSiteConfigModules(),
    institution: {
      name: "",
      shortName: "",
      tenant: "",
      organization: "",
      website: "",
      tagline: "",
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
      primaryColor: colorDefaults.primary,
      secondaryColor: colorDefaults.secondary,
      backgroundColor: colorDefaults.surface,
      textColor: colorDefaults.foreground,
    },
    heroPortal: createDefaultHeroPortal(),
    seo: {
      title: "",
      description: "",
      keywords: [],
    },
    contact: {
      email: "contacto@seminarioipn.cl",
      phone: "+56 2 2345 6789",
      whatsapp: "+56912345678",
      address: "Av. Seminario 1234, Providencia",
      city: "Santiago",
      country: "Chile",
      hours: "",
    },
    social: {
      facebook: "https://facebook.com/seminarioipn",
      instagram: "https://instagram.com/seminarioipn",
      youtube: "https://youtube.com/@seminarioipn",
      linkedin: "",
      tiktok: "",
      spotify: "",
    },
    features: {
      blog: false,
      news: false,
      events: false,
      academicAgenda: true,
      institutionalNotices: true,
      store: false,
      library: false,
      forms: false,
      applications: false,
      onlinePayments: false,
    },
    portalCopy: {
      footerProgramsTitle: "Oferta Académica",
      footerResourcesTitle: "Recursos",
      footerAdmissionTitle: "Admisión",
      footerContactTitle: "Contacto",
      footerAdminLabel: "Administración",
      footerCopyrightSuffix: "Todos los derechos reservados.",
      footerCredits: "Desarrollado por Grupo Mentor Prime · Learning OS",
      footerBackToTopLabel: "Volver arriba",
    },
    topBar: {
      enabled: false,
      tagline: "100% Online",
      email: "contacto@seminarioipn.cl",
      phone: "+56 9 1234 5678",
      virtualCampusLabel: "Aula Virtual",
      virtualCampusHref: "https://campus.aprendehoy.cl",
    },
    portalExperience: {
      cursor: { ...DEFAULT_PORTAL_CURSOR },
      footerPremium: {
        showDescription: true,
        showNavigation: true,
        showContact: true,
        showSocial: true,
        showLegal: true,
      },
    },
    createdAt: now,
    updatedAt: now,
  };
}
