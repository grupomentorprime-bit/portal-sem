import "server-only";

import { cache } from "react";
import { filterNavItem } from "@/lib/admin/nav-access";
import { getAllNavTreeItems } from "@/lib/admin/nav-domains";
import { executeContentQuery } from "@/lib/content/query";
import type { AllowedCollection } from "@/lib/content/types";
import {
  listExperienceForms,
  listFormSubmissions,
} from "@/lib/experience/forms/repository";
import { filterFormsForStudentAffairsPanel } from "@/lib/student-affairs/forms";
import { classifyAbsenceSubmission } from "@/lib/student-affairs/absence-categories";
import {
  canAccessStudentAffairsPanel,
  filterSubmissionsForStudentAffairs,
  resolveStudentAffairsScope,
} from "@/lib/student-affairs/scope";
import type { AuthContext, IdentityMembership, IdentitySession, IdentityUser } from "@/types/identity";

/** Claves alineadas con `AdminNavItem.id` en nav-domains.ts */
export const NAV_BADGE_ITEM_IDS = {
  convocatoriasResultados: "convocatorias-resultados",
  communications: "communications-hub",
} as const;

const COMMUNICATIONS_DRAFT_COLLECTIONS = [
  "content_news",
  "content_events",
  "content_library",
  "content_institutional_notices",
  "content_academic_agenda",
  "academy_testimonials",
  "academy_gallery",
] as const satisfies readonly AllowedCollection[];

export interface ResolveAdminNavBadgesInput {
  tenant: string;
  tenantId: string;
  permissions: string[];
  compatMode: boolean;
  roleCodes?: string[];
  session?: IdentitySession | null;
  user?: IdentityUser | null;
  membership?: IdentityMembership | null;
}

function navItemById(id: string) {
  return getAllNavTreeItems().find((item) => item.id === id);
}

function canSeeNavItem(
  id: string,
  permissions: string[],
  compatMode: boolean,
  roleCodes: string[] = []
): boolean {
  const item = navItemById(id);
  if (!item) return false;
  return filterNavItem(item, permissions, compatMode, roleCodes);
}

function toAuthContext(input: ResolveAdminNavBadgesInput): AuthContext | null {
  if (!input.session || !input.user) return null;
  return {
    session: input.session,
    user: input.user,
    membership: input.membership ?? null,
    permissions: input.permissions,
    tenantId: input.tenantId,
    compatMode: input.compatMode,
  };
}

async function countDraftDocuments(
  tenant: string,
  collection: AllowedCollection
): Promise<number> {
  const result = await executeContentQuery(
    {
      tenant,
      collection,
      pagination: { page: 1, limit: 1 },
      filters: { status: "draft" },
    },
    { includeDraft: true, mapItems: false, countOnly: true }
  );
  return result.total;
}

async function countCommunicationsDrafts(tenant: string): Promise<number> {
  const counts = await Promise.all(
    COMMUNICATIONS_DRAFT_COLLECTIONS.map((collection) =>
      countDraftDocuments(tenant, collection).catch(() => 0)
    )
  );
  return counts.reduce((sum, value) => sum + value, 0);
}

async function countStudentAffairsPending(ctx: AuthContext): Promise<number> {
  if (!canAccessStudentAffairsPanel(ctx)) return 0;

  const scope = resolveStudentAffairsScope(ctx);
  const allForms = filterFormsForStudentAffairsPanel(await listExperienceForms(ctx.tenantId));
  const forms = scope ? allForms.filter((form) => scope.formIds.includes(form._id)) : allForms;

  if (forms.length === 0) return 0;

  const totals = await Promise.all(
    forms.map(async (form) => {
      try {
        const { submissions } = await listFormSubmissions(ctx.tenantId, {
          formId: form._id,
          limit: 1000,
        });
        const filtered = filterSubmissionsForStudentAffairs(submissions, scope);
        const attending = filtered.filter((s) => s.data.attendance === "yes").length;
        const checkedIn = filtered.filter((s) => s.dayCheckIn?.present).length;
        const pendingArrival = Math.max(0, attending - checkedIn);
        const pendingAbsenceReviews = filtered.filter((s) => {
          const category = classifyAbsenceSubmission(s);
          return (
            category === "pending-email" ||
            category === "pending-review" ||
            category === "awaiting-justification"
          );
        }).length;
        return pendingArrival + pendingAbsenceReviews;
      } catch {
        return 0;
      }
    })
  );

  return totals.reduce((sum, value) => sum + value, 0);
}

export const resolveAdminNavBadges = cache(
  async (input: ResolveAdminNavBadgesInput): Promise<Record<string, number>> => {
    const roleCodes = input.roleCodes ?? [];
    const badges: Record<string, number> = {};

    const tasks: Array<Promise<void>> = [];
    const authCtx = toAuthContext(input);

    if (
      authCtx &&
      canSeeNavItem(
        NAV_BADGE_ITEM_IDS.convocatoriasResultados,
        input.permissions,
        input.compatMode,
        roleCodes
      )
    ) {
      tasks.push(
        countStudentAffairsPending(authCtx)
          .then((count) => {
            if (count > 0) badges[NAV_BADGE_ITEM_IDS.convocatoriasResultados] = count;
          })
          .catch(() => undefined)
      );
    }

    if (
      canSeeNavItem(NAV_BADGE_ITEM_IDS.communications, input.permissions, input.compatMode, roleCodes)
    ) {
      tasks.push(
        countCommunicationsDrafts(input.tenant)
          .then((count) => {
            if (count > 0) badges[NAV_BADGE_ITEM_IDS.communications] = count;
          })
          .catch(() => undefined)
      );
    }

    await Promise.all(tasks);
    return badges;
  }
);
