import dynamic from "next/dynamic";
import { PortalBreadcrumb } from "@/components/portal/layout";
import {
  AdmissionFAQ,
  AdmissionFees,
  AdmissionForm,
  AdmissionLanding,
  AdmissionPageChrome,
  AdmissionProgramsSection,
  AdmissionScholarships,
  AdmissionTimeline,
} from "@/components/portal/admission";
import {
  AdmissionDates,
  AdmissionDocuments,
  AdmissionProfiles,
  AdmissionRequirementsList,
  AdmissionWhyStudy,
} from "@/components/portal/admission/AdmissionSections";
import { getAdmissionConfig } from "@/lib/cms/admission-config";
import { sortAdmissionSections } from "@/lib/portal/admission-sections";
import { fetchPrograms } from "@/lib/portal/content";
import { getActivePortal } from "@/lib/portal/site";
import type { AdmissionConfig, AdmissionSectionId } from "@/types/admission";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

const LazyAdmissionClosing = dynamic(
  () => import("@/components/portal/admission/AdmissionClosing").then((m) => m.AdmissionClosing),
  { loading: () => null }
);

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getActivePortal();
  const config = ctx ? await getAdmissionConfig(ctx.tenant) : null;
  const heroSeo = config?.sectionSeo?.hero;
  return {
    title: heroSeo?.title ?? (ctx ? `Admisión | ${ctx.config.seo.title}` : "Centro de Admisión"),
    description:
      heroSeo?.description ??
      config?.hero.description ??
      "Centro de Admisión del Seminario Eclesiástico Mayor.",
  };
}

interface AdmissionPageSectionsProps {
  config: AdmissionConfig;
  tenant: string;
  programOptions: Array<{ id: string; label: string }>;
  programs: Awaited<ReturnType<typeof fetchPrograms>>;
}

function sectionAnchor(config: AdmissionConfig, id: AdmissionSectionId): string | undefined {
  return config.sectionSeo?.[id]?.anchor;
}

function sectionLayout(config: AdmissionConfig, id: AdmissionSectionId) {
  return config.sectionLayouts?.[id];
}

async function renderAdmissionSection(
  sectionId: AdmissionSectionId,
  config: AdmissionConfig,
  tenant: string,
  programOptions: Array<{ id: string; label: string }>,
  programs: Awaited<ReturnType<typeof fetchPrograms>>
): Promise<ReactNode> {
  const layout = sectionLayout(config, sectionId);
  const anchor = sectionAnchor(config, sectionId);

  switch (sectionId) {
    case "hero":
      return (
        <AdmissionLanding
          key="hero"
          config={config}
          tenant={tenant}
          sectionId={anchor}
          breadcrumb={
            <PortalBreadcrumb
              bare
              items={[
                { label: "Inicio", href: "/" },
                { label: "Admisión" },
              ]}
            />
          }
        />
      );
    case "programs":
      return (
        <AdmissionProgramsSection
          key="programs"
          config={config.programsSection}
          programs={programs}
          sectionId={anchor ?? "programas-admision"}
        />
      );
    case "why_study":
      return <AdmissionWhyStudy key="why_study" layout={layout} anchor={anchor} />;
    case "profiles":
      return (
        <AdmissionProfiles
          key="profiles"
          profiles={config.profiles}
          layout={layout}
          anchor={anchor}
        />
      );
    case "requirements":
      return (
        <AdmissionRequirementsList
          key="requirements"
          requirements={config.requirements}
          layout={layout}
          anchor={anchor}
        />
      );
    case "dates":
      return (
        <AdmissionDates
          key="dates"
          calendar={config.calendar}
          calendarItems={config.calendarItems}
          dateLabels={config.calendarLabels}
          layout={layout}
          anchor={anchor}
        />
      );
    case "documents":
      return (
        <AdmissionDocuments
          key="documents"
          documents={config.documents}
          layout={layout}
          anchor={anchor}
        />
      );
    case "timeline":
      return (
        <AdmissionTimeline
          key="timeline"
          steps={config.processSteps}
          layout={layout}
          anchor={anchor}
        />
      );
    case "fees":
      return (
        <AdmissionFees
          key="fees"
          items={config.fees}
          note={config.feesNote}
          layout={layout}
          anchor={anchor}
        />
      );
    case "scholarships":
      return (
        <AdmissionScholarships
          key="scholarships"
          items={config.scholarships}
          description={config.scholarshipsDescription}
          layout={layout}
          anchor={anchor}
        />
      );
    case "form":
      return (
        <AdmissionForm
          key="form"
          title={config.formTitle}
          description={config.formDescription}
          fields={config.formFields}
          programs={programOptions}
          layout={layout}
          anchor={anchor}
          submitLabel={config.formSubmitLabel}
          footerNote={config.formFooterNote}
          globalErrorMessage={config.formGlobalError}
          connectionErrorMessage={config.formConnectionError}
        />
      );
    case "faq":
      return <AdmissionFAQ key="faq" items={config.faq} layout={layout} anchor={anchor} />;
    case "closing":
      return config.closing.enabled ? (
        <LazyAdmissionClosing key="closing" tenant={tenant} closing={config.closing} />
      ) : null;
    default:
      return null;
  }
}

async function AdmissionPageSections({
  config,
  tenant,
  programOptions,
  programs,
}: AdmissionPageSectionsProps) {
  const sections = sortAdmissionSections(config.sections).filter((section) => section.enabled);
  const nodes = await Promise.all(
    sections.map((section) =>
      renderAdmissionSection(section.id, config, tenant, programOptions, programs)
    )
  );
  return <>{nodes}</>;
}

export default async function AdmisionPage() {
  const ctx = await getActivePortal();
  if (!ctx) notFound();

  const [config, programs] = await Promise.all([
    getAdmissionConfig(ctx.tenant),
    fetchPrograms(ctx.tenant),
  ]);

  const programOptions = programs.map((p) => ({ id: p.id, label: p.title }));

  return (
    <>
      <AdmissionPageChrome />
      <AdmissionPageSections
        config={config}
        tenant={ctx.tenant}
        programOptions={programOptions}
        programs={programs}
      />
    </>
  );
}
