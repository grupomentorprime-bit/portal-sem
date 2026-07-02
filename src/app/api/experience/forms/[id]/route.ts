import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { authorizeApiWrite } from "@/lib/identity/api-guard";
import {
  duplicateExperienceForm,
  getExperienceFormById,
  updateExperienceForm,
} from "@/lib/experience/forms/repository";
import type { ExperienceFormUpdate } from "@/types/experience-forms";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const ctx = await requirePermission("experience.forms.read");
    if (ctx instanceof NextResponse) return ctx;

    const form = await getExperienceFormById(ctx.tenantId, id);
    if (!form) {
      return NextResponse.json({ ok: false, error: "Formulario no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, form });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const denied = await authorizeApiWrite("experience.forms.manage", {
      action: "experience_form.update",
      entity: "experience_forms",
      entityId: id,
    });
    if (denied) return denied;

    const ctx = await requirePermission("experience.forms.manage");
    if (ctx instanceof NextResponse) return ctx;

    const body = (await request.json()) as ExperienceFormUpdate;
    const form = await updateExperienceForm(ctx.tenantId, id, body);

    if (!form) {
      return NextResponse.json({ ok: false, error: "Formulario no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, form });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const denied = await authorizeApiWrite("experience.forms.manage", {
      action: "experience_form.deactivate",
      entity: "experience_forms",
      entityId: id,
    });
    if (denied) return denied;

    const ctx = await requirePermission("experience.forms.manage");
    if (ctx instanceof NextResponse) return ctx;

    const form = await updateExperienceForm(ctx.tenantId, id, { active: false, visible: false });
    if (!form) {
      return NextResponse.json({ ok: false, error: "Formulario no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, form });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { action?: string };

    if (body.action === "duplicate") {
      const denied = await authorizeApiWrite("experience.forms.manage", {
        action: "experience_form.duplicate",
        entity: "experience_forms",
        entityId: id,
      });
      if (denied) return denied;

      const ctx = await requirePermission("experience.forms.manage");
      if (ctx instanceof NextResponse) return ctx;

      const form = await duplicateExperienceForm(ctx.tenantId, id);
      if (!form) {
        return NextResponse.json({ ok: false, error: "Formulario no encontrado." }, { status: 404 });
      }

      return NextResponse.json({ ok: true, form }, { status: 201 });
    }

    return NextResponse.json({ ok: false, error: "Acción no soportada." }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
