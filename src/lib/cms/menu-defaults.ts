import { computeItemLevels } from "@/lib/cms/menu-utils";
import { isSemTenant } from "@/core/tenant/is-sem";
import type { CmsMenu, MenuItem } from "@/types/menu";

function item(
  partial: Pick<MenuItem, "id" | "title" | "slug"> &
    Partial<Omit<MenuItem, "id" | "title" | "slug">>
): MenuItem {
  return {
    url: "",
    type: "internal",
    icon: "circle",
    parent: null,
    order: 1,
    visible: true,
    active: true,
    target: "_self",
    nofollow: false,
    highlighted: false,
    badge: "",
    color: "",
    level: 0,
    ...partial,
  };
}

/** Árbol público SEM. Solo se usa si el tenant aún no tiene menú publicado. */
const MAIN_ITEMS: MenuItem[] = computeItemLevels([
  item({ id: "home", title: "Inicio", slug: "/", icon: "house", order: 1 }),
  item({ id: "el-sem", title: "El SEM", slug: "/el-sem", icon: "building", order: 2 }),
  item({
    id: "el-sem-quienes",
    title: "Quiénes somos",
    slug: "/el-sem/quienes-somos",
    parent: "el-sem",
    order: 1,
  }),
  item({
    id: "el-sem-historia",
    title: "Historia",
    slug: "/el-sem/historia",
    parent: "el-sem",
    order: 2,
  }),
  item({
    id: "el-sem-mision",
    title: "Misión, visión y propósito",
    slug: "/el-sem/mision-vision-proposito",
    parent: "el-sem",
    order: 3,
  }),
  item({
    id: "el-sem-directivos",
    title: "Nuestros directivos",
    slug: "/el-sem/directivos",
    parent: "el-sem",
    order: 4,
  }),
  item({
    id: "el-sem-academico",
    title: "Equipo académico",
    slug: "/el-sem/equipo-academico",
    parent: "el-sem",
    order: 5,
  }),
  item({
    id: "el-sem-ipn",
    title: "IPN Chile — Iglesia Pentecostal Nazareth",
    slug: "/el-sem/ipn-chile",
    parent: "el-sem",
    order: 6,
  }),
  item({ id: "formacion", title: "Formación", slug: "/formacion", icon: "book", order: 3 }),
  item({
    id: "formacion-teologica",
    title: "Educación Teológica",
    slug: "/formacion/educacion-teologica",
    parent: "formacion",
    order: 1,
  }),
  item({
    id: "formacion-cursos",
    title: "Cursos de Formación",
    slug: "/formacion/cursos",
    parent: "formacion",
    order: 2,
  }),
  item({
    id: "formacion-malla",
    title: "Malla / Plan de estudios",
    slug: "/formacion/malla",
    parent: "formacion",
    order: 3,
  }),
  item({
    id: "como-estudiamos",
    title: "Cómo estudiamos",
    slug: "/como-estudiamos",
    icon: "calendar",
    order: 4,
  }),
  item({ id: "admission", title: "Admisión", slug: "/admision", icon: "send", order: 5 }),
  item({
    id: "contact",
    title: "Contacto",
    slug: "/contacto",
    icon: "mail",
    order: 6,
    visible: false,
  }),
]);

const FOOTER_ITEMS: MenuItem[] = computeItemLevels([
  item({ id: "footer-sem", title: "El SEM", slug: "/el-sem", order: 1 }),
  item({
    id: "footer-quienes",
    title: "Quiénes somos",
    slug: "/el-sem/quienes-somos",
    order: 1,
    parent: "footer-sem",
  }),
  item({
    id: "footer-ipn",
    title: "IPN Chile",
    slug: "/el-sem/ipn-chile",
    order: 2,
    parent: "footer-sem",
  }),
  item({ id: "footer-formacion", title: "Formación", slug: "/formacion", order: 2 }),
  item({
    id: "footer-teologica",
    title: "Educación Teológica",
    slug: "/formacion/educacion-teologica",
    order: 1,
    parent: "footer-formacion",
  }),
  item({
    id: "footer-malla",
    title: "Malla",
    slug: "/formacion/malla",
    order: 2,
    parent: "footer-formacion",
  }),
  item({ id: "footer-admision", title: "Admisión", slug: "/admision", order: 3 }),
  item({
    id: "footer-2027",
    title: "Admisión 2027",
    slug: "/admision/2027",
    order: 1,
    parent: "footer-admision",
    highlighted: true,
  }),
  item({
    id: "footer-contact",
    title: "Contacto",
    slug: "/contacto",
    icon: "mail",
    order: 4,
    visible: false,
  }),
]);

const LEGAL_ITEMS: MenuItem[] = computeItemLevels([
  item({ id: "privacy", title: "Política de Privacidad", slug: "/privacidad", icon: "shield", order: 1 }),
  item({ id: "terms", title: "Términos de Uso", slug: "/terminos", icon: "file", order: 2 }),
  item({ id: "sitemap", title: "Mapa del Sitio", slug: "/sitemap", icon: "map", order: 3 }),
]);

const QUICK_LINK_ITEMS: MenuItem[] = computeItemLevels([
  item({
    id: "login",
    title: "Ingresar",
    slug: "/ingresar",
    icon: "log-in",
    order: 1,
  }),
  item({
    id: "apply",
    title: "Admisión 2027",
    slug: "/admision/2027",
    icon: "send",
    order: 2,
    highlighted: true,
  }),
]);

const MOBILE_ITEMS: MenuItem[] = [...MAIN_ITEMS];

/** Menús SEM (T001) — IPN / El Seminario. */
export const SEM_DEFAULT_MENUS: CmsMenu[] = [
  {
    _id: "main",
    name: "Menú Principal",
    location: "header",
    active: true,
    items: MAIN_ITEMS,
    createdAt: "",
    updatedAt: "",
  },
  {
    _id: "footer",
    name: "Menú Footer",
    location: "footer",
    active: true,
    items: FOOTER_ITEMS,
    createdAt: "",
    updatedAt: "",
  },
  {
    _id: "mobile",
    name: "Menú Mobile",
    location: "mobile",
    active: true,
    items: MOBILE_ITEMS,
    createdAt: "",
    updatedAt: "",
  },
  {
    _id: "legal",
    name: "Menú Legal",
    location: "legal",
    active: true,
    items: LEGAL_ITEMS,
    createdAt: "",
    updatedAt: "",
  },
  {
    _id: "quick-links",
    name: "Enlaces rápidos",
    location: "quick-links",
    active: true,
    items: QUICK_LINK_ITEMS,
    createdAt: "",
    updatedAt: "",
  },
];

/** @deprecated Usar SEM_DEFAULT_MENUS o getDefaultMenusForTenant */
export const DEFAULT_MENUS = SEM_DEFAULT_MENUS;

const PLATFORM_MAIN_ITEMS: MenuItem[] = computeItemLevels([
  item({ id: "home", title: "Inicio", slug: "/", icon: "house", order: 1 }),
  item({ id: "programs", title: "Programas", slug: "/programas", icon: "book", order: 2 }),
  item({ id: "news", title: "Noticias", slug: "/noticias", icon: "newspaper", order: 3 }),
  item({ id: "contact", title: "Contacto", slug: "/contacto", icon: "mail", order: 4 }),
]);

const PLATFORM_FOOTER_ITEMS: MenuItem[] = computeItemLevels([
  item({ id: "resources-group", title: "Recursos", slug: "#", order: 1 }),
  item({
    id: "news-footer",
    title: "Noticias",
    slug: "/noticias",
    icon: "newspaper",
    order: 1,
    parent: "resources-group",
  }),
  item({ id: "admission-group", title: "Admisión", slug: "#", order: 2 }),
  item({
    id: "apply-footer",
    title: "Postular",
    slug: "/admision",
    icon: "send",
    order: 1,
    parent: "admission-group",
    highlighted: true,
  }),
]);

const PLATFORM_QUICK_LINK_ITEMS: MenuItem[] = computeItemLevels([
  item({ id: "login", title: "Ingresar", slug: "/ingresar", icon: "log-in", order: 1 }),
  item({
    id: "apply",
    title: "Postular ahora",
    slug: "/admision",
    icon: "send",
    order: 2,
    highlighted: true,
  }),
]);

/** Menús neutros de plataforma — sin SEM/IPN. */
export const PLATFORM_DEFAULT_MENUS: CmsMenu[] = [
  {
    _id: "main",
    name: "Menú Principal",
    location: "header",
    active: true,
    items: PLATFORM_MAIN_ITEMS,
    createdAt: "",
    updatedAt: "",
  },
  {
    _id: "footer",
    name: "Menú Footer",
    location: "footer",
    active: true,
    items: PLATFORM_FOOTER_ITEMS,
    createdAt: "",
    updatedAt: "",
  },
  {
    _id: "mobile",
    name: "Menú Mobile",
    location: "mobile",
    active: true,
    items: PLATFORM_MAIN_ITEMS,
    createdAt: "",
    updatedAt: "",
  },
  {
    _id: "legal",
    name: "Menú Legal",
    location: "legal",
    active: true,
    items: LEGAL_ITEMS,
    createdAt: "",
    updatedAt: "",
  },
  {
    _id: "quick-links",
    name: "Enlaces rápidos",
    location: "quick-links",
    active: true,
    items: PLATFORM_QUICK_LINK_ITEMS,
    createdAt: "",
    updatedAt: "",
  },
];

export function getDefaultMenusForTenant(tenantId: string): CmsMenu[] {
  return isSemTenant(tenantId) ? SEM_DEFAULT_MENUS : PLATFORM_DEFAULT_MENUS;
}
