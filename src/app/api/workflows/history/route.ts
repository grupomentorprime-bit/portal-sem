import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { getHistory } from "@/core/workflow";
import { listRecentHistory } from "@/lib/workflow/history";

export async function GET(request: Request) {
  try {
    const auth = await requirePermission("workflow.read");
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const instanceId = searchParams.get("instanceId");

    if (instanceId) {
      const history = await getHistory(instanceId);
      return NextResponse.json({ ok: true, history });
    }

    const history = await listRecentHistory(auth.tenantId, 50);
    return NextResponse.json({ ok: true, history });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
