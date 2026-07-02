import { cn } from "@/lib/utils";
import type { PortalContactHubLayout, PortalContactHubProps } from "@/types/contact-hub";
import { PortalContactHeaderFromView } from "./PortalContactHeader";
import { PortalContactCard } from "./PortalContactCard";
import { PortalContactLocation } from "./PortalContactLocation";
import { PortalContactMap } from "./PortalContactMap";
import { PortalContactActions } from "./PortalContactActions";
import { PortalContactFooterList } from "./PortalContactFooterList";

export function PortalContactHub({
  viewModel,
  layout = "full",
  id = "contacto",
  className,
}: PortalContactHubProps) {
  const isFooter = layout === "footer";
  const hasChannels = viewModel.channels.length > 0;
  const hasLocations = viewModel.locations.length > 0;
  const hasMap = viewModel.showMap && viewModel.map;
  const hasActions = viewModel.actions.length > 0;

  if (isFooter) {
    return (
      <PortalContactFooterList
        title={viewModel.title}
        channels={viewModel.channels}
        className={className}
      />
    );
  }

  if (!hasChannels && !hasLocations && !hasMap && !hasActions) {
    return null;
  }

  return (
    <section
      id={id}
      className={cn("portal-contact-hub portal-contact-hub--full", className)}
      aria-labelledby="portal-contact-hub-title"
    >
      <div className="portal-contact-hub__layout">
        <div className="portal-contact-hub__main">
          <PortalContactHeaderFromView viewModel={viewModel} />
          {hasChannels ? (
            <PortalContactCard channels={viewModel.channels} className="mt-10" />
          ) : null}
          {hasLocations ? (
            <ul className="portal-contact-hub__locations mt-10 space-y-4" role="list">
              {viewModel.locations.map((location) => (
                <li key={location.id}>
                  <PortalContactLocation location={location} />
                </li>
              ))}
            </ul>
          ) : null}
          {hasActions ? <PortalContactActions actions={viewModel.actions} className="mt-10" /> : null}
        </div>
        {hasMap && viewModel.map ? (
          <div className="portal-contact-hub__aside">
            <PortalContactMap map={viewModel.map} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function PortalContactHubSection({
  viewModel,
  layout = "full",
  id,
  className,
}: PortalContactHubProps) {
  if (layout === "footer") {
    return <PortalContactHub viewModel={viewModel} layout={layout} id={id} className={className} />;
  }

  return (
    <div className={cn("animate-slide-up", className)}>
      <PortalContactHub viewModel={viewModel} layout={layout} id={id} />
    </div>
  );
}

export type { PortalContactHubLayout };
