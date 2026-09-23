import type { Db } from "mongodb";
import type { IdentityAuditEntry, IdentityUser } from "@/types/identity";
import { generateId } from "@/core/identity/auth/crypto";
import {
  createMongoGrowthAutomationStore,
  ensureGrowthAutomationIndexes,
  ensureGrowthStartupNextActionAutomation,
} from "@/core/growth/automations";
import { createDefaultSiteConfig } from "@/lib/cms/defaults";
import {
  buildDefaultSpaceHost,
  classifySpaceDomainKind,
  isReservedPlatformHost,
  isReservedSpaceSlug,
  normalizeHost,
} from "@/core/tenant/hosts";
import {
  findDomainByHost,
  findTenantBySlug,
} from "@/core/tenant/repositories";
import {
  provisionTenantFoundation,
  type TenantProvisionHost,
} from "@/core/tenant/provision";
import type { TenantType } from "@/core/tenant/types";
import {
  labelTenantStatus,
  labelTenantType,
} from "@/lib/platform/space-labels";
import { isSpaceCreationType } from "@/lib/platform/space-organization-types";

export interface CreatePlatformSpaceInput {
  name: string;
  slug: string;
  type: TenantType;
  host: string;
  /** Si viene vacío, se usa el nombre del Espacio. */
  siteName?: string | null;
  /** Correo de una cuenta existente. Opcional; no se asigna el operador automáticamente. */
  ownerEmail?: string | null;
}

export interface CreatePlatformSpaceSummary {
  tenantId: string;
  name: string;
  siteName: string;
  primaryDomain: string | null;
  status: string;
  statusLabel: string;
  type: TenantType;
  typeLabel: string;
  ownerAssigned: boolean;
  created: boolean;
}

export type CreatePlatformSpaceErrorCode =
  | "invalid_name"
  | "invalid_slug"
  | "invalid_type"
  | "invalid_host"
  | "invalid_site_name"
  | "slug_taken"
  | "host_taken"
  | "owner_not_found"
  | "owner_invalid"
  | "provision_failed";

export class CreatePlatformSpaceError extends Error {
  readonly code: CreatePlatformSpaceErrorCode;
  readonly status: number;

  constructor(code: CreatePlatformSpaceErrorCode, message: string, status = 400) {
    super(message);
    this.name = "CreatePlatformSpaceError";
    this.code = code;
    this.status = status;
  }
}

/** Slug canónico: minúsculas, a-z0-9 y guiones; sin acentos ni extremos. */
export function normalizeSpaceSlug(raw: string): string | null {
  const slug = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug || slug.length < 2 || slug.length > 64) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return slug;
}

function resolveProvisionHosts(
  slug: string,
  rawHost: string
): TenantProvisionHost[] {
  const defaultHost = buildDefaultSpaceHost(slug);
  const requested = normalizeHost(rawHost);

  if (requested && isReservedPlatformHost(requested)) {
    throw new CreatePlatformSpaceError(
      "invalid_host",
      "Ese host es el origen de la plataforma. Usa el subdominio del Espacio o un dominio propio."
    );
  }

  const hosts: TenantProvisionHost[] = [];
  if (defaultHost) {
    hosts.push({
      host: defaultHost,
      kind: "platform_subdomain",
      isPrimary: !requested || requested === defaultHost,
    });
  }

  if (requested && requested !== defaultHost) {
    hosts.push({
      host: requested,
      kind: classifySpaceDomainKind(slug, requested),
      isPrimary: true,
    });
  }

  return hosts;
}

function buildNeutralConfig(tenantId: string, name: string, siteName: string) {
  const base = createDefaultSiteConfig();
  return {
    ...base,
    institution: {
      ...base.institution,
      name,
      shortName: siteName,
      tenant: tenantId,
      organization: "",
      website: "",
      tagline: "",
      status: "active" as const,
    },
    seo: {
      ...base.seo,
      title: siteName || name,
      description: "",
      keywords: [] as string[],
    },
  };
}

async function writePlatformSpaceAudit(
  db: Db,
  input: {
    userId: string;
    entityId: string;
    metadata: Record<string, unknown>;
  }
): Promise<void> {
  const entry: IdentityAuditEntry = {
    _id: generateId("audit"),
    userId: input.userId,
    action: "platform.space.create",
    entity: "tenant",
    entityId: input.entityId,
    metadata: input.metadata,
    scope: "platform",
    createdAt: new Date().toISOString(),
  };
  await db.collection<IdentityAuditEntry>("identity_audit").insertOne(entry);
}

/** Seed Growth de arranque (idempotente; fail-soft). */
async function seedGrowthStartupAutomationSafe(
  db: Db,
  tenantId: string
): Promise<void> {
  try {
    await ensureGrowthAutomationIndexes(db);
    await ensureGrowthStartupNextActionAutomation(
      createMongoGrowthAutomationStore(db),
      tenantId
    );
  } catch (error) {
    console.error(
      "[Growth] startup nextAction automation seed failed (space preserved)",
      tenantId,
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Alta de Espacio desde Platform Admin.
 * Reutiliza provisionTenantFoundation — sin segundo motor ni seeds SEM.
 * El operador (actorUserId) nunca se asigna como Dueño salvo que figure en ownerEmail.
 */
export async function createPlatformSpace(
  db: Db,
  input: CreatePlatformSpaceInput,
  actorUserId: string
): Promise<CreatePlatformSpaceSummary> {
  const name = input.name?.trim() ?? "";
  const slug = normalizeSpaceSlug(input.slug ?? "");
  const type = (input.type?.trim() || "") as TenantType;
  // Sitio toma el nombre del Espacio si no viene informado (UX horizontal).
  const siteName = input.siteName?.trim() || name;
  const ownerEmailRaw = input.ownerEmail?.trim().toLowerCase() || "";

  if (!name) {
    throw new CreatePlatformSpaceError(
      "invalid_name",
      "El nombre del Espacio es obligatorio."
    );
  }
  if (!slug) {
    throw new CreatePlatformSpaceError(
      "invalid_slug",
      "El slug debe tener 2–64 caracteres (a-z, 0-9 y guiones)."
    );
  }
  if (isReservedSpaceSlug(slug)) {
    throw new CreatePlatformSpaceError(
      "invalid_slug",
      "Ese identificador está reservado para la infraestructura."
    );
  }
  if (!isSpaceCreationType(type)) {
    throw new CreatePlatformSpaceError(
      "invalid_type",
      "Elige un tipo de organización válido."
    );
  }

  // Subdominio de plataforma siempre; dominio informado si es distinto.
  const hosts = resolveProvisionHosts(slug, input.host);
  const host = hosts.find((entry) => entry.isPrimary)?.host ?? hosts[0]?.host;

  if (!host) {
    throw new CreatePlatformSpaceError(
      "invalid_host",
      "El dominio o subdominio inicial no es válido."
    );
  }

  const tenantId = slug;
  const siteId = slug;

  const existingTenant = await findTenantBySlug(db, slug);
  if (existingTenant) {
    // Idempotencia: mismo Espacio + mismo host ya registrado → devolver resumen.
    const existingHost = await findDomainByHost(db, host);
    if (
      existingHost &&
      existingHost.tenantId === existingTenant.tenantId &&
      existingTenant.tenantId === tenantId
    ) {
      const result = await provisionTenantFoundation(db, {
        tenantId,
        code: existingTenant.code,
        name,
        slug,
        type: existingTenant.type,
        siteId,
        siteCode: siteId,
        siteName,
        hosts,
        config: buildNeutralConfig(tenantId, name, siteName),
        membershipEmail: null,
      });

      await seedGrowthStartupAutomationSafe(db, tenantId);

      await writePlatformSpaceAudit(db, {
        userId: actorUserId,
        entityId: tenantId,
        metadata: {
          idempotent: true,
          slug,
          host,
          siteId,
          type: existingTenant.type,
        },
      });

      return {
        tenantId,
        name: existingTenant.name?.trim() || name,
        siteName,
        primaryDomain: host,
        status: existingTenant.status,
        statusLabel: labelTenantStatus(existingTenant.status),
        type: existingTenant.type,
        typeLabel: labelTenantType(existingTenant.type),
        ownerAssigned: false,
        created: false,
      };
    }

    throw new CreatePlatformSpaceError(
      "slug_taken",
      "Ya existe un Espacio con ese slug.",
      409
    );
  }

  for (const entry of hosts) {
    const takenHost = await findDomainByHost(db, entry.host);
    if (takenHost && takenHost.tenantId !== tenantId) {
      throw new CreatePlatformSpaceError(
        "host_taken",
        "Ese dominio o subdominio ya está asignado a otro Espacio.",
        409
      );
    }
  }

  let membershipEmail: string | null = null;
  if (ownerEmailRaw) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmailRaw)) {
      throw new CreatePlatformSpaceError(
        "owner_invalid",
        "El correo del dueño inicial no es válido."
      );
    }
    const owner = await db.collection<IdentityUser>("identity_users").findOne({
      email: ownerEmailRaw,
    });
    if (!owner) {
      throw new CreatePlatformSpaceError(
        "owner_not_found",
        "No existe una cuenta con ese correo. Usa una identidad existente."
      );
    }
    membershipEmail = ownerEmailRaw;
  }

  const config = buildNeutralConfig(tenantId, name, siteName);

  const result = await provisionTenantFoundation(db, {
    tenantId,
    code: slug.toUpperCase().replace(/-/g, "_"),
    name,
    slug,
    type,
    siteId,
    siteCode: siteId,
    siteName,
    hosts,
    config,
    seedMenus: true,
    seedHomePage: true,
    seedRoles: true,
    seedStorageStub: true,
    membershipEmail,
  });

  if (result.skipped.hostsRejected.length > 0 && result.hosts.length === 0) {
    throw new CreatePlatformSpaceError(
      "host_taken",
      "Ese dominio o subdominio ya está asignado a otro Espacio.",
      409
    );
  }

  await seedGrowthStartupAutomationSafe(db, tenantId);

  const created =
    result.created.tenant ||
    result.created.site ||
    result.created.siteConfig ||
    result.created.domains > 0;

  await writePlatformSpaceAudit(db, {
    userId: actorUserId,
    entityId: tenantId,
    metadata: {
      slug,
      host: result.hosts[0] ?? host,
      siteId,
      type,
      name,
      siteName,
      ownerEmail: membershipEmail,
      ownerAssigned: result.created.membership,
      created,
    },
  });

  return {
    tenantId,
    name,
    siteName,
    primaryDomain: host,
    status: "active",
    statusLabel: labelTenantStatus("active"),
    type,
    typeLabel: labelTenantType(type),
    ownerAssigned: Boolean(result.created.membership),
    created,
  };
}
