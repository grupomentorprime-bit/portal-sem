/**
 * Breadcrumbs automáticos para Shell V2 — derivados de la ruta sin tocar páginas.
 */

import type { BreadcrumbItem } from "@/components/ui/breadcrumb";
import { ADMIN_PRIMARY_NAV } from "@/lib/admin/institutional";
import { ADMIN_SIDEBAR_SUPPLEMENTAL, getAllNavTreeItems } from "@/lib/admin/nav-domains";

const ALL_NAV = [...ADMIN_PRIMARY_NAV, ...ADMIN_SIDEBAR_SUPPLEMENTAL, ...getAllNavTreeItems()];

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Dashboard",
  config: "Institución",
  pages: "Páginas",
  menus: "Menús",
  content: "Comunicaciones",
  media: "Medios",
  settings: "Administración",
  portal: "Portal",
  workflows: "Workflows",
  events: "Eventos",
  experience: "Experiencia",
  "experience-studio": "Experience Studio",
  "asuntos-estudiantiles": "Operación",
  convocatorias: "Formularios",
  configuracion: "Gestión",
  admission: "Admisión",
  forms: "Formularios",
  programs: "Programas",
  people: "Personas",
  news: "Noticias",
  library: "Biblioteca",
  users: "Usuarios",
  roles: "Permisos por rol",
  help: "Ayuda",
  aek: "Catálogo AEK",
  profile: "Perfil",
  security: "Seguridad",
  activity: "Actividad",
  integrations: "Integraciones",
  notifications: "Notificaciones",
};

function findNavMatch(pathname: string) {
  let best: (typeof ALL_NAV)[number] | null = null;
  let bestLen = 0;

  for (const item of ALL_NAV) {
    const prefixes = item.matchPrefixes ?? [item.href];
    for (const prefix of prefixes) {
      if (
        (pathname === prefix || pathname.startsWith(`${prefix}/`)) &&
        prefix.length > bestLen
      ) {
        best = item;
        bestLen = prefix.length;
      }
    }
  }

  return best;
}

/**
 * Genera migas para la ruta actual. En Fase 1 no sustituye headers de módulo.
 */
export function resolveAdminBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname === "/admin/login") return [];

  const items: BreadcrumbItem[] = [{ label: "Dashboard", href: "/admin" }];

  if (pathname === "/admin") {
    return [{ label: "Dashboard" }];
  }

  const navMatch = findNavMatch(pathname);
  if (navMatch && navMatch.href !== "/admin") {
    const navLabel =
      navMatch.href === "/admin" ? "Dashboard" : navMatch.label;
    if (!items.some((i) => i.label === navLabel)) {
      items.push({
        label: navLabel,
        href: navMatch.href === pathname ? undefined : navMatch.href,
      });
    }
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 2) {
    const tail = segments[segments.length - 1];
    const tailLabel = SEGMENT_LABELS[tail] ?? decodeURIComponent(tail);
    const parentHref = `/${segments.slice(0, -1).join("/")}`;
    const already = items.some((i) => i.label === tailLabel);
    const parentIsNav = navMatch?.href === pathname;

    if (!already && !parentIsNav) {
      if (items.length > 1 && items[items.length - 1].href === parentHref) {
        items[items.length - 1] = { ...items[items.length - 1], href: parentHref };
      }
      items.push({ label: tailLabel });
    } else if (!already && parentIsNav && tailLabel !== navMatch?.label) {
      items.push({ label: tailLabel });
    }
  } else if (navMatch && pathname === navMatch.href) {
    items[items.length - 1] = { label: navMatch.href === "/admin" ? "Dashboard" : navMatch.label };
  }

  return items;
}
