import { ParticipantJustificationForm } from "@/components/portal/experience/forms/ParticipantJustificationForm";
import { hasSubmissionAttachment } from "@/lib/experience/forms/attachments";
import { getActivePortal } from "@/lib/portal/site";
import { getFormSubmissionById } from "@/lib/experience/forms/repository";
import { verifySubmissionParticipantToken } from "@/lib/experience/forms/submission-participant-token";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ submissionId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export const metadata: Metadata = {
  title: "Justificar inasistencia — Portal SEM",
  robots: { index: false, follow: false },
};

export default async function JustificarAsistenciaPage({ params, searchParams }: PageProps) {
  const { submissionId } = await params;
  const { token = "" } = await searchParams;

  if (!token || !verifySubmissionParticipantToken(token, submissionId)) {
    notFound();
  }

  const ctx = await getActivePortal();
  if (!ctx) notFound();

  const submission = await getFormSubmissionById(ctx.tenant, submissionId);
  if (!submission || String(submission.data.attendance ?? "") !== "no") {
    notFound();
  }

  const participantName = String(
    submission.data.fullName ?? submission.data.name ?? "Participante"
  );

  const alreadySubmitted = hasSubmissionAttachment(submission.data.justificationAttachment);

  return (
    <main className="min-h-[60vh] bg-background-muted/30 px-4 py-12">
      {alreadySubmitted ? (
        <div className="mx-auto max-w-lg rounded-2xl border border-border bg-background p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-foreground">Justificación ya recibida</p>
          <p className="mt-3 text-sm text-muted">
            Hola, {participantName.split(/\s+/)[0] || participantName}. Ya registramos tu
            justificativo. El equipo académico te informará por correo cuando revise tu caso.
          </p>
        </div>
      ) : (
        <ParticipantJustificationForm
          submissionId={submissionId}
          token={token}
          participantName={participantName}
        />
      )}
    </main>
  );
}
