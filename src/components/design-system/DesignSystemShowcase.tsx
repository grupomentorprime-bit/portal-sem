"use client";

import { ComponentSpecPanel } from "@/components/design-system/ComponentSpecPanel";
import { getComponentSpec } from "@/components/design-system/component-specs";
import {
  Accordion,
  AccordionItem,
  Alert,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  CTA,
  Drawer,
  Dropdown,
  Footer,
  Hero,
  Input,
  Modal,
  Navbar,
  Pagination,
  RadioGroup,
  Select,
  Skeleton,
  Spinner,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
} from "@/components/ui";
import {
  CTASection,
  EventCard,
  NewsCard,
  ProgramCard,
  SectionTitle,
  TeacherCard,
  TestimonialCard,
  VerseBlock,
} from "@/components/institutional";
import { Container, Grid, Section, Spacer, Stack } from "@/components/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { PortalTimeline } from "@/components/portal/experience/timeline";
import type { PortalTimelineItem } from "@/types/timeline";
import { colors } from "@/design";
import {
  HOME_EVENTS,
  HOME_NEWS,
  HOME_PROGRAMS,
  HOME_TEACHERS,
  HOME_TESTIMONIALS,
  HOME_VERSE,
} from "@/lib/institutional/home-content";
import { cn } from "@/lib/utils";
import { Mail, Search } from "lucide-react";
import { useState } from "react";

const buttonVariants = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "danger",
  "success",
] as const;

const colorSwatches = [
  { name: "Primary", token: "--primary", value: colors.primary },
  { name: "Secondary", token: "--secondary", value: colors.secondary },
  { name: "Accent", token: "--accent", value: colors.accent },
  { name: "Success", token: "--success", value: colors.success },
  { name: "Light", token: "--light", value: colors.light },
  { name: "White", token: "--white", value: colors.white },
];

const graySwatches = Object.entries(colors.gray).map(([shade, value]) => ({
  name: `Gray ${shade}`,
  token: `--gray-${shade}`,
  value,
}));

const demoTimelineItems: PortalTimelineItem[] = [
  { id: "1", step: 1, title: "Solicitud", description: "Completa el formulario.", order: 0, status: "completed" },
  { id: "2", step: 2, title: "Revisión", description: "Evaluación documental.", order: 1, status: "active" },
  { id: "3", step: 3, title: "Entrevista", order: 2, status: "upcoming" },
  { id: "4", step: 4, title: "Admisión", order: 3, status: "pending" },
];

interface DesignSystemShowcaseProps {
  variant?: "internal" | "legacy";
}

export function DesignSystemShowcase({ variant = "internal" }: DesignSystemShowcaseProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [switchOn, setSwitchOn] = useState(true);
  const [radioValue, setRadioValue] = useState("a");
  const [page, setPage] = useState(1);

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        links={[
          { label: "Colores", href: "#colores" },
          { label: "Tipografía", href: "#tipografia" },
          { label: "Componentes", href: "#componentes" },
          { label: "Institucional", href: "#institucional" },
        ]}
        cta={{ label: "Volver al admin", href: "/admin/config" }}
      />

      <Hero
        subtitle="OT-BRANDING-005 · Experience Kit v1.0"
        title="Catálogo visual del Design System"
        description="Componentes, variantes, estados y tokens corporativos SEM. Documentación en docs/design/."
        primaryCta={{ label: "Explorar componentes", href: "#componentes" }}
        secondaryCta={{ label: "Guía de contribución", href: "#docs" }}
        align="center"
      />

      {variant === "internal" ? (
        <Section padding="sm">
          <Container size="md">
            <p className="rounded-lg border border-border bg-background-soft px-4 py-3 text-center text-sm text-muted">
              Ruta interna: <code className="font-mono text-foreground">/internal/design-system</code>
              {" · "}
              Checklist PR: <code className="font-mono text-foreground">docs/design/PULL_REQUEST_CHECKLIST.md</code>
            </p>
          </Container>
        </Section>
      ) : null}

      <Section id="colores" padding="lg">
        <Container>
          <SectionHeader title="Colores" description="Paleta oficial — sin colores inventados." />
          <Grid cols={2} mdCols={3} lgCols={6} gap={4} className="mt-8">
            {colorSwatches.map((swatch) => (
              <ColorSwatch key={swatch.name} {...swatch} />
            ))}
          </Grid>
          <Spacer size={8} />
          <Grid cols={3} mdCols={5} lgCols={10} gap={4}>
            {graySwatches.map((swatch) => (
              <ColorSwatch key={swatch.name} {...swatch} compact />
            ))}
          </Grid>
        </Container>
      </Section>

      <Section id="tipografia" padding="lg" muted>
        <Container>
          <SectionHeader title="Tipografía" description="Manrope como reemplazo temporal de Mosk." />
          <Stack gap={6} className="mt-8">
            <p className="text-5xl font-bold text-foreground">Heading 1 — Manrope Bold</p>
            <p className="text-4xl font-semibold text-foreground">Heading 2 — Semibold</p>
            <p className="text-2xl font-medium text-foreground">Heading 3 — Medium</p>
            <p className="text-base text-foreground">
              Body — Lorem ipsum dolor sit amet, consectetur adipiscing elit. Texto base para
              contenido institucional.
            </p>
            <p className="text-sm text-muted">Caption — Texto auxiliar y metadatos.</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
              Overline — Etiquetas de sección
            </p>
          </Stack>
        </Container>
      </Section>

      <Section id="componentes" padding="lg">
        <Container>
          <SectionHeader title="Componentes" description="Biblioteca completa de UI institucional." />

          <ShowcaseBlock title="Botones" specId="button">
            <Grid cols={2} mdCols={3} lgCols={6} gap={4}>
              {buttonVariants.map((variant) => (
                <Button key={variant} variant={variant}>
                  {variant}
                </Button>
              ))}
            </Grid>
            <Spacer size={4} />
            <Stack direction="horizontal" gap={4} className="flex-wrap">
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
            </Stack>
          </ShowcaseBlock>

          <ShowcaseBlock title="Cards" specId="card">
            <Grid cols={1} mdCols={2} lgCols={4} gap={4}>
              <Card variant="default">
                <CardHeader>
                  <CardTitle>Default</CardTitle>
                  <CardDescription>Card con borde estándar.</CardDescription>
                </CardHeader>
              </Card>
              <Card variant="outlined">
                <CardHeader>
                  <CardTitle>Outlined</CardTitle>
                  <CardDescription>Borde reforzado.</CardDescription>
                </CardHeader>
              </Card>
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Elevated</CardTitle>
                  <CardDescription>Sombra suave.</CardDescription>
                </CardHeader>
              </Card>
              <Card variant="interactive">
                <CardHeader>
                  <CardTitle>Interactive</CardTitle>
                  <CardDescription>Hover con elevación.</CardDescription>
                </CardHeader>
              </Card>
            </Grid>
          </ShowcaseBlock>

          <ShowcaseBlock title="Badges" specId="badge">
            <Stack direction="horizontal" gap={2} className="flex-wrap">
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="neutral">Neutral</Badge>
            </Stack>
          </ShowcaseBlock>

          <ShowcaseBlock title="Alertas / Toast" specId="alert">
            <Stack gap={4}>
              <Alert variant="info" title="Información">
                Mensaje informativo para el usuario.
              </Alert>
              <Alert variant="success" title="Éxito" role="status">
                Patrón toast: Alert con role=&quot;status&quot; hasta componente Toast v1.1.
              </Alert>
              <Alert variant="warning" title="Advertencia">
                Revise los datos antes de continuar.
              </Alert>
              <Alert variant="error" title="Error">
                No se pudo completar la acción solicitada.
              </Alert>
            </Stack>
          </ShowcaseBlock>

          <ShowcaseBlock title="Formularios" specId="input">
            <Grid cols={1} mdCols={2} gap={6}>
              <Input
                label="Correo electrónico"
                placeholder="nombre@sem.edu"
                helper="Usaremos este correo para contactarte."
                icon={Mail}
              />
              <Input
                label="Búsqueda"
                placeholder="Buscar…"
                icon={Search}
                loading
              />
              <Input
                label="Campo con error"
                error="Este campo es obligatorio."
                defaultValue=""
              />
              <Select
                label="Programa"
                placeholder="Seleccionar…"
                options={[
                  {
                    value: "diploma-teologia-biblica-pastoral-g2023",
                    label: "Diploma Teología Bíblica Pastoral — G-2023",
                  },
                  {
                    value: "diploma-teologia-biblica-pastores-g2024",
                    label: "Diploma Teología Bíblica — G-2024",
                  },
                ]}
              />
              <Textarea
                label="Mensaje"
                placeholder="Escribe tu mensaje…"
                helper="Máximo 500 caracteres."
              />
              <Stack gap={4}>
                <Checkbox label="Acepto los términos" description="He leído la política de privacidad." defaultChecked />
                <RadioGroup
                  name="demo-radio"
                  legend="Opciones"
                  value={radioValue}
                  onChange={setRadioValue}
                  options={[
                    { value: "a", label: "Opción A" },
                    { value: "b", label: "Opción B", description: "Descripción adicional." },
                  ]}
                />
                <Switch
                  label="Notificaciones"
                  description="Recibir alertas por correo."
                  checked={switchOn}
                  onChange={setSwitchOn}
                />
              </Stack>
            </Grid>
          </ShowcaseBlock>

          <ShowcaseBlock title="Tabs y Accordion" specId="tabs">
            <Grid cols={1} lgCols={2} gap={8}>
              <Tabs defaultValue="tab1">
                <TabsList>
                  <TabsTrigger value="tab1">General</TabsTrigger>
                  <TabsTrigger value="tab2">Detalles</TabsTrigger>
                  <TabsTrigger value="tab3">Historial</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1">Contenido de la pestaña General.</TabsContent>
                <TabsContent value="tab2">Contenido de la pestaña Detalles.</TabsContent>
                <TabsContent value="tab3">Contenido de la pestaña Historial.</TabsContent>
              </Tabs>
              <Accordion>
                <AccordionItem title="¿Qué es el SEM?" defaultOpen>
                  El Seminario Eclesiástico Mayor es una institución de formación eclesiástica.
                </AccordionItem>
                <AccordionItem title="¿Cómo me inscribo?">
                  Consulta la sección de admisiones en el portal institucional.
                </AccordionItem>
              </Accordion>
            </Grid>
          </ShowcaseBlock>

          <ShowcaseBlock title="Modal, Drawer y Dropdown" specId="modal">
            <Stack direction="horizontal" gap={4} className="flex-wrap">
              <Button onClick={() => setModalOpen(true)}>Abrir Modal</Button>
              <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
                Abrir Drawer
              </Button>
              <Dropdown
                trigger={<Button variant="outline">Dropdown</Button>}
                items={[
                  { label: "Editar", onClick: () => {} },
                  { label: "Duplicar", onClick: () => {} },
                  { label: "Eliminar", onClick: () => {}, disabled: true },
                ]}
              />
              <Tooltip content="Información adicional">
                <Button variant="ghost">Tooltip</Button>
              </Tooltip>
            </Stack>
            <Modal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Modal de ejemplo"
              description="Diálogo modal accesible con foco gestionado."
            >
              <p className="text-sm text-muted">
                Este modal utiliza el elemento nativo dialog con estilos institucionales.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setModalOpen(false)}>Confirmar</Button>
              </div>
            </Modal>
            <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Panel lateral">
              <p className="text-sm text-muted">Contenido del drawer para navegación o formularios.</p>
            </Drawer>
          </ShowcaseBlock>

          <ShowcaseBlock title="Navegación">
            <Stack gap={6}>
              <Breadcrumb
                items={[
                  { label: "Inicio", href: "/" },
                  { label: "Admin", href: "/admin/config" },
                  { label: "Design System" },
                ]}
              />
              <Pagination currentPage={page} totalPages={5} onPageChange={setPage} />
            </Stack>
          </ShowcaseBlock>

          <ShowcaseBlock title="Avatar, Spinner y Skeleton" specId="skeleton">
            <Stack direction="horizontal" gap={6} align="center" className="flex-wrap">
              <Avatar name="Juan Pérez" size="sm" />
              <Avatar name="María García" size="md" />
              <Avatar name="Carlos López" size="lg" />
              <Spinner size="md" />
              <div className="w-48 space-y-2">
                <Skeleton variant="text" />
                <Skeleton className="h-20" />
              </div>
            </Stack>
          </ShowcaseBlock>

          <ShowcaseBlock title="Hero" specId="hero">
            <Hero
              subtitle="Ejemplo"
              title="Cabecera de página"
              description="Variante de demostración con CTAs."
              primaryCta={{ label: "Primario", href: "#" }}
              secondaryCta={{ label: "Secundario", href: "#" }}
              align="left"
            />
          </ShowcaseBlock>

          <ShowcaseBlock title="Footer" specId="footer">
            <Footer
              columns={[
                {
                  title: "Enlaces",
                  links: [
                    { label: "Programas", href: "/programas" },
                    { label: "Contacto", href: "/contacto" },
                  ],
                },
              ]}
              copyright="© Ejemplo SEM"
            />
          </ShowcaseBlock>

          <ShowcaseBlock title="CTA" specId="cta">
            <CTA
              title="¿Listo para formarte?"
              description="Descubre nuestros programas de formación eclesiástica."
              primaryLabel="Ver programas"
              primaryHref="/programas"
              secondaryLabel="Contactar"
              secondaryHref="/contacto"
              variant="accent"
            />
          </ShowcaseBlock>

          <ShowcaseBlock title="Empty State" specId="empty-state">
            <PortalEmptyState
              title="Sin contenido disponible"
              description="Ejemplo de estado vacío para listados CMS y portal."
              actionLabel="Ir al CMS"
              actionHref="/admin/config"
            />
          </ShowcaseBlock>

          <ShowcaseBlock title="Timeline" specId="timeline">
            <PortalTimeline
              id="ds-timeline"
              settings={{
                title: "Proceso de admisión",
                description: "Ejemplo de línea de tiempo con estados corporativos.",
                layout: "auto",
                variant: "process",
              }}
              items={demoTimelineItems}
            />
          </ShowcaseBlock>

          <ShowcaseBlock title="Table (patrón v1.0)" specId="table">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-background-muted text-left text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Programa</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  <tr className="hover:bg-background-soft">
                    <td className="px-4 py-3 text-foreground">Teología Bíblica</td>
                    <td className="px-4 py-3">
                      <Badge variant="success">Activo</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost">
                        Editar
                      </Button>
                    </td>
                  </tr>
                  <tr className="hover:bg-background-soft">
                    <td className="px-4 py-3 text-foreground">Pastoral</td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral">Borrador</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost">
                        Editar
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-muted">
              Componente Table formal planificado para v1.1. Usar este patrón con tokens hasta entonces.
            </p>
          </ShowcaseBlock>
        </Container>
      </Section>

      <Section id="institucional" padding="lg" muted>
        <Container>
          <SectionHeader
            title="Componentes institucionales"
            description="OT-SEM-DESIGN-002 — Identidad visual del portal SEM."
          />

          <ShowcaseBlock title="SectionTitle y VerseBlock">
            <Grid cols={1} lgCols={2} gap={8}>
              <SectionTitle
                overline="Presentación"
                title="Formación al servicio de la Iglesia"
                description="Ejemplo de título de sección institucional."
              />
              <VerseBlock text={HOME_VERSE.text} reference={HOME_VERSE.reference} />
            </Grid>
          </ShowcaseBlock>

          <ShowcaseBlock title="ProgramCard">
            <Grid cols={1} mdCols={3} gap={6}>
              {HOME_PROGRAMS.map((p) => (
                <ProgramCard key={p.id} program={p} />
              ))}
            </Grid>
          </ShowcaseBlock>

          <ShowcaseBlock title="TeacherCard y TestimonialCard">
            <Grid cols={1} mdCols={2} lgCols={4} gap={6}>
              {HOME_TEACHERS.slice(0, 2).map((t) => (
                <TeacherCard key={t.id} teacher={t} />
              ))}
            </Grid>
            <Spacer size={6} />
            <Grid cols={1} mdCols={2} gap={6}>
              {HOME_TESTIMONIALS.slice(0, 2).map((t) => (
                <TestimonialCard key={t.id} testimonial={t} />
              ))}
            </Grid>
          </ShowcaseBlock>

          <ShowcaseBlock title="NewsCard y EventCard">
            <Grid cols={1} mdCols={3} gap={6}>
              {HOME_NEWS.map((n) => (
                <NewsCard key={n.id} news={n} />
              ))}
            </Grid>
            <Spacer size={6} />
            <Grid cols={1} mdCols={2} gap={6}>
              {HOME_EVENTS.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </Grid>
          </ShowcaseBlock>

          <ShowcaseBlock title="CTASection institucional">
            <CTASection
              title="¿Sientes el llamado?"
              description="Componente CTA para secciones del portal institucional."
              primaryLabel="Solicitar admisión"
              primaryHref="/admision"
              variant="primary"
            />
          </ShowcaseBlock>

          <div className="mt-8 text-center">
            <Button href="/" variant="secondary">
              Ver Home institucional completa
            </Button>
          </div>
        </Container>
      </Section>

        <Section id="docs" padding="md" muted>
        <Container size="md">
          <SectionHeader
            title="Documentación y gobernanza"
            description="Experience Kit v1.0 — OT-BRANDING-005"
          />
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Documentos obligatorios</CardTitle>
              <CardDescription>Consultar antes de crear UI nueva.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-2 text-sm text-muted">
                <li><code className="text-foreground">docs/design/INTRODUCTION.md</code> — arquitectura multi-tenant</li>
                <li><code className="text-foreground">docs/design/COMPONENTS.md</code> — catálogo y especificaciones</li>
                <li><code className="text-foreground">docs/design/CONTRIBUTING.md</code> — flujo de nuevos componentes</li>
                <li><code className="text-foreground">docs/design/PULL_REQUEST_CHECKLIST.md</code> — checklist PR</li>
                <li><code className="text-foreground">docs/design/VISUAL_QA.md</code> — procedimiento QA visual</li>
                <li><code className="text-foreground">docs/design/VERSIONING.md</code> — política de evolución</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button href="/admin/config" variant="outline">
                Volver al CMS
              </Button>
            </CardFooter>
          </Card>
        </Container>
      </Section>

      <Footer
        columns={[
          {
            title: "Design System",
            links: [
              { label: "Colores", href: "#colores" },
              { label: "Tipografía", href: "#tipografia" },
              { label: "Componentes", href: "#componentes" },
            ],
          },
        ]}
        copyright="© Seminario Eclesiástico Mayor — Design System v1.0"
      />
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-3xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 text-muted">{description}</p>
    </div>
  );
}

function ShowcaseBlock({
  title,
  specId,
  children,
}: {
  title: string;
  specId?: string;
  children: React.ReactNode;
}) {
  const spec = specId ? getComponentSpec(specId) : undefined;

  return (
    <div className="mt-12 border-t border-border pt-12 first:mt-8 first:border-t-0 first:pt-0">
      <h3 className="mb-6 text-xl font-semibold text-foreground">{title}</h3>
      {children}
      {spec ? <ComponentSpecPanel spec={spec} /> : null}
    </div>
  );
}

function ColorSwatch({
  name,
  token,
  value,
  compact,
}: {
  name: string;
  token: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={cn(
          "mx-auto rounded-[var(--radius-md)] border border-border shadow-[var(--shadow-sm)]",
          compact ? "h-10 w-full" : "h-16 w-full"
        )}
        style={{ backgroundColor: value }}
      />
      <p className="mt-2 text-xs font-medium text-foreground">{name}</p>
      {!compact && (
        <>
          <p className="font-mono text-xs text-muted">{value}</p>
          <p className="font-mono text-xs text-muted">{token}</p>
        </>
      )}
    </div>
  );
}
