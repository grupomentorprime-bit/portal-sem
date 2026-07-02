import { cn } from "@/lib/utils";

/** Tokens visuales del Inspector — OT-CMSV2-COMPONENTS-001 */
export const inspectorStyles = {
  panel:
    "flex h-full w-full max-w-[20rem] flex-col border-l border-border bg-background",
  panelHeader: "shrink-0 border-b border-border px-4 py-3",
  panelBody: "flex-1 space-y-1 overflow-y-auto px-4 py-4",
  panelFooter: "shrink-0 border-t border-border px-4 py-3",
  sectionTitle:
    "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted",
  fieldStack: "space-y-4",
  fieldGap: "space-y-1.5",
} as const;

export function inspectorFieldId(label: string, id?: string): string {
  return id ?? `inspector-${label.replace(/\s+/g, "-").toLowerCase()}`;
}

export function cnInspector(...classes: Array<string | false | undefined>) {
  return cn(...classes);
}
