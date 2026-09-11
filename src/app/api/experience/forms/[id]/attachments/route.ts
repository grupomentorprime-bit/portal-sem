import { NextResponse } from "next/server";
import { getActiveTenantId } from "@/core/identity";
import { uploadMedia } from "@/lib/cms/media";
import { assertS3StorageForUpload } from "@/lib/cms/storage-config";
import {
  FORM_ATTACHMENT_MAX_BYTES,
  inferAttachmentMimeType,
  isAllowedAttachmentMimeType,
  type FormSubmissionAttachment,
} from "@/lib/experience/forms/attachments";
import { getDirectAccessibleExperienceForm } from "@/lib/experience/forms/repository";
import { logServerError } from "@/core/security/redact";
import {
  STORAGE_INTEGRATION_DECRYPT_MESSAGE,
  STORAGE_INTEGRATION_INCOMPLETE_MESSAGE,
  STORAGE_NOT_CONFIGURED_MESSAGE,
} from "@/lib/cms/storage-config";

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

    const form = await getDirectAccessibleExperienceForm(tenant, id);
    if (!form) {
      return NextResponse.json({ ok: false, error: "Formulario no disponible." }, { status: 404 });
    }

    await assertS3StorageForUpload(tenant);

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

    const mimeType = inferAttachmentMimeType(file);
    if (!mimeType || !isAllowedAttachmentMimeType(mimeType)) {
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
      mimeType,
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
    logServerError("form-attachments", error);
    const message = error instanceof Error ? error.message : "";
    const isConfigError =
      message === STORAGE_NOT_CONFIGURED_MESSAGE ||
      message === STORAGE_INTEGRATION_INCOMPLETE_MESSAGE ||
      message === STORAGE_INTEGRATION_DECRYPT_MESSAGE;
    return NextResponse.json(
      { ok: false, error: isConfigError ? message : "No se pudo subir el archivo." },
      { status: isConfigError ? 503 : 500 }
    );
  }
}
