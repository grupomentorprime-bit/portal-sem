/**
 * @deprecated
 *
 * Reemplazado por:
 * WhyStudySectionContent + VerseSectionContent
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import { asBoolean, asString } from "@/lib/cms/block-utils";
import {
  VerseSectionContent,
  WhyStudySectionContent,
} from "@/components/portal/institution/InstitutionSectionContent";

interface InstitutionPresentationProps {
  settings: Record<string, unknown>;
}

export function InstitutionPresentation({ settings }: InstitutionPresentationProps) {
  const showVerse = asBoolean(settings.showVerse, true);
  const verseText = asString(settings.verseText);
  const verseReference = asString(settings.verseReference);

  return (
    <>
      <WhyStudySectionContent
        overline={asString(settings.overline) || undefined}
        title={asString(settings.title, "Presentación")}
        description={asString(settings.description) || undefined}
        highlights={[]}
      />
      {showVerse && verseText ? (
        <VerseSectionContent text={verseText} reference={verseReference} />
      ) : null}
    </>
  );
}
