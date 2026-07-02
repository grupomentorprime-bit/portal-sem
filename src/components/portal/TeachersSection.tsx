import "server-only";

import {
  PortalPeopleGrid,
  personItemsToPortalPersonCards,
} from "@/components/portal/experience/people-grid";
import type { PortalPeopleGridSettings } from "@/types/people-grid";
import { resolveBlockContent } from "@/lib/content/block-queries";
import { getQueryLimit } from "@/lib/content/block-settings";
import { DEFAULT_SETTINGS } from "@/lib/cms/page-defaults";
import { blockSettings } from "@/lib/portal/blocks";
import type { PersonItem } from "@/types/people-grid";
import type { PageBlock } from "@/types/page";

interface TeachersSectionProps {
  tenant: string;
  block: PageBlock;
}

function visiblePeople(people: PersonItem[]): PersonItem[] {
  return people.filter(
    (person) => person.visible !== false && person.personStatus !== "historical"
  );
}

/** @deprecated Usar PeopleBlockSection / PortalPeopleGrid */
export async function TeachersSection({ tenant, block }: TeachersSectionProps) {
  const settings = blockSettings<PortalPeopleGridSettings>(block);
  let people: PersonItem[] = [];
  let error = false;

  try {
    const items = await resolveBlockContent(block, tenant);
    people = visiblePeople(items as PersonItem[]).slice(0, getQueryLimit(block.settings, 4));
  } catch {
    error = true;
  }

  return (
    <PortalPeopleGrid
      settings={settings}
      people={personItemsToPortalPersonCards(people)}
      error={error}
      id="equipo"
    />
  );
}

export function fallbackTeachersBlock(): PageBlock {
  return {
    id: "teachers-fallback",
    type: "teachers",
    visible: true,
    order: 0,
    settings: { ...DEFAULT_SETTINGS.teachers },
  };
}
