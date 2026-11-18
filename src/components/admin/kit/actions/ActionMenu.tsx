"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const menuItemClass = (destructive?: boolean) =>
  cn(
    "block w-full whitespace-nowrap px-3 py-2 text-left text-sm transition hover:bg-background-muted",
    destructive ? "text-[var(--color-danger)]" : "text-foreground"
  );

export interface ActionMenuProps {
  label?: string;
  children: ReactNode;
  align?: "start" | "end";
}

interface MenuPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  maxHeight: number;
}

/**
 * Menú de acciones (⋯). Se pinta en un portal con posición fija para que
 * no lo recorten los contenedores con overflow de las tablas.
 */
export function ActionMenu({ label = "Acciones", children, align = "end" }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    function place() {
      const trigger = ref.current?.querySelector("button");
      const menuEl = menuRef.current;
      if (!trigger || !menuEl) return;

      const rect = trigger.getBoundingClientRect();
      const gap = 6;
      const margin = 8;
      const menuHeight = menuEl.scrollHeight;
      const spaceBelow = window.innerHeight - rect.bottom - margin;
      const spaceAbove = rect.top - margin;
      const openUp = spaceBelow < menuHeight + gap && spaceAbove > spaceBelow;
      const available = openUp ? spaceAbove : spaceBelow;

      const next: MenuPosition = {
        maxHeight: Math.max(120, available - gap),
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + gap }
          : { top: rect.bottom + gap }),
      };

      if (align === "end") {
        next.right = Math.max(margin, window.innerWidth - rect.right);
      } else {
        next.left = Math.max(margin, rect.left);
      }
      setPosition(next);
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, align, children]);

  const menu =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: position?.top,
              bottom: position?.bottom,
              left: position?.left,
              right: position?.right,
              maxHeight: position?.maxHeight,
              visibility: position ? "visible" : "hidden",
            }}
            className="z-[80] w-max min-w-[12rem] max-w-[min(20rem,calc(100vw-1rem))] overflow-y-auto rounded-lg border border-border bg-[var(--admin-surface,white)] py-1 shadow-[var(--shadow-lg)]"
          >
            <div className="flex flex-col" onClick={() => setOpen(false)}>
              {children}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={ref} className="relative inline-block">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {menu}
    </div>
  );
}

export function ActionMenuItem({
  children,
  onClick,
  href,
  external,
  destructive,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  destructive?: boolean;
}) {
  if (href) {
    return (
      <Link
        href={href}
        role="menuitem"
        className={menuItemClass(destructive)}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {children}
      </Link>
    );
  }

  return (
    <button type="button" role="menuitem" className={menuItemClass(destructive)} onClick={onClick}>
      {children}
    </button>
  );
}
