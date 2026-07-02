import { cn } from "@/lib/utils";
import { inspectorStyles } from "./inspector-styles";
import type { InspectorCanonicalSection } from "./types";
import { INSPECTOR_SECTION_LABELS } from "./types";

interface InspectorSectionProps {
  section: InspectorCanonicalSection;
  children: React.ReactNode;
  className?: string;
}

export function InspectorSection({ section, children, className }: InspectorSectionProps) {
  return (
    <section
      className={cn("py-2", className)}
      aria-labelledby={`inspector-section-${section}`}
    >
      <h3
        id={`inspector-section-${section}`}
        className={cn(inspectorStyles.sectionTitle, "mb-3")}
      >
        {INSPECTOR_SECTION_LABELS[section]}
      </h3>
      <div className={inspectorStyles.fieldStack}>{children}</div>
    </section>
  );
}
