import { NextResponse } from "next/server";
import { getActiveTenantId } from "@/core/identity";
import { uploadMedia } from "@/lib/cms/media";
import {
  FORM_ATTACHMENT_MAX_BYTES,
  FORM_ATTACHMENT_MIME_TYPES,
  type FormSubmissionAttachment,
} from "@/lib/experience/forms/attachments";
import { getPublicExperienceForm } from "@/lib/experience/forms/repository";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tenant = await getActiveTenantId();
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Portal no configurado." }, { status: 503 });
    }

    const form = await getPublicExperienceForm(tenant, id);
    if (!form) {
      return NextResponse.json({ ok: false, error: "Formulario no disponible." }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { ok: false, error: "Debe adjuntar un archivo de respaldo." },
        { status: 422 }
      );
    }

    if (file.size > FORM_ATTACHMENT_MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: "El archivo no puede superar 5 MB." },
        { status: 422 }
      );
    }

    if (!FORM_ATTACHMENT_MIME_TYPES.includes(file.type as (typeof FORM_ATTACHMENT_MIME_TYPES)[number])) {
      return NextResponse.json(
        { ok: false, error: "Formato no permitido. Usa PDF o imagen (JPG, PNG, WEBP)." },
        { status: 422 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await uploadMedia({
      tenant,
      buffer,
      originalName: file.name,
      mimeType: file.type,
      folder: "Documentos",
      tags: ["Formulario", "Justificativo", form._id],
      alt: `Justificativo — ${form.name}`,
      createdBy: "public-form",
    });

    const attachment: FormSubmissionAttachment = {
      mediaId: asset._id,
      filename: asset.originalName,
      url: asset.url,
      mimeType: asset.mimeType,
      size: asset.size,
    };

    return NextResponse.json({ ok: true, attachment });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al subir el archivo." },
      { status: 500 }
    );
  }
}
