import { getSubmissionAttachment } from "@/lib/experience/forms/attachments";

interface SubmissionJustificationCellProps {
  data: Record<string, unknown>;
}

export function SubmissionJustificationCell({ data }: SubmissionJustificationCellProps) {
  const justification = String(data.justification ?? "").trim();
  const attachment = getSubmissionAttachment(data);

  if (!justification && !attachment) return <span className="text-muted">—</span>;

  return (
    <div className="space-y-1">
      {justification ? <p>{justification}</p> : null}
      {attachment ? (
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex text-xs font-medium text-primary hover:underline"
        >
          Ver justificativo ({attachment.filename})
        </a>
      ) : (
        <p className="text-xs text-muted">Sin archivo adjunto</p>
      )}
    </div>
  );
}
