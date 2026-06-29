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
  const { config, tenant, logos } = ctx;
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
  const presentationBlock = findBlock(homePage?.blocks, "presentation");
  const textBlock = findBlock(homePage?.blocks, "text");

  const heroSettings = blockSettings<{
    motto?: string;
    ctaLabel?: string;
    ctaHref?: string;
    badge?: string;
  }>(heroBlock);

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

  const teamPreview = team.slice(0, 4);

  return (
    <>
      <PortalHero
        badge={heroSettings.badge}
        title={institution.name}
        subtitle={heroSettings.motto || seo.description}
        description={presentation.description || undefined}
        heroImage={logos.hero}
        logoSrc={logos.sem}
        primaryLabel="Postula ahora"
        primaryHref="/contacto"
        secondaryLabel={heroSettings.ctaLabel || "Ver programas"}
        secondaryHref={heroSettings.ctaHref || "/programas"}
      />

      <PortalSection id="programas-destacados">
        <PortalContainer>
          <PortalSectionHeader
            overline="Académico"
            title="Programas destacados"
            description="Formación bíblica, teológica y ministerial al servicio de la Iglesia."
            href="/programas"
            linkLabel="Ver todos"
          />
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
              actionLabel="Contactar"
              actionHref="/contacto"
            />
          )}
        </PortalContainer>
      </PortalSection>

      <PortalSection muted id="por-que-estudiar">
        <PortalContainer>
          <PortalSectionHeader
            overline="Ventajas"
            title={presentation.title || "Por qué estudiar con nosotros"}
            description={
              presentation.description ||
              "Descubre una formación diseñada para líderes y ministros de la Iglesia."
            }
          />
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

      <PortalSection id="modalidad-online">
        <PortalContainer>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <PortalSectionHeader
                overline={textSettings.overline || "Modalidad"}
                title={textSettings.title || "Estudia 100% online"}
                description={
                  textSettings.body ||
                  "Accede a la formación desde cualquier lugar, con acompañamiento pastoral y comunidad de aprendizaje."
                }
              />
              <Button href="/programas" variant="primary">
                Conocer programas
              </Button>
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

      <PortalSection muted id="equipo">
        <PortalContainer>
          <PortalSectionHeader
            overline="Equipo"
            title="Nuestro equipo SEM"
            description="Formadores comprometidos con la excelencia académica y pastoral."
            href="/equipo"
            linkLabel="Ver equipo completo"
          />
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
          <PortalSectionHeader
            overline="Actualidad"
            title="Noticias recientes"
            href="/noticias"
            linkLabel="Ver todas"
          />
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

      <PortalSection muted id="ipn-chile">
        <PortalContainer>
          <div className="flex flex-col items-center gap-8 rounded-[var(--radius-2xl)] border border-border bg-background p-8 text-center sm:p-12 lg:flex-row lg:text-left">
            {logos.ipn ? (
              <Image
                src={logos.ipn}
                alt="IPN Chile"
                width={120}
                height={120}
                className="h-24 w-auto shrink-0"
              />
            ) : null}
            <div className="flex-1">
              <h2 className="text-display-s font-semibold text-foreground">
                Vinculación con IPN Chile
              </h2>
              <p className="mt-3 text-body text-muted">
                {institution.organization ||
                  "Formación en alianza con el Instituto Patrístico Nacional de Chile."}
              </p>
              <Button href="/ipn-chile" variant="outline" className="mt-6">
                Conocer la vinculación
              </Button>
            </div>
          </div>
        </PortalContainer>
      </PortalSection>

      <PortalSection id="cta-final">
        <PortalContainer>
          <PortalCTA
            title={ctaSettings.title || "¿Sientes el llamado al ministerio?"}
            description={
              ctaSettings.description ||
              "Inicia tu proceso de postulación y forma parte de nuestra comunidad de aprendizaje."
            }
            primaryLabel={ctaSettings.primaryLabel || "Postula ahora"}
            primaryHref={ctaSettings.primaryHref || "/contacto"}
            secondaryLabel={ctaSettings.secondaryLabel || "Solicitar información"}
            secondaryHref={ctaSettings.secondaryHref || "/contacto"}
          />
        </PortalContainer>
      </PortalSection>
    </>
  );
}
