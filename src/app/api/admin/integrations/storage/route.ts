import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { authorizeApiWrite } from "@/lib/identity/api-guard";
import {
  getStorageIntegrationPublic,
  updateStorageIntegration,
} from "@/lib/cms/storage-config";
import type { StorageIntegrationUpdate } from "@/types/integrations";

export async function GET() {
  try {
    const ctx = await requirePermission("settings.integrations");
    if (ctx instanceof NextResponse) return ctx;

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
