"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { thresholdBreathMs } from "@/lib/identity/threshold-line";
import {
  browserArrivalStorage,
  markThresholdArrival,
} from "@/lib/identity/threshold-arrival";

export interface ThresholdAuthResult {
  redirectTo: string;
  thresholdLine?: string;
  thresholdArrival?: boolean;
}

const ThresholdAuthContext = createContext<
  ((result: ThresholdAuthResult) => Promise<void>) | null
>(null);

export function useThresholdOnAuthenticated() {
  return useContext(ThresholdAuthContext);
}

export function ThresholdLogin({
  line,
  children,
}: {
  line: string;
  children: ReactNode;
}) {
  const [phrase, setPhrase] = useState(line);
  const phraseRef = useRef(line);
  phraseRef.current = phrase;

  async function onAuthenticated(result: ThresholdAuthResult) {
    const wait = thresholdBreathMs({
      nextLine: result.thresholdLine,
      currentLine: phraseRef.current,
      reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
    const nextLine = result.thresholdLine?.trim();
    if (nextLine && nextLine !== phraseRef.current) setPhrase(nextLine);
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    if (result.thresholdArrival) {
      const storage = browserArrivalStorage();
      if (storage) markThresholdArrival(storage, Date.now());
    }
    window.location.assign(result.redirectTo);
  }

  return (
    <ThresholdAuthContext.Provider value={onAuthenticated}>
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-10 px-5 py-16">
        <h1
          aria-live="polite"
          className="text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--growth-os-primary)]"
        >
          {phrase}
        </h1>
        {children}
      </main>
    </ThresholdAuthContext.Provider>
  );
}
