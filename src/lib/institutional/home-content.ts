import {
  BookOpen,
  Calendar,
  GraduationCap,
  Monitor,
  Users,
  type LucideIcon,
} from "lucide-react";

export const INSTITUTIONAL_MOTTO =
  "Equipando a los santos para la obra del ministerio";

export const DEFAULT_NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Programas", href: "/programas" },
  { label: "Admisión", href: "/admision" },
  { label: "Biblioteca", href: "/biblioteca" },
  { label: "Noticias", href: "/noticias" },
  { label: "Contacto", href: "/contacto" },
] as const;

export const INSTITUTIONAL_IMAGES = {
  hero: "/images/hero-institutional.svg",
  logoSem: "/images/logo-sem.svg",
  logoIpn: "/images/logo-ipn.svg",
} as const;

export interface ProgramItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: LucideIcon;
  href: string;
}

export interface TeacherItem {
  id: string;
  name: string;
  role: string;
  specialty: string;
  image?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  href: string;
  image?: string;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  href: string;
}

export interface StatItem {
  id: string;
  value: string;
  label: string;
}

export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
}

export const HOME_PROGRAMS: ProgramItem[] = [
  {
    id: "diploma-teologia-biblica-pastoral-g2023",
    title: "Diploma en Teología Bíblica Pastoral",
    description:
      "Formación bíblica y pastoral exclusiva para pastores y pastoras.",
    duration: "3 años",
    icon: BookOpen,
    href: "/programas/diploma-teologia-biblica-pastoral-g2023",
  },
  {
    id: "diploma-teologia-biblica-pastores-g2024",
    title: "Diploma en Teología Bíblica",
    description:
      "Formación bíblica integral para pastores y líderes comprometidos con el servicio cristiano.",
    duration: "4 años",
    icon: Users,
    href: "/programas/diploma-teologia-biblica-pastores-g2024",
  },
  {
    id: "diploma-teologia-biblica-hermanos-g2025",
    title: "Diploma en Teología Bíblica",
    description:
      "Formación bíblica de cuatro años orientada a hermanos(as) y líderes.",
    duration: "4 años",
    icon: GraduationCap,
    href: "/programas/diploma-teologia-biblica-hermanos-g2025",
  },
  {
    id: "diploma-teologia-biblica-hermanos-g2026",
    title: "Diploma en Teología Bíblica",
    description:
      "Programa académico de ingreso para hermanos(as) y líderes en modalidad online.",
    duration: "4 años",
    icon: Monitor,
    href: "/programas/diploma-teologia-biblica-hermanos-g2026",
  },
];

export const HOME_TEACHERS: TeacherItem[] = [
  {
    id: "1",
    name: "P. Dr. Miguel Ángel R.",
    role: "Rector",
    specialty: "Teología Dogmática",
  },
  {
    id: "2",
    name: "P. Lic. Carlos M.",
    role: "Decano Académico",
    specialty: "Filosofía",
  },
  {
    id: "3",
    name: "P. Dr. Andrés V.",
    role: "Profesor",
    specialty: "Sagrada Escritura",
  },
  {
    id: "4",
    name: "P. Lic. Roberto S.",
    role: "Profesor",
    specialty: "Espiritualidad",
  },
];

export const HOME_TESTIMONIALS: TestimonialItem[] = [
  {
    id: "1",
    quote:
      "El SEM formó mi vocación con rigor académico y profunda vida espiritual. Hoy sirvo a la Iglesia con convicción.",
    author: "Diácono Juan P.",
    role: "Promoción 2022",
  },
  {
    id: "2",
    quote:
      "Encontré una comunidad de fe que me acompañó en el discernimiento y la preparación para el ministerio.",
    author: "P. Francisco L.",
    role: "Promoción 2020",
  },
  {
    id: "3",
    quote:
      "La formación integral del seminario me equipó para responder con excelencia a los desafíos pastorales.",
    author: "Diácono Marco T.",
    role: "Promoción 2023",
  },
];

export const HOME_NEWS: NewsItem[] = [
  {
    id: "1",
    title: "Inicio del año académico 2026",
    excerpt: "Bienvenida oficial a la nueva promoción de seminaristas.",
    date: "15 Ene 2026",
    category: "Institucional",
    href: "/noticias/inicio-ano-academico",
  },
  {
    id: "2",
    title: "Jornada de Admisión abierta",
    excerpt: "Conoce nuestros programas y requisitos de ingreso.",
    date: "8 Ene 2026",
    category: "Admisión",
    href: "/noticias/jornada-admision",
  },
  {
    id: "3",
    title: "Nueva colección en la biblioteca",
    excerpt: "Más de 200 títulos de teología patrística disponibles.",
    date: "2 Ene 2026",
    category: "Biblioteca",
    href: "/noticias/nueva-coleccion",
  },
];

export const HOME_EVENTS: EventItem[] = [
  {
    id: "1",
    title: "Misa de Apertura Académica",
    date: "20 Feb 2026",
    location: "Capilla del Seminario",
    href: "/eventos/misa-apertura",
  },
  {
    id: "2",
    title: "Conferencia: Teología del Laicado",
    date: "5 Mar 2026",
    location: "Auditorio IPN",
    href: "/eventos/conferencia-laicado",
  },
];

export const HOME_STATS: StatItem[] = [
  { id: "1", value: "45+", label: "Años de historia" },
  { id: "2", value: "500+", label: "Egresados" },
  { id: "3", value: "30+", label: "Profesores" },
  { id: "4", value: "3", label: "Programas académicos" },
];

export const HOME_GALLERY: GalleryItem[] = [
  { id: "1", src: "/images/gallery-1.svg", alt: "Capilla del seminario" },
  { id: "2", src: "/images/gallery-2.svg", alt: "Aula magna" },
  { id: "3", src: "/images/gallery-3.svg", alt: "Biblioteca" },
  { id: "4", src: "/images/gallery-4.svg", alt: "Comunidad seminarista" },
];

export const HOME_VERSE = {
  text: "Y él mismo constituyó a algunos en apóstoles, a otros en profetas, a otros en evangelistas, a otros en pastores y maestros, para equipar a los santos para la obra del ministerio.",
  reference: "Efesios 4:11-12",
};

export const WHY_STUDY_POINTS = [
  {
    title: "Formación integral",
    description:
      "Desarrollo humano, espiritual, intelectual y pastoral en comunidad.",
  },
  {
    title: "Excelencia académica",
    description:
      "Programas rigurosos avalados por el Instituto Patrístico Nacional.",
  },
  {
    title: "Vida comunitaria",
    description:
      "Oración, estudio y fraternidad en un ambiente de discernimiento vocacional.",
  },
  {
    title: "Servicio a la Iglesia",
    description:
      "Preparación para el ministerio ordenado y la misión evangelizadora.",
  },
];

export { Calendar };
