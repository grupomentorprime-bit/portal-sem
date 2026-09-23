import type { Db } from "mongodb";
import type { IdentityAuditEntry } from "@/types/identity";
import { generateId } from "@/core/identity/auth/crypto";
import { TENANTS_COLLECTION } from "@/core/tenant/constants";
import { findTenantById } from "@/core/tenant/repositories";
import type { TenantStatus } from "@/core/tenant/types";

export const SPACE_CONTROL_STATUSES = [
  "active",
  "inactive",
  "suspended",
  "archived",
] as const satisfies readonly TenantStatus[];

export type SpaceControlStatus = (typeof SPACE_CONTROL_STATUSES)[number];

export type SetPlatformSpaceStatusErrorCode =
  | "invalid_tenant"
  | "invalid_status"
  | "space_not_found";

export class SetPlatformSpaceStatusError extends Error {
  readonly code: SetPlatformSpaceStatusErrorCode;
  readonly status: number;

  constructor(
    code: SetPlatformSpaceStatusErrorCode,
    message: string,
    status = 400
  ) {
    super(message);
    this.name = "SetPlatformSpaceStatusError";
    this.code = code;
    this.status = status;
  }
}

export function isSpaceControlStatus(value: string): value is SpaceControlStatus {
  return (SPACE_CONTROL_STATUSES as readonly string[]).includes(value);
}

export interface SetPlatformSpaceStatusResult {
  tenantId: string;
  name: string;
  status: SpaceControlStatus;
  previousStatus: TenantStatus;
  changed: boolean;
}

/**
 * Cambia el estado operativo del Espacio (activar, desactivar, suspender, archivar).
 * El portal público solo se sirve cuando el estado es `active`.
 */
export async function setPlatformSpaceStatus(
  db: Db,
  input: {
    tenantId: string;
    status: string;
    actorUserId: string;
  }
): Promise<SetPlatformSpaceStatusResult> {
  const tenantId = input.tenantId?.trim() ?? "";
  const status = input.status?.trim() ?? "";

  if (!tenantId) {
    throw new SetPlatformSpaceStatusError(
      "invalid_tenant",
      "El identificador del Espacio no es válido."
    );
  }
  if (!isSpaceControlStatus(status)) {
    throw new SetPlatformSpaceStatusError(
      "invalid_status",
      "El estado no es válido."
    );
  }

  const tenant = await findTenantById(db, tenantId);
  if (!tenant) {
    throw new SetPlatformSpaceStatusError(
      "space_not_found",
      "Espacio no encontrado.",
      404
    );
  }

  const previousStatus = tenant.status;
  if (previousStatus !== status) {
    const at = new Date().toISOString();
    await db.collection(TENANTS_COLLECTION).updateOne(
      { tenantId },
      { $set: { status, updatedAt: at } }
    );

    const entry: IdentityAuditEntry = {
      _id: generateId("audit"),
      userId: input.actorUserId,
      action: "platform.space.status",
      entity: "tenant",
      entityId: tenantId,
      metadata: {
        name: tenant.name,
        from: previousStatus,
        to: status,
      },
      scope: "platform",
      createdAt: at,
    };
    await db.collection<IdentityAuditEntry>("identity_audit").insertOne(entry);
  }

  return {
    tenantId,
    name: tenant.name?.trim() || tenantId,
    status,
    previousStatus,
    changed: previousStatus !== status,
  };
}
