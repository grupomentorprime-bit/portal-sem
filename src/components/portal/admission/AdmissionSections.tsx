import { Calendar, FileText } from "lucide-react";
import { iconSizes } from "@/design";
import { PortalCard } from "@/components/portal/cards/PortalCard";
import { CmsSectionHeader, CmsSectionShell } from "@/components/portal/cms/CmsSectionShell";
import { resolveBlockIcon } from "@/lib/cms/block-utils";
import type {
  AdmissionCalendarDates,
  AdmissionCalendarLabels,
  AdmissionConfig,
  AdmissionDocumentItem,
  AdmissionProfileItem,
  AdmissionRequirementItem,
} from "@/types/admission";
import type { CmsDateItem, CmsSectionLayout } from "@/types/cms-shared";

interface SectionProps {
  layout?: CmsSectionLayout;
  anchor?: string;
}

export function AdmissionWhyStudy({ layout, anchor }: SectionProps) {
  if (!layout?.title && !layout?.description) return null;
  return (
    <CmsSectionShell id={anchor} layout={layout}>
      <CmsSectionHeader layout={layout} />
    </CmsSectionShell>
  );
}

interface AdmissionProfilesProps extends SectionProps {
  profiles: AdmissionProfileItem[];
}

export function AdmissionProfiles({ profiles, layout, anchor }: AdmissionProfilesProps) {
  if (profiles.length === 0) return null;
  return (
    <CmsSectionShell id={anchor} layout={{ ...layout, muted: layout?.muted ?? true }}>
      <CmsSectionHeader layout={layout} />
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" role="list">
        {profiles.map((profile) => {
          const Icon = resolveBlockIcon(profile.icon);
          return (
            <li key={profile.id}>
              <PortalCard className="h-full p-6">
                <span className="portal-icon-badge mb-4 inline-flex" aria-hidden>
                  <Icon size={iconSizes.md} strokeWidth={1.75} />
                </span>
                <h3 className="text-heading text-foreground">{profile.title}</h3>
                {profile.subtitle ? (
                  <p className="mt-1 text-sm text-secondary">{profile.subtitle}</p>
                ) : null}
                <p className="mt-2 text-body text-muted">{profile.description}</p>
              </PortalCard>
            </li>
          );
        })}
      </ul>
    </CmsSectionShell>
  );
}

interface AdmissionRequirementsListProps extends SectionProps {
  requirements: AdmissionRequirementItem[];
}

export function AdmissionRequirementsList({
  requirements,
  layout,
  anchor,
}: AdmissionRequirementsListProps) {
  if (requirements.length === 0) return null;
  return (
    <CmsSectionShell id={anchor} layout={layout}>
      <CmsSectionHeader layout={layout} />
      <ol className="admission-requirements__list space-y-4" role="list">
        {requirements.map((item, index) => (
          <li key={item.id}>
            <PortalCard className="flex gap-4 p-5 sm:items-start">
              <span
                className="admission-requirements__step flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-text-inverse"
                aria-hidden
              >
                {index + 1}
              </span>
              <div>
                <h3 className="text-heading text-foreground">{item.title}</h3>
                <p className="mt-1 text-body text-muted">{item.description}</p>
              </div>
            </PortalCard>
          </li>
        ))}
      </ol>
    </CmsSectionShell>
  );
}

interface AdmissionDatesProps extends SectionProps {
  calendar: AdmissionCalendarDates;
  calendarItems?: CmsDateItem[];
  dateLabels?: AdmissionCalendarLabels;
}

export function AdmissionDates({
  calendar,
  calendarItems,
  dateLabels,
  layout,
  anchor,
}: AdmissionDatesProps) {
  const dates =
    calendarItems ??
    [
      {
        id: "d-open",
        label: dateLabels?.applicationsOpen ?? "Inicio de postulaciones",
        value: calendar.applicationsOpen,
      },
      {
        id: "d-close",
        label: dateLabels?.applicationsClose ?? "Cierre de postulaciones",
        value: calendar.applicationsClose,
      },
      {
        id: "d-classes",
        label: dateLabels?.classesStart ?? "Inicio de clases",
        value: calendar.classesStart,
      },
    ];

  return (
    <CmsSectionShell id={anchor} layout={{ ...layout, muted: layout?.muted ?? true }}>
      <CmsSectionHeader layout={layout} />
      <ul className="grid gap-4 sm:grid-cols-3" role="list">
        {dates.map((item) => (
          <li key={item.id}>
            <PortalCard className="h-full p-5">
              <Calendar
                size={iconSizes.md}
                className="mb-3 text-secondary"
                strokeWidth={1.75}
                aria-hidden
              />
              <p className="text-caption font-semibold uppercase tracking-wide text-muted">
                {item.label}
              </p>
              <p className="mt-1 text-heading text-foreground">{item.value}</p>
            </PortalCard>
          </li>
        ))}
      </ul>
    </CmsSectionShell>
  );
}

interface AdmissionDocumentsProps extends SectionProps {
  documents: AdmissionDocumentItem[];
  requiredLabel?: string;
  optionalLabel?: string;
}

export function AdmissionDocuments({
  documents,
  layout,
  anchor,
  requiredLabel = "Requerido",
  optionalLabel = "Opcional",
}: AdmissionDocumentsProps) {
  if (documents.length === 0) return null;

  return (
    <CmsSectionShell id={anchor} layout={layout}>
      <CmsSectionHeader layout={layout} />
      <ul className="space-y-3" role="list">
        {documents.map((doc) => (
          <li key={doc.id}>
            <PortalCard className="flex gap-4 p-4 sm:items-start">
              <FileText
                size={iconSizes.md}
                className="mt-0.5 shrink-0 text-secondary"
                strokeWidth={1.75}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-heading text-foreground">{doc.title}</h3>
                  {doc.required ? (
                    <span className="rounded-full bg-background-muted px-2 py-0.5 text-xs font-medium text-muted">
                      {requiredLabel}
                    </span>
                  ) : (
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted">
                      {optionalLabel}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-body text-muted">{doc.description}</p>
              </div>
            </PortalCard>
          </li>
        ))}
      </ul>
    </CmsSectionShell>
  );
}
