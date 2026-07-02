import { registerExperienceActionHandler } from "../registry";

registerExperienceActionHandler("url", (action, ctx) => {
  if (action.type !== "url") return;
  if (action.newTab) {
    window.open(action.href, "_blank", "noopener,noreferrer");
    return;
  }
  ctx.navigate(action.href);
});
