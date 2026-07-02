"use client";

import type { ReactNode } from "react";
import type { PortalCursorConfig } from "@/types/cms";
import { CursorProvider } from "@/components/ui/CursorProvider";

interface PortalExperienceProviderProps {
  cursor: PortalCursorConfig;
  children: ReactNode;
}

export function PortalExperienceProvider({ cursor, children }: PortalExperienceProviderProps) {
  if (!cursor.enabled || cursor.mode !== "premium") {
    return children;
  }

  return <CursorProvider config={cursor}>{children}</CursorProvider>;
}
