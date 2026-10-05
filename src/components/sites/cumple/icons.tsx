import type { ReactNode } from "react";

type IconProps = {
  name: string;
  className?: string;
};

export function Icon({ name, className = "size-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name] ?? paths.search}
    </svg>
  );
}

const paths: Record<string, ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  scale: (
    <>
      <path d="M12 3v18" />
      <path d="M5 7h14" />
      <path d="m5 7-3 6h6L5 7Z" />
      <path d="m19 7-3 6h6l-3-6Z" />
    </>
  ),
  folder: (
    <>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-10Z" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 1 1 12 0c0 7 2 7 2 7H4s2 0 2-7" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-4" />
      <path d="M12 16V8" />
      <path d="M16 16v-6" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </>
  ),
  store: (
    <>
      <path d="M4 10 6 4h12l2 6" />
      <path d="M4 10h16v9H4v-9Z" />
      <path d="M9 19v-5h6v5" />
    </>
  ),
  building: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <path d="M9 7h.01M12 7h.01M15 7h.01M9 11h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15h.01" />
    </>
  ),
  landmark: (
    <>
      <path d="M4 10h16" />
      <path d="M6 10v8M10 10v8M14 10v8M18 10v8" />
      <path d="M3 18h18" />
      <path d="m12 3 9 7H3l9-7Z" />
    </>
  ),
  users: (
    <>
      <path d="M16 20v-1.5A3.5 3.5 0 0 0 12.5 15h-5A3.5 3.5 0 0 0 4 18.5V20" />
      <circle cx="10" cy="8" r="3" />
      <path d="M20 20v-1.5A3.5 3.5 0 0 0 17 15" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
      <path d="M3 12h18" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5L3 8l9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 16 9 5 9-5" />
    </>
  ),
  list: (
    <>
      <path d="M9 7h11M9 12h11M9 17h11" />
      <path d="M4 7h.01M4 12h.01M4 17h.01" />
    </>
  ),
  clipboard: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4.5h6V6H9V4.5Z" />
      <path d="M9 11h6M9 15h4" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.8.4-1.2.9-1.2 1.8" />
      <path d="M12 17h.01" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v6c0 4.2 2.8 7.4 7 9 4.2-1.6 7-4.8 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  check: <path d="m5 12 5 5L20 7" />,
  x: (
    <>
      <path d="M6 6 18 18" />
      <path d="M18 6 6 18" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
  /** Dos personas separadas por una barrera: hostigamiento en el trabajo. */
  hostility: (
    <>
      <circle cx="5.4" cy="7.4" r="1.7" />
      <path d="M8.2 16.6v-.7a2.3 2.3 0 0 0-2.3-2.3h-1a2.3 2.3 0 0 0-2.3 2.3v.7" />
      <path d="M12 4.8v14.4" />
      <path d="M10.3 4.8h3.4" />
      <path d="M10.3 19.2h3.4" />
      <circle cx="18.6" cy="7.4" r="1.7" />
      <path d="M21.4 16.6v-.7a2.3 2.3 0 0 0-2.3-2.3h-1a2.3 2.3 0 0 0-2.3 2.3v.7" />
    </>
  ),
  /** Persona frente a un límite que no cruza. */
  boundary: (
    <>
      <circle cx="7" cy="8" r="2" />
      <path d="M10.5 18.4v-.8a2.9 2.9 0 0 0-2.9-2.9h-.6a2.9 2.9 0 0 0-2.9 2.9v.8" />
      <path d="M16 4.6v14.8" />
      <path d="M14.5 4.6H18" />
      <path d="M14.5 19.4H18" />
    </>
  ),
  /** Lugar de trabajo con señal de alerta. */
  "workplace-alert": (
    <>
      <rect x="3" y="8.6" width="12.2" height="11.6" rx="1.4" />
      <path d="M6.1 12.2h.01M9.5 12.2h.01M6.1 15.6h.01M9.5 15.6h.01" />
      <circle cx="17.4" cy="7" r="3.3" />
      <path d="M17.4 5.4v2.1" />
      <path d="M17.4 9.1h.01" />
    </>
  ),
  prevent: <path d="M12 3.2 5.2 6.1v5.6c0 4 2.7 7.1 6.8 8.6 4.1-1.5 6.8-4.6 6.8-8.6V6.1L12 3.2Z" />,
  investigate: (
    <>
      <rect x="3.5" y="3" width="11" height="15" rx="1.6" />
      <path d="M6.5 7h5M6.5 10.2h3.4" />
      <circle cx="15.6" cy="15.4" r="3.1" />
      <path d="m17.9 17.7 2.6 2.6" />
    </>
  ),
  shelter: (
    <>
      <path d="M3.8 13.2a8.2 8.2 0 0 1 16.4 0" />
      <circle cx="12" cy="15.2" r="1.7" />
      <path d="M15.2 20.4v-.5a2.7 2.7 0 0 0-2.7-2.7h-1a2.7 2.7 0 0 0-2.7 2.7v.5" />
    </>
  ),
};
