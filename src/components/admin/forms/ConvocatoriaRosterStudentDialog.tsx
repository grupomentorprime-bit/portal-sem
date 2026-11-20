"use client";

import { useState } from "react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ChilePhoneInput } from "@/components/portal/experience/forms/ChilePhoneInput";
import { ChileRutInput } from "@/components/portal/experience/forms/ChileRutInput";
import { CONVOCATORIA_GENERATIONS } from "@/lib/experience/forms/generations";
import {
  CHILE_PHONE_INVALID_MESSAGE,
  isValidChilePhone,
  normalizeChilePhone,
} from "@/lib/experience/forms/phone-chile";
import {
  CHILE_RUT_INVALID_MESSAGE,
  isValidChileRut,
  normalizeChileRut,
} from "@/lib/experience/forms/rut-chile";
import { createRosterStudentFromFields } from "@/lib/experience/forms/roster-import";
import type { ConvocatoriaRosterStudent } from "@/types/convocatoria-roster";

export interface RosterStudentFormValues {
  rut: string;
  firstName: string;
  lastName: string;
  generation: string;
  phone: string;
}

const EMPTY_FORM: RosterStudentFormValues = {
  rut: "",
  firstName: "",
  lastName: "",
  generation: "",
  phone: "",
};

function splitFullName(fullName: string): Pick<RosterStudentFormValues, "firstName" | "lastName"> {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function formFromStudent(student: ConvocatoriaRosterStudent): RosterStudentFormValues {
  const { firstName, lastName } = splitFullName(student.fullName);
  return {
    rut: student.rut ?? "",
    firstName,
    lastName,
    generation: student.generation,
    phone: student.phone ?? "",
  };
}

interface ConvocatoriaRosterStudentDialogProps {
  open: boolean;
  mode: "add" | "edit";
  student?: ConvocatoriaRosterStudent | null;
  onClose: () => void;
  onSubmit: (student: ConvocatoriaRosterStudent, originalId?: string) => Promise<void>;
  existingCount: number;
}

export function ConvocatoriaRosterStudentDialog({
  open,
  mode,
  student,
  onClose,
  onSubmit,
  existingCount,
}: ConvocatoriaRosterStudentDialogProps) {
  const [form, setForm] = useState<RosterStudentFormValues>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = mode === "edit";

  useDeferredEffect(() => {
    if (!open) return;
    setForm(student ? formFromStudent(student) : EMPTY_FORM);
    setError(null);
  }, [open, student]);

  const resetAndClose = () => {
    setForm(EMPTY_FORM);
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.firstName.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!form.lastName.trim()) {
      setError("Los apellidos son obligatorios.");
      return;
    }
    if (!form.generation.trim()) {
      setError("Selecciona una generación o programa.");
      return;
    }

    const rawRut = form.rut.trim();
    if (rawRut && !isValidChileRut(rawRut)) {
      setError(CHILE_RUT_INVALID_MESSAGE);
      return;
    }

    const rawPhone = form.phone.trim();
    if (rawPhone && !isValidChilePhone(rawPhone)) {
      setError(CHILE_PHONE_INVALID_MESSAGE);
      return;
    }

    const created = createRosterStudentFromFields({
      rut: rawRut ? normalizeChileRut(rawRut) ?? undefined : undefined,
      firstName: form.firstName,
      lastName: form.lastName,
      generation: form.generation,
      phone: rawPhone ? normalizeChilePhone(rawPhone) ?? undefined : undefined,
      index: existingCount,
    });

    if (!created) {
      setError("No se pudo crear el registro. Revisa los datos ingresados.");
      return;
    }

    const payload: ConvocatoriaRosterStudent = isEdit && student
      ? { ...created, id: student.id }
      : created;

    setSubmitting(true);
    try {
      await onSubmit(payload, student?.id);
      resetAndClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : isEdit
            ? "No se pudo actualizar el participante."
            : "No se pudo agregar el alumno."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={isEdit ? "Editar participante" : "Agregar alumno individual"}
      description={
        isEdit
          ? "Actualiza los datos del participante en el listado de la convocatoria."
          : "Ingresa los datos del participante. Se añadirá al listado de la convocatoria."
      }
      size="md"
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 p-6 pt-2">
        <ChileRutInput
          label="RUT"
          name="rosterRut"
          value={form.rut}
          onChange={(value) => setForm((prev) => ({ ...prev, rut: value }))}
          helper="Opcional, pero recomendado para evitar duplicados."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nombre"
            placeholder="Alejandra"
            value={form.firstName}
            onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
            required
          />
          <Input
            label="Apellidos"
            placeholder="Gutiérrez Carrasco"
            value={form.lastName}
            onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
            required
          />
        </div>

        <Select
          label="Generación / programa"
          placeholder="Selecciona una opción"
          options={CONVOCATORIA_GENERATIONS}
          value={form.generation}
          onChange={(event) => setForm((prev) => ({ ...prev, generation: event.target.value }))}
          required
        />

        <ChilePhoneInput
          label="Teléfono"
          name="rosterPhone"
          value={form.phone}
          onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))}
          helper="Opcional. El alumno puede actualizarlo al confirmar asistencia."
        />

        {error ? <p className="text-sm text-primary">{error}</p> : null}

        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={resetAndClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {isEdit ? "Guardar cambios" : "Agregar al listado"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
