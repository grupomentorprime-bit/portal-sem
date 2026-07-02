import { registerExperienceActionHandler } from "../registry";

registerExperienceActionHandler("form", (action, ctx) => {
  if (action.type !== "form") return;
  ctx.openForm(action.formId);
});
