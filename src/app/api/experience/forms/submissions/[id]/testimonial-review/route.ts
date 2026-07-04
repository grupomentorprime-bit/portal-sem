import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { authorizeApiWrite } from "@/lib/identity/api-guard";
import { createContentItem } from "@/lib/content/content-write";
import {
  getFormSubmissionById,
  updateFormSubmissionTestimonialReview,
} from "@/lib/experience/forms/repository";
import {
  buildTestimonialAuthor,
  buildTestimonialProgram,
  formatGenerationRole,
  TESTIMONIAL_FORM_LIMITS,
} from "@/lib/experience/forms/testimonial-limits";
import { slugify } from "@/lib/slugify";
import {
  TESTIMONIAL_REVIEW_STATUSES,
  type ExperienceFormTestimonialReview,
  type TestimonialReviewStatus,
} from "@/types/experience-forms";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function isTestimonialReviewStatus(value: unknown): value is TestimonialReviewStatus {
  return typeof value === "string" && TESTIMONIAL_REVIEW_STATUSES.includes(value as TestimonialReviewStatus);
}

function trimOptional(value: unknown): string | undefined {
  const text = String(value ?? "").trim();
  return text || undefined;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const denied = await authorizeApiWrite("experience.forms.manage", {
      action: "experience_form_submission.testimonial_review",
      entity: "experience_form_submissions",
      entityId: id,
    });
    if (denied) return denied;

    const ctx = await requirePermission("experience.forms.manage");
    if (ctx instanceof NextResponse) return ctx;

    const existing = await getFormSubmissionById(ctx.tenantId, id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Respuesta no encontrada." }, { status: 404 });
    }

    if (existing.destination !== "testimonial_submission") {
      return NextResponse.json(
        { ok: false, error: "Esta respuesta no corresponde a un testimonio." },
        { status: 400 }
      );
    }

    const body = (await request.json()) as Partial<ExperienceFormTestimonialReview> & {
      publishNow?: boolean;
    };

    if (!isTestimonialReviewStatus(body.status)) {
      return NextResponse.json({ ok: false, error: "Estado de revisión inválido." }, { status: 400 });
    }

    const preview = {
      quote: trimOptional(body.editedQuote) ?? trimOptional(existing.data.quote) ?? "",
      author:
        trimOptional(body.editedAuthor) ??
        buildTestimonialAuthor(existing.data.honorific, existing.data.fullName),
      role:
        trimOptional(body.editedRole) ?? formatGenerationRole(existing.data.generation),
      program:
        trimOptional(body.editedProgram) ??
        buildTestimonialProgram(existing.data.churchSection, existing.data.city),
    };

    const publishQuote = body.publishQuote !== false;
    const publishAuthor = body.publishAuthor !== false;
    const publishGeneration = body.publishGeneration !== false;
    const publishAffiliation = body.publishAffiliation !== false;

    let publishedTestimonialId = existing.testimonialReview?.publishedTestimonialId;

    if (body.status === "published" || body.publishNow) {
      if (!publishQuote || !preview.quote) {
        return NextResponse.json(
          { ok: false, error: "Debe publicar al menos el testimonio (cita)." },
          { status: 400 }
        );
      }
      if (!publishAuthor || !preview.author) {
        return NextResponse.json(
          { ok: false, error: "Debe publicar el nombre del autor." },
          { status: 400 }
        );
      }

      const slugBase = slugify(preview.author) || `testimonio-${Date.now()}`;
      const doc = await createContentItem({
        tenant: ctx.tenantId,
        collection: "academy_testimonials",
        title: preview.author.slice(0, TESTIMONIAL_FORM_LIMITS.author),
        author: preview.author.slice(0, TESTIMONIAL_FORM_LIMITS.author),
        quote: preview.quote.slice(0, TESTIMONIAL_FORM_LIMITS.quote),
        role:
          publishGeneration && preview.role
            ? preview.role.slice(0, TESTIMONIAL_FORM_LIMITS.generationRole)
            : undefined,
        program:
          publishAffiliation && preview.program
            ? preview.program.slice(0, TESTIMONIAL_FORM_LIMITS.program)
            : undefined,
        status: "published",
        rating: 5,
        slug: `${slugBase}-${Date.now()}`,
      });

      publishedTestimonialId = doc._id;
    }

    const review: ExperienceFormTestimonialReview = {
      status: body.publishNow || publishedTestimonialId ? "published" : body.status,
      publishQuote,
      publishAuthor,
      publishGeneration,
      publishAffiliation,
      editedQuote: trimOptional(body.editedQuote),
      editedAuthor: trimOptional(body.editedAuthor),
      editedRole: trimOptional(body.editedRole),
      editedProgram: trimOptional(body.editedProgram),
      publishedTestimonialId,
      reviewNotes: trimOptional(body.reviewNotes),
    };

    const submission = await updateFormSubmissionTestimonialReview(
      ctx.tenantId,
      id,
      review,
      ctx.user.displayName
    );

    if (!submission) {
      return NextResponse.json({ ok: false, error: "Respuesta no encontrada." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, submission });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
