import { registerExperienceActionHandler } from "../registry";

registerExperienceActionHandler("application", (action) => {
  if (action.type !== "application") return;
  if (process.env.NODE_ENV !== "production") {
    console.warn("[Experience Action] application — pendiente Experience Studio", action.programId);
  }
});

registerExperienceActionHandler("program", (action) => {
  if (action.type !== "program") return;
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[Experience Action] program "${action.programId}" — pendiente Experience Studio`
    );
  }
});

registerExperienceActionHandler("video", (action) => {
  if (action.type !== "video") return;
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[Experience Action] video "${action.videoId}" — pendiente Experience Studio`);
  }
});

registerExperienceActionHandler("workflow", (action) => {
  if (action.type !== "workflow") return;
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[Experience Action] workflow "${action.workflowId}" — pendiente Experience Studio`
    );
  }
});

registerExperienceActionHandler("api", (action) => {
  if (action.type !== "api") return;
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[Experience Action] api "${action.endpoint}" — pendiente Experience Studio`);
  }
});
