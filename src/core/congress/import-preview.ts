/**
 * Revisión previa del Excel del congreso.
 * No escribe Mongo ni crea fichas. Nunca sugiere auto-merge por nombre.
 */

export type CongressImportNamedPerson = {
  zoneId: string;
  zoneLabel: string;
  churchName: string;
  fullName: string;
  expectedDayLabel: string | null;
  sheetRow: number;
};

export type CongressImportQuantityGap = {
  zoneId: string;
  zoneLabel: string;
  churchName: string;
  expectedDayLabel: string | null;
  sheetRow: number;
  reason: "missing_name";
};

export type CongressImportChurchLodgingRequest = {
  zoneId: string;
  churchName: string;
  requestedBeds: number;
  note: string | null;
};

export type CongressImportPreview = {
  namedPeople: CongressImportNamedPerson[];
  quantityGaps: CongressImportQuantityGap[];
  churchLodgingRequests: CongressImportChurchLodgingRequest[];
  declaredRegisteredByZone: Record<string, number>;
  /** Siempre vacío: no fusionar nombres parecidos automáticamente. */
  autoMergeSuggestions: [];
  summary: {
    namedCount: number;
    gapCount: number;
    declaredTotal: number;
  };
};

export type CongressImportSheetRow = {
  zoneId: string;
  zoneLabel: string;
  churchName: string;
  fullName: string;
  expectedDayLabel: string | null;
  sheetRow: number;
  lodgingNote?: string | null;
};

export type CongressImportDeclaredZone = {
  zoneId: string;
  registered: number;
  lodgingRequested?: number;
};

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function cellText(value: unknown): string {
  if (value == null || value === "") return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function lodgingCount(value: string): number | null {
  const match = value.match(/(\d+)\s*alojamiento/i);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Solo etiquetas de día (p. ej. «SÁBADO Y DOMINGO»), no topónimos como «Santo Domingo». */
function isDayLabel(value: string): boolean {
  const folded = fold(value);
  if (!folded) return false;
  const tokens = folded
    .replace(/\by\b/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (!tokens.length) return false;
  return tokens.every((t) => t === "sabado" || t === "domingo" || t === "ambos");
}

/**
 * Nombre usable de hermano/pastor. "Hno" solo no cuenta.
 */
export function looksLikePersonName(value: string): boolean {
  const name = value.trim();
  if (!name) return false;
  const folded = fold(name);
  if (folded === "hno" || folded === "hermano" || folded === "na") return false;
  if (lodgingCount(name) != null) return false;
  if (/^iglesias?/i.test(name)) return false;
  // Exige al menos un token con letras además de Hno/Pastor
  const withoutTitle = name.replace(/^(hno\.?|hermano|pastor)\s+/i, "").trim();
  if (!withoutTitle || fold(withoutTitle) === "hno") return false;
  if (withoutTitle.length < 2) return false;
  return /[a-záéíóúñ]/i.test(withoutTitle);
}

/**
 * Construye la revisión a partir de filas ya normalizadas (tests + parser xlsx).
 */
export function buildCongressImportPreview(input: {
  peopleRows: CongressImportSheetRow[];
  declaredZones?: CongressImportDeclaredZone[];
  lodgingRequests?: CongressImportChurchLodgingRequest[];
}): CongressImportPreview {
  const namedPeople: CongressImportNamedPerson[] = [];
  const quantityGaps: CongressImportQuantityGap[] = [];

  for (const row of input.peopleRows) {
    if (looksLikePersonName(row.fullName)) {
      namedPeople.push({
        zoneId: row.zoneId,
        zoneLabel: row.zoneLabel,
        churchName: row.churchName.trim(),
        fullName: row.fullName.trim(),
        expectedDayLabel: row.expectedDayLabel,
        sheetRow: row.sheetRow,
      });
    } else if (row.expectedDayLabel || row.fullName.trim() || row.lodgingNote) {
      // Día sin nombre, "Hno" solo, etc. → brecha, no ficha.
      if (row.expectedDayLabel || (row.fullName.trim() && !looksLikePersonName(row.fullName))) {
        quantityGaps.push({
          zoneId: row.zoneId,
          zoneLabel: row.zoneLabel,
          churchName: row.churchName.trim(),
          expectedDayLabel: row.expectedDayLabel,
          sheetRow: row.sheetRow,
          reason: "missing_name",
        });
      }
    }
  }

  const declaredRegisteredByZone: Record<string, number> = {};
  let declaredTotal = 0;
  for (const zone of input.declaredZones ?? []) {
    declaredRegisteredByZone[zone.zoneId] = zone.registered;
    declaredTotal += zone.registered;
  }

  return {
    namedPeople,
    quantityGaps,
    churchLodgingRequests: [...(input.lodgingRequests ?? [])],
    declaredRegisteredByZone,
    autoMergeSuggestions: [],
    summary: {
      namedCount: namedPeople.length,
      gapCount: quantityGaps.length,
      declaredTotal,
    },
  };
}

export type RawGrid = unknown[][];

type Block = { churchCol: number; nameCol: number; dayCol: number };

function detectBlocks(header: unknown[]): Block[] {
  const blocks: Block[] = [];
  const texts = header.map(cellText);
  for (let col = 0; col < texts.length; col += 1) {
    if (!/^iglesias?/i.test(texts[col] ?? "")) continue;
    const nameCol = col + 1;
    const dayCol = col + 2;
    if (nameCol >= texts.length) continue;
    blocks.push({ churchCol: col, nameCol, dayCol });
  }
  if (blocks.length === 0) {
    blocks.push({ churchCol: 0, nameCol: 1, dayCol: 2 });
  }
  return blocks;
}

/**
 * Parser de hojas ZONA N: columnas IGLESIAS | HERMANOS | DIA, con bloques paralelos.
 */
export function parseZoneSheetGrid(
  zoneId: string,
  zoneLabel: string,
  grid: RawGrid
): {
  peopleRows: CongressImportSheetRow[];
  lodgingRequests: CongressImportChurchLodgingRequest[];
} {
  if (!grid.length) return { peopleRows: [], lodgingRequests: [] };

  const blocks = detectBlocks(grid[0] ?? []);
  const peopleRows: CongressImportSheetRow[] = [];
  const lodgingRequests: CongressImportChurchLodgingRequest[] = [];
  const churchByBlock = blocks.map(() => "");

  for (let index = 1; index < grid.length; index += 1) {
    const line = grid[index] ?? [];
    blocks.forEach((block, blockIndex) => {
      const churchCell = cellText(line[block.churchCol]);
      const nameCell = cellText(line[block.nameCol]);
      const dayCell = cellText(line[block.dayCol]);

      const beds = lodgingCount(churchCell);
      if (beds != null) {
        lodgingRequests.push({
          zoneId,
          churchName: churchByBlock[blockIndex] || "Sin iglesia",
          requestedBeds: beds,
          note: churchCell,
        });
      } else if (churchCell && !isDayLabel(churchCell)) {
        // Columna IGLESIAS: siempre actualiza la iglesia activa (no es nombre de persona).
        churchByBlock[blockIndex] = churchCell;
      }

      if (!nameCell && !dayCell) return;

      peopleRows.push({
        zoneId,
        zoneLabel,
        churchName: churchByBlock[blockIndex],
        fullName: nameCell,
        expectedDayLabel: dayCell && isDayLabel(dayCell) ? dayCell : dayCell || null,
        sheetRow: index + 1,
      });
    });
  }

  return { peopleRows, lodgingRequests };
}

/** @deprecated Prefer parseZoneSheetGrid().peopleRows — kept for older tests. */
export function parseZoneSheetGridRows(
  zoneId: string,
  zoneLabel: string,
  grid: RawGrid
): CongressImportSheetRow[] {
  return parseZoneSheetGrid(zoneId, zoneLabel, grid).peopleRows;
}

export function parseLodgingSummaryGrid(grid: RawGrid): {
  declaredZones: CongressImportDeclaredZone[];
  lodgingRequests: CongressImportChurchLodgingRequest[];
} {
  const declaredZones: CongressImportDeclaredZone[] = [];
  const lodgingRequests: CongressImportChurchLodgingRequest[] = [];
  let currentZoneId = "";

  // Encabezado tipico: bloque izquierdo CANTIDAD y derecho REGISTRADOS.
  let registeredCol = -1;
  let quantityCol = -1;
  for (const line of grid.slice(0, 3)) {
    const texts = line.map(cellText);
    texts.forEach((cell, col) => {
      if (/registrados/i.test(cell)) registeredCol = col;
      if (/cantidad/i.test(cell)) quantityCol = col;
    });
  }

  for (const line of grid) {
    const texts = line.map(cellText);

    if (registeredCol >= 0) {
      // Buscar marca de zona a la izquierda de REGISTRADOS.
      for (let col = Math.max(0, registeredCol - 3); col < registeredCol; col += 1) {
        const mark = texts[col].match(/(\d+)\s*°/);
        if (!mark) continue;
        const registered = Number(String(texts[registeredCol]).replace(/[^\d-]/g, ""));
        if (!Number.isFinite(registered) || registered < 0) continue;
        declaredZones.push({
          zoneId: `zona-${Number(mark[1])}`,
          registered,
        });
      }
    }

    // Solicitudes por iglesia (bloque izquierdo).
    if (quantityCol >= 1) {
      const church = texts[quantityCol - 1];
      const qty = Number(String(texts[quantityCol]).replace(/[^\d]/g, ""));
      const zoneHint = texts[quantityCol - 2]?.match(/(\d+)\s*°/)?.[1];
      if (zoneHint) currentZoneId = `zona-${Number(zoneHint)}`;
      if (currentZoneId && church && Number.isFinite(qty) && qty > 0 && qty < 200) {
        lodgingRequests.push({
          zoneId: currentZoneId,
          churchName: church,
          requestedBeds: qty,
          note: "excel-summary",
        });
      }
    }
  }

  return { declaredZones, lodgingRequests };
}
