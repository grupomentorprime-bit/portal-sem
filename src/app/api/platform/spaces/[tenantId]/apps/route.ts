import { NextResponse } from "next/server";
import { findTenantById } from "@/core/tenant";
import { requirePlatformOperator } from "@/core/identity/middleware/guards";
import { provisionAprendeHoyCompany } from "@/lib/connect/provision-aprende-hoy";
import { provisionRrhhCompany } from "@/lib/connect/provision-rrhh";
import {
  newlyContracted,
  parseContractPatch,
  resolveContractedApps,
} from "@/lib/desktop/contract";
import { ensureDeskProduct } from "@/lib/desktop/ensure-client-company";
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
  const added = newlyContracted(before.contracted, patch.contractedApps);
  for (const appId of added) {
    await store.fulfillOpen(tenant.tenantId, appId);
    if (appId === "rrhh" || appId === "aprende-hoy") {
      await ensureDeskProduct({
        tenantId: tenant.tenantId,
        userId: ctx.user._id,
        appId,
      });
    }
  }

  const companyName = tenant.name?.trim() || tenant.tenantId;
  const email = ctx.user.email.trim().toLowerCase();
  const displayName = ctx.user.displayName.trim() || email;
  if (added.includes("rrhh")) {
    void provisionRrhhCompany({
      tenantId: tenant.tenantId,
      companyName,
      email,
      displayName,
    }).catch((error: unknown) => {
      console.error(
        "[escritorio] no se pudo crear la empresa de RR.HH.",
        tenant.tenantId,
        error instanceof Error ? error.message : error
      );
    });
  }
  if (added.includes("aprende-hoy")) {
    void provisionAprendeHoyCompany({
      tenantId: tenant.tenantId,
      companyName,
      email,
      displayName,
    }).catch((error: unknown) => {
      console.error(
        "[escritorio] no se pudo crear el perfil de Aprende Hoy.",
        tenant.tenantId,
        error instanceof Error ? error.message : error
      );
    });
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
