import { Container, Grid, Section, Stack } from "@/components/layout";
import {
  CTASection,
  HeroInstitutional,
  InstitutionalGallery,
  NewsCard,
  ProgramCard,
  SectionTitle,
  StatsInstitution,
  TeacherCard,
  TestimonialCard,
  VerseBlock,
} from "@/components/institutional";
import { Button } from "@/components/ui";
import {
  HOME_GALLERY,
  HOME_NEWS,
  HOME_PROGRAMS,
  HOME_STATS,
  HOME_TEACHERS,
  HOME_TESTIMONIALS,
  HOME_VERSE,
  WHY_STUDY_POINTS,
} from "@/lib/institutional/home-content";
import type { SiteConfig } from "@/types/cms";
import { CheckCircle2 } from "lucide-react";
import { iconSizes } from "@/design";

interface HomeInstitutionalProps {
  config: SiteConfig;
}

export function HomeInstitutional({ config }: HomeInstitutionalProps) {
  const { institution, branding, seo } = config;
  const heroImage = branding.heroImage || undefined;
  const logoSrc = branding.logo || undefined;

  return (
    <>
      <HeroInstitutional
        institutionName={institution.name || "Seminario Eclesiástico Mayor"}
        heroImage={heroImage}
        logoSrc={logoSrc}
      />

      <Section id="presentacion" padding="lg">
        <Container>
          <Grid cols={1} lgCols={2} gap={8} className="items-center">
            <SectionTitle
              overline="Presentación"
              title="Formación al servicio de la Iglesia"
              description={seo.description || "El Seminario Eclesiástico Mayor ofrece una formación integral para quienes responden al llamado al ministerio ordenado."}
            />
            <VerseBlock text={HOME_VERSE.text} reference={HOME_VERSE.reference} />
          </Grid>
        </Container>
      </Section>

      <Section id="programas" padding="lg" muted>
        <Container>
          <Stack gap={12}>
            <SectionTitle
              overline="Académico"
              title="Nuestros programas"
              description="Rutas formativas diseñadas para una preparación sólida en filosofía, teología y pastoral."
              align="center"
              className="mx-auto"
            />
            <Grid cols={1} mdCols={2} lgCols={3} gap={6}>
              {HOME_PROGRAMS.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </Grid>
            <div className="text-center">
              <Button href="/programas" variant="outline" size="lg">
                Ver todos los programas
              </Button>
            </div>
          </Stack>
        </Container>
      </Section>

      <Section id="por-que" padding="lg">
        <Container>
          <Grid cols={1} lgCols={2} gap={12} className="items-start">
            <SectionTitle
              overline="Vocación"
              title="¿Por qué estudiar en el SEM?"
              description="Una experiencia formativa que integra fe, razón y servicio pastoral."
            />
            <ul className="space-y-6">
              {WHY_STUDY_POINTS.map((point) => (
                <li key={point.title} className="flex gap-4 animate-scale-in">
                  <CheckCircle2
                    className="mt-0.5 shrink-0 text-success"
                    size={iconSizes.lg}
                    strokeWidth={2}
                    aria-hidden
                  />
                  <div>
                    <h3 className="text-heading text-foreground">{point.title}</h3>
                    <p className="mt-1 text-body text-muted">{point.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Grid>
        </Container>
      </Section>

      <Section padding="lg" className="bg-primary">
        <Container>
          <StatsInstitution stats={HOME_STATS} />
        </Container>
      </Section>

      <Section id="equipo" padding="lg" muted>
        <Container>
          <Stack gap={12}>
            <SectionTitle
              overline="Equipo"
              title="Nuestros formadores"
              description="Profesores y mentores comprometidos con la excelencia académica y espiritual."
              align="center"
              className="mx-auto"
            />
            <Grid cols={1} smCols={2} lgCols={4} gap={6}>
              {HOME_TEACHERS.map((teacher) => (
                <TeacherCard key={teacher.id} teacher={teacher} />
              ))}
            </Grid>
          </Stack>
        </Container>
      </Section>

      <Section id="galeria" padding="lg">
        <Container>
          <Stack gap={12}>
            <SectionTitle
              overline="Campus"
              title="Vida en el seminario"
              description="Espacios de oración, estudio y comunidad."
              align="center"
              className="mx-auto"
            />
            <InstitutionalGallery items={HOME_GALLERY} />
          </Stack>
        </Container>
      </Section>

      <Section id="testimonios" padding="lg" muted>
        <Container>
          <Stack gap={12}>
            <SectionTitle
              overline="Testimonios"
              title="Voces de nuestra comunidad"
              align="center"
              className="mx-auto"
            />
            <Grid cols={1} mdCols={3} gap={6}>
              {HOME_TESTIMONIALS.map((t) => (
                <TestimonialCard key={t.id} testimonial={t} />
              ))}
            </Grid>
          </Stack>
        </Container>
      </Section>

      <Section id="noticias" padding="lg">
        <Container>
          <Stack gap={12}>
            <SectionTitle
              overline="Actualidad"
              title="Noticias y eventos"
              description="Mantente informado sobre la vida institucional."
              align="center"
              className="mx-auto"
            />
            <Grid cols={1} mdCols={3} gap={6}>
              {HOME_NEWS.map((news) => (
                <NewsCard key={news.id} news={news} />
              ))}
            </Grid>
            <div className="text-center">
              <Button href="/noticias" variant="secondary">
                Ver todas las noticias
              </Button>
            </div>
          </Stack>
        </Container>
      </Section>

      <CTASection
        title="¿Sientes el llamado?"
        description="Descubre el proceso de admisión y da el primer paso en tu camino de formación."
        primaryLabel="Solicitar admisión"
        primaryHref="/admision"
        secondaryLabel="Contactar"
        secondaryHref="/contacto"
        variant="primary"
      />
    </>
  );
}
