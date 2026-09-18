"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Sparkles, Zap } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BLANK_FORM_FIELDS,
  FORM_QUICK_TEMPLATES,
  getFormQuickTemplate,
  type FormQuickTemplateId,
} from "@/lib/admin/form-quick-templates";
import type { ExperienceFormDestination, ExperienceFormField } from "@/types/experience-forms";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

type EntryMode = "choose" | "ai" | "template" | "blank";

interface CreateFormDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function CreateFormDialog({ open, onClose, onCreated }: CreateFormDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<EntryMode>("choose");
  const [name, setName] = useState("");
  const [formId, setFormId] = useState("");
  const [idTouched, setIdTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedId = formId.trim() || slugify(name);

  const reset = () => {
    setStep("choose");
    setName("");
    setFormId("");
    setIdTouched(false);
    setDescription("");
    setAiPrompt("");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const createForm = async (payload: {
    name: string;
    description?: string;
    destination: ExperienceFormDestination;
    fields: ExperienceFormField[];
    idHint?: string;
  }) => {
    const id = (payload.idHint?.trim() || slugify(payload.name)).slice(0, 64);
    if (!payload.name.trim()) {
      setError("Escribe un nombre para el formulario.");
      return;
    }
    if (!id) {
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
          _id: id,
          tenant: "",
          name: payload.name.trim(),
          description: payload.description?.trim() || undefined,
          destination: payload.destination,
          successMessage: "¡Gracias! Hemos recibido tu respuesta.",
          errorMessage: "No fue posible enviar el formulario. Intenta nuevamente.",
          postSubmit: { type: "message" },
          active: false,
          visible: false,
          fields: payload.fields,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo crear el formulario.");
        return;
      }
      onCreated?.();
      handleClose();
      router.push(`/admin/portal/forms/${data.form._id}?tab=formulario`);
    } catch {
      setError("No pudimos crear el formulario. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromTemplate = async (templateId: FormQuickTemplateId) => {
    const template = getFormQuickTemplate(templateId);
    await createForm({
      name: template.defaultName,
      description: template.defaultDescription,
      destination: template.destination,
      fields: template.fields,
      idHint: slugify(template.defaultName),
    });
  };

  const handleCreateBlank = async () => {
    await createForm({
      name: name.trim() || "Nuevo formulario",
      description: description.trim() || undefined,
      destination: "information_request",
      fields: BLANK_FORM_FIELDS,
      idHint: resolvedId,
    });
  };

  const handleCreateFromAi = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) {
      setError("Cuéntanos qué necesitas, aunque sea en una frase.");
      return;
    }
    const template = getFormQuickTemplate("information");
    await createForm({
      name: "Formulario con IA",
      description: prompt,
      destination: template.destination,
      fields: template.fields,
      idHint: slugify(`ia-${prompt}`).slice(0, 48) || "formulario-ia",
    });
  };

  const title =
    step === "choose"
      ? "Nuevo formulario"
      : step === "ai"
        ? "Crear con IA"
        : step === "template"
          ? "Usar una plantilla"
          : "Crear desde cero";

  const descriptionText =
    step === "choose"
      ? "¿Qué quieres crear?"
      : step === "ai"
        ? "Describe lo que necesitas. Growth OS preparará el formulario."
        : step === "template"
          ? "Empieza con un formulario listo para editar."
          : "Para quien quiera controlar todo desde el inicio.";

  return (
    <Modal open={open} onClose={handleClose} title={title} description={descriptionText} size="lg">
      <div className="space-y-4">
        {error ? <p className="text-sm font-medium text-primary">{error}</p> : null}

        {step === "choose" ? (
          <div className="grid gap-3 sm:grid-cols-1">
            <EntryCard
              icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
              title="Crear con IA"
              subtitle="Describe lo que necesitas y Growth OS prepara el formulario."
              onClick={() => {
                setError(null);
                setStep("ai");
              }}
            />
            <EntryCard
              icon={<Zap className="h-5 w-5" aria-hidden="true" />}
              title="Usar una plantilla"
              subtitle="Empieza con un formulario listo para editar."
              onClick={() => {
                setError(null);
                setStep("template");
              }}
            />
            <EntryCard
              icon={<Pencil className="h-5 w-5" aria-hidden="true" />}
              title="Crear desde cero"
              subtitle="Para quien quiera controlar todo."
              onClick={() => {
                setError(null);
                setStep("blank");
              }}
            />
          </div>
        ) : null}

        {step === "ai" ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed border-border bg-background-muted/60 px-3 py-2 text-sm text-muted">
              La IA aún está en preparación. Por ahora abriremos el editor con preguntas útiles
              listas para ajustar.
            </div>
            <div>
              <Label htmlFor="ai-form-prompt">¿Qué necesitas?</Label>
              <Textarea
                id="ai-form-prompt"
                rows={4}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ej. Necesito un formulario para personas interesadas en cursos de maquinaria."
              />
            </div>
            <div className="flex justify-between gap-2 pt-1">
              <Button variant="outline" type="button" onClick={() => setStep("choose")}>
                Volver
              </Button>
              <Button variant="primary" type="button" onClick={handleCreateFromAi} loading={loading}>
                Continuar al editor
              </Button>
            </div>
          </div>
        ) : null}

        {step === "template" ? (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {FORM_QUICK_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  disabled={loading}
                  onClick={() => void handleCreateFromTemplate(template.id)}
                  className="rounded-xl border border-border bg-background px-4 py-3 text-left transition hover:border-primary/40 hover:bg-background-muted disabled:opacity-60"
                >
                  <span className="block text-sm font-semibold text-foreground">{template.label}</span>
                  <span className="mt-1 block text-xs text-muted">{template.description}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-start">
              <Button variant="outline" type="button" onClick={() => setStep("choose")} disabled={loading}>
                Volver
              </Button>
            </div>
          </div>
        ) : null}

        {step === "blank" ? (
          <div className="space-y-4">
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
                placeholder="Opcional · se muestra arriba de las preguntas"
              />
            </div>
            <details className="rounded-lg border border-border px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium text-muted">Más opciones</summary>
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
            <div className="flex justify-between gap-2 pt-1">
              <Button variant="outline" type="button" onClick={() => setStep("choose")}>
                Volver
              </Button>
              <Button variant="primary" type="button" onClick={handleCreateBlank} loading={loading}>
                Crear formulario
              </Button>
            </div>
          </div>
        ) : null}

        {step === "choose" ? (
          <div className="flex justify-end pt-1">
            <Button variant="outline" type="button" onClick={handleClose}>
              Cancelar
            </Button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function EntryCard({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-xl border border-border bg-background px-4 py-3.5 text-left transition hover:border-primary/40 hover:bg-background-muted"
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background-muted text-primary">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block text-sm text-muted">{subtitle}</span>
      </span>
    </button>
  );
}
