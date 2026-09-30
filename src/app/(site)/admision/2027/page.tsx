import { AdmissionCampaignPage } from "@/components/portal/admission/AdmissionCampaignPage";
import { getAdmissionConfig } from "@/lib/cms/admission-config";
import { getActivePortal } from "@/lib/portal/site";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getActivePortal();
  const config = ctx ? await getAdmissionConfig(ctx.tenant) : null;
  const heroSeo = config?.sectionSeo?.hero;
  return {
    title: heroSeo?.title ?? (ctx ? `Admisión 2027 | ${ctx.config.seo.title}` : "Admisión 2027"),
    description:
      heroSeo?.description ??
      config?.hero.description ??
      ctx?.config.seo.description ??
      "Admisión 2027",
  };
}

export default function Admision2027Page() {
  return <AdmissionCampaignPage />;
}
