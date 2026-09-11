"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BreadcrumbItem } from "@/components/ui/breadcrumb";

interface AdminChromeContextValue {
  shellV2: boolean;
  /** Migas humanas de la página (Shell V2); anulan las derivadas de la ruta. */
  breadcrumbOverride: BreadcrumbItem[] | null;
  setBreadcrumbOverride: (items: BreadcrumbItem[] | null) => void;
}

const AdminChromeContext = createContext<AdminChromeContextValue>({
  shellV2: false,
  breadcrumbOverride: null,
  setBreadcrumbOverride: () => {},
});

export function AdminChromeProvider({
  shellV2,
  children,
}: {
  shellV2: boolean;
  children: ReactNode;
}) {
  const [breadcrumbOverride, setBreadcrumbOverrideState] =
    useState<BreadcrumbItem[] | null>(null);

  const setBreadcrumbOverride = useCallback(
    (items: BreadcrumbItem[] | null) => {
      setBreadcrumbOverrideState(items);
    },
    []
  );

  const value = useMemo(
    () => ({ shellV2, breadcrumbOverride, setBreadcrumbOverride }),
    [shellV2, breadcrumbOverride, setBreadcrumbOverride]
  );

  return (
    <AdminChromeContext.Provider value={value}>
      {children}
    </AdminChromeContext.Provider>
  );
}

export function useAdminChrome() {
  return useContext(AdminChromeContext);
}
