"use client";

import { useCallback, useState } from "react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import type { NavGroupId } from "@/lib/admin/nav-domains";

const STORAGE_KEY = "sem-admin-nav-expanded-group";

export function useNavGroupExpanded(activeGroupId: NavGroupId | null) {
  const [expandedGroupId, setExpandedGroupId] = useState<NavGroupId | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useDeferredEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as NavGroupId | null;
      if (stored) {
        setExpandedGroupId(stored);
      } else if (activeGroupId) {
        setExpandedGroupId(activeGroupId);
      }
    } catch {
      if (activeGroupId) setExpandedGroupId(activeGroupId);
    }
    setHydrated(true);
  }, [activeGroupId]);

  useDeferredEffect(() => {
    if (!hydrated || !activeGroupId) return;
    setExpandedGroupId((current) => current ?? activeGroupId);
  }, [activeGroupId, hydrated]);

  const toggleGroup = useCallback((groupId: NavGroupId) => {
    setExpandedGroupId((current) => {
      const next = current === groupId ? null : groupId;
      try {
        if (next) localStorage.setItem(STORAGE_KEY, next);
        else localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const expandGroup = useCallback((groupId: NavGroupId) => {
    setExpandedGroupId((current) => {
      if (current === groupId) return current;
      try {
        localStorage.setItem(STORAGE_KEY, groupId);
      } catch {
        /* ignore */
      }
      return groupId;
    });
  }, []);

  const isExpanded = useCallback(
    (groupId: NavGroupId) => expandedGroupId === groupId,
    [expandedGroupId]
  );

  return { expandedGroupId, toggleGroup, expandGroup, isExpanded, hydrated };
}
