"use client";

import { useEffect, useState } from "react";
import { Activity, Clock, Users } from "lucide-react";
import { AuditTimeline, type AuditTimelineEntry } from "@/components/admin/AuditTimeline";
import {
  AdminModuleCenter,
  AdminModuleHero,
  AdminModuleSectionHeader,
  AdminModuleStats,
} from "@/components/admin/AdminModuleCenter";
import { ADMIN_PANEL_META } from "@/lib/admin/module-panels";

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

  return (
    <AdminModuleCenter>
      <AdminModuleHero {...ADMIN_PANEL_META.activity} />

      <AdminModuleStats
        items={[
          { label: "Eventos registrados", value: audit.length, icon: Activity, tone: "total" },
          {
            label: "Últimas 24 h",
            value: audit.filter((e) => Date.now() - new Date(e.createdAt).getTime() < 86400000).length,
            icon: Clock,
            tone: "active",
          },
          {
            label: "Autores distintos",
            value: new Set(audit.map((e) => e.actorName).filter(Boolean)).size,
            icon: Users,
            tone: "published",
          },
        ]}
      />

      <AdminModuleSectionHeader
        icon={Activity}
        title="Línea de tiempo"
        description="Acciones recientes en el CMS ordenadas cronológicamente."
      />

      <AuditTimeline entries={audit} />
    </AdminModuleCenter>
  );
}
