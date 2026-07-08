"use client";

import { useEffect, useState } from "react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ConfirmOptions } from "@/components/admin/kit/hooks/useConfirmDialog";
import { StatusBadge } from "@/components/admin/kit";
import {
  absenceCategoryLabel,
  classifyAbsenceSubmission,
} from "@/lib/student-affairs/absence-categories";
import {
  absenceContactChannelLabel,
  absenceContactOutcomeLabel,
  formatAbsenceContactDate,
} from "@/lib/student-affairs/absence-contact-labels";
import { CONFIRMED_NO_SHOW_ROW_LABEL } from "@/lib/student-affairs/operations-labels";
import { formatJustificationDeadline } from "@/lib/experience/forms/absence-justification-deadline";
import {
  formatSubmissionPhone,
  getSubmissionGeneration,
} from "@/lib/admin/forms-center";
import { formatGenerationDisplay } from "@/lib/experience/forms/generations";
import {
  OPERATOR_CONTACT_CHANNEL_OPTIONS,
  type OperatorManualContactChannel,
} from "@/lib/student-affairs/operator-contact-channels";
import {
  DropoutClosureForm,
  DropoutRecordCard,
} from "@/components/admin/student-affairs/DropoutClosureSection";
import { isDropoutContactOutcome, validateDropoutNotes, DROPOUT_NOTES_MIN_LENGTH } from "@/lib/student-affairs/participant-closure";
import {
  contactNotesPlaceholder,
  defaultContactOutcomeForChannel,
  getContactOutcomeOptions,
  isContactOutcomeValidForChannel,
  isFailedContactOutcomeForChannel,
} from "@/lib/student-affairs/operator-contact-outcomes";
import type {
  AbsenceContactLogEntry,
  AbsenceContactOutcome,
  ExperienceFormSubmission,
} from "@/types/experience-forms";
import {
  CONTACT_INFO_REQUIRED_MESSAGE,
  rosterStudentHasCompleteContactInfo,
  submissionNeedsContactInfoUpdate,
} from "@/lib/student-affairs/contact-info";
import type { ConvocatoriaRosterStudent } from "@/types/convocatoria-roster";

export type ParticipantManageTarget =
  | { kind: "submission"; submission: ExperienceFormSubmission }
  | { kind: "roster"; student: ConvocatoriaRosterStudent };

interface ParticipantManageDrawerProps {
  formId: string;
  target: ParticipantManageTarget;
  canDeleteSubmissions: boolean;
  canReclassifyGeneration: boolean;
  isSaving: boolean;
  onSiteClosed?: boolean;
  followUpLocked?: boolean;
  onClose: () => void;
  onCheckIn: (present: boolean) => void;
  onMarkAbsent: () => void;
  onMarkArrivedFromAbsence: () => void;
  onSendJustificationEmail: () => void;
  onPhoneContact: () => void;
  onReviewAbsence: () => void;
  onReclassifyGeneration: () => void;
  onDelete: () => void;
  onRosterCheckIn: () => void;
  onRosterMarkAbsent: () => void;
  onRosterUpdated: (student: ConvocatoriaRosterStudent) => void;
  onSubmissionUpdated: (submission: ExperienceFormSubmission) => void;
  onRosterJustificationSent: (submission: ExperienceFormSubmission) => void;
  confirmAction: (options: ConfirmOptions) => Promise<boolean>;
}

function ParticipantSummary({
  name,
  email,
  phone,
  generation,
  statusLabel,
  statusTone,
}: {
  name: string;
  email?: string;
  phone?: string;
  generation?: string;
  statusLabel: string;
  statusTone: "active" | "pending" | "info" | "neutral" | "error";
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-background-muted/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{name}</p>
          {email ? <p className="truncate text-sm text-muted">{email}</p> : null}
        </div>
        <StatusBadge tone={statusTone} label={statusLabel} />
      </div>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        {generation ? (
          <div>
            <dt className="text-xs text-muted">Generación</dt>
            <dd className="font-medium text-foreground">{generation}</dd>
          </div>
        ) : null}
        {phone ? (
          <div>
            <dt className="text-xs text-muted">Teléfono</dt>
            <dd className="font-medium text-foreground">{phone}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function DrawerHint({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted">{children}</p>;
}

function ContactInfoRequiredBanner() {
  return (
    <p className="rounded-lg border border-[color-mix(in_srgb,var(--color-warning)_40%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-warning)_8%,white)] px-3 py-2 text-sm text-foreground">
      {CONTACT_INFO_REQUIRED_MESSAGE}
    </p>
  );
}

function PrimaryDrawerAction({
  label,
  loading,
  disabled,
  onClick,
  variant = "success",
}: {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  variant?: "success" | "primary" | "outline";
}) {
  return (
    <Button
      variant={variant}
      className="w-full"
      loading={loading}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

function ActionSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{title}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function ContactLogList({ entries }: { entries: AbsenceContactLogEntry[] }) {
  if (!entries.length) return null;
  return (
    <div className="space-y-2 rounded-xl border border-border p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">Gestiones del expediente</p>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li key={entry.id} className="border-b border-border pb-2 text-sm last:border-0 last:pb-0">
            <span className="font-medium text-foreground">
              {absenceContactChannelLabel(entry.channel)}
            </span>
            <span className="text-muted"> · {formatAbsenceContactDate(entry.contactedAt)}</span>
            {entry.operatorName ? (
              <span className="text-muted"> · {entry.operatorName}</span>
            ) : null}
            {entry.email ? <p className="mt-0.5 text-xs text-muted">Correo: {entry.email}</p> : null}
            {entry.notes ? <p className="mt-0.5 text-muted">{entry.notes}</p> : null}
            {entry.contactOutcome ? (
              <p className="mt-0.5 text-xs text-muted">
                {absenceContactOutcomeLabel(entry.contactOutcome, entry.channel)}
              </p>
            ) : null}
            {entry.startedJustificationDeadline ? (
              <p className="mt-0.5 text-xs text-primary">Inició plazo de 3 días para justificar</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RosterContactSection({
  formId,
  student,
  isSaving,
  allowManagement = true,
  onUpdated,
  onJustificationSent,
  confirmAction,
}: {
  formId: string;
  student: ConvocatoriaRosterStudent;
  isSaving: boolean;
  allowManagement?: boolean;
  onUpdated: (student: ConvocatoriaRosterStudent) => void;
  onJustificationSent: (submission: ExperienceFormSubmission) => void;
  confirmAction: (options: ConfirmOptions) => Promise<boolean>;
}) {
  const [email, setEmail] = useState(student.email ?? "");
  const [phone, setPhone] = useState(student.phone ?? "");
  const [notes, setNotes] = useState("");
  const [channel, setChannel] = useState<OperatorManualContactChannel>("phone");
  const [contactOutcome, setContactOutcome] = useState<AbsenceContactOutcome>("reached");
  const [startDeadline, setStartDeadline] = useState(true);
  const [savingContact, setSavingContact] = useState(false);
  const [savingFields, setSavingFields] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useDeferredEffect(() => {
    setEmail(student.email ?? "");
    setPhone(student.phone ?? "");
  }, [student.email, student.phone, student.id]);

  useDeferredEffect(() => {
    if (!isContactOutcomeValidForChannel(channel, contactOutcome)) {
      setContactOutcome(defaultContactOutcomeForChannel(channel));
    }
  }, [channel, contactOutcome]);

  useDeferredEffect(() => {
    if (isFailedContactOutcomeForChannel(channel, contactOutcome)) {
      setStartDeadline(false);
    }
  }, [contactOutcome, channel]);

  const outreach = student.outreachLog ?? [];
  const hasDeadlineStarted = outreach.some((entry) => entry.startedJustificationDeadline);
  const outcomeOptions = getContactOutcomeOptions(channel);

  const saveContactFields = async () => {
    setSavingFields(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/student-affairs/forms/${encodeURIComponent(formId)}/roster/${encodeURIComponent(student.id)}/outreach`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), phone: phone.trim() }),
        }
      );
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudieron guardar los datos.");
        return;
      }
      onUpdated(data.student as ConvocatoriaRosterStudent);
    } catch {
      setError("Error de red al guardar.");
    } finally {
      setSavingFields(false);
    }
  };

  const saveContact = async () => {
    setSavingContact(true);
    setError(null);
    try {
      const trimmedNotes = notes.trim();
      if (isDropoutContactOutcome(contactOutcome)) {
        const validated = validateDropoutNotes(trimmedNotes);
        if (!validated.ok) {
          setError(validated.error);
          setSavingContact(false);
          return;
        }
      }
      const res = await fetch(
        `/api/student-affairs/forms/${encodeURIComponent(formId)}/roster/${encodeURIComponent(student.id)}/outreach`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "contact",
            notes: trimmedNotes,
            channel,
            startJustificationDeadline: startDeadline,
            contactOutcome,
          }),
        }
      );
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo registrar el contacto.");
        return;
      }
      setNotes("");
      setContactOutcome("reached");
      onUpdated(data.student as ConvocatoriaRosterStudent);
    } catch {
      setError("Error de red al registrar el contacto.");
    } finally {
      setSavingContact(false);
    }
  };

  const sendJustification = async () => {
    const confirmed = await confirmAction({
      title: "Marcar inasistencia y enviar correo",
      description: `Se registrará la inasistencia de ${student.fullName} y se enviará la solicitud de justificación a ${email.trim()}. El plazo de 3 días comenzará al enviar la notificación por correo.`,
      confirmLabel: "Marcar inasistencia y enviar",
      destructive: true,
    });
    if (!confirmed) return;

    setSendingEmail(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/student-affairs/forms/${encodeURIComponent(formId)}/roster/${encodeURIComponent(student.id)}/outreach`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send-justification",
            email: email.trim(),
          }),
        }
      );
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo enviar la solicitud.");
        return;
      }
      if (data.submission) {
        onJustificationSent(data.submission as ExperienceFormSubmission);
      }
    } catch {
      setError("Error de red al enviar la solicitud.");
    } finally {
      setSendingEmail(false);
    }
  };

  const busy = isSaving || savingFields || savingContact || sendingEmail;
  const canSaveContactFields = email.trim().length > 0 && phone.trim().length > 0;
  const canStartDeadlineNow =
    !hasDeadlineStarted && !isFailedContactOutcomeForChannel(channel, contactOutcome);
  const canRegisterContact = notes.trim().length > 0;
  const canSendJustification = email.trim().length > 0;

  return (
    <div className="space-y-5">
      <ActionSection title="Datos de contacto">
        <DrawerHint>
          Registre correo y teléfono antes de gestionar inasistencias o contactos. Ambos son
          obligatorios.
        </DrawerHint>
        <Input
          label="Correo del participante"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="correo@ejemplo.cl"
        />
        <Input
          label="Teléfono"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+56 9 …"
        />
        <Button
          variant="outline"
          loading={savingFields}
          disabled={busy || !canSaveContactFields}
          onClick={() => void saveContactFields()}
        >
          Guardar correo y teléfono
        </Button>
      </ActionSection>

      {!allowManagement ? null : (
        <>
      {outreach.length > 0 ? <ContactLogList entries={outreach} /> : null}

      <ActionSection title="Registrar gestión">
        <DrawerHint>
          Documente llamadas, WhatsApp o contacto presencial. Los correos de justificación quedan
          registrados automáticamente al enviarlos desde aquí.
        </DrawerHint>
        <Select
          label="Canal de contacto"
          value={channel}
          onChange={(event) => setChannel(event.target.value as OperatorManualContactChannel)}
          options={OPERATOR_CONTACT_CHANNEL_OPTIONS}
        />
        <Select
          label="Resultado"
          value={contactOutcome}
          onChange={(event) => setContactOutcome(event.target.value as AbsenceContactOutcome)}
          options={outcomeOptions}
        />
        <Textarea
          label="Detalle de la gestión"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={contactNotesPlaceholder(channel)}
          rows={3}
        />
        {canStartDeadlineNow ? (
          <Checkbox
            checked={startDeadline}
            onChange={(event) => setStartDeadline(event.target.checked)}
            label="Informó plazo de 3 días para justificar (inicia al notificar al participante)"
          />
        ) : isDropoutContactOutcome(contactOutcome) ? (
          <DrawerHint>
            Al registrar deserción confirmada, use un antecedente de al menos {DROPOUT_NOTES_MIN_LENGTH}{" "}
            caracteres. El participante quedará como <strong>Desertor</strong>.
          </DrawerHint>
        ) : hasDeadlineStarted ? (
          <DrawerHint>
            El plazo ya fue informado en un contacto anterior; esta gestión quedará en el historial.
          </DrawerHint>
        ) : (
          <DrawerHint>No se inicia plazo si el contacto no fue exitoso.</DrawerHint>
        )}
        {!canRegisterContact ? (
          <DrawerHint>Escriba el detalle del contacto para habilitar el registro.</DrawerHint>
        ) : null}
        <Button
          variant="outline"
          className="w-full"
          loading={savingContact}
          disabled={busy || !canRegisterContact}
          onClick={() => void saveContact()}
        >
          Registrar gestión
        </Button>
      </ActionSection>

      <ActionSection title="Cerrar inasistencia">
        <DrawerHint>
          Use esta acción cuando confirme que no asistirá. Se enviará la solicitud de excusa por
          correo e iniciará el plazo de 3 días.
        </DrawerHint>
        {!canSendJustification ? (
          <DrawerHint>Ingrese y guarde un correo válido arriba para habilitar esta acción.</DrawerHint>
        ) : null}
        <Button
          variant="outline"
          className="w-full"
          loading={sendingEmail}
          disabled={busy || !canSendJustification}
          onClick={() => void sendJustification()}
        >
          Marcar inasistencia y enviar solicitud por correo
        </Button>
      </ActionSection>
        </>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function SubmissionContactInfoSection({
  submission,
  onUpdated,
}: {
  submission: ExperienceFormSubmission;
  onUpdated: (submission: ExperienceFormSubmission) => void;
}) {
  const submissionId = submission._id ?? "";
  const existingEmail = String(submission.data.email ?? "").trim();
  const existingPhone = String(submission.data.phone ?? "").trim();
  const [email, setEmail] = useState(existingEmail);
  const [phone, setPhone] = useState(existingPhone);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedEmail = existingEmail || email.trim();
  const resolvedPhone = existingPhone || phone.trim();
  const canSave = Boolean(resolvedEmail && resolvedPhone) && !saving;

  if (existingEmail && existingPhone) return null;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const body: { email?: string; phone?: string } = {};
      if (!existingEmail && email.trim()) body.email = email.trim();
      if (!existingPhone && phone.trim()) body.phone = phone.trim();

      const res = await fetch(
        `/api/student-affairs/submissions/${encodeURIComponent(submissionId)}/contact-info`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo actualizar los datos.");
        return;
      }
      onUpdated(data.submission as ExperienceFormSubmission);
    } catch {
      setError("Error de red al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ActionSection title="Datos de contacto">
      <DrawerHint>
        Complete correo y teléfono para habilitar el resto de acciones de gestión.
      </DrawerHint>
      {!existingEmail ? (
        <Input
          label="Correo del participante"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="correo@ejemplo.cl"
        />
      ) : null}
      {!existingPhone ? (
        <Input
          label="Teléfono"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+56 9 …"
        />
      ) : null}
      <Button
        variant="outline"
        loading={saving}
        disabled={!canSave}
        onClick={() => void save()}
      >
        Guardar datos de contacto
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </ActionSection>
  );
}

export function ParticipantManageDrawer({
  formId,
  target,
  canDeleteSubmissions,
  canReclassifyGeneration,
  isSaving,
  onSiteClosed = false,
  followUpLocked = false,
  onClose,
  onCheckIn,
  onMarkAbsent,
  onMarkArrivedFromAbsence,
  onSendJustificationEmail,
  onPhoneContact,
  onReviewAbsence,
  onReclassifyGeneration,
  onDelete,
  onRosterCheckIn,
  onRosterMarkAbsent,
  onRosterUpdated,
  onSubmissionUpdated,
  onRosterJustificationSent,
  confirmAction,
}: ParticipantManageDrawerProps) {
  if (target.kind === "roster") {
    const { student } = target;
    const phone = formatSubmissionPhone(student.phone);
    const needsContactInfo = !rosterStudentHasCompleteContactInfo(student);

    return (
      <div className="space-y-5">
        <ParticipantSummary
          name={student.fullName}
          email={student.email}
          phone={phone !== "—" ? phone : undefined}
          generation={formatGenerationDisplay(student.generation)}
          statusLabel="Sin registro en formulario"
          statusTone="neutral"
        />

        {needsContactInfo ? <ContactInfoRequiredBanner /> : null}

        {!needsContactInfo ? (
          <ActionSection title="Acción en jornada">
            {onSiteClosed ? (
              <DrawerHint>
                La jornada presencial ya fue cerrada. Asuntos Estudiantiles continúa el seguimiento
                desde contacto e inasistencia.
              </DrawerHint>
            ) : (
              <>
                <DrawerHint>
                  Está en nómina pero no completó el formulario. Si asistió hoy, regístrelo aquí.
                </DrawerHint>
                <PrimaryDrawerAction
                  label="Registrar asistencia"
                  loading={isSaving}
                  disabled={isSaving}
                  onClick={onRosterCheckIn}
                />
              </>
            )}
            <Button
              variant="outline"
              className="w-full"
              loading={isSaving}
              disabled={isSaving}
              onClick={onRosterMarkAbsent}
            >
              Marcar inasistencia (sin formulario)
            </Button>
          </ActionSection>
        ) : null}

        <RosterContactSection
          formId={formId}
          student={student}
          isSaving={isSaving}
          allowManagement={!needsContactInfo}
          onUpdated={onRosterUpdated}
          onJustificationSent={onRosterJustificationSent}
          confirmAction={confirmAction}
        />

        <div className="flex justify-end border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    );
  }

  const { submission } = target;
  const data = submission.data;
  const name = String(data.name ?? data.fullName ?? "Participante");
  const email = String(data.email ?? "").trim() || undefined;
  const phone = formatSubmissionPhone(data.phone);
  const rsvpYes = data.attendance === "yes";
  const rsvpNo = data.attendance === "no";
  const checkedIn = Boolean(submission.dayCheckIn?.present);
  const absenceCategory = rsvpNo ? classifyAbsenceSubmission(submission) : null;
  const contacts = submission.absenceContactLog ?? [];
  const deadline = submission.absenceReview?.justificationDeadlineAt;
  const needsContactInfo = submissionNeedsContactInfoUpdate(submission);

  let statusLabel = "—";
  let statusTone: "active" | "pending" | "info" | "neutral" | "error" = "neutral";
  if (rsvpYes) {
    statusLabel = checkedIn ? "Asistió" : CONFIRMED_NO_SHOW_ROW_LABEL;
    statusTone = checkedIn ? "active" : "pending";
  } else if (absenceCategory) {
    statusLabel = absenceCategoryLabel(absenceCategory);
    statusTone =
      absenceCategory === "approved"
        ? "active"
        : absenceCategory === "dropout"
          ? "neutral"
        : absenceCategory === "unjustified"
          ? "error"
          : absenceCategory === "pending-review"
            ? "info"
            : "pending";
  }

  const submitDropoutClosure = async (notes: string) => {
    if (!submission._id) {
      return { ok: false as const, error: "Respuesta sin identificador." };
    }
    try {
      const res = await fetch(
        `/api/student-affairs/submissions/${encodeURIComponent(submission._id)}/closure`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "dropout", notes }),
        }
      );
      const data = await res.json();
      if (!data.ok) {
        return { ok: false as const, error: data.error ?? "No se pudo marcar como desertor." };
      }
      onSubmissionUpdated(data.submission as ExperienceFormSubmission);
      return { ok: true as const };
    } catch {
      return { ok: false as const, error: "Error de red al marcar como desertor." };
    }
  };

  return (
    <div className="space-y-5">
      <ParticipantSummary
        name={name}
        email={email}
        phone={phone !== "—" ? phone : undefined}
        generation={getSubmissionGeneration(data)}
        statusLabel={statusLabel}
        statusTone={statusTone}
      />

      {followUpLocked ? (
        <>
          <DrawerHint>
            Informe validado. Este participante asistió a la jornada presencial y su registro quedó
            bloqueado para su perfil. Solo puede consultar el expediente.
          </DrawerHint>
          {contacts.length > 0 ? <ContactLogList entries={contacts} /> : null}
          <div className="flex justify-end border-t border-border pt-4">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </>
      ) : (
        <>
      {needsContactInfo ? <ContactInfoRequiredBanner /> : null}

      {needsContactInfo ? (
        <SubmissionContactInfoSection submission={submission} onUpdated={onSubmissionUpdated} />
      ) : null}

      {!needsContactInfo ? (
        <>
      {rsvpYes && !checkedIn && !onSiteClosed ? (
        <PrimaryDrawerAction
          label="Registrar asistencia"
          loading={isSaving}
          disabled={isSaving}
          onClick={() => onCheckIn(true)}
        />
      ) : null}

      {onSiteClosed ? (
        <DrawerHint>
          Jornada presencial cerrada. Revise excusas, contacte al participante o gestione la
          inasistencia desde las acciones de seguimiento.
        </DrawerHint>
      ) : null}

      {absenceCategory === "pending-review" ? (
        <PrimaryDrawerAction
          label="Revisar justificación"
          variant="primary"
          disabled={isSaving}
          onClick={onReviewAbsence}
        />
      ) : null}

      {absenceCategory === "pending-email" ? (
        <PrimaryDrawerAction
          label="Enviar solicitud por correo"
          variant="primary"
          disabled={isSaving}
          onClick={onSendJustificationEmail}
        />
      ) : null}

      {absenceCategory === "awaiting-justification" ? (
        <PrimaryDrawerAction
          label="Registrar gestión de contacto"
          variant="outline"
          disabled={isSaving}
          onClick={onPhoneContact}
        />
      ) : null}

      {deadline && absenceCategory === "awaiting-justification" ? (
        <p className="rounded-lg border border-border bg-background-muted/30 px-3 py-2 text-sm text-muted">
          Plazo para justificar:{" "}
          <strong className="text-foreground">{formatJustificationDeadline(deadline)}</strong>
        </p>
      ) : null}

      {contacts.length > 0 ? <ContactLogList entries={contacts} /> : null}

      {contacts.length === 0 && rsvpNo ? (
        <DrawerHint>
          Aún no hay gestiones en el expediente. Registre llamadas, WhatsApp u otras gestiones con el
          botón de arriba o desde el panel de contacto.
        </DrawerHint>
      ) : null}

      {rsvpYes ? (
        <ActionSection title="Asistencia">
          {checkedIn ? (
            <Button
              variant="outline"
              className="w-full"
              loading={isSaving}
              disabled={isSaving || onSiteClosed}
              onClick={() => onCheckIn(false)}
            >
              Desmarcar asistencia
            </Button>
          ) : (
            <Button variant="outline" className="w-full" disabled={isSaving} onClick={onMarkAbsent}>
              Marcar inasistencia
            </Button>
          )}
        </ActionSection>
      ) : null}

      {rsvpNo ? (
        <>
          {absenceCategory === "dropout" ? <DropoutRecordCard submission={submission} /> : null}
        <ActionSection title="Más acciones">
          {absenceCategory !== "pending-email" &&
          absenceCategory !== "awaiting-justification" &&
          absenceCategory !== "pending-review" &&
          absenceCategory !== "dropout" ? (
            <Button variant="outline" className="w-full" disabled={isSaving} onClick={onPhoneContact}>
              Registrar gestión de contacto
            </Button>
          ) : null}
          {absenceCategory !== "pending-review" &&
          absenceCategory !== "approved" &&
          absenceCategory !== "dropout" ? (
            <Button
              variant="outline"
              className="w-full"
              disabled={isSaving || onSiteClosed}
              onClick={onMarkArrivedFromAbsence}
            >
              Registrar asistencia en jornada
            </Button>
          ) : null}
          {absenceCategory === "approved" ? (
            <Button variant="outline" className="w-full" onClick={onReviewAbsence}>
              Ver revisión de justificación
            </Button>
          ) : null}
          {absenceCategory !== "dropout" ? (
            <DropoutClosureForm
              participantName={name}
              absenceCategory={absenceCategory}
              busy={isSaving}
              contactHint
              onConfirm={confirmAction}
              onSubmit={submitDropoutClosure}
            />
          ) : null}
        </ActionSection>
        </>
      ) : null}

      {needsContactInfo && contacts.length > 0 ? <ContactLogList entries={contacts} /> : null}

      {canReclassifyGeneration || canDeleteSubmissions ? (
        <ActionSection title="Administración">
          {canReclassifyGeneration ? (
            <Button
              variant="outline"
              className="w-full"
              disabled={isSaving}
              onClick={onReclassifyGeneration}
            >
              Cambiar generación
            </Button>
          ) : null}
          {canDeleteSubmissions ? (
            <Button variant="outline" className="w-full" disabled={isSaving} onClick={onDelete}>
              Eliminar registro
            </Button>
          ) : null}
        </ActionSection>
      ) : null}

      <div className="flex justify-end border-t border-border pt-4">
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </div>
        </>
      ) : null}
        </>
      )}
    </div>
  );
}
