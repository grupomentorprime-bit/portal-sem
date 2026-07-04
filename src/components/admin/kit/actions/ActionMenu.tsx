"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

const menuItemClass = (destructive?: boolean) =>
  cn(
    "block w-full px-3 py-2 text-left text-sm transition hover:bg-background-muted",
    destructive ? "text-[var(--color-danger)]" : "text-foreground"
  );

export interface ActionMenuProps {
  label?: string;
  children: ReactNode;
  align?: "start" | "end";
}

/** Menú de acciones compacto (⋯). */
export function ActionMenu({ label = "Acciones", children, align = "end" }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open ? (
        <div
          className={cn(
            "absolute z-50 mt-1 min-w-[10rem] rounded-lg border border-border bg-background py-1 shadow-[var(--shadow-lg)]",
            align === "end" ? "right-0" : "left-0"
          )}
          role="menu"
        >
          <div className="flex flex-col" onClick={() => setOpen(false)}>
            {children}
          </div>
        </div>
      ) : null}
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
