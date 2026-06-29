import "server-only";

import { getDatabase } from "@/lib/mongodb";
import { revalidateContentCache } from "@/lib/content/cache";
import type { CategoryItem, ContentDocument } from "@/types/content";

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

export async function seedContentCollections(tenant: string): Promise<{ seeded: string[] }> {
  const db = await getDatabase();
  const seeded: string[] = [];

  const programs: ContentDocument[] = [
    baseDoc("filosofia", tenant, {
      title: "Filosofía",
      slug: "filosofia",
      summary: "Formación filosófica sólida como fundamento del pensamiento teológico y pastoral.",
      duration: "2 años",
      icon: "BookOpen",
      href: "/programas/filosofia",
      featured: true,
      order: 1,
    }),
    baseDoc("teologia", tenant, {
      title: "Teología",
      slug: "teologia",
      summary: "Estudio profundo de la revelación divina al servicio de la Iglesia y el ministerio.",
      duration: "4 años",
      icon: "GraduationCap",
      href: "/programas/teologia",
      featured: true,
      order: 2,
    }),
    baseDoc("pastoral", tenant, {
      title: "Formación Pastoral",
      slug: "pastoral",
      summary: "Preparación integral para el servicio diaconal, sacerdotal y la vida consagrada.",
      duration: "Continua",
      icon: "Heart",
      href: "/programas/pastoral",
      featured: true,
      order: 3,
    }),
  ];

  const team: ContentDocument[] = [
    baseDoc("rector", tenant, {
      name: "P. Dr. Miguel Ángel R.",
      title: "P. Dr. Miguel Ángel R.",
      role: "Rector",
      specialty: "Teología Dogmática",
      order: 1,
    }),
    baseDoc("decano", tenant, {
      name: "P. Lic. Carlos M.",
      title: "P. Lic. Carlos M.",
      role: "Decano Académico",
      specialty: "Filosofía",
      order: 2,
    }),
    baseDoc("prof-escriptura", tenant, {
      name: "P. Dr. Andrés V.",
      title: "P. Dr. Andrés V.",
      role: "Profesor",
      specialty: "Sagrada Escritura",
      order: 3,
    }),
    baseDoc("prof-espiritualidad", tenant, {
      name: "P. Lic. Roberto S.",
      title: "P. Lic. Roberto S.",
      role: "Profesor",
      specialty: "Espiritualidad",
      order: 4,
    }),
  ];

  const news: ContentDocument[] = [
    baseDoc("inicio-ano-academico", tenant, {
      title: "Inicio del año académico 2026",
      slug: "inicio-ano-academico",
      summary: "Bienvenida oficial a la nueva promoción de seminaristas.",
      excerpt: "Bienvenida oficial a la nueva promoción de seminaristas.",
      category: "Institucional",
      categories: ["institucional"],
      featured: true,
      publishedAt: "2026-01-15T00:00:00.000Z",
    }),
    baseDoc("jornada-admision", tenant, {
      title: "Jornada de Admisión abierta",
      slug: "jornada-admision",
      summary: "Conoce nuestros programas y requisitos de ingreso.",
      excerpt: "Conoce nuestros programas y requisitos de ingreso.",
      category: "Admisión",
      categories: ["admision"],
      featured: true,
      publishedAt: "2026-01-08T00:00:00.000Z",
    }),
    baseDoc("nueva-coleccion", tenant, {
      title: "Nueva colección en la biblioteca",
      slug: "nueva-coleccion",
      summary: "Más de 200 títulos de teología patrística disponibles.",
      excerpt: "Más de 200 títulos de teología patrística disponibles.",
      category: "Biblioteca",
      categories: ["biblioteca"],
      publishedAt: "2026-01-02T00:00:00.000Z",
    }),
  ];

  const events: ContentDocument[] = [
    baseDoc("misa-apertura", tenant, {
      title: "Misa de Apertura Académica",
      slug: "misa-apertura",
      location: "Capilla del Seminario",
      date: "20 Feb 2026",
      publishedAt: "2026-02-20T00:00:00.000Z",
      featured: true,
    }),
    baseDoc("conferencia-laicado", tenant, {
      title: "Conferencia: Teología del Laicado",
      slug: "conferencia-laicado",
      location: "Auditorio IPN",
      date: "5 Mar 2026",
      publishedAt: "2026-03-05T00:00:00.000Z",
    }),
  ];

  const library: ContentDocument[] = [
    baseDoc("suma-teologica", tenant, {
      title: "Suma Teológica",
      slug: "suma-teologica",
      author: "Santo Tomás de Aquino",
      summary: "Obra fundamental de teología escolástica.",
    }),
    baseDoc("confesiones", tenant, {
      title: "Confesiones",
      slug: "confesiones",
      author: "San Agustín",
      summary: "Autobiografía espiritual del Padre de la Iglesia.",
    }),
    baseDoc("city-of-god", tenant, {
      title: "La Ciudad de Dios",
      slug: "city-of-god",
      author: "San Agustín",
      summary: "Tratado sobre la historia y el destino eterno.",
    }),
  ];

  const testimonials: ContentDocument[] = [
    baseDoc("test-1", tenant, {
      quote:
        "El SEM formó mi vocación con rigor académico y profunda vida espiritual. Hoy sirvo a la Iglesia con convicción.",
      author: "Diácono Juan P.",
      role: "Promoción 2022",
      order: 1,
    }),
    baseDoc("test-2", tenant, {
      quote:
        "Encontré una comunidad de fe que me acompañó en el discernimiento y la preparación para el ministerio.",
      author: "P. Francisco L.",
      role: "Promoción 2020",
      order: 2,
    }),
    baseDoc("test-3", tenant, {
      quote:
        "La formación integral del seminario me equipó para responder con excelencia a los desafíos pastorales.",
      author: "Diácono Marco T.",
      role: "Promoción 2023",
      order: 3,
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
    { collection: "content_news", docs: news },
    { collection: "content_events", docs: events },
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
      revalidateContentCache(collection, tenant);
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
      revalidateContentCache(cats.collection, tenant);
    }
  }

  return { seeded };
}
