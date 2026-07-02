import { ProgramMeta } from "./ProgramMeta";

interface ProgramMetaGridProps {
  modality?: string;
  duration?: string;
  certification?: string;
  startDate?: string;
  className?: string;
}

export function ProgramMetaGrid({
  modality,
  duration,
  certification,
  startDate,
  className,
}: ProgramMetaGridProps) {
  return (
    <ProgramMeta
      modality={modality}
      duration={duration}
      certification={certification}
      startDate={startDate}
      variant="academic-grid"
      className={className}
    />
  );
}
