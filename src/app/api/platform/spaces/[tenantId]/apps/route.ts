import { NextResponse } from "next/server";
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

  const before = await readSpaceContract(decoded);
  await writeSpaceContract(decoded, patch);

  const store = mongoAppRequestStore();
  for (const appId of newlyContracted(before.contracted, patch.contractedApps)) {
    await store.fulfillOpen(decoded, appId);
  }

  return NextResponse.json({
    ok: true,
    contractedApps: resolveContractedApps({
      tenantId: decoded,
      contractedApps: patch.contractedApps,
    }),
  });
}
