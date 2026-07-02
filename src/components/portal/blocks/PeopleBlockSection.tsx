import "server-only";

import {
  PortalPeopleGrid,
  personItemsToPortalPersonCards,
} from "@/components/portal/experience/people-grid";
import type { PortalPeopleGridSettings } from "@/types/people-grid";
import { resolveBlockContent } from "@/lib/content/block-queries";
import { getQueryLimit } from "@/lib/content/block-settings";
import { blockSettings } from "@/lib/portal/blocks";
import { withHomeDemoPeople } from "@/lib/portal/institutional-demo";
import { isHomePageSlug } from "@/lib/portal/home-experience";
import type { PersonItem } from "@/types/people-grid";
import type { PageBlock } from "@/types/page";

interface PeopleBlockSectionProps {
  block: PageBlock;
  tenant: string;
  pageSlug?: string;
}

function visiblePeople(people: PersonItem[]): PersonItem[] {
  return people.filter(
    (person) => person.visible !== false && person.personStatus !== "historical"
  );
}

export async function PeopleBlockSection({ block, tenant, pageSlug }: PeopleBlockSectionProps) {
  const settings = blockSettings<PortalPeopleGridSettings>(block);
  let people: PersonItem[] = [];
  let error = false;

  try {
    const resolved = await resolveBlockContent(block, tenant);
    people = visiblePeople(resolved as PersonItem[]).slice(0, getQueryLimit(block.settings, 4));
  } catch {
    error = true;
  }

  const isHome = pageSlug ? isHomePageSlug(pageSlug) : false;
  people = withHomeDemoPeople(people, pageSlug);

  return (
    <PortalPeopleGrid
      settings={settings}
      people={personItemsToPortalPersonCards(people)}
      error={error}
      compactCards={isHome}
      editorialHome={isHome}
    />
  );
}
