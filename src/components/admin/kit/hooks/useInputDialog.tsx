"use client";

import { InputDialog, type InputDialogField } from "@/components/admin/kit/dialogs/InputDialog";
import { useCallback, useState } from "react";

export interface InputDialogOptions {
  title: string;
  description?: string;
  fields: InputDialogField[];
  submitLabel?: string;
  cancelLabel?: string;
}

interface InputDialogState extends InputDialogOptions {
  resolve: (value: Record<string, string> | null) => void;
}

/**
 * Reemplazo de window.prompt — presentacional, sin lógica de negocio.
 */
export function useInputDialog() {
  const [pending, setPending] = useState<InputDialogState | null>(null);

  const prompt = useCallback((options: InputDialogOptions) => {
    return new Promise<Record<string, string> | null>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const close = useCallback((result: Record<string, string> | null) => {
    setPending((current) => {
      current?.resolve(result);
      return null;
    });
  }, []);

  const dialog = pending ? (
    <InputDialog
      open
      title={pending.title}
      description={pending.description}
      fields={pending.fields}
      submitLabel={pending.submitLabel}
      cancelLabel={pending.cancelLabel}
      onClose={() => close(null)}
      onSubmit={(values) => close(values)}
    />
  ) : null;

  return { prompt, dialog };
}
