import { registerExperienceActionHandler } from "../registry";

registerExperienceActionHandler("whatsapp", (action) => {
  if (action.type !== "whatsapp") return;
  const digits = action.phone.replace(/\D/g, "");
  const query = action.message ? `?text=${encodeURIComponent(action.message)}` : "";
  window.open(`https://wa.me/${digits}${query}`, "_blank", "noopener,noreferrer");
});
