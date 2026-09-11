import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

/**
 * Aísla una superficie de `--brand-*` / `--color-*` del Espacio activo.
 * Usa la paleta por defecto de plataforma (Growth OS), no la del cliente.
 * /platform y auth nunca heredan la identidad visual del Espacio.
 */
const NEUTRAL_THEME_STYLE = {
  "--sem-primary": "var(--growth-os-primary)",
  "--sem-secondary": "var(--growth-os-secondary)",
  "--sem-accent": "var(--growth-os-accent)",
  "--sem-success": "var(--growth-os-success)",
  "--sem-light": "var(--growth-os-light)",
  "--brand-primary": "var(--growth-os-primary)",
  "--brand-secondary": "var(--growth-os-secondary)",
  "--brand-background": "var(--color-background-default)",
  "--brand-text": "var(--color-foreground-default)",
  "--color-primary": "var(--growth-os-primary)",
  "--color-secondary": "var(--growth-os-secondary)",
  "--color-accent": "var(--growth-os-accent)",
  "--color-success": "var(--growth-os-success)",
  "--color-warning": "var(--growth-os-light)",
  "--color-info": "var(--growth-os-secondary)",
  "--color-background": "var(--color-background-default)",
  "--color-foreground": "var(--color-foreground-default)",
  "--color-surface": "var(--color-surface-default)",
  "--color-border": "var(--color-border-default)",
  "--color-muted": "var(--color-muted-default)",
  "--color-brand": "var(--growth-os-primary)",
  "--color-link": "var(--growth-os-secondary)",
  "--color-action": "var(--growth-os-accent)",
  "--primary": "var(--growth-os-primary)",
  "--secondary": "var(--growth-os-secondary)",
  "--accent": "var(--growth-os-accent)",
  "--success": "var(--growth-os-success)",
  "--light": "var(--growth-os-light)",
  "--background": "var(--color-background-default)",
  "--background-soft": "var(--gray-50)",
  "--background-muted": "var(--gray-100)",
  "--text": "var(--color-foreground-default)",
  "--text-muted": "var(--color-muted-default)",
  "--border": "var(--color-border-default)",
  "--border-strong": "var(--gray-300)",
} as CSSProperties;

export function PlatformNeutralTheme({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("growth-os-neutral-theme", className)}
      data-theme-scope="growth-os"
      style={NEUTRAL_THEME_STYLE}
    >
      {children}
    </div>
  );
}
