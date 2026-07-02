import { Calendar, FileText } from "lucide-react";
import { iconSizes } from "@/design";
import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalSectionHeader } from "@/components/portal/PortalSectionHeader";
import { PortalCard } from "@/components/portal/cards/PortalCard";
import { resolveBlockIcon } from "@/lib/cms/block-utils";
import type {
  AdmissionCalendarDates,
  AdmissionConfig,
  AdmissionDocumentItem,
} from "@/types/admission";

interface AdmissionRequirementsProps {
  config: Pick<
    AdmissionConfig,
    "intro" | "profiles" | "requirements" | "calendar" | "documents"
  >;
}

export function AdmissionRequirements({ config }: AdmissionRequirementsProps) {
  const { intro, profiles, requirements, calendar, documents } = config;

  return (
    <>
      <PortalSection id="introduccion" padding="md">
        <PortalContainer size="md">
          <PortalSectionHeader
            title={intro.whyTitle}
            description={intro.whyDescription}
          />
        </PortalContainer>
      </PortalSection>

      <PortalSection id="perfil-postulante" muted padding="md">
        <PortalContainer>
          <PortalSectionHeader
            title={intro.profilesTitle}
            description={intro.profilesDescription}
          />
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
                    <p className="mt-2 text-body text-muted">{profile.description}</p>
                  </PortalCard>
                </li>
              );
            })}
          </ul>
        </PortalContainer>
      </PortalSection>

      <PortalSection id="requisitos" padding="md">
        <PortalContainer size="md">
          <PortalSectionHeader
            overline="Requisitos"
            title="¿Qué necesitas para postular?"
            description="Requisitos reales del SEM. El equipo de admisiones confirmará tu elegibilidad tras recibir tu solicitud."
          />
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
        </PortalContainer>
      </PortalSection>

      <AdmissionCalendarSection calendar={calendar} />

      <AdmissionDocumentsSection documents={documents} />
    </>
  );
}

function AdmissionCalendarSection({ calendar }: { calendar: AdmissionCalendarDates }) {
  const dates = [
    { label: "Inicio de postulaciones", value: calendar.applicationsOpen },
    { label: "Cierre de postulaciones", value: calendar.applicationsClose },
    { label: "Inicio de clases", value: calendar.classesStart },
  ];

  return (
    <PortalSection id="calendario" muted padding="md">
      <PortalContainer size="md">
        <PortalSectionHeader
          overline="Calendario"
          title="Fechas importantes"
          description={calendar.note}
        />
        <ul className="grid gap-4 sm:grid-cols-3" role="list">
          {dates.map((item) => (
            <li key={item.label}>
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
      </PortalContainer>
    </PortalSection>
  );
}

function AdmissionDocumentsSection({ documents }: { documents: AdmissionDocumentItem[] }) {
  if (documents.length === 0) return null;

  return (
    <PortalSection id="documentacion" padding="md">
      <PortalContainer size="md">
        <PortalSectionHeader
          overline="Documentación"
          title="Documentos requeridos"
          description="Listado informativo. No es necesario adjuntar archivos en esta etapa del portal."
        />
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
                        Requerido
                      </span>
                    ) : (
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted">
                        Opcional
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-body text-muted">{doc.description}</p>
                </div>
              </PortalCard>
            </li>
          ))}
        </ul>
      </PortalContainer>
    </PortalSection>
  );
}
