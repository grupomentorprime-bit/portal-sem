import { registerExperienceActionHandler } from "../registry";

registerExperienceActionHandler("modal", (action, ctx) => {
  if (action.type !== "modal") return;
  ctx.openModal(action.modalId);
});
