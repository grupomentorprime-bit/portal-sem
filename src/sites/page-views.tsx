import type { ComponentType } from "react";
import type { ContactInfo, SocialLinks } from "@/types/cms";

export interface CodedPageViewProps {
  institutionName: string;
  contact: ContactInfo;
  social: SocialLinks;
}

const views = new Map<string, ComponentType<CodedPageViewProps>>();

function viewKey(tenantId: string, path: string): string {
  return `${tenantId}:${path}`;
}

export function registerCodedPageView(
  tenantId: string,
  path: string,
  view: ComponentType<CodedPageViewProps>
): void {
  views.set(viewKey(tenantId, path), view);
}

export function getCodedPageView(
  tenantId: string,
  path: string
): ComponentType<CodedPageViewProps> | undefined {
  return views.get(viewKey(tenantId, path));
}
