"use client";

import { useEffect, useState } from "react";
import { AuditTimeline, type AuditTimelineEntry } from "@/components/admin/AuditTimeline";

export function ActivityClient() {
  const [audit, setAudit] = useState<AuditTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/identity/team")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setAudit(data.audit ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted">Cargando actividad…</p>;

  return <AuditTimeline entries={audit} />;
}
