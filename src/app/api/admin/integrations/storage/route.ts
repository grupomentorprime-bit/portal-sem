import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { authorize } from "@/core/identity/policies/engine";
import { authorizeApiWrite } from "@/lib/identity/api-guard";
import { resolvePermissionsForRoles } from "@/lib/identity/roles";
import {
  getStorageIntegrationPublic,
  updateStorageIntegration,
} from "@/lib/cms/storage-config";
import { ensureTenantRoles } from "@/lib/identity/roles";
import type { StorageIntegrationUpdate } from "@/types/integrations";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    await ensureTenantRoles(auth.tenantId);

    const permissions = auth.membership
      ? await resolvePermissionsForRoles(auth.tenantId, auth.membership.roleIds)
      : [];
    const result = authorize({ ...auth, permissions }, "settings.integrations");
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }

    const config = await getStorageIntegrationPublic();
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
    const denied = await authorizeApiWrite("settings.integrations", {
      action: "settings.integrations.update",
      entity: "platform_integrations",
      entityId: "storage",
    });
    if (denied) return denied;

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

    const config = await updateStorageIntegration(body);
    return NextResponse.json({ ok: true, config });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
