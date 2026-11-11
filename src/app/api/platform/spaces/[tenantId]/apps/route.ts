import { NextResponse } from "next/server";
import { findTenantById } from "@/core/tenant";
import { requirePlatformOperator } from "@/core/identity/middleware/guards";
import {
  newlyContracted,
  parseContractPatch,
  resolveContractedApps,
} from "@/lib/desktop/contract";
import {
  mongoAppRequestStore,
  readSpaceContract,
  writeSpaceContract,
} from "@/lib/desktop/store";
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
  }

  return NextResponse.json({
    ok: true,
    contractedApps: resolveContractedApps({
      tenantId: tenant.tenantId,
      contractedApps: patch.contractedApps,
    }),
  });
}
