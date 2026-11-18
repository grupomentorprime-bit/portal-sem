import * as XLSX from "xlsx";
import {
  buildCongressImportPreview,
  parseLodgingSummaryGrid,
  parseZoneSheetGrid,
  type CongressImportPreview,
  type CongressImportChurchLodgingRequest,
  type CongressImportSheetRow,
} from "@/core/congress/import-preview";

function zoneIdFromSheetName(name: string): string | null {
  const match = name.match(/zona\s*(\d+)/i);
  if (!match) return null;
  return `zona-${Number(match[1])}`;
}

/**
 * Parsea el Excel del congreso solo para revisión previa.
 * No escribe Mongo ni confirma importación.
 */
export function previewCongressWorkbook(buffer: ArrayBuffer | Buffer): CongressImportPreview {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const peopleRows: CongressImportSheetRow[] = [];
  let declaredZones: ReturnType<typeof parseLodgingSummaryGrid>["declaredZones"] = [];
  const lodgingRequests: CongressImportChurchLodgingRequest[] = [];
  const churches: Array<{ zoneId: string; churchName: string }> = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const grid = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
      defval: "",
    }) as unknown[][];

    const zoneId = zoneIdFromSheetName(sheetName);
    if (zoneId) {
      const parsed = parseZoneSheetGrid(zoneId, sheetName, grid);
      peopleRows.push(...parsed.peopleRows);
      lodgingRequests.push(...parsed.lodgingRequests);
      churches.push(...parsed.churches);
      continue;
    }

    if (/alojamiento/i.test(sheetName)) {
      const parsed = parseLodgingSummaryGrid(grid);
      declaredZones = parsed.declaredZones;
      lodgingRequests.push(...parsed.lodgingRequests);
    }
  }

  return buildCongressImportPreview({
    peopleRows,
    declaredZones,
    lodgingRequests,
    churches,
  });
}
