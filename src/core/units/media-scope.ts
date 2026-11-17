import "server-only";

import { NextResponse } from "next/server";
import {
  canReadUnitDocument,
  documentListUnitIds,
  resolveUploadUnitId,
} from "@/core/units/access";
import type { UnitAccess } from "@/core/units/types";
import { loadSessionContext } from "@/lib/identity/sessions";

export async function unitAccessForTenant(tenantId: string): Promise<UnitAccess | undefined> {
  const session = await loadSessionContext();
  if (!session?.membership || session.session.tenantId !== tenantId) return undefined;
  return session.membership.unitAccess;
}

export function hiddenUnitDocumentResponse() {
  return NextResponse.json({ ok: false, error: "No encontrado." }, { status: 404 });
}

export async function assertReadableUnitDocument(
  tenantId: string,
  documentUnitId: string | null | undefined
): Promise<NextResponse | null> {
  const access = await unitAccessForTenant(tenantId);
  if (canReadUnitDocument(access, documentUnitId)) return null;
  return hiddenUnitDocumentResponse();
}

/** null = sin filtro. [] = el pedido no está autorizado. */
export async function mediaListUnitIds(
  tenantId: string,
  requestedUnitId?: string | null
): Promise<string[] | null> {
  const access = await unitAccessForTenant(tenantId);
  const own = documentListUnitIds(access);
  const requested = requestedUnitId?.trim() || "";
  if (own) {
    if (requested && !own.includes(requested)) return [];
    return requested ? [requested] : own;
  }
  return requested ? [requested] : null;
}

export async function mediaUploadUnitId(
  tenantId: string,
  requestedUnitId?: string | null
): Promise<{ ok: true; unitId?: string } | { ok: false; response: NextResponse }> {
  const access = await unitAccessForTenant(tenantId);
  const resolved = resolveUploadUnitId(access, requestedUnitId?.trim() || null);
  if (!resolved.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Elige una unidad a la que tengas acceso." },
        { status: 403 }
      ),
    };
  }
  return resolved;
}
