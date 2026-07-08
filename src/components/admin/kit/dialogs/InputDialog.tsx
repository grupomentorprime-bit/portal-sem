"use client";

import { Dialog } from "@/components/admin/kit/dialogs/Dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";

export interface InputDialogField {
  id: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
}

export interface InputDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void;
  title: string;
  description?: string;
  fields: InputDialogField[];
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

/** Diálogo con campos de entrada — reemplazo de window.prompt. */
export function InputDialog({
  open,
  onClose,
  onSubmit,
  title,
  description,
  fields,
  submitLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading = false,
}: InputDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  useDeferredEffect(() => {
    if (!open) return;
    setValues(
      Object.fromEntries(fields.map((field) => [field.id, field.defaultValue ?? ""]))
    );
  }, [open, fields]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const missing = fields.filter((field) => field.required && !values[field.id]?.trim());
    if (missing.length > 0) return;
    onSubmit(values);
  };

  return (
    <Dialog open={open} onClose={onClose} title={title} description={description} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.id}>
            <Label htmlFor={field.id} className="mb-2 block">
              {field.label}
            </Label>
            <Input
              id={field.id}
              value={values[field.id] ?? ""}
              placeholder={field.placeholder}
              required={field.required}
              onChange={(event) =>
                setValues((current) => ({ ...current, [field.id]: event.target.value }))
              }
            />
          </div>
        ))}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button type="submit" loading={loading}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
