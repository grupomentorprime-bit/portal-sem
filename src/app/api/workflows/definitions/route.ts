import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { ensureSystemDefinitions, listDefinitions } from "@/lib/workflow/definitions";
import { listActiveInstances } from "@/lib/workflow/instances";

export async function GET() {
  try {
    const auth = await requirePermission("workflow.read");
    if (auth instanceof NextResponse) return auth;

    await ensureSystemDefinitions(auth.tenantId);
    const [definitions, instances] = await Promise.all([
      listDefinitions(auth.tenantId),
      listActiveInstances(auth.tenantId),
    ]);

    return NextResponse.json({ ok: true, definitions, instances });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
