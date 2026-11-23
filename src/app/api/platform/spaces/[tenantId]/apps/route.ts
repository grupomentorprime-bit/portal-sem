import { NextResponse } from "next/server";
import { findTenantById } from "@/core/tenant";
import { requirePlatformOperator } from "@/core/identity/middleware/guards";
import { provisionAprendeHoyCompany } from "@/lib/connect/provision-aprende-hoy";
import { provisionRrhhCompany } from "@/lib/connect/provision-rrhh";
import {
  recoverExternalProvision,
  type ExternalProvisionApp,
  type ExternalProvisionRecord,
} from "@/lib/connect/provision-state";
import { TENANTS_COLLECTION } from "@/core/tenant/constants";
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

async function rememberExternalProvision(
  tenantId: string,
  appId: ExternalProvisionApp,
  request: () => Promise<ExternalProvisionRecord>
): Promise<void> {
  const db = await getDatabase();
  const tenants = db.collection<{
    _id: string;
    tenantId?: string;
    externalProvision?: Partial<Record<ExternalProvisionApp, ExternalProvisionRecord>>;
  }>(TENANTS_COLLECTION);
  const current = await tenants.findOne({ $or: [{ _id: tenantId }, { tenantId }] });
  if (!current) return;
  const prior = current.externalProvision?.[appId];
  const recovery = recoverExternalProvision(prior);
  if (prior && prior.state !== "not_configured") {
    console.error(
      "[escritorio] provisión externa no se repite",
      tenantId,
      appId,
      recovery.state,
      recovery.reason
    );
    return;
  }
  const at = new Date().toISOString();
  const record = await request().catch(() => ({
    state: "failed" as const,
    httpStatus: null,
    at,
  }));
  await tenants.updateOne(
    { _id: current._id },
    { $set: { externalProvision: { ...current.externalProvision, [appId]: record } } }
  );
  if (record.state !== "activated") {
    console.error(
      "[escritorio] provisión externa sin activar",
      tenantId,
      appId,
      record.state,
      record.httpStatus
    );
  }
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
    await noteCommercialActivation({
      tenantId: tenant.tenantId,
      appId,
      actorUserId: ctx.user._id,
      actorName: ctx.user.displayName,
    }).catch(() => null);
  }

  const companyName = tenant.name?.trim() || tenant.tenantId;
  const email = ctx.user.email.trim().toLowerCase();
  const displayName = ctx.user.displayName.trim() || email;
  if (added.includes("rrhh")) {
    await rememberExternalProvision(tenant.tenantId, "rrhh", () =>
      provisionRrhhCompany({
        tenantId: tenant.tenantId,
        companyName,
        email,
        displayName,
      })
    );
  }
  if (added.includes("aprende-hoy")) {
    await rememberExternalProvision(tenant.tenantId, "aprende-hoy", () =>
      provisionAprendeHoyCompany({
        tenantId: tenant.tenantId,
        companyName,
        email,
        displayName,
      })
    );
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
