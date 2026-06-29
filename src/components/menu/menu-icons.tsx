import { MENU_ITEM_TYPES } from "@/types/menu";

export const MENU_ICONS = [
  { id: "house", label: "Inicio" },
  { id: "book", label: "Libro" },
  { id: "users", label: "Usuarios" },
  { id: "newspaper", label: "Noticias" },
  { id: "library", label: "Biblioteca" },
  { id: "mail", label: "Correo" },
  { id: "phone", label: "Teléfono" },
  { id: "calendar", label: "Calendario" },
  { id: "cart", label: "Tienda" },
  { id: "graduation", label: "Académico" },
  { id: "shield", label: "Seguridad" },
  { id: "file", label: "Documento" },
  { id: "link", label: "Enlace" },
  { id: "circle", label: "Genérico" },
] as const;

export const MENU_TYPE_LABELS: Record<(typeof MENU_ITEM_TYPES)[number], string> = {
  internal: "Interno",
  external: "Externo",
  cms_page: "Página CMS",
  program: "Programa",
  category: "Categoría",
  news: "Noticia",
  blog: "Blog",
  event: "Evento",
};

export function MenuIcon({ name, className }: { name: string; className?: string }) {
  const iconClass = className ?? "h-4 w-4";

  switch (name) {
    case "house":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V20h14V9.5" />
        </svg>
      );
    case "book":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 0 4 23.5Z" />
          <path d="M4 5.5A2.5 2.5 0 0 0 6.5 8H20" />
        </svg>
      );
    case "users":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="8" r="3" />
          <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M15 20c.3-2.2 2.4-4 5-4" />
        </svg>
      );
    case "newspaper":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 8h10M7 12h10M7 16h6" />
        </svg>
      );
    case "library":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 5h6v14H4zM10 5h6v14h-6zM16 5h4v14h-4z" />
        </svg>
      );
    case "mail":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}
