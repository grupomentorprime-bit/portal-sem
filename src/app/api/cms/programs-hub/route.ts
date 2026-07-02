import { NextResponse } from "next/server";
import { assertActiveTenant, tenantGuardResponse } from "@/core/security";
import { getAdmissionConfigUncached } from "@/lib/cms/admission-config";
import { getDatabase } from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantParam = searchParams.get("tenant") ?? "";
    const tenantCheck = await assertActiveTenant(tenantParam);
    if (!tenantCheck.ok) return tenantGuardResponse(tenantCheck);

    const tenant = tenantCheck.tenant;
    const db = await getDatabase();

    const rows = await db
      .collection("portal_interesados")
      .aggregate<{ _id: string; count: number }>([
        { $match: { tenant } },
        { $group: { _id: "$programId", count: { $sum: 1 } } },
      ])
      .toArray();

    const applicantCounts = Object.fromEntries(
      rows.filter((row) => row._id).map((row) => [row._id, row.count])
    );

    const admissionConfig = await getAdmissionConfigUncached(tenant);

    return NextResponse.json({
      ok: true,
      applicantCounts,
      featuredProgramId: admissionConfig.programsSection.featuredProgramId,
      totalApplicants: Object.values(applicantCounts).reduce((sum, count) => sum + count, 0),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
