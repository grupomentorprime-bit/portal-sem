import { NextResponse } from "next/server";
import { requirePermission, isAuthContext } from "@/core/identity";
import { writeAudit } from "@/lib/identity/audit";
import { testS3Connection } from "@/lib/cms/media-storage";
import { getResolvedS3SettingsForTest } from "@/lib/cms/storage-config";
import { formatStorageError } from "@/lib/cms/storage-normalize";
import { logServerError } from "@/core/security/redact";
import type { StorageIntegrationUpdate } from "@/types/integrations";

export async function POST(request: Request) {
  try {
    const auth = await requirePermission("settings.integrations");
    if (!isAuthContext(auth)) return auth;

    const body = (await request.json().catch(() => ({}))) as {
      config?: StorageIntegrationUpdate;
    };

    const s3 = await getResolvedS3SettingsForTest(auth.tenantId, body.config);
    const result = await testS3Connection(s3);

    if (!auth.compatMode) {
      await writeAudit({
        tenantId: auth.tenantId,
        userId: auth.user._id,
        action: "settings.integrations.test",
        entity: "platform_integrations",
        entityId: `storage:${auth.tenantId}`,
      });
    }

    return NextResponse.json({ ok: true, message: result.message });
  } catch (error) {
    logServerError("storage-test", error);
    return NextResponse.json(
      {
        ok: false,
        error: formatStorageError(error),
      },
      { status: 400 }
    );
  }
}
