/**
 * Materializa el menú aprobado y las páginas institucionales del SEM como borradores.
 * Idempotente. No publica, no asigna personas y no escribe en ADL.
 */
import { ADL_TENANT_ID, SEM_TENANT_ID } from "@/core/tenant/constants";
import { scopedResourceId } from "@/core/tenant/resource-ids";
import { SEM_DEFAULT_MENUS } from "@/lib/cms/menu-defaults";
import { computeItemLevels } from "@/lib/cms/menu-utils";
import { mergeBlockSettings } from "@/lib/cms/page-validation";
import { sortBlocks } from "@/lib/cms/page-utils";
import { semInstitutionalDrafts } from "@/lib/portal/sem-institutional-drafts";
import type { CmsMenu } from "@/types/menu";
import type { CmsPage } from "@/types/page";
import type { Db } from "mongodb";

export interface SemInstitutionalCmsResult {
  tenant: typeof SEM_TENANT_ID;
  menusUpdated: string[];
  pagesCreated: Array<{ slug: string; title: string; blocks: number }>;
  pagesSkipped: string[];
  adlPages: number;
  adlMenus: number;
}

export async function applySemInstitutionalCms(db: Db): Promise<SemInstitutionalCmsResult> {
  const now = new Date().toISOString();
  const adlPagesBefore = await db.collection("cms_pages").countDocuments({ tenant: ADL_TENANT_ID });
  const adlMenusBefore = await db.collection("cms_menus").countDocuments({ tenant: ADL_TENANT_ID });
  const peopleBefore = await db.collection("content_people").countDocuments({
    tenant: SEM_TENANT_ID,
    teamGroup: { $in: ["team_directivos", "team_academic"] },
  });

  const menusUpdated: string[] = [];
  const menusCol = db.collection<CmsMenu>("cms_menus");
  for (const menu of SEM_DEFAULT_MENUS) {
    const physicalId = scopedResourceId(SEM_TENANT_ID, menu._id);
    const items = computeItemLevels(menu.items ?? []);
    const existing = await menusCol.findOne({
      _id: physicalId,
      tenant: SEM_TENANT_ID,
    });
    if (existing) {
      await menusCol.updateOne(
        { _id: physicalId, tenant: SEM_TENANT_ID },
        {
          $set: {
            name: menu.name,
            location: menu.location,
            active: true,
            items,
            updatedAt: now,
          },
        }
      );
    } else {
      await menusCol.insertOne({
        ...menu,
        _id: physicalId,
        tenant: SEM_TENANT_ID,
        active: true,
        items,
        createdAt: now,
        updatedAt: now,
      });
    }
    menusUpdated.push(menu._id);
  }

  const pagesCreated: SemInstitutionalCmsResult["pagesCreated"] = [];
  const pagesSkipped: string[] = [];
  const pagesCol = db.collection<CmsPage>("cms_pages");
  for (const draft of semInstitutionalDrafts()) {
    const exists = await pagesCol.countDocuments({
      tenant: SEM_TENANT_ID,
      slug: draft.slug,
    });
    if (exists > 0) {
      pagesSkipped.push(draft.slug);
      continue;
    }

    const blocks = sortBlocks(draft.blocks).map((block, index) => ({
      ...block,
      order: index,
      settings: mergeBlockSettings(block.type, block.settings),
    }));

    await pagesCol.insertOne({
      _id: scopedResourceId(SEM_TENANT_ID, draft.id),
      tenant: SEM_TENANT_ID,
      title: draft.title,
      slug: draft.slug,
      description: "",
      status: "draft",
      template: "institutional",
      seo: draft.seo,
      blocks,
      versions: [],
      createdAt: now,
      updatedAt: now,
    });
    pagesCreated.push({ slug: draft.slug, title: draft.title, blocks: blocks.length });
  }

  const adlPages = await db.collection("cms_pages").countDocuments({ tenant: ADL_TENANT_ID });
  const adlMenus = await db.collection("cms_menus").countDocuments({ tenant: ADL_TENANT_ID });
  const peopleAfter = await db.collection("content_people").countDocuments({
    tenant: SEM_TENANT_ID,
    teamGroup: { $in: ["team_directivos", "team_academic"] },
  });
  if (adlPages !== adlPagesBefore || adlMenus !== adlMenusBefore || peopleAfter !== peopleBefore) {
    throw new Error("La materialización SEM alteró ADL o asignó directivos/equipo académico.");
  }

  return {
    tenant: SEM_TENANT_ID,
    menusUpdated,
    pagesCreated,
    pagesSkipped,
    adlPages,
    adlMenus,
  };
}
