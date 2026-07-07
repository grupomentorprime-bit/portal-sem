"use client";

import { formatAuditMessage, formatRelativeTime, groupAuditByDay } from "@/lib/admin/audit-labels";

export interface AuditTimelineEntry {
  id: string;
  action: string;
  entity: string;
  actorName: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface AuditTimelineProps {
  entries: AuditTimelineEntry[];
  compact?: boolean;
}

export function AuditTimeline({ entries, compact = false }: AuditTimelineProps) {
  const groups = groupAuditByDay(entries);

  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
        Aún no hay actividad registrada.
      </p>
    );
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-8"}>
      {groups.map((group) => (
        <section key={group.label}>
          <h3
            className={
              compact
                ? "mb-2 text-[10px] font-bold uppercase tracking-wider text-muted"
                : "mb-3 text-xs font-semibold uppercase tracking-widest text-muted"
            }
          >
            {group.label}
          </h3>
          <ol className={compact ? "space-y-1.5" : "space-y-3"}>
            {group.items.map((entry) => (
              <li
                key={entry.id}
                className={
                  compact
                    ? "flex items-start gap-2.5 rounded-lg border border-border bg-background px-3 py-2"
                    : "flex items-start gap-3 rounded-xl border border-border bg-background p-4"
                }
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className={compact ? "text-xs leading-snug text-foreground" : "text-sm text-foreground"}>
                    {formatAuditMessage(entry, entry.actorName)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted">{formatRelativeTime(entry.createdAt)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
