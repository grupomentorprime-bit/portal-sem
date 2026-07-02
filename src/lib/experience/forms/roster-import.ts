import type { ConvocatoriaRosterStudent } from "@/types/convocatoria-roster";
import { formatGenerationDisplay, normalizeGenerationValue } from "@/lib/experience/forms/generations";

const RUT_HEADERS = ["rut", "run"];
const FIRST_NAME_HEADERS = ["nombre", "nombres", "name", "first name"];
const LAST_NAME_HEADERS = ["apellidos", "apellido", "last name", "surname"];
const FULL_NAME_HEADERS = ["nombre completo", "alumno", "estudiante", "participante"];
const PHONE_HEADERS = ["telefono", "teléfono", "phone", "celular", "movil", "móvil", "fono"];
const GENERATION_HEADERS = [
  "generacion",
  "generación",
  "generation",
  "programa",
  "curso",
  "cohorte",
];

export function normalizeRosterSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function normalizeText(value: string): string {
  return normalizeRosterSearchText(value);
}

function normalizeHeader(value: string): string {
  return normalizeText(value).replace(/\s+/g, " ");
}

function normalizeRut(value: string): string {
  return value.replace(/\./g, "").replace(/-/g, "").toLowerCase().trim();
}

function formatPersonName(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function formatGenerationLabel(value: string): string {
  const normalized = normalizeGenerationValue(value);
  return normalized || value.trim();
}

function slugifyId(fullName: string, rut: string | undefined, index: number): string {
  if (rut) {
    return `rut-${normalizeRut(rut)}`;
  }
  return `student-${index + 1}-${normalizeText(fullName).replace(/\s+/g, "-").slice(0, 40)}`;
}

function detectDelimiter(line: string): string {
  if (line.includes(";")) return ";";
  if (line.includes("|")) return "|";
  if (line.includes("\t")) return "\t";
  return ",";
}

function splitCsvLine(line: string, delimiter: string): string[] {
  if (delimiter !== ",") {
    return line.split(delimiter).map((part) => part.trim());
  }

  const parts: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  parts.push(current.trim());
  return parts;
}

function findColumnIndex(headers: string[], aliases: string[]): number {
  return headers.findIndex((header) => aliases.includes(normalizeHeader(header)));
}

interface ColumnMap {
  rut: number;
  firstName: number;
  lastName: number;
  fullName: number;
  phone: number;
  generation: number;
}

function findHeaderRowIndex(rows: string[][]): number {
  for (let i = 0; i < Math.min(rows.length, 12); i += 1) {
    const headers = rows[i].map((cell) => normalizeHeader(String(cell ?? "")));
    const hasGeneration = findColumnIndex(headers, GENERATION_HEADERS) >= 0;
    const hasName =
      findColumnIndex(headers, FULL_NAME_HEADERS) >= 0 ||
      findColumnIndex(headers, FIRST_NAME_HEADERS) >= 0;

    if (hasGeneration && hasName) {
      return i;
    }
  }
  return 0;
}

function buildColumnMap(headers: string[]): ColumnMap {
  return {
    rut: findColumnIndex(headers, RUT_HEADERS),
    firstName: findColumnIndex(headers, FIRST_NAME_HEADERS),
    lastName: findColumnIndex(headers, LAST_NAME_HEADERS),
    fullName: findColumnIndex(headers, FULL_NAME_HEADERS),
    phone: findColumnIndex(headers, PHONE_HEADERS),
    generation: findColumnIndex(headers, GENERATION_HEADERS),
  };
}

function readCell(row: string[], index: number): string {
  if (index < 0) return "";
  return String(row[index] ?? "").trim();
}

function rowToStudent(
  row: string[],
  columnMap: ColumnMap,
  index: number,
  fallbackGeneration?: string
): ConvocatoriaRosterStudent | null {
  const rut = readCell(row, columnMap.rut);
  const firstName = readCell(row, columnMap.firstName);
  const lastName = readCell(row, columnMap.lastName);
  const fullNameRaw = readCell(row, columnMap.fullName);
  const generation =
    formatGenerationLabel(readCell(row, columnMap.generation)) ||
    formatGenerationLabel(fallbackGeneration ?? "");
  const phone = readCell(row, columnMap.phone);

  const fullName = formatPersonName(
    fullNameRaw || [firstName, lastName].filter(Boolean).join(" ")
  );

  if (!fullName || !generation) return null;

  return {
    id: slugifyId(fullName, rut || undefined, index),
    rut: rut || undefined,
    fullName,
    generation,
    phone: phone || undefined,
  };
}

function isLikelyHeaderRow(row: string[]): boolean {
  const headers = row.map((cell) => normalizeHeader(String(cell ?? "")));
  return (
    findColumnIndex(headers, GENERATION_HEADERS) >= 0 &&
    (findColumnIndex(headers, FULL_NAME_HEADERS) >= 0 ||
      findColumnIndex(headers, FIRST_NAME_HEADERS) >= 0)
  );
}

export function parseConvocatoriaRosterRows(
  rows: string[][],
  sheetGenerationFallback?: string
): ConvocatoriaRosterStudent[] {
  const cleanedRows = rows
    .map((row) => row.map((cell) => String(cell ?? "").trim()))
    .filter((row) => row.some((cell) => cell.length > 0));

  if (cleanedRows.length === 0) return [];

  const headerRowIndex = findHeaderRowIndex(cleanedRows);
  const headerCells = cleanedRows[headerRowIndex].map((cell) => normalizeHeader(cell));
  const columnMap = buildColumnMap(headerCells);
  const hasStructuredHeader =
    columnMap.generation >= 0 &&
    (columnMap.fullName >= 0 || columnMap.firstName >= 0) &&
    cleanedRows.length > headerRowIndex + 1;

  const students: ConvocatoriaRosterStudent[] = [];
  const seen = new Set<string>();

  const pushStudent = (student: ConvocatoriaRosterStudent | null) => {
    if (!student) return;
    const key = student.rut
      ? normalizeRut(student.rut)
      : `${normalizeText(student.fullName)}::${normalizeText(student.generation)}`;
    if (seen.has(key)) return;
    seen.add(key);
    students.push(student);
  };

  if (hasStructuredHeader) {
    for (const row of cleanedRows.slice(headerRowIndex + 1)) {
      if (isLikelyHeaderRow(row)) continue;
      pushStudent(rowToStudent(row, columnMap, students.length, sheetGenerationFallback));
    }
    return students;
  }

  for (const row of cleanedRows) {
    if (row.length < 2 || isLikelyHeaderRow(row)) continue;

    if (row.length >= 4 && !isLikelyHeaderRow(row)) {
      pushStudent(
        rowToStudent(
          row,
          {
            rut: 0,
            firstName: 1,
            lastName: 2,
            fullName: -1,
            phone: -1,
            generation: 3,
          },
          students.length,
          sheetGenerationFallback
        )
      );
      continue;
    }

    if (row.length >= 3) {
      pushStudent(
        rowToStudent(
          row,
          {
            rut: -1,
            firstName: 0,
            lastName: -1,
            fullName: -1,
            phone: 1,
            generation: 2,
          },
          students.length,
          sheetGenerationFallback
        )
      );
      continue;
    }

    pushStudent(
      rowToStudent(
        row,
        {
          rut: -1,
          firstName: 0,
          lastName: -1,
          fullName: -1,
          phone: -1,
          generation: 1,
        },
        students.length,
        sheetGenerationFallback
      )
    );
  }

  return students;
}

export function parseConvocatoriaRosterCsv(input: string): ConvocatoriaRosterStudent[] {
  const normalized = input.replace(/^\uFEFF/, "");
  const lines = normalized.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return [];

  const delimiter = detectDelimiter(lines[0]);
  const rows = lines.map((line) => splitCsvLine(line, delimiter));
  return parseConvocatoriaRosterRows(rows);
}

export function parseConvocatoriaRosterText(input: string): ConvocatoriaRosterStudent[] {
  return parseConvocatoriaRosterCsv(input);
}

export const ROSTER_IMPORT_TEMPLATE = `rut,nombre,apellidos,generacion
13.786.472-K,ALEJANDRA,GUTIERREZ CARRASCO,G-2023
16.628.806-3,ANDRES ENMANUEL,SEPULVEDA,G-2023
19.897.456-8,ANA MARIA,LOPEZ SILVA,G-2024`;

export function rosterStudentsToCsv(students: ConvocatoriaRosterStudent[]): string {
  const lines = ["rut,nombre,apellidos,generacion"];
  for (const student of students) {
    const nameParts = student.fullName.split(/\s+/);
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ");
    const rut = `"${(student.rut ?? "").replace(/"/g, '""')}"`;
    const nombre = `"${firstName.replace(/"/g, '""')}"`;
    const apellidos = `"${lastName.replace(/"/g, '""')}"`;
    const generacion = `"${student.generation.replace(/"/g, '""')}"`;
    lines.push(`${rut},${nombre},${apellidos},${generacion}`);
  }
  return lines.join("\n");
}

export function inferGenerationFromSheetName(sheetName: string): string | null {
  const match = sheetName.match(/\bG[-\s]?(\d{4})\b/i);
  return match ? `G-${match[1]}` : null;
}

export function parseConvocatoriaRosterRowsFromSheet(
  rows: string[][],
  sheetName?: string
): ConvocatoriaRosterStudent[] {
  const inferredGeneration = sheetName ? inferGenerationFromSheetName(sheetName) : null;
  return parseConvocatoriaRosterRows(rows, inferredGeneration ?? undefined);
}

export function mergeRosterStudents(
  batches: ConvocatoriaRosterStudent[][]
): ConvocatoriaRosterStudent[] {
  const seen = new Set<string>();
  const merged: ConvocatoriaRosterStudent[] = [];

  for (const batch of batches) {
    for (const student of batch) {
      const key = student.rut
        ? normalizeRut(student.rut)
        : `${normalizeText(student.fullName)}::${normalizeText(student.generation)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(student);
    }
  }

  return merged;
}

export function rosterStudentKey(student: ConvocatoriaRosterStudent): string {
  return student.rut
    ? normalizeRut(student.rut)
    : `${normalizeText(student.fullName)}::${normalizeText(student.generation)}`;
}

export function createRosterStudentFromFields(input: {
  rut?: string;
  firstName: string;
  lastName: string;
  generation: string;
  phone?: string;
  index?: number;
}): ConvocatoriaRosterStudent | null {
  const generation = formatGenerationLabel(input.generation);
  const fullName = formatPersonName(
    [input.firstName.trim(), input.lastName.trim()].filter(Boolean).join(" ")
  );
  const rut = input.rut?.trim();

  if (!fullName || !generation) return null;

  return {
    id: slugifyId(fullName, rut || undefined, input.index ?? 0),
    rut: rut || undefined,
    fullName,
    generation,
    phone: input.phone?.trim() || undefined,
  };
}

export function upsertRosterStudent(
  students: ConvocatoriaRosterStudent[],
  incoming: ConvocatoriaRosterStudent
): { students: ConvocatoriaRosterStudent[]; replaced: boolean } {
  const incomingKey = rosterStudentKey(incoming);
  const existingIndex = students.findIndex((student) => rosterStudentKey(student) === incomingKey);

  if (existingIndex >= 0) {
    const next = [...students];
    next[existingIndex] = {
      ...students[existingIndex],
      ...incoming,
      id: students[existingIndex].id,
    };
    return { students: next, replaced: true };
  }

  return {
    students: [...students, incoming].sort((a, b) => a.fullName.localeCompare(b.fullName, "es")),
    replaced: false,
  };
}

export interface RosterSheetImportSummary {
  name: string;
  count: number;
  generation?: string;
}

export function summarizeRosterStudentsByGeneration(
  students: ConvocatoriaRosterStudent[]
): Array<{ generation: string; count: number }> {
  const counts = new Map<string, number>();
  for (const student of students) {
    const generation = student.generation
      ? formatGenerationDisplay(student.generation)
      : "Sin generación";
    counts.set(generation, (counts.get(generation) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([generation, count]) => ({ generation, count }))
    .sort((a, b) => a.generation.localeCompare(b.generation, "es"));
}

export function rosterStudentMatchesQuery(
  student: ConvocatoriaRosterStudent,
  query: string
): boolean {
  const normalizedQuery = normalizeRosterSearchText(query);
  if (normalizedQuery.length < 2) return false;

  const haystack = [
    student.fullName,
    student.generation,
    formatGenerationDisplay(student.generation),
    student.rut ?? "",
    student.phone ?? "",
  ]
    .map(normalizeRosterSearchText)
    .join(" ");

  if (haystack.includes(normalizedQuery)) return true;

  const rutQuery = normalizeRut(query);
  if (rutQuery.length >= 3 && student.rut && normalizeRut(student.rut).includes(rutQuery)) {
    return true;
  }

  return normalizedQuery
    .split(/\s+/)
    .filter((token) => token.length >= 2)
    .every((token) => haystack.includes(token));
}
