import type { Branding, SiteConfig } from "@/types/cms";

export interface ResolvedBrandingAssets {
  logo: string;
  secondaryLogo?: string;
  hero: string;
  favicon?: string;
  colors: Pick<Branding, "primaryColor" | "secondaryColor" | "backgroundColor" | "textColor">;
}

export interface BrandingResolverInput {
  config: SiteConfig;
}
