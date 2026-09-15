"use client";

import { useMemo, useState } from "react";
import { Dialog } from "@/components/admin/kit/dialogs/Dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PAGE_OBJECTIVES,
  getPageObjective,
  pageIdFromTitle,
  pathFromTitle,
  seedBlocksForObjective,
  type PageObjectiveId,
} from "@/lib/cms/page-objectives";
import { normalizeSlug } from "@/lib/cms/page-utils";

interface CreatePageWizardProps {
  open: boolean;
  onClose: () => void;
  tenant: string;
  onCreated: (pageId: string) => void;
  onError: (message: string) => void;
}

type Step = "objective" | "details";

export function CreatePageWizard({
  open,
  onClose,
  tenant,
  onCreated,
  onError,
}: CreatePageWizardProps) {
  const [step, setStep] = useState<Step>("objective");
  const [objectiveId, setObjectiveId] = useState<PageObjectiveId | null>(null);
  const [title, setTitle] = useState("");
  const [path, setPath] = useState("");
  const [pathTouched, setPathTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const objective = objectiveId ? getPageObjective(objectiveId) : undefined;

  const suggestedPath = useMemo(() => (title.trim() ? pathFromTitle(title) : ""), [title]);

  const reset = () => {
    setStep("objective");
    setObjectiveId(null);
    setTitle("");
    setPath("");
    setPathTouched(false);
    setLoading(false);
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const selectObjective = (id: PageObjectiveId) => {
    setObjectiveId(id);
    setStep("details");
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!pathTouched) {
      setPath(value.trim() ? pathFromTitle(value) : "");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!objective || !title.trim()) return;

    const name = title.trim();
    const logicalId = pageIdFromTitle(name);
    const slug = normalizeSlug(path.trim() || suggestedPath || `/${logicalId}`);
    const blocks = seedBlocksForObjective(objective);

    setLoading(true);
    try {
      const res = await fetch("/api/cms/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: logicalId,
          tenant,
          title: name,
          slug,
          description: objective.description,
          template: objective.template,
          status: "draft",
          seo: { title: name, description: objective.description },
          blocks,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        errors?: Array<{ message: string }>;
        page?: { _id: string };
      };
      if (!data.ok) {
        const detail =
          data.error ??
          data.errors?.map((e) => e.message).join(" ") ??
          "No se pudo crear la página.";
        onError(detail);
        setLoading(false);
        return;
      }
      reset();
      onCreated(data.page?._id ?? logicalId);
    } catch {
      onError("No se pudo crear la página. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Crear página"
      description={
        step === "objective"
          ? "¿Qué quieres crear?"
          : "Nombre de la página y dirección pública."
      }
      size="md"
    >
      {step === "objective" ? (
        <div className="space-y-3">
          {PAGE_OBJECTIVES.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full flex-col rounded-lg border border-border bg-background px-4 py-3 text-left transition hover:border-primary/40 hover:bg-background-soft"
              onClick={() => selectObjective(item.id)}
            >
              <span className="text-sm font-medium text-foreground">{item.label}</span>
              <span className="mt-0.5 text-xs text-muted">{item.description}</span>
            </button>
          ))}
          <div className="flex justify-end pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {objective ? (
            <p className="rounded-md bg-background-soft px-3 py-2 text-xs text-muted">
              Objetivo: <span className="font-medium text-foreground">{objective.label}</span>
              {" · "}
              <button
                type="button"
                className="underline"
                onClick={() => setStep("objective")}
                disabled={loading}
              >
                Cambiar
              </button>
            </p>
          ) : null}

          <div>
            <Label htmlFor="page-title" className="mb-2 block">
              Nombre de la página
            </Label>
            <Input
              id="page-title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Ej. Inscripciones 2026"
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="page-path" className="mb-2 block">
              Dirección de la página
            </Label>
            <Input
              id="page-path"
              value={path}
              onChange={(e) => {
                setPathTouched(true);
                setPath(e.target.value);
              }}
              placeholder="/mi-pagina"
            />
            <p className="mt-1 text-xs text-muted">
              Así se verá en el sitio. Puedes dejar la sugerencia o escribir otra.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading} disabled={!title.trim()}>
              Crear y editar
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
