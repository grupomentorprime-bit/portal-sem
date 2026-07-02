"use client";

import type { ReactNode } from "react";
import type { PortalCursorConfig } from "@/types/cms";
import { usePremiumCursor } from "@/hooks/useCursor";

interface CursorProviderProps {
  config: PortalCursorConfig;
  children: ReactNode;
}

/** Monta el cursor premium del portal (OT-PORTAL-015). */
export function CursorProvider({ config, children }: CursorProviderProps) {
  usePremiumCursor(config);
  return children;
}
