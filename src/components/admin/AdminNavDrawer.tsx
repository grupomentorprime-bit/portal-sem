"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { ADMIN_PRIMARY_NAV, isNavActive } from "@/lib/admin/institutional";
import { cn } from "@/lib/utils";

export function AdminNavDrawer() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex rounded-lg border border-border p-2 text-muted lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} title="Centro de Administración" side="left">
        <nav className="space-y-1" aria-label="Navegación principal">
          {ADMIN_PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-lg px-3 py-2.5 text-sm font-medium transition",
                isNavActive(pathname, item)
                  ? "bg-primary text-text-inverse"
                  : "text-foreground hover:bg-background-muted"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Drawer>
    </>
  );
}
