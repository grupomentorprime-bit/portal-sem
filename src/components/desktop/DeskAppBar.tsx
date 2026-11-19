"use client";

import type { ReactNode } from "react";

function Mark({ name }: { name: "home" | "gear" | "user" }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  if (name === "home") {
    return (
      <svg {...common}>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
      </svg>
    );
  }
  if (name === "user") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 19.5c1.2-3 3.4-4.5 7-4.5s5.8 1.5 7 4.5" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a7.7 7.7 0 0 0 .1-2l2-1.2-2-3.4-2.3.6a7.8 7.8 0 0 0-1.7-1L15 3h-4l-.5 2.9a7.8 7.8 0 0 0-1.7 1L6.5 6.4l-2 3.4L6.5 11a7.7 7.7 0 0 0 .1 2l-2 1.2 2 3.4 2.3-.6a7.8 7.8 0 0 0 1.7 1L11 21h4l.5-2.9a7.8 7.8 0 0 0 1.7-1l2.3.6 2-3.4-2-1.3z" />
    </svg>
  );
}

export function DeskAppBar({
  title,
  titleId,
  mark,
  enlarged,
  onEnlarge,
  onClose,
  children,
}: {
  title: string;
  titleId: string;
  mark: "home" | "gear" | "user";
  enlarged: boolean;
  onEnlarge: (next: boolean) => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  return (
    <>
      <header className="plat-bar">
        <h2 id={titleId}>
          <span className="plat-mark" aria-hidden="true">
            <Mark name={mark} />
          </span>
          {title}
        </h2>
        <div className="plat-chrome">
          <button type="button" aria-label="Reducir" onClick={() => onEnlarge(false)}>
            <span />
          </button>
          <button type="button" aria-label="Ampliar" aria-pressed={enlarged} onClick={() => onEnlarge(!enlarged)}>
            <span />
          </button>
          <button type="button" aria-label="Cerrar" onClick={onClose}>
            <span />
          </button>
        </div>
      </header>
      {children ? <div className="plat-tabs">{children}</div> : null}
    </>
  );
}
