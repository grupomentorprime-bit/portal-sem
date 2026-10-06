interface AdminStatusBadgesProps {
  compatMode: boolean;
}

type StatusTone = "success" | "info" | "warning";

export function AdminStatusBadges({ compatMode }: AdminStatusBadgesProps) {
  if (!compatMode) return null;

  return (
    <div className="admin-status-badges hidden items-center xl:flex" aria-label="Estado del sistema">
      <StatusPill label="Panel" tone="warning" detail="Abierto" />
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
