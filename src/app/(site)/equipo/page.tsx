import { PortalBreadcrumb, PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { PortalPageHeader, PortalSectionHeader } from "@/components/portal/PortalSectionHeader";
import { PortalPersonCard, personItemToPortalPersonCard } from "@/components/portal/experience/people-grid";
import { TEAM_GROUPS } from "@/lib/content/team-groups";
import { fetchTeam } from "@/lib/portal/content";
import { getActivePortal } from "@/lib/portal/site";
import type { PersonItem } from "@/types/people-grid";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

function groupTeamByCategory(members: PersonItem[]) {
  const assigned = new Set<string>();

  const sections = TEAM_GROUPS.map((group) => {
    const items = members.filter((member) => {
      if (assigned.has(member.id)) return false;
      if (member.teamGroup === group.id) {
        assigned.add(member.id);
        return true;
      }
      return false;
    });
    return { ...group, members: items };
  });

  const unassigned = members.filter((member) => !assigned.has(member.id));
  return { sections, unassigned };
}

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getActivePortal();
  if (!ctx) return { title: "Equipo docente" };
  return {
    title: `Equipo docente | ${ctx.config.institution.shortName}`,
    description:
      "Docentes y equipo institucional del Seminario Eclesiástico Mayor — autoridad académica al servicio de la Iglesia.",
  };
}

export default async function EquipoPage() {
  const ctx = await getActivePortal();
  if (!ctx) notFound();

  const team = await fetchTeam(ctx.tenant);
  const { sections, unassigned } = groupTeamByCategory(team);

  return (
    <>
      <PortalBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Equipo" },
        ]}
      />
      <PortalPageHeader
        title="Equipo del seminario"
        description="Equipo directivo, docente y técnico comprometido con la formación bíblica, académica y pastoral del SEM."
      />

      {team.length === 0 ? (
        <PortalSection padding="md">
          <PortalContainer>
            <PortalEmptyState
              title="Equipo en actualización"
              description="Los perfiles del equipo se publican desde Personas en el panel de administración."
            />
          </PortalContainer>
        </PortalSection>
      ) : (
        <>
          {sections.map((section, index) =>
            section.members.length > 0 ? (
              <PortalSection key={section.id} padding="md" muted={index % 2 === 1}>
                <PortalContainer>
                  <PortalSectionHeader
                    title={section.label}
                    description={section.description}
                  />
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {section.members.map((member) => (
                      <PortalPersonCard
                        key={member.id}
                        person={personItemToPortalPersonCard(member)}
                        compact
                      />
                    ))}
                  </div>
                </PortalContainer>
              </PortalSection>
            ) : null
          )}

          {unassigned.length > 0 ? (
            <PortalSection padding="md">
              <PortalContainer>
                <PortalSectionHeader title="Otros colaboradores" />
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {unassigned.map((member) => (
                    <PortalPersonCard
                      key={member.id}
                      person={personItemToPortalPersonCard(member)}
                      compact
                    />
                  ))}
                </div>
              </PortalContainer>
            </PortalSection>
          ) : null}
        </>
      )}
    </>
  );
}
