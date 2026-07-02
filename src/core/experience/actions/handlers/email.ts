import { registerExperienceActionHandler } from "../registry";
import { resolveExperienceActionLink } from "../registry";

registerExperienceActionHandler("email", (action) => {
  if (action.type !== "email") return;
  const link = resolveExperienceActionLink(action);
  if (link) window.location.href = link.href;
});
