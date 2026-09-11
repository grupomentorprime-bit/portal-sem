import { NextResponse } from "next/server";
import { requireActiveTenant, tenantGuardResponse } from "@/core/security";
import { getAdmissionConfigUncached } from "@/lib/cms/admission-config";
import { getDatabase } from "@/lib/mongodb";
import { authorizeApiRead } from "@/lib/identity/api-guard";

export async function GET() {
  try {
    const denied = await authorizeApiRead("cms.pages.read");
    if (denied) return denied;

    const tenantCheck = await requireActiveTenant();
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
