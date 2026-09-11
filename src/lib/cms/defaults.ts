import { PLATFORM_CREDITS } from "@/core/branding/display";
import { createDefaultHeroPortal } from "@/lib/cms/hero-portal-defaults";
import { colorDefaults } from "@/design/tokens/colors";
import {
  createDefaultSiteConfigModules,
  SITE_CONFIG_SCHEMA_VERSION,
} from "@/lib/cms/schema-versions";
import { DEFAULT_PORTAL_CURSOR } from "@/lib/portal/cursor-defaults";
import type { SiteConfig } from "@/types/cms";
import { SITE_CONFIG_ID } from "@/types/cms";

/**
 * Plantilla vacía de Site — paleta de plataforma, sin identidad SEM.
 * SEM se materializa en T001/S001 (OT-GROWTH-SAAS-006).
 */
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
      backgroundColor: colorDefaults.background,
      textColor: colorDefaults.foreground,
    },
    heroPortal: createDefaultHeroPortal(),
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
      hours: "",
    },
    social: {
      facebook: "",
      instagram: "",
      youtube: "",
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
      footerCredits: PLATFORM_CREDITS,
      footerBackToTopLabel: "Volver arriba",
    },
    topBar: {
      enabled: false,
      tagline: "",
      email: "",
      phone: "",
      virtualCampusLabel: "Aula Virtual",
      virtualCampusHref: "",
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
