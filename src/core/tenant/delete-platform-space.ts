import type { Db } from "mongodb";
import type { IdentityAuditEntry, IdentitySession } from "@/types/identity";
import { generateId } from "@/core/identity/auth/crypto";
import {
  GROWTH_ACTIVIDADES_COLLECTION,
  GROWTH_OPORTUNIDADES_COLLECTION,
  GROWTH_PERSONAS_COLLECTION,
  GROWTH_SPACE_CONFIG_COLLECTION,
} from "@/core/growth/types";
import {
  GROWTH_AUTOMATIONS_COLLECTION,
  GROWTH_AUTOMATION_RUNS_COLLECTION,
  GROWTH_AUTOMATION_VERSIONS_COLLECTION,
} from "@/core/growth/automations/types";
import {
  GROWTH_CONVERSACIONES_COLLECTION,
  GROWTH_MENSAJES_COLLECTION,
} from "@/core/growth/messaging/types";
import { GROWTH_CAMPAIGNS_COLLECTION } from "@/core/growth/campaigns/types";
import { GROWTH_WHATSAPP_CONNECTIONS_COLLECTION } from "@/core/growth/whatsapp/types";
import {
  DOMAINS_COLLECTION,
  isProtectedPlatformSpace,
  SITE_CONFIG_COLLECTION,
  SITES_COLLECTION,
  TENANTS_COLLECTION,
} from "@/core/tenant/constants";
import { findTenantById } from "@/core/tenant/repositories";
import type { TenantDocument } from "@/core/tenant/types";

export type DeletePlatformSpaceErrorCode =
  | "invalid_tenant"
  | "space_not_found"
  | "protected_space"
  | "confirm_mismatch";

export class DeletePlatformSpaceError extends Error {
  readonly code: DeletePlatformSpaceErrorCode;
  readonly status: number;

  constructor(
    code: DeletePlatformSpaceErrorCode,
    message: string,
    status = 400
  ) {
    super(message);
    this.name = "DeletePlatformSpaceError";
    this.code = code;
    this.status = status;
  }
}

export interface DeletePlatformSpaceResult {
  tenantId: string;
  name: string;
  deleted: Record<string, number>;
}

export { isProtectedPlatformSpace };

type TenantScopedCollection = {
  name: string;
  field: "tenantId" | "tenant";
};

const TENANT_SCOPED: TenantScopedCollection[] = [
  { name: DOMAINS_COLLECTION, field: "tenantId" },
  { name: SITES_COLLECTION, field: "tenantId" },
  { name: SITE_CONFIG_COLLECTION, field: "tenantId" },
  { name: "cms_menus", field: "tenant" },
  { name: "cms_pages", field: "tenant" },
  { name: "cms_media", field: "tenant" },
  { name: "cms_templates", field: "tenant" },
  { name: "identity_roles", field: "tenantId" },
  { name: "identity_memberships", field: "tenantId" },
  { name: "identity_invitations", field: "tenantId" },
  { name: "platform_integrations", field: "tenantId" },
  { name: GROWTH_PERSONAS_COLLECTION, field: "tenantId" },
  { name: GROWTH_OPORTUNIDADES_COLLECTION, field: "tenantId" },
  { name: GROWTH_ACTIVIDADES_COLLECTION, field: "tenantId" },
  { name: GROWTH_SPACE_CONFIG_COLLECTION, field: "tenantId" },
  { name: GROWTH_AUTOMATIONS_COLLECTION, field: "tenantId" },
  { name: GROWTH_AUTOMATION_VERSIONS_COLLECTION, field: "tenantId" },
  { name: GROWTH_AUTOMATION_RUNS_COLLECTION, field: "tenantId" },
  { name: GROWTH_CONVERSACIONES_COLLECTION, field: "tenantId" },
  { name: GROWTH_MENSAJES_COLLECTION, field: "tenantId" },
  { name: GROWTH_CAMPAIGNS_COLLECTION, field: "tenantId" },
  { name: GROWTH_WHATSAPP_CONNECTIONS_COLLECTION, field: "tenantId" },
  { name: "experience_forms", field: "tenant" },
  { name: "experience_form_submissions", field: "tenant" },
  { name: "experience_form_suppressions", field: "tenant" },
  { name: "convocatoria_rosters", field: "tenant" },
  { name: "academy_programs", field: "tenant" },
  { name: "content_news", field: "tenant" },
  { name: "content_people", field: "tenant" },
  { name: "content_events", field: "tenant" },
  { name: "portal_admission_config", field: "tenant" },
  { name: "portal_interesados", field: "tenant" },
  { name: "workflow_definitions", field: "tenantId" },
  { name: "workflow_instances", field: "tenantId" },
  { name: "workflow_history", field: "tenantId" },
];

async function deleteScoped(
  db: Db,
  tenantId: string,
  entry: TenantScopedCollection
): Promise<number> {
  try {
    const result = await db
      .collection(entry.name)
      .deleteMany({ [entry.field]: tenantId });
    return result.deletedCount;
  } catch {
    // Colección ausente u otro error no bloquea el borrado del Espacio.
    return 0;
  }
}

async function clearActiveSessions(db: Db, tenantId: string): Promise<number> {
  const result = await db
    .collection<IdentitySession>("identity_sessions")
    .updateMany({ tenantId }, { $set: { tenantId: "" } });
  return result.modifiedCount;
}

async function writeDeleteAudit(
  db: Db,
  input: {
    userId: string;
    tenantId: string;
    name: string;
    deleted: Record<string, number>;
  }
): Promise<void> {
  const entry: IdentityAuditEntry = {
    _id: generateId("audit"),
    userId: input.userId,
    action: "platform.space.delete",
    entity: "tenant",
    entityId: input.tenantId,
    metadata: {
      name: input.name,
      deleted: input.deleted,
    },
    scope: "platform",
    createdAt: new Date().toISOString(),
  };
  await db.collection<IdentityAuditEntry>("identity_audit").insertOne(entry);
}

/**
 * Baja irreversible de un Espacio desde Platform Admin.
 * No borra SEM ni ADL. Requiere confirmación con el identificador exacto.
 */
export async function deletePlatformSpace(
  db: Db,
  input: {
    tenantId: string;
    confirmSlug: string;
    actorUserId: string;
  }
): Promise<DeletePlatformSpaceResult> {
  const tenantId = input.tenantId?.trim() ?? "";
  const confirmSlug = input.confirmSlug?.trim() ?? "";

  if (!tenantId) {
    throw new DeletePlatformSpaceError(
      "invalid_tenant",
      "El identificador del Espacio no es válido."
    );
  }

  if (isProtectedPlatformSpace(tenantId)) {
    throw new DeletePlatformSpaceError(
      "protected_space",
      "Este Espacio de fundación no se puede eliminar desde Growth OS.",
      403
    );
  }

  if (confirmSlug !== tenantId) {
    throw new DeletePlatformSpaceError(
      "confirm_mismatch",
      "Escribe el identificador del Espacio para confirmar la eliminación."
    );
  }

  const tenant = await findTenantById(db, tenantId);
  if (!tenant) {
    throw new DeletePlatformSpaceError(
      "space_not_found",
      "Espacio no encontrado.",
      404
    );
  }

  const deleted: Record<string, number> = {};

  for (const entry of TENANT_SCOPED) {
    deleted[entry.name] = await deleteScoped(db, tenantId, entry);
  }

  deleted.identity_sessions = await clearActiveSessions(db, tenantId);

  const auditByEntity = await db
    .collection("identity_audit")
    .deleteMany({ entityId: tenantId });
  deleted.identity_audit = auditByEntity.deletedCount;

  const auditByTenant = await db
    .collection("identity_audit")
    .deleteMany({ tenantId });
  deleted.identity_audit += auditByTenant.deletedCount;

  const tenantDelete = await db
    .collection(TENANTS_COLLECTION)
    .deleteMany({ tenantId });
  deleted[TENANTS_COLLECTION] = tenantDelete.deletedCount;

  // Defensa por _id si el documento no traía tenantId duplicado.
  if (tenantDelete.deletedCount === 0) {
    const byId = await db
      .collection<TenantDocument>(TENANTS_COLLECTION)
      .deleteOne({ _id: tenantId });
    deleted[TENANTS_COLLECTION] += byId.deletedCount;
  }

  await writeDeleteAudit(db, {
    userId: input.actorUserId,
    tenantId,
    name: tenant.name?.trim() || tenantId,
    deleted,
  });

  return {
    tenantId,
    name: tenant.name?.trim() || tenantId,
    deleted,
  };
}
