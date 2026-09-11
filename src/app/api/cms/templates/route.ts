import { NextResponse } from "next/server";
import { getOperationalSiteConfig } from "@/lib/cms/config";
import {
  getTemplatesUncached,
  revalidateTemplatesCache,
  seedDefaultHomePage,
  seedTemplates,
} from "@/lib/cms/templates";
import { authorizeApiRead, authorizeApiWrite } from "@/lib/identity/api-guard";

export async function GET() {
  try {
    const denied = await authorizeApiRead("cms.pages.read");
    if (denied) return denied;
    const templates = await getTemplatesUncached();
    return NextResponse.json({ ok: true, templates });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/** Acción explícita: sembrar plantillas y home por defecto si falta. */
export async function POST() {
  try {
    const denied = await authorizeApiWrite("cms.pages.update", {
      action: "templates.seed",
      entity: "cms_templates",
    });
    if (denied) return denied;

    const templates = await seedTemplates();
    revalidateTemplatesCache();

    const config = await getOperationalSiteConfig();
    if (config) {
      await seedDefaultHomePage(
        config.institution.tenant,
        config.institution.name,
        config.seo.description
      );
    }

    return NextResponse.json({ ok: true, templates, seeded: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
