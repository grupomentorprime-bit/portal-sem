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
}

export function AuditTimeline({ entries }: AuditTimelineProps) {
  const groups = groupAuditByDay(entries);

  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
        Aún no hay actividad registrada.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.label}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
            {group.label}
          </h3>
          <ol className="space-y-3">
            {group.items.map((entry) => (
              <li
                key={entry.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-background p-4"
              >
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">
                    {formatAuditMessage(entry, entry.actorName)}
                  </p>
                  <p className="mt-1 text-xs text-muted">{formatRelativeTime(entry.createdAt)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
