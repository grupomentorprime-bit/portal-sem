import type { ComponentType } from "react";
import { CumpleShell } from "@/components/sites/cumple/CumpleShell";
import { MateriaPage } from "@/components/sites/cumple/MateriaPage";
import type { MateriaContent } from "@/sites/cumple/pages/types";
import type { CodedPageViewProps } from "@/sites/page-views";

export function createMateriaView(content: MateriaContent): ComponentType<CodedPageViewProps> {
  function MateriaView({ contact }: CodedPageViewProps) {
    return (
      <CumpleShell contact={contact}>
        <MateriaPage content={content} />
      </CumpleShell>
    );
  }
  MateriaView.displayName = `MateriaView(${content.slug})`;
  return MateriaView;
}
