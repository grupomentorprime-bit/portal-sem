"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "cumple-theme";

function siteRoot(): HTMLElement | null {
  return document.querySelector(".cumple-site");
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(siteRoot()?.getAttribute("data-theme") === "dark");
  }, []);

  function toggle() {
    const root = siteRoot();
    if (!root) return;
    const next = root.getAttribute("data-theme") !== "dark";
    root.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "Activar modo claro" : "Activar modo oscuro"}
      className="group grid size-10 place-items-center rounded-full border border-cviolet/20 bg-[#efeaff] text-cviolet shadow-[0_10px_22px_-12px_rgba(109,77,255,0.85)] transition duration-200 hover:-translate-y-px hover:border-cviolet/40 hover:bg-[#e4dcff] hover:shadow-[0_14px_26px_-12px_rgba(109,77,255,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caccent focus-visible:ring-offset-2 focus-visible:ring-offset-cpaper active:translate-y-0 active:scale-95 cdark:border-ccyan/25 cdark:bg-[#10243f] cdark:text-ccyan cdark:shadow-[0_10px_22px_-12px_rgba(46,200,255,0.65)] cdark:hover:border-ccyan/50 cdark:hover:bg-[#14304f]"
    >
      <span className="relative grid size-6 place-items-center">
        <svg
          viewBox="0 0 24 24"
          className={`col-start-1 row-start-1 size-6 transition duration-300 ${dark ? "scale-100 rotate-0" : "scale-0 -rotate-90"}`}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4.2" fill="currentColor" />
          <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 2.2v2.3M12 19.5v2.3M2.2 12h2.3M19.5 12h2.3" />
            <path d="m5.1 5.1 1.6 1.6M17.3 17.3l1.6 1.6M18.9 5.1l-1.6 1.6M6.7 17.3l-1.6 1.6" />
          </g>
        </svg>
        <svg
          viewBox="0 0 24 24"
          className={`col-start-1 row-start-1 size-6 fill-current transition duration-300 ${dark ? "scale-0 rotate-90" : "scale-100 rotate-0"}`}
          aria-hidden="true"
        >
          <path d="M9.53 1.72a.75.75 0 0 1 .16.82A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.46-.69.75.75 0 0 1 .98.98 10.5 10.5 0 0 1-9.69 6.46c-5.8 0-10.5-4.7-10.5-10.5 0-4.37 2.67-8.11 6.46-9.67a.75.75 0 0 1 .82.16Z" />
        </svg>
      </span>
    </button>
  );
}
