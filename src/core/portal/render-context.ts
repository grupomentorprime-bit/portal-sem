import type { PortalRenderContext } from "@/types/portal";
import type { SiteConfig } from "@/types/cms";

export function buildRenderContext(input: {
  tenantId: string;
  config: SiteConfig;
  preview?: boolean;
  audience?: PortalRenderContext["audience"];
  language?: string;
}): PortalRenderContext {
  return {
    tenantId: input.tenantId,
    audience: input.audience ?? "guest",
    featureFlags: input.config.features,
    language: input.language,
    preview: input.preview,
  };
}
