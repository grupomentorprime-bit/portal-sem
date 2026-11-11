"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  browserArrivalStorage,
  consumeThresholdArrival,
} from "@/lib/identity/threshold-arrival";

export function ThresholdArrival({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storage = browserArrivalStorage();
    if (!storage) return;
    const play = consumeThresholdArrival(storage, Date.now());
    if (!play) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ref.current?.setAttribute("data-threshold-arrival", "true");
  }, []);

  return (
    <div ref={ref} className="threshold-arrival mt-4 flex min-h-0 flex-1 flex-col">
      {children}
    </div>
  );
}
