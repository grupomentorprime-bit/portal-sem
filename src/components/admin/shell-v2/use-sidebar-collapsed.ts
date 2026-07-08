"use client";

import { useCallback, useState } from "react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";

const STORAGE_KEY = "aprendehoy-admin-sidebar-collapsed";

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useDeferredEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((v) => !v);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return {
    collapsed,
    mobileOpen,
    toggleCollapsed,
    toggleMobile,
    closeMobile,
  };
}
