import { PortalBreadcrumb, PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { PortalPageHeader, PortalSectionHeader } from "@/components/portal/PortalSectionHeader";
import { TeamCard } from "@/components/portal/cards";
import { fetchTeam } from "@/lib/portal/content";
import { getActivePortal } from "@/lib/portal/site";
import type { TeacherItem } from "@/types/content";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const TEAM_SECTIONS = [
  { id: "director", title: "Director", match: /director/i },
  { id: "subdirector", title: "Subdirector", match: /subdirector|decano|vicerrector/i },
  { id: "academica", title: "Coordinación académica", match: /acad[eé]m|coordinaci[oó]n/i },
  { id: "gestion", title: "Gestión / calidad", match: /gesti[oó]n|calidad/i },
  { id: "estudiantiles", title: "Asuntos estudiantiles", match: /estudiant/i },
  { id: "soporte", title: "Soporte", match: /soporte|t[eé]cnico|administr/i },
] as const;

function groupTeam(members: TeacherItem[]) {
  const assigned = new Set<string>();
  const sections = TEAM_SECTIONS.map((section) => {
    const items = members.filter((m) => {
      if (assigned.has(m.id)) return false;
      const haystack = `${m.role} ${m.department ?? ""} ${m.specialty}`;
      if (section.match.test(haystack)) {
        assigned.add(m.id);
        return true;
      }
      return false;
    });
    return { ...section, members: items };
  });

  const unassigned = members.filter((m) => !assigned.has(m.id));
  return { sections, unassigned };
}

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getActivePortal();
  if (!ctx) return { title: "Equipo" };
  return {
    title: `Equipo | ${ctx.config.institution.shortName}`,
    description: "Equipo institucional y formadores.",
  };
}

export default async function EquipoPage() {
  const ctx = await getActivePortal();
  if (!ctx) notFound();

  const team = await fetchTeam(ctx.tenant);
  const { sections, unassigned } = groupTeam(team);

  return (
    <>
      <PortalBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Equipo" },
        ]}
      />
      <PortalPageHeader
        title="Equipo institucional"
        description={ctx.config.seo.description}
      />

      {team.length === 0 ? (
        <PortalSection padding="md">
          <PortalContainer>
            <PortalEmptyState
              title="Equipo en actualización"
              description="Los perfiles del equipo se publicarán desde el panel de administración."
            />
          </PortalContainer>
        </PortalSection>
      ) : (
        <>
          {sections.map((section) =>
            section.members.length > 0 ? (
              <PortalSection key={section.id} padding="md" muted={section.id === "academica" || section.id === "estudiantiles"}>
                <PortalContainer>
                  <PortalSectionHeader title={section.title} />
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {section.members.map((member) => (
                      <TeamCard key={member.id} member={member} />
                    ))}
                  </div>
                </PortalContainer>
              </PortalSection>
            ) : null
          )}

          {unassigned.length > 0 ? (
            <PortalSection padding="md">
              <PortalContainer>
                <PortalSectionHeader title="Equipo" />
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {unassigned.map((member) => (
                    <TeamCard key={member.id} member={member} />
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
