import { NextResponse } from "next/server";
import { getActiveTenantId } from "@/core/identity";
import { getConvocatoriaBySlug } from "@/lib/admin/forms-center";
import {
  hydrateRosterStudentContact,
  searchConvocatoriaRoster,
} from "@/lib/experience/forms/roster";
import type { ConvocatoriaRosterStudent } from "@/types/convocatoria-roster";
import { publicInternalError } from "@/core/security/public-error";

function toPublicRosterSearchResult(
  student: ConvocatoriaRosterStudent
): Pick<ConvocatoriaRosterStudent, "id" | "fullName" | "generation" | "phone" | "email"> {
  return {
    id: student.id,
    fullName: student.fullName,
    generation: student.generation,
    phone: student.phone,
    email: student.email,
  };
}

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const tenant = await getActiveTenantId();
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Portal no configurado." }, { status: 503 });
    }

    const convocatoria = getConvocatoriaBySlug(slug);
    if (!convocatoria) {
      return NextResponse.json({ ok: false, error: "Convocatoria no encontrada." }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    if (query.length < 2) {
      return NextResponse.json({ ok: true, students: [], suggestions: [] });
    }

    const { students, suggestions, hasMore, suggestionsHasMore } = await searchConvocatoriaRoster(
      tenant,
      slug,
      query
    );
    const withContact = await hydrateRosterStudentContact(tenant, [...students, ...suggestions]);
    const contactById = new Map(withContact.map((student) => [student.id, student]));
    return NextResponse.json({
      ok: true,
      students: students.map((student) =>
        toPublicRosterSearchResult(contactById.get(student.id) ?? student)
      ),
      suggestions: suggestions.map((student) =>
        toPublicRosterSearchResult(contactById.get(student.id) ?? student)
      ),
      hasMore,
      suggestionsHasMore,
    });
  } catch (error) {
    return publicInternalError("roster-search", error);
  }
}
