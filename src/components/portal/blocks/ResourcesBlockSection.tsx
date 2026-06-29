import "server-only";

import { ResourcesSectionContent } from "@/components/portal/ecosystem/EcosystemSectionContent";
import { blockSettings, extractResources } from "@/lib/portal/blocks";
import type { PageBlock } from "@/types/page";
import type { EcosystemSectionSettings } from "@/components/portal/ecosystem/EcosystemSectionContent";

interface ResourcesBlockSectionProps {
  block: PageBlock;
}

export function ResourcesBlockSection({ block }: ResourcesBlockSectionProps) {
  const settings = blockSettings<EcosystemSectionSettings>(block);
  const items = extractResources(block);

  return <ResourcesSectionContent items={items} settings={settings} />;
}
