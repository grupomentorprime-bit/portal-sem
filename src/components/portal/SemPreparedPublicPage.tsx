import Link from "next/link";
import { PortalRenderer } from "@/components/portal/PortalRenderer";
import { PortalBreadcrumb, PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { PortalPageHeader } from "@/components/portal/PortalSectionHeader";
import { PortalPersonCard, personItemToPortalPersonCard } from "@/components/portal/experience/people-grid";
import { loadPublishedPage } from "@/core/portal";
import { getPublishedPageBySlug } from "@/lib/cms/pages";
import { SemInstitutionalEducacionTeologica } from "@/components/portal/home/institutional/SemInstitutionalEducacionTeologica";
import { SemInstitutionalElSem } from "@/components/portal/home/institutional/SemInstitutionalElSem";
import { SemInstitutionalFormacion } from "@/components/portal/home/institutional/SemInstitutionalFormacion";
import { SemInstitutionalMalla } from "@/components/portal/home/institutional/SemInstitutionalMalla";
import { fetchPrograms, fetchTeam } from "@/lib/portal/content";
import {
  getSemPreparedPage,
  semPreparedChildren,
  type SemPreparedPage,
} from "@/lib/portal/sem-prepared-pages";
import {
  listFormationCourses,
  listTheologicalCohortLinks,
} from "@/lib/portal/theological-cohorts";
import { getActivePortal } from "@/lib/portal/site";
import { notFound } from "next/navigation";

export async function SemPreparedPublicPage({ spec }: { spec: SemPreparedPage }) {
  const ctx = await getActivePortal();
  if (!ctx) notFound();

  if (spec.slug === "/el-sem") {
    const published = await getPublishedPageBySlug(spec.slug, ctx.tenant);
    if (!published?.blocks?.length) {
      return <SemInstitutionalElSem />;
    }
  }

  if (spec.slug === "/formacion") {
    const published = await getPublishedPageBySlug(spec.slug, ctx.tenant);
    if (!published?.blocks?.length) {
      const programs = await fetchPrograms(ctx.tenant, { limit: 100 });
      return (
        <SemInstitutionalFormacion coursesPublished={listFormationCourses(programs).length > 0} />
      );
    }
  }

  if (spec.slug === "/formacion/educacion-teologica") {
    const published = await getPublishedPageBySlug(spec.slug, ctx.tenant);
    if (!published?.blocks?.length) {
      const programs = await fetchPrograms(ctx.tenant, { limit: 100 });
      return (
        <SemInstitutionalEducacionTeologica cohorts={listTheologicalCohortLinks(programs)} />
      );
    }
  }

  if (spec.slug === "/formacion/malla") {
    const published = await getPublishedPageBySlug(spec.slug, ctx.tenant);
    if (!published?.blocks?.length) {
      return <SemInstitutionalMalla />;
    }
  }

  const page = await loadPublishedPage(spec.slug, ctx.tenant);
  const hasBlocks = Boolean(page?.blocks?.length);
  const children = semPreparedChildren(spec.slug);
  const parentSlug = spec.slug.split("/").slice(0, -1).join("/") || "/";
  const parent = parentSlug !== "/" ? getSemPreparedPage(parentSlug) : undefined;

  return (
    <>
      <PortalBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          ...(parent ? [{ label: parent.title, href: parent.slug }] : []),
          { label: page?.title || spec.title },
        ]}
      />
      {hasBlocks && page ? <PortalRenderer page={page} ctx={ctx} /> : null}
      {!hasBlocks ? (
        <>
          <PortalPageHeader
            title={spec.title}
            description={spec.kind === "people" ? undefined : spec.pending}
          />
          {spec.kind === "shell" && children.length > 0 ? (
            <PortalSection padding="md">
              <PortalContainer>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {children.map((child) => (
                    <li key={child.slug}>
                      <Link
                        href={child.slug}
                        className="block rounded-[var(--radius-md)] border border-border px-4 py-3 text-body font-medium text-foreground hover:bg-background-soft"
                      >
                        {child.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </PortalContainer>
            </PortalSection>
          ) : null}
          {spec.kind === "people" ? <PeopleDirectory tenant={ctx.tenant} spec={spec} /> : null}
        </>
      ) : null}
      {spec.kind === "courses" ? <FormationCourseList tenant={ctx.tenant} /> : null}
    </>
  );
}

async function PeopleDirectory({ tenant, spec }: { tenant: string; spec: SemPreparedPage }) {
  const team = await fetchTeam(tenant);
  const members = team.filter((person) => person.teamGroup === spec.teamGroupId);

  return (
    <PortalSection padding="md">
      <PortalContainer>
        {members.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {members.map((member) => (
              <PortalPersonCard key={member.id} person={personItemToPortalPersonCard(member)} compact />
            ))}
          </div>
        ) : (
          <PortalEmptyState title={spec.title} description={spec.pending} />
        )}
      </PortalContainer>
    </PortalSection>
  );
}

async function FormationCourseList({ tenant }: { tenant: string }) {
  const programs = await fetchPrograms(tenant);
  const courses = listFormationCourses(programs);

  if (courses.length === 0) {
    return (
      <PortalSection padding="md">
        <PortalContainer>
          <p className="text-body text-muted">
            Esta línea no tiene cursos publicados.
          </p>
        </PortalContainer>
      </PortalSection>
    );
  }

  return (
    <PortalSection padding="md">
      <PortalContainer>
        <ul className="divide-y divide-border border-y border-border">
          {courses.map((course) => (
            <li key={course.id}>
              <Link href={course.href} className="block py-4 text-body font-medium text-foreground">
                {course.title}
              </Link>
            </li>
          ))}
        </ul>
      </PortalContainer>
    </PortalSection>
  );
}
