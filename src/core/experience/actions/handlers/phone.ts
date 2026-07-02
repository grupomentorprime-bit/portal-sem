import { registerExperienceActionHandler } from "../registry";
import { resolveExperienceActionLink } from "../registry";

registerExperienceActionHandler("phone", (action) => {
  if (action.type !== "phone") return;
  const link = resolveExperienceActionLink(action);
  if (link) window.location.href = link.href;
});
