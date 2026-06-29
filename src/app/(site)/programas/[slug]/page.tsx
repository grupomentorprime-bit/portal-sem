import Image from "next/image";
import { notFound } from "next/navigation";
import { Clock, MapPin } from "lucide-react";
import { iconSizes } from "@/design";
import { Badge } from "@/components/ui";
import {
  PortalBreadcrumb,
  PortalContainer,
  PortalCTA,
  PortalSection,
} from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { fetchProgramBySlug } from "@/lib/portal/content";
import { getActivePortal } from "@/lib/portal/site";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const ctx = await getActivePortal();
  if (!ctx) return { title: "Programa" };
  const program = await fetchProgramBySlug(ctx.tenant, slug);
  if (!program) return { title: "Programa no encontrado" };
  return {
    title: program.seo.title || program.title,
    description: program.seo.description || program.summary,
  };
}

export default async function ProgramaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const ctx = await getActivePortal();
  if (!ctx) notFound();
  const program = await fetchProgramBySlug(ctx.tenant, slug);

  if (!program) notFound();

  const heroImage = program.image || ctx.logos.hero;

  return (
    <>
      <PortalBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Programas", href: "/programas" },
          { label: program.title },
        ]}
      />

      <section className="relative overflow-hidden bg-primary py-16 sm:py-20">
        <div className="absolute inset-0 opacity-20">
          <Image src={heroImage} alt="" fill className="object-cover" sizes="100vw" />
        </div>
        <PortalContainer className="relative">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              {program.programStatus === "admission_open" ? (
                <Badge variant="info">Admisión abierta</Badge>
              ) : null}
              {program.modality ? <Badge variant="neutral">{program.modality}</Badge> : null}
            </div>
            <h1 className="mt-4 text-display-m font-semibold text-text-inverse sm:text-display-l">
              {program.title}
            </h1>
            {program.summary ? (
              <p className="mt-4 text-lg text-text-inverse/85">{program.summary}</p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-text-inverse/70">
              {program.duration ? (
                <span className="flex items-center gap-2">
                  <Clock size={iconSizes.sm} strokeWidth={2} />
                  {program.duration}
                </span>
              ) : null}
              {program.modality ? (
                <span className="flex items-center gap-2">
                  <MapPin size={iconSizes.sm} strokeWidth={2} />
                  {program.modality}
                </span>
              ) : null}
            </div>
          </div>
        </PortalContainer>
      </section>

      <PortalSection padding="md">
        <PortalContainer size="md">
          <div className="prose-portal space-y-10">
            {program.content ? (
              <div>
                <h2 className="text-heading text-foreground">Descripción general</h2>
                <p className="mt-3 whitespace-pre-line text-body text-muted">{program.content}</p>
              </div>
            ) : program.summary ? (
              <div>
                <h2 className="text-heading text-foreground">Descripción general</h2>
                <p className="mt-3 text-body text-muted">{program.summary}</p>
              </div>
            ) : null}

            {program.fees ? (
              <div>
                <h2 className="text-heading text-foreground">Aranceles</h2>
                <p className="mt-3 text-body text-muted">{program.fees}</p>
              </div>
            ) : null}

            {program.requirements ? (
              <div>
                <h2 className="text-heading text-foreground">Requisitos</h2>
                <p className="mt-3 whitespace-pre-line text-body text-muted">{program.requirements}</p>
              </div>
            ) : null}

            {program.modules ? (
              <div>
                <h2 className="text-heading text-foreground">Malla / módulos</h2>
                <p className="mt-3 whitespace-pre-line text-body text-muted">{program.modules}</p>
              </div>
            ) : null}

            {!program.content &&
            !program.summary &&
            !program.fees &&
            !program.requirements &&
            !program.modules ? (
              <PortalEmptyState
                title="Detalle en preparación"
                description="La información del programa se completará desde el CMS."
              />
            ) : null}
          </div>

          <div className="mt-12">
            <PortalCTA
              title="¿Te interesa este programa?"
              description="Inicia tu postulación o solicita más información."
              primaryLabel="Postular"
              primaryHref="/contacto"
              secondaryLabel="Solicitar información"
              secondaryHref="/contacto"
              variant="default"
            />
          </div>
        </PortalContainer>
      </PortalSection>
    </>
  );
}
