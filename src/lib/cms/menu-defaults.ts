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

const MAIN_ITEMS: MenuItem[] = computeItemLevels([
  item({ id: "home", title: "Inicio", slug: "/", icon: "house", order: 1 }),
  item({ id: "institution", title: "El SEM", slug: "/institucion", icon: "building", order: 2 }),
  item({ id: "study", title: "Cómo se estudia", slug: "/como-se-estudia", icon: "calendar", order: 3 }),
  item({ id: "curriculum", title: "Malla/Formación", slug: "/malla", icon: "book", order: 4 }),
  item({ id: "admission", title: "Admisión", slug: "/admision", icon: "send", order: 5 }),
  item({ id: "news", title: "Actualidad", slug: "/noticias", icon: "newspaper", order: 6 }),
]);

const FOOTER_ITEMS: MenuItem[] = computeItemLevels([
  item({ id: "resources-group", title: "Recursos", slug: "#", order: 1 }),
  item({
    id: "library-footer",
    title: "Biblioteca",
    slug: "/biblioteca",
    icon: "book-open",
    order: 1,
    parent: "resources-group",
  }),
  item({
    id: "news-footer",
    title: "Noticias",
    slug: "/noticias",
    icon: "newspaper",
    order: 2,
    parent: "resources-group",
  }),
  item({
    id: "events-footer",
    title: "Eventos",
    slug: "/eventos",
    icon: "calendar",
    order: 3,
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
  item({
    id: "scholarships-footer",
    title: "Becas",
    slug: "/admision#becas",
    icon: "award",
    order: 2,
    parent: "admission-group",
  }),
  item({
    id: "requirements-footer",
    title: "Requisitos",
    slug: "/admision#requisitos",
    icon: "clipboard-list",
    order: 3,
    parent: "admission-group",
  }),
  item({
    id: "faq-footer",
    title: "Preguntas frecuentes",
    slug: "/admision#faq",
    icon: "help-circle",
    order: 4,
    parent: "admission-group",
  }),
  item({
    id: "ipn-footer",
    title: "IPN Chile",
    slug: "/institucion",
    icon: "building",
    order: 5,
    parent: "admission-group",
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
    title: "Postular ahora",
    slug: "/admision",
    icon: "send",
    order: 2,
    highlighted: true,
  }),
  item({
    id: "study-quick",
    title: "Cómo se estudia",
    slug: "/como-se-estudia",
    icon: "calendar",
    order: 3,
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
