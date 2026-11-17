import type { CongressImportPreview } from "@/core/congress/import-preview";
import { registrationDuplicateKey } from "@/core/congress/duplicates";
import type { CongressRegistration } from "@/core/congress/types";

export type ImportCommitPlanItem = {
  zoneId: string;
  churchName: string;
  fullName: string;
  expectedDayLabel: string | null;
  sheetRow: number;
  importRowId: string;
};

export type ImportCommitPlan = {
  toCreate: ImportCommitPlanItem[];
  toLinkExisting: Array<ImportCommitPlanItem & { registrationId: string }>;
  skippedDuplicates: Array<ImportCommitPlanItem & { registrationId: string; reason: string }>;
  gapsKept: CongressImportPreview["quantityGaps"];
  summary: {
    namedCount: number;
    createCount: number;
    linkCount: number;
    skipCount: number;
    gapCount: number;
  };
};

function foldName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function importRowId(zoneId: string, sheetRow: number, fullName: string): string {
  return `irow:${zoneId}:${sheetRow}:${foldName(fullName)}`;
}

/**
 * Plan de importación definitiva. Nunca crea fichas desde gaps.
 * No fusiona por similitud de nombre. No escribe Mongo.
 */
export function planCongressImportCommit(input: {
  preview: CongressImportPreview;
  existing: CongressRegistration[];
  batchId: string;
}): ImportCommitPlan {
  const toCreate: ImportCommitPlan["toCreate"] = [];
  const toLinkExisting: ImportCommitPlan["toLinkExisting"] = [];
  const skippedDuplicates: ImportCommitPlan["skippedDuplicates"] = [];

  const byImportRow = new Map(
    input.existing
      .filter((r) => r.importRowId)
      .map((r) => [r.importRowId as string, r] as const)
  );
  const byRutKey = new Map<string, CongressRegistration>();
  for (const reg of input.existing) {
    const key = registrationDuplicateKey({ rut: reg.identity.rut });
    if (key) byRutKey.set(key, reg);
  }

  for (const person of input.preview.namedPeople) {
    const rowId = importRowId(person.zoneId, person.sheetRow, person.fullName);
    const item: ImportCommitPlanItem = {
      zoneId: person.zoneId,
      churchName: person.churchName,
      fullName: person.fullName,
      expectedDayLabel: person.expectedDayLabel,
      sheetRow: person.sheetRow,
      importRowId: rowId,
    };

    const already = byImportRow.get(rowId);
    if (already) {
      skippedDuplicates.push({
        ...item,
        registrationId: already._id,
        reason: "same_import_row",
      });
      continue;
    }

    // Reimportación: misma zona+iglesia+nombre ya creada por importación previa.
    const sameIdentity = input.existing.find(
      (r) =>
        r.source === "import" &&
        r.zoneId === person.zoneId &&
        foldName(r.churchName) === foldName(person.churchName) &&
        foldName(r.identity.fullName) === foldName(person.fullName)
    );
    if (sameIdentity) {
      skippedDuplicates.push({
        ...item,
        registrationId: sameIdentity._id,
        reason: "reimport_same_person",
      });
      continue;
    }

    // Solo vincular por RUT si el preview trae RUT (este Excel no) y hay coincidencia exacta.
    // Nunca por nombre parecido.
    toCreate.push(item);
  }

  // batchId reserved for future commit writer; plan is side-effect free.
  void input.batchId;

  return {
    toCreate,
    toLinkExisting,
    skippedDuplicates,
    gapsKept: input.preview.quantityGaps,
    summary: {
      namedCount: input.preview.namedPeople.length,
      createCount: toCreate.length,
      linkCount: toLinkExisting.length,
      skipCount: skippedDuplicates.length,
      gapCount: input.preview.quantityGaps.length,
    },
  };
}
