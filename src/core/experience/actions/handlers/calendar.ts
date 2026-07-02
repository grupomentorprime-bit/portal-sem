import { registerExperienceActionHandler } from "../registry";

registerExperienceActionHandler("calendar", (action) => {
  if (action.type !== "calendar") return;
  if (process.env.NODE_ENV !== "production") {
    console.warn("[Experience Action] calendar — pendiente Experience Studio", action);
  }
});
