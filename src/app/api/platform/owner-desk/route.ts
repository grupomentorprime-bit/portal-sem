import { NextResponse } from "next/server";
import { requirePlatformOperator } from "@/core/identity";
import { hasPlatformOwnerCapability } from "@/core/identity/platform/capability";
import { TENANTS_COLLECTION } from "@/core/tenant/constants";
import { resolvePlatformBaseDomain } from "@/core/tenant/hosts";
import type { TenantDocument } from "@/core/tenant/types";
import { clientIdFromActivity, activityKind, platformActivityLine } from "@/lib/desktop/owner-settings";
import { listPlatformAudit } from "@/lib/identity/audit";
import { listUsersByIds } from "@/lib/identity/users";
import { getDatabase } from "@/lib/mongodb";
import type { IdentityAuditEntry } from "@/types/identity";

async function requireOwner() {
  const ctx = await requirePlatformOperator();
  if (ctx instanceof NextResponse) return ctx;
  if (!hasPlatformOwnerCapability(ctx.user)) {
    return NextResponse.json(
      { ok: false, error: "Solo el dueño ve los ajustes de la plataforma." },
      { status: 403 }
    );
  }
  return ctx;
}

export async function GET() {
  const ctx = await requireOwner();
  if (ctx instanceof NextResponse) return ctx;

  const entries = await listPlatformAudit(30);
  const ids = [...new Set(entries.map((entry) => entry.userId).filter(Boolean))];
  const clientIds = [
    ...new Set(entries.map((entry) => clientIdFromActivity(entry)).filter(Boolean)),
  ];
  const [people, clients] = await Promise.all([
    listUsersByIds(ids),
    clientIds.length ? listClientNames(clientIds) : Promise.resolve(new Map<string, string>()),
  ]);
  const names = new Map(
    people.map((person) => [
      person._id,
      person.displayName?.trim() || person.email?.trim() || "Alguien de la plataforma",
    ])
  );

  return NextResponse.json({
    ok: true,
    baseDomain: resolvePlatformBaseDomain(),
    activity: entries.map((entry) => ({
      id: entry._id,
      at: entry.createdAt,
      actor: names.get(entry.userId) || (entry.userId ? "Una cuenta que ya no está" : "Alguien de la plataforma"),
      kind: activityKind(entry.action),
      line: platformActivityLine({
        action: entry.action,
        metadata: metadataWithClient(entry, clients),
      }),
    })),
  });
}

async function listClientNames(ids: string[]): Promise<Map<string, string>> {
  const db = await getDatabase();
  const rows = await db
    .collection<TenantDocument>(TENANTS_COLLECTION)
    .find({ $or: [{ tenantId: { $in: ids } }, { _id: { $in: ids } }] })
    .toArray();
  const names = new Map<string, string>();
  for (const row of rows) {
    const name = row.name?.trim();
    if (!name) continue;
    if (row.tenantId) names.set(row.tenantId, name);
    if (row._id) names.set(String(row._id), name);
  }
  return names;
}

function metadataWithClient(
  entry: IdentityAuditEntry,
  clients: Map<string, string>
): Record<string, unknown> | null | undefined {
  const metadata = entry.metadata ?? null;
  const current = typeof metadata?.name === "string" ? metadata.name.trim() : "";
  if (current) return metadata;
  const name = clients.get(clientIdFromActivity(entry));
  if (!name) return metadata;
  return { ...(metadata ?? {}), name };
}
