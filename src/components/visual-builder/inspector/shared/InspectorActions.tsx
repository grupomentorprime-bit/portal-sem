"use client";

import { Copy, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InspectorActionHandlers } from "../types";

/**
 * Acciones estándar de bloque: duplicar, ocultar, eliminar.
 */
export function InspectorActions({
  onDuplicate,
  onHide,
  onDelete,
  hidden,
  deleteDisabled,
}: InspectorActionHandlers) {
  return (
    <div className="flex flex-col gap-2">
      {onDuplicate ? (
        <Button type="button" variant="outline" size="sm" className="justify-start" onClick={onDuplicate}>
          <Copy className="mr-2 h-4 w-4" aria-hidden />
          Duplicar bloque
        </Button>
      ) : null}
      {onHide ? (
        <Button type="button" variant="outline" size="sm" className="justify-start" onClick={onHide}>
          <EyeOff className="mr-2 h-4 w-4" aria-hidden />
          {hidden ? "Mostrar en el sitio" : "Ocultar bloque"}
        </Button>
      ) : null}
      {onDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-start text-[var(--color-danger)] hover:bg-[var(--state-danger-bg)]"
          onClick={onDelete}
          disabled={deleteDisabled}
        >
          <Trash2 className="mr-2 h-4 w-4" aria-hidden />
          Eliminar bloque
        </Button>
      ) : null}
    </div>
  );
}
