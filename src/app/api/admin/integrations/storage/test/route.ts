import { NextResponse } from "next/server";
import { authorizeApiWrite } from "@/lib/identity/api-guard";
import { testS3Connection } from "@/lib/cms/media-storage";
import { getResolvedS3SettingsForTest } from "@/lib/cms/storage-config";
import { formatStorageError } from "@/lib/cms/storage-normalize";
import type { StorageIntegrationUpdate } from "@/types/integrations";

export async function POST(request: Request) {
  try {
    const denied = await authorizeApiWrite("settings.integrations", {
      action: "settings.integrations.test",
      entity: "platform_integrations",
      entityId: "storage",
    });
    if (denied) return denied;

    const body = (await request.json().catch(() => ({}))) as {
      config?: StorageIntegrationUpdate;
    };

    const s3 = await getResolvedS3SettingsForTest(body.config);
    const result = await testS3Connection(s3);

    return NextResponse.json({ ok: true, message: result.message });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        ok: false,
        error: formatStorageError(error),
      },
      { status: 400 }
    );
  }
}
