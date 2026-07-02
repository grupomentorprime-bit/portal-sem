import { registerExperienceActionHandler } from "../registry";
import { resolveExperienceActionLink } from "../registry";

registerExperienceActionHandler("download", (action) => {
  if (action.type !== "download") return;
  const link = resolveExperienceActionLink(action);
  if (!link) return;

  const anchor = document.createElement("a");
  anchor.href = link.href;
  if (link.download) anchor.download = link.download;
  if (link.newTab) anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.click();
});
