import { NextResponse } from "next/server";
import { getActiveTenantId } from "@/core/identity";
import { uploadMedia } from "@/lib/cms/media";
import { assertS3StorageForUpload } from "@/lib/cms/storage-config";
import {
  FORM_ATTACHMENT_MAX_BYTES,
  hasSubmissionAttachment,
  inferAttachmentMimeType,
  isAllowedAttachmentMimeType,
  type FormSubmissionAttachment,
} from "@/lib/experience/forms/attachments";
import {
  getFormSubmissionById,
  updateFormSubmissionParticipantJustification,
} from "@/lib/experience/forms/repository";
import { verifySubmissionParticipantToken } from "@/lib/experience/forms/submission-participant-token";

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

    const submission = await getFormSubmissionById(tenant, id);
    if (!submission) {
      return NextResponse.json({ ok: false, error: "Registro no encontrado." }, { status: 404 });
    }

    if (String(submission.data.attendance ?? "") !== "no") {
      return NextResponse.json(
        { ok: false, error: "Este registro no requiere justificación de inasistencia." },
        { status: 422 }
      );
    }

    if (hasSubmissionAttachment(submission.data.justificationAttachment)) {
      return NextResponse.json(
        { ok: false, error: "Ya recibimos tu justificación. El equipo académico la revisará." },
        { status: 409 }
      );
    }

    const formData = await request.formData();
    const token = String(formData.get("token") ?? "");
    const justification = String(formData.get("justification") ?? "").trim();
    const file = formData.get("file");

    if (!verifySubmissionParticipantToken(token, id)) {
      return NextResponse.json({ ok: false, error: "Enlace inválido o expirado." }, { status: 403 });
    }

    if (justification.length < 10) {
      return NextResponse.json(
        { ok: false, error: "Describe el motivo con al menos 10 caracteres." },
        { status: 422 }
      );
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { ok: false, error: "Debe adjuntar un respaldo documental." },
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

    await assertS3StorageForUpload();

    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await uploadMedia({
      tenant,
      buffer,
      originalName: file.name,
      mimeType,
      folder: "Documentos",
      tags: ["Formulario", "Justificativo", submission.formId],
      alt: `Justificativo — ${String(submission.data.fullName ?? submission.data.name ?? "Participante")}`,
      createdBy: "participant-justify",
    });

    const attachment: FormSubmissionAttachment = {
      mediaId: asset._id,
      filename: asset.originalName,
      url: asset.url,
      mimeType: asset.mimeType,
      size: asset.size,
    };

    const updated = await updateFormSubmissionParticipantJustification(tenant, id, {
      justification,
      justificationAttachment: attachment,
    });

    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "No se pudo guardar la justificación." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, message: "Justificación enviada correctamente." });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Error desconocido.";
    const isConfigError =
      message.includes("Integraciones") || message.includes("almacenamiento");
    return NextResponse.json({ ok: false, error: message }, { status: isConfigError ? 503 : 500 });
  }
}
