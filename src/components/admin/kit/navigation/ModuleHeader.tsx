import { cn } from "@/lib/utils";

export interface ModuleHeaderProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

/** Encabezado de módulo — H1 único + descripción + acciones. */
export function ModuleHeader({ title, description, actions, className }: ModuleHeaderProps) {
  if (!title) return null;

  return (
    <header
      className={cn(
        "mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
