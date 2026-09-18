"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { EXPERIENCE_FORM_DESTINATIONS } from "@/types/experience-forms";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/** Etiquetas humanas; los valores internos no cambian. */
const DESTINATION_LABELS: Record<(typeof EXPERIENCE_FORM_DESTINATIONS)[number], string> = {
  information_request: "Pedir información",
  contact: "Recibir contactos",
  event_registration: "Inscribir a un evento",
  attendance_confirmation: "Confirmar asistencia",
  absence_justification: "Justificar inasistencia",
  subscription: "Suscribirse",
  testimonial_submission: "Recibir testimonio",
};

interface CreateFormDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function CreateFormDialog({ open, onClose, onCreated }: CreateFormDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [formId, setFormId] = useState("");
  const [idTouched, setIdTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [destination, setDestination] =
    useState<(typeof EXPERIENCE_FORM_DESTINATIONS)[number]>("information_request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedId = formId.trim() || slugify(name);

  const reset = () => {
    setName("");
    setFormId("");
    setIdTouched(false);
    setDescription("");
    setDestination("information_request");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Escribe un nombre para el formulario.");
      return;
    }
    if (!resolvedId) {
      setError("Escribe un nombre para poder crear el formulario.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/experience/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: resolvedId,
          tenant: "",
          name: name.trim(),
          description: description.trim() || undefined,
          destination,
          successMessage: "¡Gracias! Hemos recibido tu respuesta.",
          errorMessage: "No fue posible enviar el formulario. Intenta nuevamente.",
          postSubmit: { type: "message" },
          active: false,
          visible: false,
          fields: [
            {
              id: "fullName",
              type: "text",
              name: "fullName",
              label: "Nombre completo",
              validation: { required: true },
            },
            {
              id: "email",
              type: "email",
              name: "email",
              label: "Correo electrónico",
              validation: { required: true },
            },
          ],
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo crear el formulario.");
        return;
      }
      onCreated?.();
      handleClose();
      router.push(`/admin/portal/forms/${data.form._id}`);
    } catch {
      setError("No pudimos crear el formulario. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nuevo formulario"
      description="Empieza con un borrador. Luego agregas las preguntas y lo publicas."
      size="lg"
    >
      <div className="space-y-4">
        {error ? <p className="text-sm font-medium text-primary">{error}</p> : null}

        <div>
          <Label htmlFor="new-form-name">Nombre</Label>
          <Input
            id="new-form-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!idTouched) setFormId(slugify(e.target.value));
            }}
            placeholder="Ej. Encuesta de satisfacción"
          />
        </div>

        <div>
          <Label htmlFor="new-form-desc">Descripción</Label>
          <Textarea
            id="new-form-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Opcional"
          />
        </div>

        <div>
          <Label htmlFor="new-form-destination">¿Para qué usarás este formulario?</Label>
          <Select
            id="new-form-destination"
            value={destination}
            onChange={(e) =>
              setDestination(e.target.value as (typeof EXPERIENCE_FORM_DESTINATIONS)[number])
            }
            options={EXPERIENCE_FORM_DESTINATIONS.map((d) => ({
              value: d,
              label: DESTINATION_LABELS[d],
            }))}
          />
        </div>

        <details className="rounded-lg border border-border px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium text-muted">
            Opciones avanzadas
          </summary>
          <div className="mt-3 space-y-2 pb-1">
            <Label htmlFor="new-form-id">Dirección del enlace</Label>
            <Input
              id="new-form-id"
              value={formId}
              onChange={(e) => {
                setIdTouched(true);
                setFormId(slugify(e.target.value));
              }}
              placeholder="se-genera-del-nombre"
            />
            <p className="text-xs text-muted">
              Se crea sola desde el nombre. Solo cámbiala si lo necesitas.
            </p>
          </div>
        </details>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={handleClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="button" onClick={handleCreate} loading={loading}>
            Crear formulario
          </Button>
        </div>
      </div>
    </Modal>
  );
}
