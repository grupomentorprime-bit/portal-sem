"use client";

import { publicUrlForPath } from "@/core/tenant/hosts";
import { createContext, useContext, type ReactNode } from "react";

const SpacePublicOriginContext = createContext<string | null>(null);

export function SpacePublicOriginProvider({
  origin,
  children,
}: {
  origin: string | null;
  children: ReactNode;
}) {
  return (
    <SpacePublicOriginContext.Provider value={origin}>
      {children}
    </SpacePublicOriginContext.Provider>
  );
}

export function useSpacePublicOrigin(): string | null {
  return useContext(SpacePublicOriginContext);
}

/** Ruta pública del Espacio. Sin origen resuelto, queda relativa. */
export function spacePublicHref(origin: string | null, path: string): string {
  if (!origin) {
    const raw = path.trim();
    if (!raw || raw === "/" || raw === "home") return "/";
    return raw.startsWith("/") ? raw : `/${raw}`;
  }
  return publicUrlForPath(origin, path);
}
