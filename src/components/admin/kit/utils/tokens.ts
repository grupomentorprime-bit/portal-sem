/**
 * AEK v1 — tokens de composición administrativa.
 * Consume variables CSS de plataforma (--color-*, --radius-*, --space-*).
 */

export const aek = {
  surface:
    "rounded-[var(--radius-lg)] border border-[var(--admin-border-subtle)] bg-[var(--admin-surface)]",
  surfaceMuted:
    "rounded-[var(--radius-lg)] border border-[var(--admin-border-subtle)] bg-[var(--admin-surface-muted)]",
  sectionGap: "space-y-6",
  label: "text-[11px] font-semibold uppercase tracking-wider text-muted",
  meta: "text-sm text-muted",
  title: "text-xl font-bold tracking-tight text-foreground sm:text-2xl",
  subtitle: "text-base font-medium text-foreground",
  focus:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2",
} as const;
