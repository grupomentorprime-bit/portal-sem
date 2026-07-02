"use client";

import { Accordion, AccordionItem } from "@/components/ui/accordion";
import type { InspectorCanonicalSection } from "./types";
import { INSPECTOR_SECTION_LABELS, INSPECTOR_SECTION_ORDER } from "./types";

interface InspectorAccordionSection {
  id: InspectorCanonicalSection;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

interface InspectorAccordionProps {
  sections: InspectorAccordionSection[];
  className?: string;
}

/**
 * Acordeón con secciones canónicas en orden institucional.
 * @example
 * <InspectorAccordion sections={[
 *   { id: "content", defaultOpen: true, children: <InspectorTextField ... /> },
 *   { id: "media", children: <InspectorImagePicker ... /> },
 * ]} />
 */
export function InspectorAccordion({ sections, className }: InspectorAccordionProps) {
  const ordered = INSPECTOR_SECTION_ORDER.map((id) =>
    sections.find((s) => s.id === id)
  ).filter(Boolean) as InspectorAccordionSection[];

  return (
    <Accordion className={className}>
      {ordered.map((section, index) => (
        <AccordionItem
          key={section.id}
          title={INSPECTOR_SECTION_LABELS[section.id]}
          defaultOpen={section.defaultOpen ?? index === 0}
        >
          <div className="space-y-4 pb-2">{section.children}</div>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
