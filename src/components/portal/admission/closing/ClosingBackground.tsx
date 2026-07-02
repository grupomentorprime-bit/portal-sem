import type { AdmissionClosingBackdropData } from "@/types/admission-closing";
import { resolveMediaRef } from "@/core/media";
import { editorialPaths } from "@/lib/editorial/assets";
import { cn } from "@/lib/utils";

const EDITORIAL_FOOTER_FALLBACK = "/media/library/library-books/variants/w1920.jpg";

interface ClosingBackgroundStyle {
  className: string;
  style: React.CSSProperties;
}

export async function buildClosingBackgroundStyle(
  tenant: string,
  data?: AdmissionClosingBackdropData
): Promise<ClosingBackgroundStyle> {
  if (!data) {
    return { className: "admission-closing__editorial-bg", style: {} };
  }

  const style: React.CSSProperties = {
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };

  const className = cn(
    "admission-closing__editorial-bg",
    data.parallax && "admission-closing__editorial-bg--parallax",
    data.blur && "admission-closing__editorial-bg--blur"
  );

  if (data.mode === "gradient") {
    style.backgroundImage = `linear-gradient(135deg, ${data.gradientFrom ?? "var(--color-primary)"}, ${data.gradientTo ?? "var(--color-secondary)"})`;
  }

  if (data.mode === "image") {
    if (data.imageMediaId) {
      const image = await resolveMediaRef(tenant, { mediaId: data.imageMediaId }, "w1920");
      if (image) {
        style.backgroundImage = `url(${image})`;
      }
    } else if (data.pattern) {
      style.backgroundImage = `url(${data.pattern})`;
    } else {
      style.backgroundImage = `url(${EDITORIAL_FOOTER_FALLBACK})`;
    }
  }

  if (data.mode === "pattern" && data.pattern) {
    style.backgroundImage = `url(${data.pattern})`;
  } else if (data.mode === "pattern" && !data.pattern) {
    style.backgroundImage = `url(${editorialPaths.backgrounds.biblioteca})`;
  }

  if (data.mode === "texture" && data.texture) {
    style.backgroundImage = `url(${data.texture})`;
  }

  return { className, style };
}

export function ClosingBackgroundOverlay({ overlay }: { overlay: number }) {
  if (!overlay) return null;
  return (
    <div
      className="admission-closing__editorial-overlay"
      aria-hidden
      style={{ opacity: overlay / 100 }}
    />
  );
}
