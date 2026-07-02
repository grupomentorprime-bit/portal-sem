import { normalizeGenerationValue } from "@/lib/experience/forms/generations";
import type { ConvocatoriaRosterStudent } from "@/types/convocatoria-roster";

/** Encabezados del formato institucional SEM (columna A reservada para índice). */
const EXCEL_HEADER_ROW = ["", "Rut", "Nombre", "Apellidos", "Generacion"] as const;

const TEMPLATE_GENERATIONS = ["G-2023", "G-2024", "G-2025", "G-2026"] as const;

const TEMPLATE_EXAMPLES: Record<
  (typeof TEMPLATE_GENERATIONS)[number],
  Array<{ rut: string; nombre: string; apellidos: string }>
> = {
  "G-2023": [
    { rut: "13.786.472-K", nombre: "ALEJANDRA", apellidos: "GUTIERREZ CARRASCO" },
    { rut: "16.628.806-3", nombre: "ANDRES ENMANUEL", apellidos: "SEPULVEDA" },
  ],
  "G-2024": [
    { rut: "19.897.456-8", nombre: "ANA MARIA", apellidos: "LOPEZ SILVA" },
    { rut: "18.234.567-1", nombre: "MARCO ANTONIO", apellidos: "SEPULVEDA BUSTOS" },
  ],
  "G-2025": [
    { rut: "20.111.222-3", nombre: "CARLOS", apellidos: "MENDOZA RIVAS" },
  ],
  "G-2026": [
    { rut: "16.594.793-2", nombre: "JESSICA NATALIA", apellidos: "QUINTEROS SAEZ" },
  ],
};

function splitFullName(fullName: string): { nombre: string; apellidos: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    nombre: parts[0] ?? "",
    apellidos: parts.slice(1).join(" "),
  };
}

function generationSheetName(generation: string): string {
  const canonical = normalizeGenerationValue(generation);
  if (canonical.startsWith("G-")) return `TSR. ${canonical}`;
  if (canonical === "staff") return "Equipo docente";
  if (canonical === "other") return "Otros";
  return canonical.slice(0, 31);
}

function sheetSortKey(sheetName: string): string {
  const match = sheetName.match(/G-(\d{4})/);
  if (match) return `0-${match[1]}`;
  if (sheetName === "Equipo docente") return "1-staff";
  if (sheetName === "Otros") return "2-other";
  if (sheetName === "Otro") return "2-other";
  return `9-${sheetName}`;
}

export function rosterStudentToExcelRow(
  student: ConvocatoriaRosterStudent,
  index: number
): string[] {
  const { nombre, apellidos } = splitFullName(student.fullName);
  return [
    String(index),
    student.rut ?? "",
    nombre.toUpperCase(),
    apellidos.toUpperCase(),
    normalizeGenerationValue(student.generation),
  ];
}

export function rosterStudentsToExcelRows(students: ConvocatoriaRosterStudent[]): string[][] {
  const rows: string[][] = [[], [...EXCEL_HEADER_ROW]];
  students.forEach((student, index) => {
    rows.push(rosterStudentToExcelRow(student, index + 1));
  });
  return rows;
}

/** Plantilla Excel con 4 hojas (TSR. G-2023 … G-2026), igual al formato institucional. */
export function buildRosterTemplateSheets(): Record<string, string[][]> {
  const sheets: Record<string, string[][]> = {};

  for (const generation of TEMPLATE_GENERATIONS) {
    const sheetName = generationSheetName(generation);
    const rows: string[][] = [[], [...EXCEL_HEADER_ROW]];
    const examples = TEMPLATE_EXAMPLES[generation];

    examples.forEach((example, index) => {
      rows.push([
        String(index + 1),
        example.rut,
        example.nombre,
        example.apellidos,
        generation,
      ]);
    });

    sheets[sheetName] = rows;
  }

  return sheets;
}

/** Exporta el listado actual agrupado por hoja de generación. */
export function buildRosterExportSheets(
  students: ConvocatoriaRosterStudent[]
): Record<string, string[][]> {
  const groups = new Map<string, ConvocatoriaRosterStudent[]>();

  for (const student of students) {
    const sheetName = generationSheetName(student.generation);
    const bucket = groups.get(sheetName) ?? [];
    bucket.push(student);
    groups.set(sheetName, bucket);
  }

  const sortedSheetNames = [...groups.keys()].sort((a, b) =>
    sheetSortKey(a).localeCompare(sheetSortKey(b))
  );

  const sheets: Record<string, string[][]> = {};
  for (const sheetName of sortedSheetNames) {
    const group = groups.get(sheetName) ?? [];
    group.sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
    sheets[sheetName] = rosterStudentsToExcelRows(group);
  }

  return sheets;
}

export async function downloadRosterExcelFile(
  sheets: Record<string, string[][]>,
  filename: string
): Promise<void> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();

  for (const [sheetName, rows] of Object.entries(sheets)) {
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  }

  XLSX.writeFile(workbook, filename);
}
