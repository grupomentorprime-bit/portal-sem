export function ProgramHubCardSkeleton() {
  return (
    <div className="program-hub-card program-hub-card--skeleton" aria-hidden>
      <div className="program-hub-card__media program-hub-skeleton" />
      <div className="program-hub-card__body space-y-3">
        <div className="flex gap-2">
          <div className="program-hub-skeleton h-6 w-20 rounded-full" />
          <div className="program-hub-skeleton h-6 w-24 rounded-full" />
        </div>
        <div className="program-hub-skeleton h-6 w-3/4 rounded-md" />
        <div className="program-hub-skeleton h-4 w-1/2 rounded-md" />
        <div className="grid grid-cols-3 gap-2">
          <div className="program-hub-skeleton h-10 rounded-md" />
          <div className="program-hub-skeleton h-10 rounded-md" />
          <div className="program-hub-skeleton h-10 rounded-md" />
        </div>
        <div className="program-hub-skeleton h-4 w-full rounded-md" />
        <div className="program-hub-skeleton h-9 w-full rounded-md" />
      </div>
    </div>
  );
}
