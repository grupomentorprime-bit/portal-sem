"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isConvocatoriaIdentityReady } from "@/lib/experience/forms/convocatoria-identity";
import { formatGenerationDisplay } from "@/lib/experience/forms/generations";
import { formatChilePhoneDisplay } from "@/lib/experience/forms/phone-chile";
import type { ExperienceFormField } from "@/types/experience-forms";
import { AbsenceJustificationFields } from "./AbsenceJustificationFields";
import { AttendanceNoFeedback } from "./AttendanceNoFeedback";
import { AttendanceYesFeedback } from "./AttendanceYesFeedback";
import { PortalFormFields } from "./PortalFormFields";

interface ConvocatoriaParticipantFieldsProps {
  convocatoriaSlug: string;
  fields: ExperienceFormField[];
  values: Record<string, unknown>;
  errors: Record<string, string>;
  disabled?: boolean;
  onChange: (name: string, value: unknown) => void;
  attendanceYesMessage?: string;
  attendanceNoMessage?: string;
}

interface RosterStudent {
  id: string;
  rut?: string;
  fullName: string;
  generation: string;
  phone?: string;
}

const ROSTER_FIELD_NAMES = new Set(["studentId", "fullName", "program", "generation", "rut"]);
const ABSENCE_ONLY_FIELD_NAMES = new Set(["justification", "justificationAttachment"]);
const SELF_REGISTERED_GENERATION = "other";

export function ConvocatoriaParticipantFields({
  convocatoriaSlug,
  fields,
  values,
  errors,
  disabled,
  onChange,
  attendanceYesMessage,
  attendanceNoMessage,
}: ConvocatoriaParticipantFieldsProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RosterStudent[]>([]);
  const [searching, setSearching] = useState(false);
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");
  const [manualEntry, setManualEntry] = useState(
    () => String(values.registrationMode ?? "") === "manual"
  );

  const identityReady = isConvocatoriaIdentityReady(values);

  const selectedStudent = useMemo(() => {
    if (manualEntry) return null;
    const studentId = String(values.studentId ?? "");
    if (!studentId) return null;
    return {
      id: studentId,
      fullName: String(values.fullName ?? ""),
      generation: String(values.generation ?? values.program ?? ""),
    };
  }, [manualEntry, values.studentId, values.fullName, values.generation, values.program]);

  const trimmedQuery = query.trim();
  const showEmptyResults =
    !manualEntry &&
    !selectedStudent &&
    !searching &&
    trimmedQuery.length >= 2 &&
    lastSearchedQuery === trimmedQuery &&
    results.length === 0;

  useEffect(() => {
    if (manualEntry) return;

    if (trimmedQuery.length < 2) {
      setResults([]);
      setLastSearchedQuery("");
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/experience/forms/convocatorias/${encodeURIComponent(convocatoriaSlug)}/roster/search?q=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setResults(data.ok ? (data.students ?? []) : []);
        setLastSearchedQuery(trimmedQuery);
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
          setLastSearchedQuery(trimmedQuery);
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [convocatoriaSlug, manualEntry, trimmedQuery]);

  const remainingFields = fields.filter(
    (field) =>
      !ROSTER_FIELD_NAMES.has(field.name) &&
      !ABSENCE_ONLY_FIELD_NAMES.has(field.name) &&
      field.type !== "hidden"
  );

  const handleSelectStudent = (student: RosterStudent) => {
    onChange("registrationMode", "roster");
    onChange("studentId", student.id);
    onChange("fullName", student.fullName);
    onChange("program", student.generation);
    onChange("generation", student.generation);
    onChange("rut", student.rut ?? "");
    if (student.phone) {
      onChange("phone", formatChilePhoneDisplay(student.phone) || student.phone);
    }
    setManualEntry(false);
    setQuery("");
    setResults([]);
    setLastSearchedQuery("");
  };

  const handleClearStudent = () => {
    onChange("registrationMode", "");
    onChange("studentId", "");
    onChange("fullName", "");
    onChange("program", "");
    onChange("generation", "");
    onChange("rut", "");
    setQuery("");
    setResults([]);
    setLastSearchedQuery("");
  };

  const handleEnableManualEntry = (prefillName = "") => {
    setManualEntry(true);
    handleClearStudent();
    onChange("registrationMode", "manual");
    onChange("generation", SELF_REGISTERED_GENERATION);
    onChange("program", SELF_REGISTERED_GENERATION);
    if (prefillName.trim()) {
      onChange("fullName", prefillName.trim());
    }
  };

  const handleBackToSearch = () => {
    setManualEntry(false);
    onChange("registrationMode", "");
    onChange("fullName", "");
    onChange("program", "");
    onChange("generation", "");
    onChange("rut", "");
  };

  return (
    <div className="portal-experience-form__stack space-y-6">
      {!manualEntry ? (
        <div className="portal-experience-form__field portal-experience-form__field--lookup space-y-3">
          <Input
            label="Busca tu nombre o RUT en el listado"
            placeholder="Escribe tu nombre, apellido o RUT…"
            helper="Selecciona tu registro. Luego completarás teléfono, correo y asistencia."
            icon={Search}
            value={query}
            disabled={disabled || Boolean(selectedStudent)}
            onChange={(event) => setQuery(event.target.value)}
            error={errors.studentId}
          />

          {searching ? <p className="text-xs text-muted">Buscando…</p> : null}

          {!selectedStudent && results.length > 0 ? (
            <ul className="portal-experience-form__lookup-results overflow-hidden rounded-xl border border-border bg-background shadow-sm">
              {results.map((student) => (
                <li key={student.id} className="border-b border-border last:border-0">
                  <button
                    type="button"
                    className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left transition hover:bg-background-muted/60 focus-visible:bg-background-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary"
                    onClick={() => handleSelectStudent(student)}
                    disabled={disabled}
                  >
                    <span className="font-medium text-foreground">{student.fullName}</span>
                    <span className="text-sm text-muted">
                      {formatGenerationDisplay(student.generation)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {showEmptyResults ? (
            <div className="portal-experience-form__lookup-empty rounded-xl border border-dashed border-border bg-background-muted/30 px-4 py-4">
              <p className="text-sm leading-relaxed text-muted">
                No hay coincidencias para «{trimmedQuery}». Si no apareces en el listado, puedes
                agregarte y continuar con el formulario.
              </p>
              <div className="portal-experience-form__lookup-empty-actions mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="portal-experience-form__manual-entry-cta"
                  onClick={() => handleEnableManualEntry(trimmedQuery)}
                  disabled={disabled}
                >
                  Agregarme y continuar
                </Button>
              </div>
            </div>
          ) : null}

          {selectedStudent ? (
            <div className="portal-experience-form__selected-student rounded-xl border border-accent/30 bg-accent/5 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Alumno seleccionado
                  </p>
                  <p className="mt-1 font-semibold text-foreground">{selectedStudent.fullName}</p>
                  <p className="text-sm text-muted">
                    {formatGenerationDisplay(selectedStudent.generation)}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:underline"
                  onClick={handleClearStudent}
                  disabled={disabled}
                >
                  Cambiar
                </button>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            className="portal-experience-form__manual-entry-link text-sm font-medium text-primary hover:underline"
            onClick={() => handleEnableManualEntry()}
            disabled={disabled}
          >
            No encuentro mi nombre en el listado
          </button>
        </div>
      ) : (
        <div className="portal-experience-form__field space-y-4 rounded-xl border border-border bg-background-muted/20 p-4">
          <div>
            <p className="font-medium text-foreground">Agregarte al formulario</p>
            <p className="mt-1 text-sm text-muted">
              Completa tus datos para registrarte. Quedarás en la categoría{" "}
              <strong>Otros</strong> y el equipo de asuntos estudiantiles validará tu participación.
            </p>
          </div>

          <Input
            label="Nombre completo"
            value={String(values.fullName ?? "")}
            onChange={(event) => onChange("fullName", event.target.value)}
            error={errors.fullName}
            disabled={disabled}
            required
          />

          <Input
            label="RUT (opcional)"
            placeholder="12.345.678-9"
            value={String(values.rut ?? "")}
            onChange={(event) => onChange("rut", event.target.value)}
            error={errors.rut}
            disabled={disabled}
            helper="Si lo conoces, ayúdanos a identificarte en el control interno."
          />

          <button
            type="button"
            className="text-sm font-medium text-primary hover:underline"
            onClick={handleBackToSearch}
            disabled={disabled}
          >
            Volver a buscar en el listado
          </button>
        </div>
      )}

      {identityReady ? (
        <>
          <PortalFormFields
            fields={remainingFields}
            values={values}
            errors={errors}
            disabled={disabled}
            onChange={onChange}
          />

          {values.attendance === "yes" && attendanceYesMessage ? (
            <AttendanceYesFeedback message={attendanceYesMessage} />
          ) : null}

          {values.attendance === "no" ? (
            <AttendanceNoFeedback message={attendanceNoMessage} />
          ) : null}

          <AbsenceJustificationFields
            values={values}
            errors={errors}
            disabled={disabled}
            onChange={onChange}
          />
        </>
      ) : (
        <p className="portal-experience-form__identity-hint rounded-xl border border-dashed border-border bg-background-muted/25 px-4 py-3 text-sm text-muted">
          {manualEntry
            ? "Completa tu nombre para continuar con teléfono, correo y asistencia."
            : "Identifícate en el listado para continuar con el resto del formulario."}
        </p>
      )}

      <input
        type="hidden"
        name="registrationMode"
        value={String(values.registrationMode ?? "")}
        readOnly
      />

      {fields
        .filter(
          (field) =>
            (field.type === "hidden" || ROSTER_FIELD_NAMES.has(field.name)) &&
            field.name !== "registrationMode"
        )
        .map((field) => (
          <input
            key={field.id}
            type="hidden"
            name={field.name}
            value={String(values[field.name] ?? field.defaultValue ?? "")}
            readOnly
          />
        ))}

      {manualEntry ? (
        <>
          <input type="hidden" name="generation" value={SELF_REGISTERED_GENERATION} readOnly />
          <input type="hidden" name="program" value={SELF_REGISTERED_GENERATION} readOnly />
        </>
      ) : null}
    </div>
  );
}
