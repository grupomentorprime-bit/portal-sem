import { NextResponse } from "next/server";
import { requireCongressImport } from "@/app/api/congress/guard";
import { previewCongressWorkbook } from "@/lib/congress/import-workbook";
import { appendCongressAudit } from "@/lib/congress/repository";

export async function POST(request: Request) {
  try {
    const ctx = await requireCongressImport();
    if (ctx instanceof NextResponse) return ctx;

    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { ok: false, error: "Debe adjuntar un archivo Excel en el campo file." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const preview = previewCongressWorkbook(buffer);

    await appendCongressAudit({
      tenantId: ctx.tenantId,
      actorUserId: ctx.user._id,
      action: "import.preview",
      entity: "congress_import",
      metadata: {
        fileName: file instanceof File ? file.name : "archivo.xlsx",
        namedCount: preview.summary.namedCount,
        gapCount: preview.summary.gapCount,
        declaredTotal: preview.summary.declaredTotal,
        committed: false,
      },
    });

    return NextResponse.json({
      ok: true,
      locked: true,
      message:
        "Revisión previa lista. La importación definitiva permanece bloqueada hasta verificación explícita.",
      preview,
      fileName: file instanceof File ? file.name : "archivo.xlsx",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "No se pudo leer el Excel." },
      { status: 400 }
    );
  }
}
