"use client";

import { useEffect, useState } from "react";
import { PlatformAttention } from "@/components/desktop/PlatformAttention";
import { applyQueueAction, examplePlatformQueue } from "@/lib/desktop/platform-queue";
import type { PublicAttentionCase } from "@/lib/desktop/attention";
import "@/components/desktop/mentor-desktop.css";

const ME = "me";

export function ColaLab() {
  const [cases, setCases] = useState<PublicAttentionCase[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [sending, setSending] = useState(false);
  const selected = cases.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    setCases(examplePlatformQueue({ viewerUserId: ME, now: Date.now() }));
  }, []);

  async function onPost(payload: Record<string, unknown>): Promise<boolean> {
    const now = new Date().toISOString();
    const caseId = typeof payload.caseId === "string" ? payload.caseId : "";
    setSending(true);
    setCases((current) =>
      current.map((item) => {
        if (item.id !== caseId) return item;
        if (payload.action === "message" && typeof payload.body === "string") {
          return applyQueueAction(item, { action: "message", body: payload.body, now });
        }
        if (payload.action === "confirm-ask") return applyQueueAction(item, { action: "confirm-ask", now });
        if (payload.action === "assign") {
          const assigneeUserId = typeof payload.assigneeUserId === "string" ? payload.assigneeUserId : "";
          const assigneeName = assigneeUserId === ME ? "Yo" : assigneeUserId ? "Marco Busts" : "";
          return applyQueueAction(item, { action: "assign", assigneeUserId, assigneeName, now });
        }
        if (payload.action === "priority" && typeof payload.priority === "string") {
          return applyQueueAction(item, { action: "priority", priority: payload.priority, now });
        }
        if (payload.action === "promote") return applyQueueAction(item, { action: "promote", now });
        return item;
      })
    );
    setSending(false);
    return true;
  }

  return (
    <div className="ajustes-back" style={{ minHeight: "100vh" }}>
      <PlatformAttention
        cases={cases}
        companies={[
          { tenantId: "org-1", name: "Seminario Eclesiástico Mayor" },
          { tenantId: "org-2", name: "Mentor Capacitación" },
        ]}
        colleagues={[
          { userId: ME, displayName: "Yo", allAreas: true, areaIds: [] },
          { userId: "colega-1", displayName: "Marco Busts", allAreas: true, areaIds: [] },
        ]}
        selected={selected}
        sending={sending}
        loading={false}
        error=""
        defaultArea="general"
        viewerUserId={ME}
        onClose={() => setSelectedId("")}
        onOpen={(item) => setSelectedId(item.id)}
        onClear={() => setSelectedId("")}
        onPost={onPost}
      />
    </div>
  );
}
