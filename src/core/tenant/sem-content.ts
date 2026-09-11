import type { Db } from "mongodb";
import { createSemDefaultForms } from "@/core/experience/forms/defaults";
import { SEM_TENANT_ID } from "@/core/tenant/constants";
import { isSemTenant } from "@/core/tenant/is-sem";
import { DEFAULT_MENUS } from "@/lib/cms/menu-defaults";
import { computeItemLevels } from "@/lib/cms/menu-utils";
import { scopedResourceId } from "@/core/tenant/resource-ids";
import {
  ADMISSION_CONFIG_ID,
  DEFAULT_ADMISSION_CONFIG,
} from "@/lib/portal/admission-content";
import { migrateAdmissionConfig } from "@/lib/portal/admission-migration";
import type { AdmissionConfig } from "@/types/admission";
import type { ExperienceFormDefinition } from "@/types/experience-forms";
import type { CmsMenu } from "@/types/menu";

export interface SemContentMaterializeResult {
  formsInserted: number;
  formsSkipped: number;
  admissionCreated: boolean;
  admissionSkipped: boolean;
  menusInserted: number;
  menusSkipped: number;
}

/**
 * Materializa contenido SEM como datos de T001 (forms, admisión, menús).
 * Idempotente. Seeds CMS de colecciones siguen en `seedContentCollections` (API, solo SEM).
 */
export async function materializeSemTenantContent(
  db: Db
): Promise<SemContentMaterializeResult> {
  if (!isSemTenant(SEM_TENANT_ID)) {
    throw new Error("materializeSemTenantContent solo aplica a T001");
  }

  const tenant = SEM_TENANT_ID;
  const at = new Date().toISOString();

  let formsInserted = 0;
  let formsSkipped = 0;
  const forms = createSemDefaultForms(tenant);
  const formsCol = db.collection<ExperienceFormDefinition>("experience_forms");
  for (const form of forms) {
    const exists = await formsCol.countDocuments({ _id: form._id, tenant });
    if (exists > 0) {
      formsSkipped += 1;
      continue;
    }
    await formsCol.insertOne({ ...form, createdAt: at, updatedAt: at });
    formsInserted += 1;
  }

  const admissionCol = db.collection<AdmissionConfig>("portal_admission_config");
  const existingAdmission = await admissionCol.findOne({
    _id: ADMISSION_CONFIG_ID,
    tenant,
  });
  let admissionCreated = false;
  let admissionSkipped = false;
  if (existingAdmission) {
    admissionSkipped = true;
  } else {
    const doc = migrateAdmissionConfig({
      ...DEFAULT_ADMISSION_CONFIG,
      tenant,
      updatedAt: at,
    });
    await admissionCol.insertOne(doc);
    admissionCreated = true;
  }

  let menusInserted = 0;
  let menusSkipped = 0;
  const menusCol = db.collection<CmsMenu>("cms_menus");
  for (const menu of DEFAULT_MENUS) {
    const physicalId = scopedResourceId(tenant, menu._id);
    const exists = await menusCol.countDocuments({
      $or: [
        { _id: physicalId, tenant },
        { _id: menu._id, tenant },
      ],
    } as Record<string, unknown>);
    if (exists > 0) {
      menusSkipped += 1;
      continue;
    }
    await menusCol.insertOne({
      ...menu,
      _id: physicalId,
      tenant,
      items: computeItemLevels(menu.items ?? []),
      createdAt: at,
      updatedAt: at,
    });
    menusInserted += 1;
  }

  return {
    formsInserted,
    formsSkipped,
    admissionCreated,
    admissionSkipped,
    menusInserted,
    menusSkipped,
  };
}
