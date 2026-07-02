interface PortalTimelineConnectorProps {
  orientation?: "horizontal" | "vertical";
}

export function PortalTimelineConnector({
  orientation = "horizontal",
}: PortalTimelineConnectorProps) {
  return (
    <span
      className={`portal-timeline__connector portal-timeline__connector--${orientation}`}
      aria-hidden
    />
  );
}
