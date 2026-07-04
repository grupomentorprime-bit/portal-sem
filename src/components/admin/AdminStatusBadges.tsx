interface AdminStatusBadgesProps {
  compatMode: boolean;
}

type StatusTone = "success" | "info" | "warning";

export function AdminStatusBadges({ compatMode }: AdminStatusBadgesProps) {
  return (
    <div className="admin-status-badges hidden items-center gap-1.5 xl:flex" aria-label="Estado del sistema">
      <StatusPill label="Portal" tone="success" detail="Activo" />
      <StatusPill
        label="CMS"
        tone={compatMode ? "warning" : "info"}
        detail={compatMode ? "Abierto" : "Seguro"}
      />
      <StatusPill label="Accesos" tone="success" detail="Activo" />
    </div>
  );
}

function StatusPill({
  label,
  tone,
  detail,
}: {
  label: string;
  tone: StatusTone;
  detail: string;
}) {
  return (
    <span className={`admin-status-pill admin-status-pill--${tone}`}>
      <span className="admin-status-pill__dot" aria-hidden />
      <span className="admin-status-pill__label">{label}</span>
      <span className="admin-status-pill__detail" aria-hidden>
        · {detail}
      </span>
    </span>
  );
}
