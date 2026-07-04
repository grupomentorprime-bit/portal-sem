"use client";

import { Drawer } from "@/components/admin/kit/drawers/Drawer";
import type { ReactNode } from "react";

export interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** Panel lateral en overlay (móvil / inspector). */
export function SidePanel({ open, onClose, title, children }: SidePanelProps) {
  return (
    <Drawer open={open} onClose={onClose} title={title} side="right">
      {children}
    </Drawer>
  );
}
