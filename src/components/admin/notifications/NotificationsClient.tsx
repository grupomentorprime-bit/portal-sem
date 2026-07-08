"use client";

import { useCallback, useEffect, useState } from "react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlatformNotification } from "@/types/notifications";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function NotificationsClient() {
  const [items, setItems] = useState<PlatformNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/identity/notifications?limit=50", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) setItems(data.notifications ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  async function markAllRead() {
    await fetch("/api/identity/notifications", { method: "PATCH" });
    setItems((current) => current.map((item) => ({ ...item, read: true })));
  }

  async function markRead(id: string) {
    await fetch(`/api/identity/notifications/${id}`, { method: "PATCH" });
    setItems((current) =>
      current.map((item) => (item._id === id ? { ...item, read: true } : item))
    );
  }

  if (loading) {
    return <p className="text-sm text-muted">Cargando notificaciones…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
        <p className="font-medium text-foreground">Sin notificaciones</p>
        <p className="mt-2 text-sm text-muted">
          Aquí verás avisos de validación de informes, asignaciones y otras gestiones del CMS.
        </p>
      </div>
    );
  }

  const unread = items.filter((item) => !item.read).length;

  return (
    <div className="space-y-4">
      {unread > 0 ? (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => void markAllRead()}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Marcar todo leído
          </Button>
        </div>
      ) : null}

      <ul className="divide-y divide-border rounded-xl border border-border bg-background">
        {items.map((item) => (
          <li
            key={item._id}
            className={cn("px-4 py-4", !item.read && "bg-primary/5")}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 whitespace-pre-line text-sm text-muted">{item.body}</p>
                <p className="mt-2 text-xs text-muted">{formatWhen(item.createdAt)}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {item.href ? (
                  <Button
                    variant="outline"
                    size="sm"
                    href={item.href}
                    onClick={() => {
                      if (!item.read) void markRead(item._id);
                    }}
                  >
                    Abrir
                  </Button>
                ) : null}
                {!item.read ? (
                  <Button variant="ghost" size="sm" onClick={() => void markRead(item._id)}>
                    Marcar leída
                  </Button>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-center text-xs text-muted">
        También puedes revisarlas desde la{" "}
        <Link href="/admin" className="text-primary underline">
          campana del panel superior
        </Link>
        .
      </p>
    </div>
  );
}
