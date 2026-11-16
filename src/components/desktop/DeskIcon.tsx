export type DeskIconName =
  | "cuentas"
  | "cuenta"
  | "plataforma"
  | "direccion"
  | "productos"
  | "seguridad"
  | "legales"
  | "actividad"
  | "growth-os"
  | "cumple"
  | "aprende-hoy"
  | "rrhh"
  | "create"
  | "remove"
  | "status"
  | "address"
  | "enter"
  | "account"
  | "other"
  | "gear";

const COMMON = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  "aria-hidden": true as const,
};

export function DeskIcon({ name }: { name: DeskIconName }) {
  if (name === "plataforma" || name === "growth-os") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 3.2l1.15 4.05L17.2 8.4l-4.05 1.15L12 13.6l-1.15-4.05L6.8 8.4l4.05-1.15L12 3.2z" />
        <path d="M17.2 13.2l.62 2.18 2.18.62-2.18.62-.62 2.18-.62-2.18-2.18-.62 2.18-.62.62-2.18z" />
      </svg>
    );
  }
  if (name === "cumple" || name === "seguridad") {
    return (
      <svg {...COMMON}>
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
        <path d="M8.5 12l2.2 2.2 4.8-5" />
      </svg>
    );
  }
  if (name === "aprende-hoy") {
    return (
      <svg {...COMMON}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
      </svg>
    );
  }
  if (name === "rrhh" || name === "cuentas") {
    return (
      <svg {...COMMON}>
        <circle cx="9" cy="9" r="3" />
        <circle cx="16" cy="10" r="2.4" />
        <path d="M4 19c.6-2.6 2.6-4 5-4s4.4 1.4 5 4" />
        <path d="M14 15.2c1.2-.5 2.5-.6 3.6-.2 1.2.8 1.8 2 2 3.8" />
      </svg>
    );
  }
  if (name === "cuenta" || name === "account") {
    return (
      <svg {...COMMON}>
        <circle cx="12" cy="9" r="3.2" />
        <path d="M6 19c.8-2.8 3-4.2 6-4.2s5.2 1.4 6 4.2" />
      </svg>
    );
  }
  if (name === "direccion" || name === "address" || name === "enter") {
    return (
      <svg {...COMMON}>
        <path d="M4 20V9l8-5 8 5v11" strokeLinejoin="round" />
        <path d="M9 20v-6h6v6" />
      </svg>
    );
  }
  if (name === "productos") {
    return (
      <svg {...COMMON}>
        <rect x="4" y="4" width="7" height="7" rx="1.6" />
        <rect x="13" y="4" width="7" height="7" rx="1.6" />
        <rect x="4" y="13" width="7" height="7" rx="1.6" />
        <rect x="13" y="13" width="7" height="7" rx="1.6" />
      </svg>
    );
  }
  if (name === "legales") {
    return (
      <svg {...COMMON}>
        <path d="M7 3h7l5 5v13H7z" strokeLinejoin="round" />
        <path d="M14 3v5h5M9 13h6M9 17h6" />
      </svg>
    );
  }
  if (name === "create") {
    return (
      <svg {...COMMON}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    );
  }
  if (name === "remove") {
    return (
      <svg {...COMMON}>
        <path d="M5 8h14" />
        <path d="M9 8V6h6v2" />
        <path d="M7 8l1 12h8l1-12" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "status") {
    return (
      <svg {...COMMON}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </svg>
    );
  }
  if (name === "gear" || name === "other" || name === "actividad") {
    return (
      <svg {...COMMON}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3.5v2.2M12 18.3V20.5M3.5 12h2.2M18.3 12H20.5M5.8 5.8l1.6 1.6M16.6 16.6l1.6 1.6M18.2 5.8l-1.6 1.6M7.4 16.6l-1.6 1.6" />
      </svg>
    );
  }
  return (
    <svg {...COMMON}>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

export function productTone(id: string): string {
  if (id === "growth-os") return "g-growth";
  if (id === "cumple") return "g-cumple";
  if (id === "aprende-hoy") return "g-aprende";
  return "g-rrhh";
}

export function activityTone(kind: string): string {
  if (kind === "remove") return "tone-rose";
  if (kind === "status") return "tone-amber";
  if (kind === "address" || kind === "enter") return "tone-cyan";
  if (kind === "account" || kind === "security") return "tone-ink";
  if (kind === "other") return "tone-mute";
  return "tone-violet";
}
