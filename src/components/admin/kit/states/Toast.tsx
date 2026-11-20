"use client";

import { cn } from "@/lib/utils";
import { Check, CircleAlert } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastTone = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone?: ToastTone;
}

interface ToastContextValue {
  push: (message: Omit<ToastMessage, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneClass: Record<ToastTone, string> = {
  success: "border-success/40 bg-success/10",
  error: "border-[var(--state-danger-border)] bg-[var(--state-danger-bg)]",
  info: "border-accent/40 bg-accent/10",
  warning: "border-light/40 bg-light/15",
};

const DISMISS_MS = 2200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastMessage[]>([]);
  const popRef = useRef<HTMLDivElement>(null);

  const push = useCallback((message: Omit<ToastMessage, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setItems((prev) => [...prev.slice(-2), { ...message, id }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, DISMISS_MS);
  }, []);

  useEffect(() => {
    const el = popRef.current;
    if (!el || typeof el.showPopover !== "function") return;
    try {
      if (items.length > 0) {
        if (!el.matches(":popover-open")) el.showPopover();
      } else if (el.matches(":popover-open")) {
        el.hidePopover();
      }
    } catch {
      /* si el aviso no puede flotar sobre el diálogo, se ignora el intento */
    }
  }, [items]);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        ref={popRef}
        popover="manual"
        className="pointer-events-none m-auto flex w-fit flex-col items-center gap-3 border-0 bg-transparent p-0 shadow-none"
        aria-live="polite"
      >
        {items.map((item) => (
          <ActionNotice key={item.id} item={item} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ActionNotice({ item }: { item: ToastMessage }) {
  const tone = item.tone ?? "info";
  const success = tone === "success";
  return (
    <div
      role="status"
      className={cn(
        "pointer-events-none flex max-w-sm items-center gap-3 rounded-2xl border bg-white px-5 py-4 shadow-[var(--shadow-xl)] animate-zoom-in",
        success ? "border-[var(--growth-os-success)]" : toneClass[tone]
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          success
            ? "bg-[color-mix(in_srgb,var(--growth-os-success)_18%,white)] text-[var(--growth-os-success)]"
            : "bg-background-soft text-foreground"
        )}
      >
        {success ? (
          <Check className="h-5 w-5" strokeWidth={2.5} />
        ) : (
          <CircleAlert className="h-5 w-5" strokeWidth={2.5} />
        )}
      </span>
      <div>
        <p className="text-base font-semibold text-foreground">{item.title}</p>
        {item.description ? (
          <p className="mt-0.5 text-sm text-muted">{item.description}</p>
        ) : null}
      </div>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }
  return ctx;
}

/** Componente vacío — los toasts los renderiza ToastProvider. */
export function ToastViewport() {
  return null;
}
