import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { requireAuth } from "@/core/identity";
import { StudentAffairsTeamClient } from "@/components/admin/student-affairs/StudentAffairsTeamClient";
import { STUDENT_AFFAIRS_HOME_PATH } from "@/lib/admin/nav-access";
import { resolveEffectiveRoleCodes } from "@/lib/identity/membership-role-codes";
import { canManageStudentAffairsScope } from "@/lib/student-affairs/scope";

export const dynamic = "force-dynamic";

export default async function StudentAffairsTeamPage() {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) {
    redirect(STUDENT_AFFAIRS_HOME_PATH);
  }

  const roleCodes = await resolveEffectiveRoleCodes(ctx);
  if (!canManageStudentAffairsScope(ctx, roleCodes)) {
    redirect(STUDENT_AFFAIRS_HOME_PATH);
  }

  return <StudentAffairsTeamClient />;
}
