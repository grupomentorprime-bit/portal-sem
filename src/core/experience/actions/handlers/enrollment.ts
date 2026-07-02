import { registerExperienceActionHandler } from "../registry";

registerExperienceActionHandler("enrollment", (action) => {
  if (action.type !== "enrollment") return;
  if (process.env.NODE_ENV !== "production") {
    console.warn("[Experience Action] enrollment — pendiente Experience Studio", action.programId);
  }
});
