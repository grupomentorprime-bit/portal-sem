/**
 * OT-BRANDING-004 — Clases reutilizables del panel administrativo (tokens SEM)
 */
export const adminUi = {
  page: "min-h-screen bg-background-soft dark:bg-gray-900",
  header:
    "border-b border-border bg-background dark:border-gray-700 dark:bg-gray-900",
  headerInner: "mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6",
  headerEyebrow:
    "text-xs font-semibold uppercase tracking-widest text-muted",
  headerTitle: "text-xl font-semibold text-foreground dark:text-gray-50",
  headerSubtitle: "text-sm text-muted",
  contentWrap: "mx-auto max-w-7xl px-4 py-6 sm:px-6",
  sidebarNav:
    "rounded-xl border border-border bg-background p-2 dark:border-gray-700 dark:bg-gray-900",
  navBtn:
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition",
  navActive: "bg-primary text-text-inverse dark:bg-gray-100 dark:text-gray-900",
  navIdle:
    "text-muted hover:bg-background-muted dark:text-gray-300 dark:hover:bg-gray-800",
  primaryBtn:
    "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-text-inverse transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-background",
  input:
    "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm dark:border-gray-700 dark:bg-gray-900",
  card: "rounded-lg border border-border bg-background dark:border-gray-700 dark:bg-gray-900",
  divider: "divide-y divide-border dark:divide-gray-700",
  errorBanner:
    "rounded-lg border border-[var(--state-danger-border)] bg-[var(--state-danger-bg)] px-4 py-3 text-sm text-[var(--state-danger-fg)]",
  warningBanner:
    "rounded-lg border border-[var(--state-warning-border)] bg-[var(--state-warning-bg)] px-4 py-3 text-sm text-[var(--state-warning-fg)]",
  successBanner:
    "rounded-md border border-[var(--state-success-border)] bg-[var(--state-success-bg)] p-3 text-xs text-[var(--state-success-fg)]",
  successText: "text-sm text-success",
  errorText: "text-sm text-[var(--color-danger)]",
  warningText: "text-sm text-[var(--color-warning)]",
  mutedText: "text-sm text-muted",
  faintText: "text-sm text-gray-400",
  link: "text-sm text-secondary hover:underline",
  metaLabel: "text-xs uppercase tracking-wide text-muted",
  metaValue: "mt-1 font-medium text-foreground dark:text-gray-100",
  statusActive:
    "border-success bg-success/10 dark:bg-success/15",
  statusWarning:
    "border-[var(--color-warning)] bg-[var(--state-warning-bg)] dark:bg-success/10",
  statusDanger:
    "border-[var(--color-danger)] bg-[var(--state-danger-bg)] dark:bg-[var(--state-danger-bg)]",
  statusIdle:
    "border-border hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
  favoriteActive: "text-[var(--color-warning)]",
  favoriteIdle: "text-muted hover:text-[var(--color-warning)]",
  deleteAction: "text-[var(--color-danger)] hover:bg-[var(--state-danger-bg)]",
  tagSuccess: "bg-success/15 text-primary dark:bg-success/20 dark:text-success",
  tagNeutral: "bg-background-muted text-muted",
  tagHighlighted:
    "bg-[var(--state-warning-bg)] text-[var(--state-warning-fg)]",
  dashedEmpty:
    "rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400 dark:border-gray-600",
  sortableActive:
    "border-primary bg-background-muted dark:border-gray-100 dark:bg-gray-900",
  sortableIdle:
    "border-border bg-background dark:border-gray-700 dark:bg-gray-900",
  iconPickerActive:
    "border-primary bg-primary text-text-inverse dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900",
  iconPickerIdle: "border-border hover:border-gray-400 dark:border-gray-700",
} as const;
