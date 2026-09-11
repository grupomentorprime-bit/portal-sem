/**
 * Plantilla vacía de admisión — sin copy SEM/IPN/Talca.
 * Un Espacio nuevo sin plantilla no hereda contenido de T001.
 */
import { ADMISSION_CONFIG_ID } from "@/lib/portal/admission-content";
import { DEFAULT_ADMISSION_SECTIONS } from "@/lib/portal/admission-sections";
import { DEFAULT_CMS_SECTION_LAYOUT } from "@/types/cms-shared";
import type { AdmissionClosingConfig } from "@/types/admission-closing";
import type { AdmissionConfig } from "@/types/admission";
import type { ProgramsShowcaseConfig } from "@/types/programs-showcase";

const EMPTY_SHOWCASE: ProgramsShowcaseConfig = {
  enabled: false,
  overline: "",
  title: "",
  description: "",
  filters: [],
  cardCtaLabel: "",
  help: {
    enabled: false,
    title: "",
    description: "",
    primaryLabel: "",
    primaryHref: "",
    secondaryLabel: "",
    secondaryHref: "",
  },
};

export const EMPTY_ADMISSION_CLOSING: AdmissionClosingConfig = {
  enabled: false,
  blocks: [],
};

/** Shell de admisión sin datos de cliente. */
export function createEmptyAdmissionConfig(tenant: string): AdmissionConfig {
  const now = new Date().toISOString();
  return {
    _id: ADMISSION_CONFIG_ID,
    tenant,
    hero: {
      enabled: false,
      eyebrow: "",
      statusBadge: {
        text: "",
        icon: "Sparkles",
        tone: "success",
        visible: false,
      },
      title: "",
      subtitle: "",
      description: "",
      media: {
        type: "image",
        imageAssetId: "",
        alt: "",
        overlay: false,
        overlayOpacity: 0,
        darkening: 0,
        blur: 0,
        gradient: false,
        gradientOpacity: 0,
        focalPoint: { x: 0.5, y: 0.5 },
        position: "center",
      },
      editorialCard: {
        visible: false,
        title: "",
        rows: [],
      },
      quote: { visible: false, text: "", reference: "" },
      animations: {
        enabled: false,
        entrance: "fade",
        hoverElevation: false,
        hoverCta: false,
      },
      actions: [],
      indicators: [],
      microBenefits: [],
    },
    datesHighlight: {
      enabled: false,
      title: "",
      statusLabel: "",
      items: [],
    },
    programsSection: { ...EMPTY_SHOWCASE },
    heroPrograms: { ...EMPTY_SHOWCASE },
    calendarLabels: {
      applicationsOpen: "",
      applicationsClose: "",
      classesStart: "",
    },
    intro: {
      whyTitle: "",
      whyDescription: "",
      profilesTitle: "",
      profilesDescription: "",
    },
    profiles: [],
    requirements: [],
    calendar: {
      applicationsOpen: "",
      applicationsClose: "",
      classesStart: "",
    },
    calendarItems: [],
    fees: [],
    feesNote: "",
    scholarships: [],
    scholarshipsDescription: "",
    faq: [],
    documents: [],
    processSteps: [],
    formTitle: "",
    formDescription: "",
    formFields: [],
    formSubmitLabel: "Enviar",
    formFooterNote: "",
    formGlobalError: "No pudimos enviar el formulario. Intenta nuevamente.",
    formConnectionError: "Error de conexión. Verifica tu red e intenta de nuevo.",
    successContent: {
      title: "",
      lead: "",
      body: "",
      invitation: "",
      links: [],
    },
    sections: DEFAULT_ADMISSION_SECTIONS.map((section) => ({
      ...section,
      enabled: false,
    })),
    sectionLayouts: {
      programs: { ...DEFAULT_CMS_SECTION_LAYOUT },
    },
    sectionSeo: {},
    closing: EMPTY_ADMISSION_CLOSING,
    updatedAt: now,
  };
}
