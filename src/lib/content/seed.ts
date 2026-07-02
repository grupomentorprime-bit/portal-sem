import "server-only";

import { colorDefaults } from "@/design/tokens/colors";
import { getDatabase } from "@/lib/mongodb";
import { revalidateContentCache } from "@/lib/content/cache";
import { DEMO_ACADEMIC_PROGRAMS } from "@/lib/portal/institutional-demo";
import type { CategoryItem, ContentDocument } from "@/types/content";
import type { ProgramItem } from "@/types/content";

const now = () => new Date().toISOString();

function baseDoc(
  id: string,
  tenant: string,
  partial: Partial<ContentDocument>
): ContentDocument {
  const ts = now();
  return {
    _id: id,
    tenant,
    title: "",
    slug: id,
    summary: "",
    content: "",
    image: "",
    status: "published",
    featured: false,
    categories: [],
    tags: [],
    seo: { title: "", description: "", keywords: [] },
    publishedAt: ts,
    expiresAt: "",
    createdAt: ts,
    updatedAt: ts,
    ...partial,
  };
}

function categoryDoc(
  id: string,
  tenant: string,
  partial: Partial<CategoryItem>
): CategoryItem {
  const ts = now();
  return {
    _id: id,
    tenant,
    name: "",
    slug: id,
    description: "",
    order: 0,
    enabled: true,
    createdAt: ts,
    updatedAt: ts,
    ...partial,
  };
}

function programToSeedDoc(
  program: ProgramItem,
  tenant: string,
  order: number
): ContentDocument {
  return baseDoc(program.id, tenant, {
    title: program.title,
    slug: program.id,
    summary: program.description,
    duration: program.duration,
    modality: program.modality,
    certification: program.certification,
    category: program.category,
    icon: program.icon,
    href: program.href,
    image: program.image ?? "",
    featured: program.featured ?? false,
    badge: program.badge,
    programStatus: program.status,
    fees: program.price,
    showPrice: program.showPrice,
    ctaPrimaryLabel: program.ctaPrimaryLabel,
    order,
  });
}

export async function seedContentCollections(
  tenant: string,
  options?: { revalidate?: boolean }
): Promise<{ seeded: string[] }> {
  const db = await getDatabase();
  const seeded: string[] = [];

  const programs: ContentDocument[] = DEMO_ACADEMIC_PROGRAMS.map((program, index) =>
    programToSeedDoc(program, tenant, index + 1)
  );

  const team: ContentDocument[] = [
    baseDoc("jose-gonzalez", tenant, {
      name: "Pastor José González",
      title: "Pastor José González",
      role: "Director Nacional",
      specialty: "Teología Pastoral",
      image: "/images/demo/team/jose-gonzalez.png",
      category: "team_leadership",
      order: 1,
      featured: true,
    }),
    baseDoc("hebert-cuevas", tenant, {
      name: "Hebert Cuevas",
      title: "Hebert Cuevas",
      role: "Sub-Director",
      specialty: "Sagrada Escritura",
      image: "/images/demo/team/hebert-cuevas.png",
      category: "team_leadership",
      order: 2,
      featured: true,
    }),
    baseDoc("carolina-cisterna", tenant, {
      name: "Carolina Cisterna",
      title: "Carolina Cisterna",
      role: "Coordinadora académica",
      specialty: "Teología Sistemática",
      image: "/images/demo/team/carolina-cisterna.png",
      category: "team_leadership",
      order: 3,
      featured: true,
    }),
    baseDoc("marco-sepulveda", tenant, {
      name: "Marco Sepúlveda",
      title: "Marco Sepúlveda",
      role: "Gestión y calidad",
      specialty: "Procesos institucionales",
      image: "/images/demo/team/marco-sepulveda.png",
      category: "team_technical",
      order: 4,
    }),
    baseDoc("alejandra-lara", tenant, {
      name: "Alejandra Lara",
      title: "Alejandra Lara",
      role: "Docente titular",
      specialty: "Historia de la Iglesia",
      image: "/images/gallery-4.svg",
      category: "team_teaching",
      order: 5,
    }),
  ];

  const people: ContentDocument[] = team.map((member) => {
    const isAuthority = member.category === "team_leadership";
    return {
      ...member,
      personRole: isAuthority ? "authority" : member.category === "team_technical" ? "staff" : "teacher",
      personStatus: member.featured ? "featured" : "active",
      summary: member.specialty
        ? `Formador con especialidad en ${member.specialty}.`
        : "",
      visible: true,
      slug: member._id,
      categories: member.category ? [member.category] : [],
    };
  });

  const news: ContentDocument[] = [
    baseDoc("inicio-semestre-2026", tenant, {
      title: "Inicio del semestre 2026",
      slug: "inicio-semestre-2026",
      summary:
        "Damos la bienvenida a la nueva promoción de seminaristas con una jornada de integración y oración.",
      excerpt:
        "Damos la bienvenida a la nueva promoción de seminaristas con una jornada de integración y oración.",
      category: "Institucional",
      categories: ["institucional"],
      image: "/images/gallery-1.svg",
      featured: true,
      publishedAt: "2026-03-15T00:00:00.000Z",
    }),
    baseDoc("jornada-presencial-julio", tenant, {
      title: "Jornada Presencial Julio",
      slug: "jornada-presencial-julio",
      summary:
        "Encuentro formativo presencial para toda la comunidad seminarista: clases, comunidad y eucaristía.",
      excerpt:
        "Encuentro formativo presencial para toda la comunidad seminarista: clases, comunidad y eucaristía.",
      category: "Eventos",
      categories: ["institucional"],
      image: "/images/gallery-2.svg",
      featured: true,
      publishedAt: "2026-07-10T00:00:00.000Z",
    }),
    baseDoc("apertura-proceso-admision", tenant, {
      title: "Apertura Proceso de Admisión",
      slug: "apertura-proceso-admision",
      summary:
        "Ya puedes postular a nuestros programas formativos. Conoce requisitos y fechas importantes.",
      excerpt:
        "Ya puedes postular a nuestros programas formativos. Conoce requisitos y fechas importantes.",
      category: "Admisión",
      categories: ["admision"],
      image: "/images/gallery-3.svg",
      featured: true,
      publishedAt: "2026-06-01T00:00:00.000Z",
    }),
  ];

  const events: ContentDocument[] = [
    baseDoc("misa-apertura", tenant, {
      title: "Misa de Apertura Académica",
      slug: "misa-apertura",
      location: "Capilla del Seminario",
      date: "20 Feb 2026",
      time: "10:00",
      publishedAt: "2026-02-20T00:00:00.000Z",
      featured: true,
    }),
    baseDoc("conferencia-laicado", tenant, {
      title: "Conferencia: Teología del Laicado",
      slug: "conferencia-laicado",
      location: "Auditorio IPN",
      date: "5 Mar 2026",
      time: "18:30",
      publishedAt: "2026-03-05T00:00:00.000Z",
    }),
    baseDoc("jornada-biblica", tenant, {
      title: "Jornada Bíblica Diocesana",
      slug: "jornada-biblica",
      location: "Online",
      date: "12 Abr 2026",
      time: "09:00",
      publishedAt: "2026-04-12T00:00:00.000Z",
    }),
  ];

  const academicAgenda: ContentDocument[] = [
    baseDoc("convocatoria-2026", tenant, {
      title: "Convocatoria de Admisión 2026",
      slug: "convocatoria-2026",
      summary: "Postulaciones abiertas para la promoción 2026 del SEM.",
      category: "convocatoria_admision",
      categories: ["convocatoria_admision"],
      startDate: "2026-01-15",
      endDate: "2026-03-31",
      color: colorDefaults.primary,
      featured: true,
      ctaPrimaryLabel: "Postular ahora",
      href: "/admision",
      visibleFrom: "2026-01-01",
      visibleUntil: "2026-03-31",
    }),
    baseDoc("inicio-clases-2026", tenant, {
      title: "Inicio de clases — Primer semestre",
      slug: "inicio-clases-2026",
      summary: "Bienvenida oficial y primera jornada académica de la promoción.",
      category: "inicio_clases",
      categories: ["inicio_clases"],
      startDate: "2026-03-10",
      color: colorDefaults.secondary,
      featured: true,
      ctaPrimaryLabel: "Ver calendario",
      href: "/agenda-academica",
    }),
    baseDoc("evaluaciones-junio", tenant, {
      title: "Evaluaciones presenciales",
      slug: "evaluaciones-junio",
      summary: "Semana de evaluaciones finales del primer semestre.",
      category: "evaluaciones_presenciales",
      categories: ["evaluaciones_presenciales"],
      startDate: "2026-06-15",
      endDate: "2026-06-20",
      color: colorDefaults.warning,
    }),
    baseDoc("graduacion-2026", tenant, {
      title: "Ceremonia de Graduación",
      slug: "graduacion-2026",
      summary: "Eucaristía y entrega de títulos a la promoción 2026.",
      category: "graduacion",
      categories: ["graduacion"],
      startDate: "2026-12-12",
      color: colorDefaults.primary,
      featured: true,
    }),
  ];

  const institutionalNotices: ContentDocument[] = [
    baseDoc("aviso-becas-2026", tenant, {
      title: "Convocatoria de becas académicas 2026",
      slug: "aviso-becas-2026",
      summary: "La Dirección informa sobre los requisitos y plazos para postular a becas de mérito.",
      content:
        "La Secretaría Académica abre la convocatoria de becas para estudiantes regulares. Consulta los requisitos en Secretaría o en el campus virtual.",
      category: "becas",
      categories: ["becas"],
      featured: true,
      priority: 10,
      publishedAt: "2026-01-20T10:00:00.000Z",
      ctaPrimaryLabel: "Ver requisitos",
      href: "/avisos/aviso-becas-2026",
    }),
    baseDoc("comunicado-direccion", tenant, {
      title: "Mensaje del Rector — Año académico 2026",
      slug: "comunicado-direccion",
      summary: "Saludo institucional y lineamientos pastorales para la comunidad seminarista.",
      content: "Queridos hermanos en Cristo, iniciamos un nuevo año académico con gratitud y esperanza...",
      category: "direccion",
      categories: ["direccion"],
      featured: true,
      priority: 8,
      publishedAt: "2026-01-10T09:00:00.000Z",
      ctaPrimaryLabel: "Leer comunicado",
    }),
    baseDoc("reglamento-interno", tenant, {
      title: "Actualización del Reglamento Interno",
      slug: "reglamento-interno",
      summary: "Nueva versión del reglamento académico y de convivencia seminarista.",
      category: "reglamentos",
      categories: ["reglamentos"],
      priority: 5,
      publishedAt: "2025-12-01T12:00:00.000Z",
      ctaPrimaryLabel: "Descargar PDF",
    }),
  ];

  const library: ContentDocument[] = [
    baseDoc("suma-teologica", tenant, {
      title: "Suma Teológica",
      slug: "suma-teologica",
      author: "Santo Tomás de Aquino",
      summary: "Obra fundamental de teología escolástica.",
      resourceType: "Libro",
      category: "Libro",
    }),
    baseDoc("confesiones", tenant, {
      title: "Confesiones",
      slug: "confesiones",
      author: "San Agustín",
      summary: "Autobiografía espiritual del Padre de la Iglesia.",
      resourceType: "Libro",
      category: "Libro",
    }),
    baseDoc("city-of-god", tenant, {
      title: "La Ciudad de Dios",
      slug: "city-of-god",
      author: "San Agustín",
      summary: "Tratado sobre la historia y el destino eterno.",
      resourceType: "Libro",
      category: "Libro",
    }),
    baseDoc("estudio-efesios", tenant, {
      title: "Estudio bíblico: Efesios",
      slug: "estudio-efesios",
      author: "Equipo SEM",
      summary: "Guía de estudio para grupos parroquiales.",
      resourceType: "Estudio Bíblico",
      category: "Estudio Bíblico",
    }),
  ];

  const testimonials: ContentDocument[] = [
    baseDoc("test-1", tenant, {
      quote:
        "El SEM me dio una base bíblica sólida y un acompañamiento pastoral que transformó mi ministerio.",
      author: "Diácono Juan Pérez",
      role: "Generación 2022",
      program: "Iglesia Metodista, Santiago",
      image: "/images/gallery-4.svg",
      order: 1,
    }),
    baseDoc("test-2", tenant, {
      quote:
        "Estudiar online no significó estudiar solo: la comunidad y los docentes estuvieron siempre presentes.",
      author: "P. Francisco López",
      role: "Generación 2020",
      program: "Diócesis de Valparaíso",
      image: "/images/gallery-4.svg",
      order: 2,
    }),
    baseDoc("test-3", tenant, {
      quote:
        "La formación del seminario me equipó para responder con excelencia a los desafíos de la Iglesia hoy.",
      author: "Diácono Marco Torres",
      role: "Generación 2023",
      program: "Iglesia Anglicana, Concepción",
      image: "/images/gallery-4.svg",
      order: 3,
    }),
    baseDoc("test-4", tenant, {
      quote:
        "Encontré claridad vocacional y herramientas prácticas para servir con mayor confianza.",
      author: "Hna. María Soto",
      role: "Generación 2024",
      program: "Comunidad Evangélica, La Serena",
      image: "/images/gallery-4.svg",
      order: 4,
    }),
  ];

  const gallery: ContentDocument[] = [
    baseDoc("gal-1", tenant, {
      title: "Capilla del seminario",
      src: "/images/gallery-1.svg",
      alt: "Capilla del seminario",
      order: 1,
    }),
    baseDoc("gal-2", tenant, {
      title: "Aula magna",
      src: "/images/gallery-2.svg",
      alt: "Aula magna",
      order: 2,
    }),
    baseDoc("gal-3", tenant, {
      title: "Biblioteca",
      src: "/images/gallery-3.svg",
      alt: "Biblioteca",
      order: 3,
    }),
    baseDoc("gal-4", tenant, {
      title: "Comunidad seminarista",
      src: "/images/gallery-4.svg",
      alt: "Comunidad seminarista",
      order: 4,
    }),
  ];

  const academyCategories: CategoryItem[] = [
    categoryDoc("academico", tenant, { name: "Académico", slug: "academico", order: 1 }),
    categoryDoc("pastoral", tenant, { name: "Pastoral", slug: "pastoral", order: 2 }),
  ];

  const newsCategories: CategoryItem[] = [
    categoryDoc("institucional", tenant, { name: "Institucional", slug: "institucional", order: 1 }),
    categoryDoc("admision", tenant, { name: "Admisión", slug: "admision", order: 2 }),
    categoryDoc("biblioteca-cat", tenant, { name: "Biblioteca", slug: "biblioteca", order: 3 }),
  ];

  const seeds: Array<{ collection: string; docs: ContentDocument[] }> = [
    { collection: "academy_programs", docs: programs },
    { collection: "academy_team", docs: team },
    { collection: "academy_teachers", docs: team },
    { collection: "content_people", docs: people },
    { collection: "content_news", docs: news },
    { collection: "content_events", docs: events },
    { collection: "content_academic_agenda", docs: academicAgenda },
    { collection: "content_institutional_notices", docs: institutionalNotices },
    { collection: "content_library", docs: library },
    { collection: "academy_testimonials", docs: testimonials },
    { collection: "academy_gallery", docs: gallery },
  ];

  for (const { collection, docs } of seeds) {
    const col = db.collection<ContentDocument>(collection);
    const count = await col.countDocuments({ tenant });
    if (count === 0) {
      await col.insertMany(docs);
      seeded.push(collection);
      if (options?.revalidate !== false) {
        revalidateContentCache(collection, tenant);
      }
    }
  }

  for (const cats of [
    { collection: "academy_categories", docs: academyCategories },
    { collection: "content_news_categories", docs: newsCategories },
  ]) {
    const col = db.collection<CategoryItem>(cats.collection);
    const count = await col.countDocuments({ tenant });
    if (count === 0) {
      await col.insertMany(cats.docs);
      seeded.push(cats.collection);
      if (options?.revalidate !== false) {
        revalidateContentCache(cats.collection, tenant);
      }
    }
  }

  return { seeded };
}
