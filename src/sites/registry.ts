import type { CodedSite } from "@/sites/types";

const sites = new Map<string, CodedSite>();

export function getCodedSite(tenantId: string): CodedSite | undefined {
  return sites.get(tenantId);
}

export function registerCodedSite(site: CodedSite): void {
  sites.set(site.tenantId, site);
}

export function clearCodedSites(): void {
  sites.clear();
}
