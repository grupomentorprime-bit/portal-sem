import { PortalBreadcrumb, PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { PortalPageHeader } from "@/components/portal/PortalSectionHeader";
import { InstitutionalNoticeCard } from "@/components/portal/cards";
import { fetchInstitutionalNotices } from "@/lib/portal/content";
import { getActivePortal } from "@/lib/portal/site";
import { INSTITUTIONAL_NOTICE_CATEGORIES } from "@/types/academic-portal";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getActivePortal();
  if (!ctx) return { title: "Avisos Institucionales" };
  return {
    title: `Avisos Institucionales | ${ctx.config.institution.shortName}`,
    description: "Comunicados oficiales de la Dirección del Seminario.",
  };
}

export default async function AvisosPage() {
  const ctx = await getActivePortal();
  if (!ctx) notFound();
  const notices = await fetchInstitutionalNotices(ctx.tenant, { limit: 48 });
  const featured = notices.find((n) => n.featured);

  return (
    <>
      <PortalBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Avisos Institucionales" },
        ]}
      />
      <PortalPageHeader
        title="Avisos institucionales"
        description="Información oficial publicada por la Dirección del Seminario."
      />
      <PortalSection padding="md">
        <PortalContainer>
          <div className="mb-8 flex flex-wrap gap-2">
            {INSTITUTIONAL_NOTICE_CATEGORIES.map((cat) => (
              <span
                key={cat.value}
                className="rounded-full bg-background-soft px-3 py-1 text-caption font-medium text-muted"
              >
                {cat.label}
              </span>
            ))}
          </div>

          {notices.length > 0 ? (
            <div className="space-y-8">
              {featured ? (
                <InstitutionalNoticeCard notice={featured} variant="banner" ctaLabel="Leer aviso" />
              ) : null}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {notices
                  .filter((n) => n.id !== featured?.id)
                  .map((notice) => (
                    <InstitutionalNoticeCard key={notice.id} notice={notice} ctaLabel="Leer aviso" />
                  ))}
              </div>
            </div>
          ) : (
            <PortalEmptyState
              title="Sin avisos publicados"
              description="Los comunicados oficiales aparecerán aquí cuando se publiquen."
            />
          )}
        </PortalContainer>
      </PortalSection>
    </>
  );
}
