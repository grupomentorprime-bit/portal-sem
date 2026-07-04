import { getSubmissionGeneration } from "@/lib/admin/forms-center";
import { formatGenerationDisplay } from "@/lib/experience/forms/generations";
import type { ExperienceFormSubmission } from "@/types/experience-forms";
import type { ConvocatoriaRosterStudent } from "@/types/convocatoria-roster";

export interface CohortRosterStat {
  generation: string;
  nominated: number;
  confirmed: number;
  pct: number;
}

export function buildCohortRosterStats(
  submissions: ExperienceFormSubmission[],
  rosterStudents: ConvocatoriaRosterStudent[]
): CohortRosterStat[] {
  const nominatedByGeneration = new Map<string, number>();
  for (const student of rosterStudents) {
    const generation = formatGenerationDisplay(student.generation);
    if (generation === "—") continue;
    nominatedByGeneration.set(generation, (nominatedByGeneration.get(generation) ?? 0) + 1);
  }

  const confirmedByGeneration = new Map<string, number>();
  for (const submission of submissions) {
    if (submission.data.attendance !== "yes") continue;
    const generation = getSubmissionGeneration(submission.data);
    if (generation === "—") continue;
    confirmedByGeneration.set(generation, (confirmedByGeneration.get(generation) ?? 0) + 1);
  }

  const generations = new Set([
    ...nominatedByGeneration.keys(),
    ...confirmedByGeneration.keys(),
  ]);

  return [...generations]
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((generation) => {
      const nominated = nominatedByGeneration.get(generation) ?? 0;
      const confirmed = confirmedByGeneration.get(generation) ?? 0;
      const pct = nominated > 0 ? Math.round((confirmed / nominated) * 100) : 0;
      return { generation, nominated, confirmed, pct };
    });
}

export function sumCohortRosterStats(stats: CohortRosterStat[]): {
  nominated: number;
  confirmed: number;
  pct: number;
} {
  const nominated = stats.reduce((sum, stat) => sum + stat.nominated, 0);
  const confirmed = stats.reduce((sum, stat) => sum + stat.confirmed, 0);
  const pct = nominated > 0 ? Math.round((confirmed / nominated) * 100) : 0;
  return { nominated, confirmed, pct };
}
