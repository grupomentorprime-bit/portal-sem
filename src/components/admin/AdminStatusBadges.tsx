interface AdminStatusBadgesProps {
  compatMode: boolean;
}

export function AdminStatusBadges({ compatMode }: AdminStatusBadgesProps) {
  return (
    <div className="hidden items-center gap-2 text-xs xl:flex" aria-label="Estado del sistema">
      <StatusPill label="Portal" status="active" />
      <StatusPill label="CMS" status={compatMode ? "warning" : "secure"} />
      <StatusPill label="Accesos" status="active" />
    </div>
  );
}

function StatusPill({
  label,
  status,
}: {
  label: string;
  status: "active" | "secure" | "warning";
}) {
  const colors = {
    active: "bg-success/15 text-success",
    secure: "bg-primary/10 text-primary",
    warning: "bg-[var(--state-warning-bg)] text-[var(--color-warning)]",
  } as const;

  const labels = {
    active: "Activo",
    secure: "Seguro",
    warning: "Abierto",
  } as const;

  return (
    <span className={cnBadge(colors[status])}>
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {label}
      <span className="text-[10px] opacity-80">· {labels[status]}</span>
    </span>
  );
}

function cnBadge(className: string) {
  return `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${className}`;
}
