import { PROGRAM_CARD_FALLBACKS } from "@/lib/portal/program-demo-assets";
import type { ContentDocument, ContentStatus } from "@/types/content";

export type ProgramHubFilter =
  | "all"
  | "published"
  | "draft"
  | "admission_open"
  | "archived";

export type ProgramHubSort =
  | "updated_desc"
  | "updated_asc"
  | "title_asc"
  | "title_desc"
  | "applicants_desc"
  | "published_desc";

export interface ProgramHubMetrics {
  total: number;
  published: number;
  draft: number;
  admissionOpen: number;
  archived: number;
  comingSoon: number;
}

export interface ProgramHubInsights {
  applicantCounts: Record<string, number>;
  featuredProgramId?: string;
}

export function computeProgramHubMetrics(programs: ContentDocument[]): ProgramHubMetrics {
  return programs.reduce<ProgramHubMetrics>(
    (acc, program) => {
      acc.total += 1;
      if (program.status === "published") acc.published += 1;
      if (program.status === "draft") acc.draft += 1;
      if (program.status === "archived") acc.archived += 1;
      if (program.programStatus === "admission_open") acc.admissionOpen += 1;
      if (program.programStatus === "coming_soon") acc.comingSoon += 1;
      return acc;
    },
    {
      total: 0,
      published: 0,
      draft: 0,
      admissionOpen: 0,
      archived: 0,
      comingSoon: 0,
    }
  );
}

export function filterPrograms(
  programs: ContentDocument[],
  filter: ProgramHubFilter,
  search: string
): ContentDocument[] {
  const query = search.trim().toLowerCase();

  return programs.filter((program) => {
    if (filter === "published" && program.status !== "published") return false;
    if (filter === "draft" && program.status !== "draft") return false;
    if (filter === "archived" && program.status !== "archived") return false;
    if (filter === "admission_open" && program.programStatus !== "admission_open") {
      return false;
    }

    if (!query) return true;

    const haystack = [
      program.title,
      program.slug,
      program.modality,
      program.duration,
      program.category,
      program.categories?.join(" "),
      program.certification,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function sortPrograms(
  programs: ContentDocument[],
  sort: ProgramHubSort,
  applicantCounts: Record<string, number>
): ContentDocument[] {
  const next = [...programs];

  next.sort((a, b) => {
    switch (sort) {
      case "title_asc":
        return a.title.localeCompare(b.title, "es");
      case "title_desc":
        return b.title.localeCompare(a.title, "es");
      case "updated_asc":
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      case "published_desc":
        return new Date(b.publishedAt || b.createdAt).getTime() -
          new Date(a.publishedAt || a.createdAt).getTime();
      case "applicants_desc":
        return (applicantCounts[b._id] ?? 0) - (applicantCounts[a._id] ?? 0);
      case "updated_desc":
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  return next;
}

export function resolveProgramCardImage(program: ContentDocument, index: number): string {
  if (program.image?.trim()) return program.image;
  return PROGRAM_CARD_FALLBACKS[index % PROGRAM_CARD_FALLBACKS.length];
}

export function resolveProgramCategory(program: ContentDocument): string {
  return program.category || program.categories?.[0] || "Programa formativo";
}

export function formatProgramStartDate(value?: string): string {
  if (!value?.trim()) return "Por definir";
  try {
    return new Intl.DateTimeFormat("es-CL", {
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function programPreviewHref(program: ContentDocument): string {
  return program.href || `/programas/${program.slug}`;
}

export function statusBadgeVariant(
  status: ContentStatus
): "success" | "warning" | "neutral" | "info" {
  switch (status) {
    case "published":
      return "success";
    case "draft":
      return "warning";
    case "archived":
      return "neutral";
    default:
      return "info";
  }
}

export function statusBadgeLabel(status: ContentStatus): string {
  switch (status) {
    case "published":
      return "Publicado";
    case "draft":
      return "Borrador";
    case "archived":
      return "Archivado";
    default:
      return status;
  }
}

export function admissionBadgeLabel(program: ContentDocument): string | null {
  if (program.programStatus === "admission_open") return "Admisión abierta";
  if (program.programStatus === "coming_soon") return "Próximamente";
  if (program.programStatus === "active") return "Sin admisión";
  return null;
}

export function exportProgramsCatalog(programs: ContentDocument[]): void {
  const payload = programs.map((program) => ({
    id: program._id,
    title: program.title,
    slug: program.slug,
    status: program.status,
    programStatus: program.programStatus,
    modality: program.modality,
    duration: program.duration,
    startDate: program.startDate,
    category: resolveProgramCategory(program),
    updatedAt: program.updatedAt,
  }));

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `catalogo-programas-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
