import { NextResponse } from "next/server";
import { requireAuth, requirePermission, isAuthContext } from "@/core/identity";
import { authorize } from "@/core/identity/policies/engine";
import { writeAudit } from "@/lib/identity/audit";
import { resolvePermissionsForRoles } from "@/lib/identity/roles";
import {
  getStorageIntegrationPublic,
  updateStorageIntegration,
} from "@/lib/cms/storage-config";
import type { StorageIntegrationUpdate } from "@/types/integrations";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    // Lectura pura — sync de roles solo en login/bootstrap/migración (SAAS-004).
    const permissions = auth.membership
      ? await resolvePermissionsForRoles(auth.tenantId, auth.membership.roleIds)
      : [];
    const result = authorize({ ...auth, permissions }, "settings.integrations");
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }

    const config = await getStorageIntegrationPublic(auth.tenantId);
    return NextResponse.json({ ok: true, config });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requirePermission("settings.integrations");
    if (!isAuthContext(auth)) return auth;

    const body = (await request.json()) as StorageIntegrationUpdate;

    if (!body.bucket?.trim() || !body.accessKeyId?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Bucket y Access Key ID son obligatorios." },
        { status: 400 }
      );
    }

    if (body.enabled && body.accessMode === "public" && !body.publicUrl?.trim()) {
      return NextResponse.json(
        { ok: false, error: "La URL pública es obligatoria cuando el acceso es público." },
        { status: 400 }
      );
    }

    const config = await updateStorageIntegration(auth.tenantId, body);

    if (!auth.compatMode) {
      await writeAudit({
        tenantId: auth.tenantId,
        userId: auth.user._id,
        action: "settings.integrations.update",
        entity: "platform_integrations",
        entityId: `storage:${auth.tenantId}`,
      });
    }

    return NextResponse.json({ ok: true, config });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
