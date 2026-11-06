"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import { Download, Pencil, Upload, UserPlus } from "lucide-react";
import {
  AdminDataTable,
  ColumnActions,
  LoadingState,
  SearchBar,
  type AdminDataTableColumn,
} from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { ConvocatoriaRosterStudentDialog } from "@/components/admin/forms/ConvocatoriaRosterStudentDialog";
import {
  mergeRosterStudents,
  parseConvocatoriaRosterCsv,
  parseConvocatoriaRosterRowsFromSheet,
  rosterStudentsToCsv,
  rosterStudentMatchesQuery,
  sortRosterImportSheetNames,
  summarizeRosterStudentsByGeneration,
  upsertRosterStudent,
  type RosterSheetImportSummary,
} from "@/lib/experience/forms/roster-import";
import { collectPersonSearchSuggestions } from "@/lib/experience/forms/person-search";
import {
  buildRosterExportSheets,
  buildRosterTemplateSheets,
  downloadRosterExcelFile,
} from "@/lib/experience/forms/roster-export";
import { formatGenerationCode, formatGenerationDisplay } from "@/lib/experience/forms/generations";
import type {
  ConvocatoriaExcludedStudent,
  ConvocatoriaRosterStudent,
} from "@/types/convocatoria-roster";

interface ConvocatoriaRosterPanelProps {
  convocatoriaSlug: string;
}

function generationFilterLabel(display: string): string {
  const code = formatGenerationCode(display);
  if (code.startsWith("G-") && /pastores/i.test(display)) return `${code} · Pastores`;
  return code;
}

const ROSTER_FORMAT_HELP =
  "Formato Excel institucional: columnas Rut, Nombre, Apellidos y Generacion (hojas TSR. G-2023, G-2024, etc.). Descarga la plantilla o el listado actual en Excel.";

async function parseRosterFile(file: File): Promise<{
  students: ConvocatoriaRosterStudent[];
  sheets: RosterSheetImportSummary[];
}> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (extension === "csv" || extension === "txt") {
    const students = parseConvocatoriaRosterCsv(await file.text());
    return {
      students,
      sheets: [{ name: file.name, count: students.length }],
    };
  }

  if (extension === "xlsx" || extension === "xls") {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const batches: ConvocatoriaRosterStudent[][] = [];
    const sheets: RosterSheetImportSummary[] = [];

    for (const sheetName of sortRosterImportSheetNames(workbook.SheetNames)) {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
      const students = parseConvocatoriaRosterRowsFromSheet(rows, sheetName);
      if (students.length === 0) continue;

      batches.push(students);
      sheets.push({
        name: sheetName,
        count: students.length,
        generation: students[0]?.generation,
      });
    }

    return {
      students: mergeRosterStudents(batches),
      sheets,
    };
  }

  throw new Error("Formato no soportado. Usa CSV o Excel (.xlsx).");
}

export function ConvocatoriaRosterPanel({ convocatoriaSlug }: ConvocatoriaRosterPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rawText, setRawText] = useState("");
  const [students, setStudents] = useState<ConvocatoriaRosterStudent[]>([]);
  const [excludedStudents, setExcludedStudents] = useState<ConvocatoriaExcludedStudent[]>([]);
  const [sheetSummary, setSheetSummary] = useState<RosterSheetImportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingStudent, setEditingStudent] = useState<ConvocatoriaRosterStudent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [generationFilter, setGenerationFilter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const generationSummary = summarizeRosterStudentsByGeneration(students);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim();
    return students.filter((student) => {
      if (generationFilter && formatGenerationDisplay(student.generation) !== generationFilter) {
        return false;
      }
      if (query.length < 2) return true;
      return rosterStudentMatchesQuery(student, query);
    });
  }, [students, searchQuery, generationFilter]);

  const suggestedStudents = useMemo(() => {
    const query = searchQuery.trim();
    if (query.length < 2) return [];
    const pool = students.filter((student) => {
      if (generationFilter && formatGenerationDisplay(student.generation) !== generationFilter) {
        return false;
      }
      return true;
    });
    return collectPersonSearchSuggestions(query, pool, (student) => [
      student.fullName,
      student.rut,
    ]).items;
  }, [students, searchQuery, generationFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/experience/forms/convocatorias/${convocatoriaSlug}/roster`);
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo cargar el listado.");
        return;
      }
      const rosterStudents = data.roster?.students ?? [];
      setStudents(rosterStudents);
      setExcludedStudents(data.roster?.excludedStudents ?? []);
      setSheetSummary([]);
      setRawText(rosterStudentsToCsv(rosterStudents));
    } catch {
      setError("Error de red al cargar el listado.");
    } finally {
      setLoading(false);
    }
  }, [convocatoriaSlug]);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (nextStudents?: ConvocatoriaRosterStudent[]) => {
    const payloadStudents = nextStudents ?? parseConvocatoriaRosterCsv(rawText);
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/experience/forms/convocatorias/${convocatoriaSlug}/roster`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: payloadStudents }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo guardar el listado.");
        return;
      }
      const savedStudents = data.roster?.students ?? [];
      setStudents(savedStudents);
      setExcludedStudents(data.roster?.excludedStudents ?? []);
      setRawText(rosterStudentsToCsv(savedStudents));
      setSaved(true);
    } catch {
      setError("Error de red al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const applyStudentChanges = async (
    student: ConvocatoriaRosterStudent,
    originalId?: string
  ) => {
    setError(null);
    let nextStudents: ConvocatoriaRosterStudent[];

    if (originalId) {
      const index = students.findIndex((item) => item.id === originalId);
      if (index >= 0) {
        nextStudents = [...students];
        nextStudents[index] = { ...student, id: originalId };
      } else {
        nextStudents = upsertRosterStudent(students, student).students;
      }
    } else {
      nextStudents = upsertRosterStudent(students, student).students;
    }

    setStudents(nextStudents);
    setRawText(rosterStudentsToCsv(nextStudents));
    setSheetSummary([]);
    await handleSave(nextStudents);
  };

  const reinstateExcluded = async (blocked: ConvocatoriaExcludedStudent) => {
    const { reason: _reason, excludedAt: _excludedAt, sourceFormId: _source, ...student } =
      blocked;
    const nextStudents = upsertRosterStudent(students, student).students;
    setStudents(nextStudents);
    setRawText(rosterStudentsToCsv(nextStudents));
    await handleSave(nextStudents);
  };

  const openAddDialog = () => {
    setDialogMode("add");
    setEditingStudent(null);
    setDialogOpen(true);
  };

  const openEditDialog = (student: ConvocatoriaRosterStudent) => {
    setDialogMode("edit");
    setEditingStudent(student);
    setDialogOpen(true);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImporting(true);
    setError(null);
    setSaved(false);
    try {
      const imported = await parseRosterFile(file);
      if (imported.students.length === 0) {
        setError("El archivo no contiene alumnos válidos. Revisa las columnas Rut, Nombre, Apellidos y Generación.");
        return;
      }
      setStudents(imported.students);
      setSheetSummary(imported.sheets);
      setRawText(rosterStudentsToCsv(imported.students));
      await handleSave(imported.students);
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "No se pudo leer el archivo importado."
      );
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadRosterExcelFile(
        buildRosterTemplateSheets(),
        "plantilla-participantes-convocatoria.xlsx"
      );
    } catch {
      setError("No se pudo generar la plantilla Excel.");
    }
  };

  const handleDownloadList = async () => {
    if (students.length === 0) return;
    try {
      await downloadRosterExcelFile(
        buildRosterExportSheets(students),
        `listado-participantes-${convocatoriaSlug}.xlsx`
      );
    } catch {
      setError("No se pudo descargar el listado en Excel.");
    }
  };

  const columns: AdminDataTableColumn<ConvocatoriaRosterStudent>[] = [
    {
      id: "rut",
      header: "RUT",
      cell: (student) => <span className="text-muted">{student.rut ?? "—"}</span>,
    },
    {
      id: "name",
      header: "Nombre",
      cell: (student) => <span className="font-medium">{student.fullName}</span>,
    },
    {
      id: "generation",
      header: "Generación",
      cell: (student) => (
        <span className="text-muted">{formatGenerationDisplay(student.generation)}</span>
      ),
    },
  ];

  if (loading) return <LoadingState variant="table" />;

  const rosterCountLabel =
    students.length === 0
      ? "Sin alumnos en la nómina"
      : filteredStudents.length === students.length
        ? `${students.length} en la nómina`
        : `${filteredStudents.length} de ${students.length}`;

  return (
    <div className="roster-hub">
      <div className="roster-hub__bar">
        <div>
          <p className="roster-hub__count">{rosterCountLabel}</p>
          <p className="roster-hub__hint">
            Sube un Excel con una hoja por generación, o agrega alumnos uno a uno. Quienes desertan
            no aparecen en el listado público.
          </p>
        </div>
        <div className="roster-hub__actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.xlsx,.xls"
            className="sr-only"
            onChange={(event) => void handleFileChange(event)}
          />
          <Button variant="ghost" size="sm" type="button" onClick={() => void handleDownloadTemplate()}>
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Plantilla
          </Button>
          {students.length > 0 ? (
            <Button variant="ghost" size="sm" type="button" onClick={() => void handleDownloadList()}>
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Descargar
            </Button>
          ) : null}
          <Button variant="outline" size="sm" type="button" onClick={openAddDialog}>
            <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
            Agregar alumno
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            loading={importing}
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            Subir Excel
          </Button>
        </div>
      </div>

      {sheetSummary.length > 1 ? (
        <div className="rounded-xl border border-border bg-background-muted/30 p-4 text-sm">
          <p className="font-medium text-foreground">Hojas importadas</p>
          <ul className="mt-2 space-y-1 text-muted">
            {sheetSummary.map((sheet) => (
              <li key={sheet.name}>
                {sheet.name}: {sheet.count} alumno{sheet.count === 1 ? "" : "s"}
                {sheet.generation ? ` · ${formatGenerationDisplay(sheet.generation)}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {students.length > 0 ? (
        <div className="space-y-3">
          <div className="roster-hub__filters">
            {generationSummary.length > 0 ? (
              <div className="forms-hub__segments roster-hub__generations" role="group" aria-label="Generación">
                <button
                  type="button"
                  className={cn(
                    "forms-hub__segment",
                    generationFilter === null && "forms-hub__segment--active"
                  )}
                  aria-pressed={generationFilter === null}
                  onClick={() => setGenerationFilter(null)}
                >
                  Todas
                  <span className="forms-hub__segment-count">{students.length}</span>
                </button>
                {generationSummary.map((item) => (
                  <button
                    key={item.generation}
                    type="button"
                    className={cn(
                      "forms-hub__segment",
                      generationFilter === item.generation && "forms-hub__segment--active"
                    )}
                    aria-pressed={generationFilter === item.generation}
                    title={item.generation}
                    onClick={() =>
                      setGenerationFilter((current) =>
                        current === item.generation ? null : item.generation
                      )
                    }
                  >
                    {generationFilterLabel(item.generation)}
                    <span className="forms-hub__segment-count">{item.count}</span>
                  </button>
                ))}
              </div>
            ) : null}
            <div className="roster-hub__search-row">
              <SearchBar
                className="roster-hub__search"
                placeholder="Nombre, apellido o RUT…"
                value={searchQuery}
                onChange={setSearchQuery}
              />
              {searchQuery || generationFilter ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setGenerationFilter(null);
                  }}
                >
                  Limpiar
                </Button>
              ) : null}
            </div>
          </div>

          {suggestedStudents.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted">Sugerencias</p>
              <div className="flex flex-wrap gap-2">
                {suggestedStudents.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    className="rounded-full border border-border bg-background px-3 py-1 text-sm text-foreground hover:bg-background-muted/60"
                    onClick={() => setSearchQuery(student.fullName)}
                  >
                    {student.fullName}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <AdminDataTable
            columns={columns}
            data={filteredStudents}
            rowKey={(student) => student.id}
            emptyTitle="Sin resultados"
            emptyDescription="No hay participantes que coincidan con la búsqueda o el filtro."
            rowActionsLabel="Acciones"
            rowActions={(student) => (
              <ColumnActions>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(student)}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Editar
                </Button>
              </ColumnActions>
            )}
          />
        </div>
      ) : null}

      {excludedStudents.length > 0 ? (
        <details className="roster-hub__aside">
          <summary className="roster-hub__summary">
            Fuera de esta convocatoria
            <span className="roster-hub__count-pill">{excludedStudents.length}</span>
          </summary>
          <div className="roster-hub__aside-body">
            <p className="roster-hub__aside-note">
              No pueden marcar asistencia por sí mismos. Reincorpóralos solo si Asuntos
              Estudiantiles, Soporte o Administración lo autorizan.
            </p>
            <ul className="roster-hub__excluded">
              {excludedStudents.map((blocked) => (
                <li key={blocked.id} className="roster-hub__excluded-item">
                  <div className="roster-hub__person">
                    <p className="roster-hub__person-name">{blocked.fullName}</p>
                    <p className="roster-hub__person-meta">
                      {formatGenerationDisplay(blocked.generation)}
                    </p>
                    {blocked.reason ? (
                      <p className="roster-hub__reason" title={blocked.reason}>
                        {blocked.reason}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={saving}
                    onClick={() => void reinstateExcluded(blocked)}
                  >
                    Reincorporar
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </details>
      ) : null}

      <details className="roster-hub__advanced">
        <summary className="roster-hub__summary">Edición avanzada en texto (CSV)</summary>
        <div className="roster-hub__advanced-body space-y-3">
          <Textarea
            label="Listado de alumnos"
            helper={ROSTER_FORMAT_HELP}
            rows={12}
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={() => void handleSave()} loading={saving}>
              Guardar listado
            </Button>
            <p className="text-sm text-muted">
              {students.length} alumno{students.length === 1 ? "" : "s"} cargado
              {students.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </details>

      {saved ? <p className="text-sm font-medium text-success">Listado actualizado.</p> : null}
      {error ? <p className="text-sm text-primary">{error}</p> : null}

      <ConvocatoriaRosterStudentDialog
        open={dialogOpen}
        mode={dialogMode}
        student={editingStudent}
        onClose={() => {
          setDialogOpen(false);
          setEditingStudent(null);
        }}
        onSubmit={applyStudentChanges}
        existingCount={students.length}
      />
    </div>
  );
}
