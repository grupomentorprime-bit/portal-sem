import Image from "next/image";
import { Button } from "@/components/ui";
import {
  PortalContainer,
  PortalCTA,
  PortalSection,
} from "@/components/portal/layout";
import { PortalHero } from "@/components/portal/PortalHero";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { PortalSectionHeader } from "@/components/portal/PortalSectionHeader";
import {
  NewsCard,
  ProgramCard,
  StatCard,
  TeamCard,
} from "@/components/portal/cards";
import {
  fetchNews,
  fetchPrograms,
  fetchTeam,
} from "@/lib/portal/content";
import {
  blockSettings,
  extractStats,
  findBlock,
} from "@/lib/portal/blocks";
import { getPublishedPageBySlug } from "@/lib/cms/pages";
import type { PortalContext } from "@/lib/portal/site";

interface PortalHomeProps {
  ctx: PortalContext;
}

export async function PortalHome({ ctx }: PortalHomeProps) {
  const { config, tenant, logos, navigation } = ctx;
  const { institution, seo } = config;

  const [programs, news, team, homePage] = await Promise.all([
    fetchPrograms(tenant, { featured: true, limit: 6 }),
    fetchNews(tenant, { limit: 3 }),
    fetchTeam(tenant),
    getPublishedPageBySlug("/", tenant),
  ]);

  const statsBlock = findBlock(homePage?.blocks, "stats");
  const ctaBlock = findBlock(homePage?.blocks, "cta");
  const heroBlock = findBlock(homePage?.blocks, "hero");
  const programsBlock = findBlock(homePage?.blocks, "programs");
  const teachersBlock = findBlock(homePage?.blocks, "teachers");
  const newsBlock = findBlock(homePage?.blocks, "news");
  const presentationBlock = findBlock(homePage?.blocks, "presentation");
  const textBlock = findBlock(homePage?.blocks, "text");

  const heroSettings = blockSettings<{
    motto?: string;
    ctaLabel?: string;
    ctaHref?: string;
    badge?: string;
    primaryLabel?: string;
    primaryHref?: string;
    secondaryLabel?: string;
    secondaryHref?: string;
  }>(heroBlock);

  const programsSettings = blockSettings<{
    overline?: string;
    title?: string;
    description?: string;
    buttonHref?: string;
    buttonLabel?: string;
  }>(programsBlock);

  const teachersSettings = blockSettings<{
    overline?: string;
    title?: string;
    description?: string;
    buttonHref?: string;
    buttonLabel?: string;
  }>(teachersBlock);

  const newsSettings = blockSettings<{
    overline?: string;
    title?: string;
    buttonHref?: string;
    buttonLabel?: string;
  }>(newsBlock);

  const stats = extractStats(statsBlock);
  const ctaSettings = blockSettings<{
    title?: string;
    description?: string;
    primaryLabel?: string;
    primaryHref?: string;
    secondaryLabel?: string;
    secondaryHref?: string;
  }>(ctaBlock);

  const presentation = blockSettings<{
    title?: string;
    description?: string;
    overline?: string;
  }>(presentationBlock);

  const textSettings = blockSettings<{
    title?: string;
    body?: string;
    overline?: string;
  }>(textBlock);

  const applyQuickLink = navigation.quickLinks.find((l) => l.highlighted) ?? navigation.quickLinks[0];
  const teamPreview = team.slice(0, 4);

  return (
    <>
      <PortalHero
        badge={heroSettings.badge}
        title={institution.name}
        subtitle={heroSettings.motto || seo.description}
        description={presentation.description || undefined}
        heroImage={logos.hero}
        logoSrc={logos.primary}
        primaryLabel={heroSettings.primaryLabel || applyQuickLink?.label}
        primaryHref={heroSettings.primaryHref || applyQuickLink?.href}
        secondaryLabel={heroSettings.secondaryLabel || heroSettings.ctaLabel}
        secondaryHref={heroSettings.secondaryHref || heroSettings.ctaHref || programsSettings.buttonHref}
      />

      <PortalSection id="programas-destacados">
        <PortalContainer>
          {programsSettings.title ? (
            <PortalSectionHeader
              overline={programsSettings.overline}
              title={programsSettings.title}
              description={programsSettings.description}
              href={programsSettings.buttonHref}
              linkLabel={programsSettings.buttonLabel}
            />
          ) : null}
          {programs.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          ) : (
            <PortalEmptyState
              title="Programas en preparación"
              description="Los programas académicos se publicarán desde el panel de administración."
            />
          )}
        </PortalContainer>
      </PortalSection>

      {(presentation.title || presentation.description || stats.length > 0) ? (
        <PortalSection muted id="presentacion">
          <PortalContainer>
            {(presentation.title || presentation.description) ? (
              <PortalSectionHeader
                overline={presentation.overline}
                title={presentation.title ?? ""}
                description={presentation.description}
              />
            ) : null}
            {stats.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <StatCard key={stat.id} value={stat.value} label={stat.label} />
                ))}
              </div>
            ) : (
              <PortalEmptyState
                title="Información próximamente"
                description="Las ventajas institucionales se configurarán desde el CMS."
              />
            )}
          </PortalContainer>
        </PortalSection>
      ) : null}

      {(textSettings.title || textSettings.body) ? (
        <PortalSection id="contenido-destacado">
          <PortalContainer>
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <PortalSectionHeader
                  overline={textSettings.overline}
                  title={textSettings.title ?? ""}
                  description={textSettings.body}
                />
                {programsSettings.buttonHref ? (
                  <Button href={programsSettings.buttonHref} variant="primary">
                    {programsSettings.buttonLabel || "Ver más"}
                  </Button>
                ) : null}
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-2xl)] bg-background-soft">
                <Image
                  src={logos.hero}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </PortalContainer>
        </PortalSection>
      ) : null}

      <PortalSection muted id="equipo">
        <PortalContainer>
          {teachersSettings.title ? (
            <PortalSectionHeader
              overline={teachersSettings.overline}
              title={teachersSettings.title}
              description={teachersSettings.description}
              href={teachersSettings.buttonHref || "/equipo"}
              linkLabel={teachersSettings.buttonLabel}
            />
          ) : null}
          {teamPreview.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {teamPreview.map((member) => (
                <TeamCard key={member.id} member={member} />
              ))}
            </div>
          ) : (
            <PortalEmptyState
              title="Equipo en actualización"
              description="Los perfiles del equipo institucional se publicarán desde el CMS."
            />
          )}
        </PortalContainer>
      </PortalSection>

      <PortalSection id="noticias">
        <PortalContainer>
          {newsSettings.title ? (
            <PortalSectionHeader
              overline={newsSettings.overline}
              title={newsSettings.title}
              href={newsSettings.buttonHref}
              linkLabel={newsSettings.buttonLabel}
            />
          ) : null}
          {news.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {news.map((item) => (
                <NewsCard key={item.id} news={item} />
              ))}
            </div>
          ) : (
            <PortalEmptyState
              title="Sin noticias publicadas"
              description="Las novedades institucionales aparecerán aquí cuando se publiquen."
            />
          )}
        </PortalContainer>
      </PortalSection>

      {(institution.organization && logos.secondary) ? (
        <PortalSection muted id="alianza-institucional">
          <PortalContainer>
            <div className="flex flex-col items-center gap-8 rounded-[var(--radius-2xl)] border border-border bg-background p-8 text-center sm:p-12 lg:flex-row lg:text-left">
              <Image
                src={logos.secondary}
                alt=""
                width={120}
                height={120}
                className="h-24 w-auto shrink-0"
              />
              <div className="flex-1">
                <h2 className="text-display-s font-semibold text-foreground">
                  {institution.organization}
                </h2>
              </div>
            </div>
          </PortalContainer>
        </PortalSection>
      ) : null}

      <PortalSection id="cta-final">
        <PortalContainer>
          {(ctaSettings.title || ctaSettings.primaryLabel) ? (
            <PortalCTA
              title={ctaSettings.title ?? ""}
              description={ctaSettings.description}
              primaryLabel={ctaSettings.primaryLabel ?? applyQuickLink?.label ?? "Contacto"}
              primaryHref={ctaSettings.primaryHref ?? applyQuickLink?.href ?? "/contacto"}
              secondaryLabel={ctaSettings.secondaryLabel}
              secondaryHref={ctaSettings.secondaryHref}
            />
          ) : null}
        </PortalContainer>
      </PortalSection>
    </>
  );
}
