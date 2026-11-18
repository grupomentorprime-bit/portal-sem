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
        className="relative flex min-h-screen w-full flex-col items-center justify-center px-5 py-16"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,12,20,.28) 0%, rgba(8,12,20,.05) 30%, rgba(8,12,20,.05) 70%, rgba(8,12,20,.32) 100%), url(/desktop/mar.jpg) center/cover no-repeat, #8aa4b8",
        }}
      >
        <style>{`
          .login-panel {
            width: min(100%, 400px);
            padding: 36px 32px 28px;
            border: 1px solid rgba(255,255,255,.55);
            border-radius: 22px;
            background: rgba(255,255,255,.92);
            color: #1d1d1f;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            box-shadow: 0 24px 60px rgba(0,0,0,.22);
            backdrop-filter: blur(28px) saturate(1.4);
            -webkit-backdrop-filter: blur(28px) saturate(1.4);
          }
          .login-title {
            margin: 0;
            color: #1d1d1f;
            font-size: 28px;
            font-weight: 600;
            letter-spacing: -0.03em;
            line-height: 1.15;
          }
          .login-phrase {
            margin: 8px 0 28px;
            color: #6e6e73;
            font-size: 15px;
            font-weight: 400;
            line-height: 1.4;
          }
          .login-card label {
            color: #1d1d1f !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            letter-spacing: 0 !important;
          }
          .login-card input {
            height: 44px !important;
            border: 1px solid #d2d2d7 !important;
            border-radius: 12px !important;
            background: #fff !important;
            color: #1d1d1f !important;
            -webkit-text-fill-color: #1d1d1f;
            caret-color: #1d1d1f;
            font-size: 16px !important;
            box-shadow: none !important;
          }
          .login-card input::placeholder { color: #86868b !important; }
          .login-card input:focus {
            border-color: #0071e3 !important;
            outline: none !important;
            box-shadow: 0 0 0 4px rgba(0,113,227,.16) !important;
          }
          .login-card input:-webkit-autofill,
          .login-card input:-webkit-autofill:hover,
          .login-card input:-webkit-autofill:focus {
            -webkit-text-fill-color: #1d1d1f !important;
            caret-color: #1d1d1f;
            border-color: #d2d2d7 !important;
            box-shadow: inset 0 0 0 1000px #fff !important;
            transition: background-color 99999s ease-out;
          }
          .login-card .password-reveal {
            color: #1d1d1f !important;
            background: transparent !important;
            border: 0 !important;
            box-shadow: none !important;
          }
          .login-card .password-reveal:hover { background: rgba(0,0,0,.05) !important; }
          .login-actions {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 8px;
          }
          .login-card .login-submit {
            width: 100% !important;
            height: 44px !important;
            border: 0 !important;
            border-radius: 12px !important;
            background: #0071e3 !important;
            color: #fff !important;
            font-family: inherit !important;
            font-size: 16px !important;
            font-weight: 600 !important;
            letter-spacing: -0.01em;
            text-shadow: none !important;
            box-shadow: none !important;
            transform: none !important;
          }
          .login-card .login-submit:hover { background: #0077ed !important; }
          .login-card .login-back {
            display: flex;
            height: 36px;
            align-items: center;
            justify-content: center;
            color: #0071e3;
            font-size: 15px;
            font-weight: 400;
            text-decoration: none;
          }
          .login-card .login-back:hover { text-decoration: underline; }
          .login-card .login-error {
            margin: 0;
            color: #9b1c1c;
            font-size: 13px;
          }
          .login-card .login-unavailable {
            margin: 0;
            color: #1c1c1c;
            font-size: 13px;
          }
        `}</style>
        <div className="login-panel">
          <h1 className="login-title">Iniciar sesión</h1>
          <p className="login-phrase" aria-live="polite">
            {phrase}
          </p>
          <div className="login-card">{children}</div>
        </div>
      </main>
    </ThresholdAuthContext.Provider>
  );
}
