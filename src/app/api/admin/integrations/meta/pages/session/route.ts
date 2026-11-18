import { NextResponse } from "next/server";
import { isAuthContext, requirePermission } from "@/core/identity";
import { getMetaPagesPublicConfig } from "@/core/growth/meta-pages/config";
import { metaPageChannelViews } from "@/core/growth/meta-pages/complete";
import { createMetaPagesConnectState } from "@/core/growth/meta-pages/state";
import { logServerError } from "@/core/security/redact";
import { openMetaPageConnectionStore } from "@/lib/growth/meta-pages-store";

export async function GET() {
  try {
    const auth = await requirePermission("settings.integrations");
    if (!isAuthContext(auth)) return auth;

    const meta = getMetaPagesPublicConfig();
    const store = await openMetaPageConnectionStore();
    const connections = await store.listByTenant(auth.tenantId);

    return NextResponse.json({
      ok: true,
      meta: {
        ready: meta.ready,
        appId: meta.appId,
        configId: meta.configId,
        missing: meta.missing,
      },
      state: meta.ready ? createMetaPagesConnectState(auth.tenantId) : null,
      channels: metaPageChannelViews(connections),
    });
  } catch (error) {
    logServerError("meta-pages-session", error);
    return NextResponse.json(
      { ok: false, error: "No se pudo preparar la conexión con Meta." },
      { status: 500 }
    );
  }
}
