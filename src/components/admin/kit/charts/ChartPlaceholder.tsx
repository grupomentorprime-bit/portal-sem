/** Placeholder para gráficos AEK — Fase 4 o integración externa. */
export function ChartPlaceholder({ label = "Gráfico" }: { label?: string }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-background-soft text-sm text-muted">
      {label}
    </div>
  );
}
