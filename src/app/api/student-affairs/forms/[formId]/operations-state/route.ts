import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { getConvocatoriaByFormId } from "@/lib/admin/forms-center";
import { listFormSubmissions } from "@/lib/experience/forms/repository";
import { getConvocatoriaRoster } from "@/lib/experience/forms/roster";
import { resolveEffectiveRoleCodes } from "@/lib/identity/membership-role-codes";
import { buildStudentAffairsHandoffReport } from "@/lib/student-affairs/build-handoff-report";
import { dispatchHandoffValidationNotifications } from "@/lib/student-affairs/dispatch-handoff-validation";
import { getHandoffValidationStatus } from "@/lib/student-affairs/follow-up-access";
import {
  closeStudentAffairsOnSitePhase,
  getStudentAffairsFormOperations,
  reopenStudentAffairsOnSitePhase,
  validateStudentAffairsHandoffReport,
} from "@/lib/student-affairs/operations-state";
import { filterRosterStudentsForStudentAffairs } from "@/lib/student-affairs/roster-pending";
import {
  canAccessFormInStudentAffairs,
  canAccessStudentAffairsPanel,
  canReopenStudentAffairsJornada,
  canValidateStudentAffairsHandoff,
  filterSubmissionsForStudentAffairs,
  isStudentAffairsOperatorProfile,
  resolveStudentAffairsScope,
} from "@/lib/student-affairs/scope";

interface RouteContext {
  params: Promise<{ formId: string }>;
}

function canCloseOnSitePhase(ctx: import("@/types/identity").AuthContext): boolean {
  if (ctx.compatMode) return true;
  return (
    ctx.permissions.includes("student-affairs.checkin") ||
    ctx.permissions.includes("student-affairs.manage") ||
    ctx.permissions.includes("experience.forms.manage")
  );
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth();
    if (ctx instanceof NextResponse) return ctx;

    if (!canAccessStudentAffairsPanel(ctx)) {
      return NextResponse.json({ ok: false, error: "Acceso denegado." }, { status: 403 });
    }

    const { formId } = await context.params;
    if (!canAccessFormInStudentAffairs(ctx, formId)) {
      return NextResponse.json({ ok: false, error: "Formulario no asignado." }, { status: 403 });
    }

    const roleCodes = await resolveEffectiveRoleCodes(ctx);
    const operations = await getStudentAffairsFormOperations(ctx.tenantId, formId);
    const handoffValidationStatus = getHandoffValidationStatus(operations);

    return NextResponse.json({
      ok: true,
      phase: operations?.phase ?? "on-site",
      operations,
      handoffValidationStatus,
      permissions: {
        canCloseOnSite: canCloseOnSitePhase(ctx),
        canReopenOnSite: canReopenStudentAffairsJornada(ctx, roleCodes),
        canValidateHandoff: canValidateStudentAffairsHandoff(ctx, roleCodes),
        isStudentAffairsOperator: isStudentAffairsOperatorProfile(roleCodes),
        followUpLocksAttendees: handoffValidationStatus === "validated",
      },
    });
  } catch (error) {
    console.error("[student-affairs/operations-state GET]", error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth();
    if (ctx instanceof NextResponse) return ctx;

    if (!canAccessStudentAffairsPanel(ctx)) {
      return NextResponse.json({ ok: false, error: "Acceso denegado." }, { status: 403 });
    }

    const { formId } = await context.params;
    if (!canAccessFormInStudentAffairs(ctx, formId)) {
      return NextResponse.json({ ok: false, error: "Formulario no asignado." }, { status: 403 });
    }

    const roleCodes = await resolveEffectiveRoleCodes(ctx);
    const body = (await request.json()) as { action?: string };
    const action = body.action;

    if (action === "close-on-site") {
      if (!canCloseOnSitePhase(ctx)) {
        return NextResponse.json({ ok: false, error: "Sin permiso para cerrar la jornada." }, { status: 403 });
      }

      const existing = await getStudentAffairsFormOperations(ctx.tenantId, formId);
      if (existing?.phase === "follow-up") {
        return NextResponse.json({ ok: false, error: "La jornada ya fue cerrada." }, { status: 409 });
      }

      const scope = resolveStudentAffairsScope(ctx);
      const { submissions } = await listFormSubmissions(ctx.tenantId, { formId, limit: 2000 });
      const filtered = filterSubmissionsForStudentAffairs(submissions, scope);
      const convocatoria = getConvocatoriaByFormId(formId);
      const roster = convocatoria
        ? await getConvocatoriaRoster(ctx.tenantId, convocatoria.slug)
        : null;
      const rosterStudents = roster?.students ?? [];
      const scopedRoster = filterRosterStudentsForStudentAffairs(rosterStudents, scope);
      const report = buildStudentAffairsHandoffReport({
        submissions: filtered,
        rosterStudents: scopedRoster,
        operatorUserId: ctx.user._id,
        operatorName: ctx.user.displayName,
      });

      const operations = await closeStudentAffairsOnSitePhase({
        tenant: ctx.tenantId,
        formId,
        operatorUserId: ctx.user._id,
        operatorName: ctx.user.displayName,
        report,
      });

      return NextResponse.json({ ok: true, operations, report });
    }

    if (action === "validate-handoff") {
      if (!canValidateStudentAffairsHandoff(ctx, roleCodes)) {
        return NextResponse.json(
          { ok: false, error: "Sin permiso para validar el informe." },
          { status: 403 }
        );
      }

      const existing = await getStudentAffairsFormOperations(ctx.tenantId, formId);
      if (!existing || existing.phase !== "follow-up") {
        return NextResponse.json(
          { ok: false, error: "No hay informe pendiente de validación." },
          { status: 409 }
        );
      }

      if (getHandoffValidationStatus(existing) === "validated") {
        return NextResponse.json({ ok: false, error: "El informe ya fue validado." }, { status: 409 });
      }

      const operations = await validateStudentAffairsHandoffReport({
        tenant: ctx.tenantId,
        formId,
        validatorUserId: ctx.user._id,
        validatorName: ctx.user.displayName,
      });

      if (!operations) {
        return NextResponse.json({ ok: false, error: "No se pudo validar el informe." }, { status: 500 });
      }

      const report = existing.handoffReport;
      let dispatch = null;
      if (report) {
        try {
          dispatch = await dispatchHandoffValidationNotifications({
            tenantId: ctx.tenantId,
            formId,
            validatorUserId: ctx.user._id,
            validatorName: ctx.user.displayName,
            report,
          });
        } catch (dispatchError) {
          console.error("[student-affairs/validate-handoff dispatch]", dispatchError);
          dispatch = {
            emailsSent: 0,
            encargadaNotifications: 0,
            qualityNotifications: 0,
            errors: ["No se pudieron enviar los avisos automáticos."],
          };
        }
      }

      return NextResponse.json({ ok: true, operations, dispatch });
    }

    if (action === "reopen-on-site") {
      if (!canReopenStudentAffairsJornada(ctx, roleCodes)) {
        return NextResponse.json(
          { ok: false, error: "Solo un encargado de calidad puede reabrir la jornada." },
          { status: 403 }
        );
      }

      const operations = await reopenStudentAffairsOnSitePhase(ctx.tenantId, formId);
      return NextResponse.json({ ok: true, operations });
    }

    return NextResponse.json({ ok: false, error: "Acción inválida." }, { status: 400 });
  } catch (error) {
    console.error("[student-affairs/operations-state PATCH]", error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
