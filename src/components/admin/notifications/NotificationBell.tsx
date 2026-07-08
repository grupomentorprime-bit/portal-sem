"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlatformNotification } from "@/types/notifications";

const POLL_INTERVAL_MS = 60_000;

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const min = Math.round(diff / 60_000);
  if (min < 1) return "Ahora";
  if (min < 60) return `Hace ${min} min`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `Hace ${days} d`;
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
}

export function NotificationBell({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PlatformNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/identity/notifications?limit=20", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.ok) return;
      setItems(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch {
      /* silencioso: la campana no debe romper el shell */
    }
  }, []);

  useDeferredEffect(() => {
    void load();
    const timer = setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      await load();
      setLoading(false);
    }
  }

  async function markAllRead() {
    setUnread(0);
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    try {
      await fetch("/api/identity/notifications", { method: "PATCH" });
    } catch {
      /* noop */
    }
    void load();
  }

  async function openNotification(notification: PlatformNotification) {
    if (!notification.read) {
      setItems((current) =>
        current.map((item) => (item._id === notification._id ? { ...item, read: true } : item))
      );
      setUnread((count) => Math.max(0, count - 1));
      try {
        await fetch(`/api/identity/notifications/${notification._id}`, { method: "PATCH" });
      } catch {
        /* noop */
      }
    }
    setOpen(false);
    if (notification.href) router.push(notification.href);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => void toggleOpen()}
        className={cn(
          "relative rounded-lg p-1.5 text-muted transition hover:bg-background-muted hover:text-foreground",
          className
        )}
        aria-label="Notificaciones"
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-background shadow-[var(--shadow-lg)] sm:w-96">
          <div className="flex items-center justify-between border-b border-border bg-background-muted/30 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Notificaciones</p>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="flex items-center gap-1 text-xs font-medium text-primary transition hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar todo leído
              </button>
            ) : null}
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">Cargando…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">No tienes notificaciones.</p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li key={item._id}>
                    <button
                      type="button"
                      onClick={() => void openNotification(item)}
                      className={cn(
                        "flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-background-muted",
                        !item.read && "bg-primary/5"
                      )}
                    >
                      <span className="flex items-start gap-2">
                        {!item.read ? (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                        ) : (
                          <span className="mt-1.5 h-2 w-2 shrink-0" aria-hidden />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-foreground">
                            {item.title}
                          </span>
                          <span className="mt-0.5 block whitespace-pre-line text-xs leading-relaxed text-muted">
                            {item.body}
                          </span>
                        </span>
                      </span>
                      <span className="pl-4 text-[11px] text-muted">{formatRelative(item.createdAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
