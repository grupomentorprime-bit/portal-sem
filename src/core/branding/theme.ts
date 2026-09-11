import type { Branding } from "@/types/cms";
import { trimText } from "./display";

export type BrandThemeCssVars = {
  "--brand-primary"?: string;
  "--brand-secondary"?: string;
  "--brand-background"?: string;
  "--brand-text"?: string;
};

/**
 * Theme del Site activo → variables CSS existentes (`--brand-*`).
 * `design-tokens.css` las mapea a `--color-*` y alias `--sem-*`.
 * No inventa un sistema de tokens nuevo.
 */
export function buildBrandThemeStyle(
  branding: Pick<
    Branding,
    "primaryColor" | "secondaryColor" | "backgroundColor" | "textColor"
  > | null | undefined
): BrandThemeCssVars | undefined {
  if (!branding) return undefined;

  const primary = trimText(branding.primaryColor);
  const secondary = trimText(branding.secondaryColor);
  const background = trimText(branding.backgroundColor);
  const text = trimText(branding.textColor);

  if (!primary && !secondary && !background && !text) return undefined;

  const style: BrandThemeCssVars = {};
  if (primary) style["--brand-primary"] = primary;
  if (secondary) style["--brand-secondary"] = secondary;
  if (background) style["--brand-background"] = background;
  if (text) style["--brand-text"] = text;
  return style;
}
