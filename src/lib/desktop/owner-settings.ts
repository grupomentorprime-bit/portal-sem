import { NELZURI_NAME } from "@/lib/desktop/nelzuri";
import {
  PLATFORM_LEGAL_ROUTES,
  PLATFORM_OPERATOR_NAME,
  PLATFORM_SUPPORT_EMAIL,
} from "@/core/legal/platform/constants";
import {
  MENTOR_APPS,
  isMentorAppId,
  mentorAppBlurb,
  mentorAppLabel,
  type MentorAppId,
} from "@/lib/desktop/catalog";

/** Igual que la cookie de sesión en `setSessionCookie`. */
export const OWNER_SESSION_DAYS = 30;

export const OWNER_SECTIONS = [
  {
    id: "cuentas",
    label: "Cuentas",
    subtitle: "Quién administra la plataforma. Estas cuentas no pertenecen a un cliente.",
  },
  {
    id: "cuenta",
    label: "Tu cuenta",
    subtitle: "La persona que está adentro.",
  },
  {
    id: "plataforma",
    label: "Plataforma",
    subtitle: "El nombre y quién opera Growth OS.",
  },
  {
    id: "direccion",
    label: "Dirección",
    subtitle: "Dónde queda cada cliente nuevo.",
  },
  {
    id: "productos",
    label: "Productos",
    subtitle: "Qué puede traer un cliente.",
  },
  {
    id: "atencion",
    label: "Atención al Cliente",
    subtitle: "Áreas de los casos y qué ejecutivo atiende cada una.",
  },
  {
    id: "seguridad",
    label: "Seguridad",
    subtitle: "La sesión del dueño y la regla del último dueño.",
  },
  {
    id: "legales",
    label: "Legales",
    subtitle: "Documentos públicos de la plataforma.",
  },
  {
    id: "actividad",
    label: "Actividad",
    subtitle: "Quién creó un cliente, entró a uno o cambió un contrato.",
  },
] as const;

export type OwnerSectionId = (typeof OWNER_SECTIONS)[number]["id"];

export const OWNER_PLATFORM = {
  name: NELZURI_NAME,
  operator: PLATFORM_OPERATOR_NAME,
  support: PLATFORM_SUPPORT_EMAIL,
} as const;

export const OWNER_LEGAL = [
  {
    href: PLATFORM_LEGAL_ROUTES.privacy,
    label: "Privacidad",
    text: "Qué información trata la plataforma, aparte de la de cada cliente.",
  },
  {
    href: PLATFORM_LEGAL_ROUTES.terms,
    label: "Términos",
    text: "Condiciones de uso, cuentas y canales.",
  },
  {
    href: PLATFORM_LEGAL_ROUTES.dataDeletion,
    label: "Eliminación de datos",
    text: "Cómo se pide borrar datos de la plataforma.",
  },
] as const;

export function platformAddress(baseDomain: string | null | undefined): {
  host: string;
  detail: string;
} {
  const host = baseDomain?.trim() ?? "";
  if (!host) {
    return {
      host: "nombre.localhost",
      detail: "Así queda un cliente nuevo en este equipo. El dominio propio se cambia en su ficha.",
    };
  }
  return {
    host: `nombre.${host}`,
    detail: "Así queda un cliente nuevo. El dominio propio se cambia en su ficha.",
  };
}

export function clientIdFromActivity(input: {
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown> | null;
}): string {
  const fromMeta = textOf(input.metadata, "tenantId");
  if (fromMeta) return fromMeta;
  if (input.entity === "tenant") return input.entityId?.trim() ?? "";
  return "";
}

export type OwnerActivityKind =
  | "create"
  | "remove"
  | "status"
  | "address"
  | "enter"
  | "products"
  | "account"
  | "security"
  | "other";

export function activityKind(action: string): OwnerActivityKind {
  if (action === "platform.space.create") return "create";
  if (action === "platform.space.delete") return "remove";
  if (action === "platform.space.status") return "status";
  if (action === "platform.space.domain") return "address";
  if (action === "platform.space.access.grant") return "enter";
  if (action === "platform.space.contract") return "products";
  if (action.startsWith("platform.user.")) return "account";
  if (action.startsWith("platform.role.") || action === "platform.access.denied") return "security";
  return "other";
}

export function ownerProducts(): { id: MentorAppId; label: string; text: string }[] {
  return MENTOR_APPS.map((id) => {
    if (id === "growth-os") {
      return {
        id,
        label: mentorAppLabel(id),
        text: "Entra en un cliente nuevo. Captación y conversión.",
      };
    }
    if (id === "cumple") {
      return {
        id,
        label: mentorAppLabel(id),
        text: "El cliente Cumple también lo trae. En los demás se activa en su ficha.",
      };
    }
    return {
      id,
      label: mentorAppLabel(id),
      text: `${mentorAppBlurb(id)} Se activa en la ficha del cliente.`,
    };
  });
}

export function ownerSecurity(activeOwners: number | null): { label: string; text: string }[] {
  let owners = "Siempre queda al menos un dueño activo.";
  if (activeOwners === 0) {
    owners = "No hay un dueño activo. La plataforma necesita uno.";
  } else if (activeOwners === 1) {
    owners = "Hay un dueño activo. No se puede suspender ni pasar a operador.";
  } else if (activeOwners != null) {
    owners = `Hay ${activeOwners} dueños activos. Siempre tiene que quedar uno.`;
  }
  return [
    {
      label: "Sesión",
      text: `Quien entra como dueño sigue adentro ${OWNER_SESSION_DAYS} días, o hasta que sale.`,
    },
    { label: "Último dueño", text: owners },
  ];
}

export function formatOwnerWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "America/Santiago",
  }).format(date);
}

function textOf(metadata: Record<string, unknown> | null | undefined, key: string): string {
  const value = metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function clientPhrase(name: string, withName: string, withoutName: string): string {
  return name ? withName : withoutName;
}

export function platformActivityLine(input: {
  action: string;
  metadata?: Record<string, unknown> | null;
}): string {
  const metadata = input.metadata ?? null;
  const name = textOf(metadata, "name") || textOf(metadata, "slug");
  const email = textOf(metadata, "email");

  switch (input.action) {
    case "platform.space.create":
      return clientPhrase(name, `Creó el cliente ${name}.`, "Creó un cliente.");
    case "platform.space.delete":
      return clientPhrase(name, `Eliminó el cliente ${name}.`, "Eliminó un cliente.");
    case "platform.space.status":
      return statusLine(name, textOf(metadata, "to"));
    case "platform.space.domain":
      return domainLine(name, metadata);
    case "platform.space.access.grant":
      return clientPhrase(name, `Entró al cliente ${name}.`, "Entró a un cliente.");
    case "platform.space.contract":
      return contractLine(name, metadata);
    case "platform.user.create":
      return email ? `Creó la cuenta ${email}.` : "Creó una cuenta.";
    case "platform.user.resend":
      return email ? `Renovó el acceso de ${email}.` : "Renovó el acceso de una cuenta.";
    case "platform.user.update":
      return email ? `Editó la cuenta ${email}.` : "Editó una cuenta.";
    case "platform.user.suspend":
      return email ? `Suspendió la cuenta ${email}.` : "Suspendió una cuenta.";
    case "platform.user.activate":
      return email ? `Activó la cuenta ${email}.` : "Activó una cuenta.";
    case "platform.user.delete":
      return email ? `Eliminó la cuenta ${email}.` : "Eliminó una cuenta.";
    case "platform.role.grant":
      return "Cambió un perfil de la plataforma.";
    case "platform.role.revoke":
      return "Quitó un perfil de la plataforma.";
    case "platform.access.denied":
      return "Se negó una entrada a la plataforma.";
    default:
      return "Movió algo en la plataforma.";
  }
}

function statusLine(name: string, to: string): string {
  if (to === "suspended") return clientPhrase(name, `Suspendió el cliente ${name}.`, "Suspendió un cliente.");
  if (to === "archived") return clientPhrase(name, `Archivó el cliente ${name}.`, "Archivó un cliente.");
  if (to === "inactive") return clientPhrase(name, `Dejó inactivo el cliente ${name}.`, "Dejó inactivo un cliente.");
  if (to === "active") return clientPhrase(name, `Activó el cliente ${name}.`, "Activó un cliente.");
  return clientPhrase(name, `Cambió el estado del cliente ${name}.`, "Cambió el estado de un cliente.");
}

function domainLine(name: string, metadata: Record<string, unknown> | null): string {
  const custom = textOf(metadata, "customDomain");
  const subdomain = textOf(metadata, "subdomain");
  if (custom) {
    return name ? `Puso el dominio propio de ${name} en ${custom}.` : `Puso un dominio propio en ${custom}.`;
  }
  if (subdomain) {
    return name ? `Dejó a ${name} en ${subdomain}.` : `Dejó un cliente en ${subdomain}.`;
  }
  return clientPhrase(name, `Cambió la dirección de ${name}.`, "Cambió la dirección de un cliente.");
}

function contractLine(name: string, metadata: Record<string, unknown> | null): string {
  const appsChanged = metadata?.appsChanged === true;
  const entryChanged = metadata?.entryChanged === true;
  const apps = Array.isArray(metadata?.contractedApps)
    ? metadata.contractedApps.filter((id): id is MentorAppId => typeof id === "string" && isMentorAppId(id))
    : [];
  const labels = apps.map((id) => mentorAppLabel(id));
  if (appsChanged) {
    const list = labels.length > 0 ? labels.join(", ") : "ninguno";
    return name
      ? `Cambió los productos de ${name}: ${list}.`
      : `Cambió los productos de un cliente: ${list}.`;
  }
  if (entryChanged) {
    return name
      ? `Cambió la entrada de Aprende Hoy en ${name}.`
      : "Cambió la entrada de Aprende Hoy de un cliente.";
  }
  return clientPhrase(name, `Cambió el contrato de ${name}.`, "Cambió el contrato de un cliente.");
}
