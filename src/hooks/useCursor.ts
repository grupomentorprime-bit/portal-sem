"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { CursorEngine } from "@/lib/cursor/cursor-engine";
import type { PortalCursorConfig } from "@/types/cms";

export function usePremiumCursor(config: PortalCursorConfig): void {
  const engineRef = useRef<CursorEngine | null>(null);
  const pathname = usePathname();
  const configKey = JSON.stringify(config);

  useEffect(() => {
    const engine = new CursorEngine(config);
    engine.start();
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [configKey]);

  useEffect(() => {
    engineRef.current?.updateConfig(config);
  }, [configKey, config]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !config.enabled || config.mode !== "premium") return;

    engine.setLoading(true);
    const timer = window.setTimeout(() => engine.setLoading(false), 480);
    return () => clearTimeout(timer);
  }, [pathname, config.enabled, config.mode]);
}
