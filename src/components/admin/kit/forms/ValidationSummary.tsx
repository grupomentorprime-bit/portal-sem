import { AlertBanner } from "@/components/admin/kit/states/AlertBanner";

export interface ValidationSummaryProps {
  errors: string[];
}

/** Resumen de errores de validación de formulario. */
export function ValidationSummary({ errors }: ValidationSummaryProps) {
  if (errors.length === 0) return null;

  return (
    <AlertBanner variant="error" title="Revisa los siguientes campos">
      <ul className="list-inside list-disc space-y-1">
        {errors.map((err) => (
          <li key={err}>{err}</li>
        ))}
      </ul>
    </AlertBanner>
  );
}
