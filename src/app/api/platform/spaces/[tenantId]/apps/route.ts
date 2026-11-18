import { NextResponse } from "next/server";
import { findTenantById } from "@/core/tenant";
import { requirePlatformOperator } from "@/core/identity/middleware/guards";
import {
  newlyContracted,
  parseContractPatch,
  resolveContractedApps,
} from "@/lib/desktop/contract";
import { noteCommercialActivation } from "@/lib/desktop/attention-store";
import {
  mongoAppRequestStore,
  readSpaceContract,
  writeSpaceContract,
} from "@/lib/desktop/store";
import { writeAudit } from "@/lib/identity/audit";
import { getDatabase } from "@/lib/mongodb";

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const ctx = await requirePlatformOperator();
  if (ctx instanceof NextResponse) return ctx;

  const { tenantId } = await params;
  const decoded = decodeURIComponent(tenantId);
  const body = (await request.json().catch(() => null)) as {
    contractedApps?: unknown;
    aprendeHoyEntryUrl?: unknown;
  } | null;
  const patch = parseContractPatch({
    contractedApps: body?.contractedApps,
    aprendeHoyEntryUrl: body?.aprendeHoyEntryUrl,
  });
  if (!patch.ok) return NextResponse.json({ ok: false }, { status: 400 });

  const db = await getDatabase();
  const tenant = await findTenantById(db, decoded);
  if (!tenant) return NextResponse.json({ ok: false }, { status: 404 });

  const before = await readSpaceContract(tenant.tenantId);
  await writeSpaceContract(tenant.tenantId, patch);

  const store = mongoAppRequestStore();
  for (const appId of newlyContracted(before.contracted, patch.contractedApps)) {
    await store.fulfillOpen(tenant.tenantId, appId);
    await noteCommercialActivation({
      tenantId: tenant.tenantId,
      appId,
      actorUserId: ctx.user._id,
      actorName: ctx.user.displayName,
    }).catch(() => null);
  }

  const appsChanged = before.contracted.join(",") !== patch.contractedApps.join(",");
  const entryChanged = (before.aprendeHoyEntryUrl ?? null) !== patch.aprendeHoyEntryUrl;
  if (appsChanged || entryChanged) {
    await writeAudit({
      scope: "platform",
      userId: ctx.user._id,
      action: "platform.space.contract",
      entity: "tenant",
      entityId: tenant.tenantId,
      metadata: {
        name: tenant.name,
        contractedApps: patch.contractedApps,
        appsChanged,
        entryChanged,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    contractedApps: resolveContractedApps({
      tenantId: tenant.tenantId,
      contractedApps: patch.contractedApps,
    }),
  });
}
