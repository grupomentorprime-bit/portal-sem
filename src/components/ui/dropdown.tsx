"use client";

import { cn } from "@/lib/utils";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { focusRing } from "./shared";

export interface DropdownItem {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  danger?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  className?: string;
}

interface MenuPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export function Dropdown({
  trigger,
  items,
  align = "left",
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    function place() {
      const triggerEl = rootRef.current?.querySelector("button");
      const menuEl = menuRef.current;
      if (!triggerEl || !menuEl) return;

      const rect = triggerEl.getBoundingClientRect();
      const menuHeight = menuEl.offsetHeight;
      const gap = 8;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < menuHeight + gap && rect.top > spaceBelow;

      const next: MenuPosition = openUp
        ? { bottom: window.innerHeight - rect.top + gap }
        : { top: rect.bottom + gap };

      if (align === "right") {
        next.right = window.innerWidth - rect.right;
      } else {
        next.left = rect.left;
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
  }, [open, align, items.length]);

  const menu =
    open && typeof document !== "undefined"
      ? createPortal(
          <ul
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: position?.top,
              bottom: position?.bottom,
              left: position?.left,
              right: position?.right,
              visibility: position ? "visible" : "hidden",
            }}
            className="z-[80] min-w-48 rounded-[var(--radius-md)] border border-border bg-background py-1 shadow-[var(--shadow-lg)]"
          >
            {items.map((item) => (
              <li
                key={item.label}
                role="none"
                className={item.danger ? "mt-1 border-t border-border pt-1" : undefined}
              >
                <button
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    item.onClick?.();
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full px-4 py-2 text-left text-sm transition-colors hover:bg-background-muted disabled:cursor-not-allowed disabled:opacity-50",
                    item.danger
                      ? "text-[var(--color-danger)]"
                      : "text-foreground",
                    focusRing
                  )}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className={cn("relative inline-block", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={cn("inline-flex", focusRing)}
      >
        {trigger}
      </button>
      {menu}
    </div>
  );
}
