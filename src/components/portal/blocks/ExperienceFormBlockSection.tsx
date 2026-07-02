import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalExperienceForm } from "@/components/portal/experience/forms";
import { blockSettings } from "@/lib/portal/blocks";
import { getPublicExperienceFormCached } from "@/lib/experience/forms/repository";
import { asString } from "@/lib/cms/block-utils";
import type { ExperienceFormBlockSettings } from "@/types/experience-forms";
import type { PageBlock } from "@/types/page";

interface ExperienceFormBlockSectionProps {
  block: PageBlock;
  tenant: string;
}

export async function ExperienceFormBlockSection({
  block,
  tenant,
}: ExperienceFormBlockSectionProps) {
  const settings = blockSettings<ExperienceFormBlockSettings>(block);
  const formId = asString(settings.formId, "information-request");
  const form = await getPublicExperienceFormCached(tenant, formId)();

  if (!form) return null;

  return (
    <PortalSection id={`form-${form._id}`}>
      <PortalContainer size="md">
        <PortalExperienceForm
          form={form}
          overline={asString(settings.overline) || undefined}
          title={asString(settings.title) || undefined}
          description={asString(settings.description) || undefined}
        />
      </PortalContainer>
    </PortalSection>
  );
}
