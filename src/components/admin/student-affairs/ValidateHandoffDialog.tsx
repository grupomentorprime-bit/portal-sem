"use client";

import { Dialog } from "@/components/admin/kit/dialogs/Dialog";
import { Button } from "@/components/ui/button";
import { ClipboardCheck } from "lucide-react";
import type { StudentAffairsHandoffReport } from "@/types/student-affairs-operations";

export interface ValidateHandoffDialogProps {
  open: boolean;
  loading?: boolean;
  report: StudentAffairsHandoffReport | null;
  closedByName?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function ValidateHandoffDialog({
  open,
  loading = false,
  report,
  closedByName,
  onClose,
  onConfirm,
}: ValidateHandoffDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Validar informe de cierre"
      description="Confirme que el informe de la jornada presencial es correcto. Al validar, el equipo de Asuntos Estudiantiles solo podrá gestionar a quienes no asistieron."
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-background-muted/30 p-3">
          <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-foreground">
              Informe entregado por {closedByName ?? "operador"}
            </p>
            {report ? (
              <ul className="space-y-0.5 text-muted">
                <li>{report.asistieron} asistieron de {report.confirmaron} confirmados</li>
                <li>{report.porRevisar} excusas por revisar</li>
                <li>{report.sinRegistrarNiJustificar} sin registrar ni justificar</li>
              </ul>
            ) : null}
          </div>
        </div>

        <p className="text-sm text-muted">
          Tras la validación, los registros de quienes asistieron quedan bloqueados para el perfil
          de Asuntos Estudiantiles. Solo un encargado de calidad puede reabrir la jornada.
        </p>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" disabled={loading} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" loading={loading} disabled={loading} onClick={onConfirm}>
            Validar informe
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
