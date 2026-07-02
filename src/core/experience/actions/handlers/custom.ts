import { registerExperienceActionHandler } from "../registry";

registerExperienceActionHandler("custom", (action) => {
  if (action.type !== "custom") return;
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[Experience Action] custom handler "${action.handlerId}" — registrar implementación específica`,
      action.payload
    );
  }
});
