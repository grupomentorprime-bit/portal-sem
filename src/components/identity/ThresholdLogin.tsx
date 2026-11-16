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
      <main
        className="relative flex min-h-screen w-full flex-col items-center justify-center px-5 py-16 text-white"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,12,20,.55) 0%, rgba(8,12,20,.08) 22%, rgba(8,12,20,.08) 68%, rgba(8,12,20,.58) 100%), url(/desktop/mar.jpg) center/cover no-repeat, #102033",
        }}
      >
        <div className="flex w-full max-w-md flex-col">
          <div
            className="rounded-[30px] border px-6 py-7 shadow-[0_16px_40px_rgba(0,0,0,.35)] [&_label]:text-white [&_input]:border-white/35 [&_input]:bg-[rgba(255,255,255,.14)] [&_input]:text-white [&_input]:placeholder:text-white/50"
            style={{
              background: "rgba(8,12,20,.68)",
              borderColor: "rgba(255,255,255,.32)",
              backdropFilter: "blur(28px) saturate(1.5)",
              WebkitBackdropFilter: "blur(28px) saturate(1.5)",
            }}
          >
            <h1
              aria-live="polite"
              className="mb-6 text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-white"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,.55)" }}
            >
              {phrase}
            </h1>
            {children}
          </div>
        </div>
      </main>
    </ThresholdAuthContext.Provider>
  );
}
