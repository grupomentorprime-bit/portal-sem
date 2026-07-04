"use client";

import { createContext, useContext, type ReactNode } from "react";

interface AdminChromeContextValue {
  shellV2: boolean;
}

const AdminChromeContext = createContext<AdminChromeContextValue>({ shellV2: false });

export function AdminChromeProvider({
  shellV2,
  children,
}: {
  shellV2: boolean;
  children: ReactNode;
}) {
  return (
    <AdminChromeContext.Provider value={{ shellV2 }}>
      {children}
    </AdminChromeContext.Provider>
  );
}

export function useAdminChrome() {
  return useContext(AdminChromeContext);
}
