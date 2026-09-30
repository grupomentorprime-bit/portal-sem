/**
 * Integración pública SEM: CMS anidado, menú padre/hijo y respaldos.
 * No toca datos ni el Espacio ADL.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { toGrowthAdmissionInput } from "../../src/core/growth/ingest-map";
import { ADL_TENANT_ID, SEM_TENANT_ID } from "../../src/core/tenant/constants";
import {
  SEM_ADMISSION_2027_CAMPAIGN,
  SEM_THEOLOGICAL_PROGRAM_ID,
  SEM_THEOLOGICAL_PROGRAM_LABEL,
  resolveSemAdmission2027Interest,
} from "../../src/lib/portal/admission-campaign-interest";
import { resolveNavigation } from "../../src/core/navigation";
import {
  isDisallowedCmsSlug,
  isReservedPublicPath,
  parsePublicCmsSegments,
} from "../../src/core/portal/public-cms-path";
import { validatePageCreate } from "../../src/lib/cms/page-validation";
import { SEM_DEFAULT_MENUS, getDefaultMenusForTenant } from "../../src/lib/cms/menu-defaults";
import { resolveFooterContent, SEM_FOOTER_COLUMNS } from "../../src/lib/portal/footer-content";
import { resolvePublicHeader, SEM_PUBLIC_NAV } from "../../src/lib/portal/public-nav";
import { semInstitutionalDrafts } from "../../src/lib/portal/sem-institutional-drafts";
import { SEM_CANONICAL_REDIRECTS } from "../../src/lib/portal/sem-legacy-redirects";
import { semEditorialPage } from "../../src/lib/portal/sem-identity-v7";
import { getSemPreparedPage } from "../../src/lib/portal/sem-prepared-pages";
import {
  groupTheologicalCohorts,
  listFormationCourses,
  listTheologicalCohortLinks,
  theologicalCohortYear,
} from "../../src/lib/portal/theological-cohorts";
import type { PortalFooterPremiumViewModel } from "../../src/types/footer-premium";

function pageCreate(slug: string) {
  return validatePageCreate({
    _id: "pagina-prueba",
    tenant: SEM_TENANT_ID,
    title: "Página",
    slug,
    template: "institutional",
  });
}

function emptyFooter(): PortalFooterPremiumViewModel {
  return {
    settings: {
      showDescription: true,
      showNavigation: true,
      showContact: true,
      showSocial: true,
      showLegal: true,
      showNewsletter: false,
      showCertifications: false,
    },
    brand: { institutionName: "", institutionShortName: "", logoPrimary: "" },
    navigation: [],
    contact: null,
    social: [],
    legal: [],
    copyright: "",
    backToTopLabel: "Volver arriba",
  };
}

describe("SEM — slugs CMS y rutas reservadas", () => {
  it("resuelve slugs anidados y rechaza rutas de plataforma", () => {
    assert.deepEqual(parsePublicCmsSegments(["el-sem", "quienes-somos"]), {
      ok: true,
      slug: "/el-sem/quienes-somos",
    });
    assert.deepEqual(parsePublicCmsSegments(["formacion", "educacion-teologica"]), {
      ok: true,
      slug: "/formacion/educacion-teologica",
    });
    assert.equal(parsePublicCmsSegments(["admin"]).ok, false);
    assert.equal(parsePublicCmsSegments(["api", "admission", "apply"]).ok, false);
    assert.equal(parsePublicCmsSegments(["ingresar"]).ok, false);
    assert.equal(parsePublicCmsSegments(["programas", "g-2024"]).ok, false);
    assert.equal(parsePublicCmsSegments(["admision", "2027"]).ok, false);
    assert.equal(parsePublicCmsSegments(["..", "admin"]).reason, "invalid");
    assert.equal(isReservedPublicPath("/programas"), true);
    assert.equal(isDisallowedCmsSlug("/el-sem/historia"), false);
    assert.equal(isDisallowedCmsSlug("/admision"), false);
  });

  it("Sitio web > Páginas acepta el árbol y bloquea slugs reservados", () => {
    assert.equal(pageCreate("/el-sem/mision-vision-proposito").length, 0);
    assert.equal(pageCreate("/formacion/cursos").length, 0);
    assert.equal(pageCreate("/admision").length, 0);
    for (const slug of ["/admin", "/api", "/ingresar", "/programas", "/programas/g-2023", "/admision/2027"]) {
      const errors = pageCreate(slug);
      assert.ok(errors.some((error) => error.field === "slug"), slug);
    }
  });

  it("prepara el árbol SEM sin preparar esas rutas para ADL", () => {
    assert.ok(getSemPreparedPage("/el-sem/directivos"));
    assert.ok(getSemPreparedPage("/formacion/educacion-teologica"));
    assert.equal(semEditorialPage("/el-sem", ADL_TENANT_ID), null);
    assert.equal(semEditorialPage("/como-estudiamos", ADL_TENANT_ID), null);
    assert.equal(semEditorialPage("/el-sem", SEM_TENANT_ID)?.slug, "/el-sem");
    assert.equal(semEditorialPage("/formacion/malla", SEM_TENANT_ID)?.slug, "/formacion/malla");
  });
});

describe("SEM — borradores y redirects canónicos", () => {
  it("crea el árbol en borrador y solo copia las páginas con texto validado", () => {
    const drafts = semInstitutionalDrafts();
    const bySlug = new Map(drafts.map((page) => [page.slug, page]));
    for (const slug of [
      "/el-sem",
      "/el-sem/quienes-somos",
      "/el-sem/historia",
      "/el-sem/mision-vision-proposito",
      "/el-sem/directivos",
      "/el-sem/equipo-academico",
      "/el-sem/ipn-chile",
      "/formacion",
      "/formacion/educacion-teologica",
      "/formacion/cursos",
      "/formacion/malla",
      "/como-estudiamos",
      "/admision",
      "/contacto",
    ]) {
      assert.ok(bySlug.has(slug), slug);
    }
    assert.equal(bySlug.get("/el-sem")?.blocks.length, 2);
    assert.equal(bySlug.get("/como-estudiamos")?.blocks.length, 2);
    assert.equal(bySlug.get("/formacion/malla")?.blocks.length, 2);
    assert.equal(bySlug.get("/el-sem/directivos")?.blocks.length, 0);
    assert.equal(bySlug.get("/el-sem/equipo-academico")?.blocks.length, 0);
    assert.equal(bySlug.get("/formacion/cursos")?.blocks.length, 0);
    assert.equal(JSON.stringify(drafts).includes("/programas"), false);
    assert.equal(JSON.stringify(drafts).includes("team_directivos"), false);
    assert.deepEqual(SEM_CANONICAL_REDIRECTS, {
      "/institucion": "/el-sem",
      "/como-se-estudia": "/como-estudiamos",
      "/malla": "/formacion/malla",
    });
  });
});

describe("SEM — menú padre/hijo", () => {
  it("el fallback SEM tiene submenús y deja programas y contacto fuera", () => {
    const elSem = SEM_PUBLIC_NAV.find((link) => link.href === "/el-sem");
    const formacion = SEM_PUBLIC_NAV.find((link) => link.href === "/formacion");
    assert.ok(elSem && (elSem.children?.length ?? 0) >= 6);
    assert.ok(formacion && (formacion.children?.length ?? 0) >= 3);
    assert.equal(SEM_PUBLIC_NAV.some((link) => link.href === "/programas"), false);
    assert.equal(SEM_PUBLIC_NAV.some((link) => link.href === "/contacto"), false);
    const contact = SEM_DEFAULT_MENUS.find((menu) => menu._id === "main")?.items.find(
      (item) => item.slug === "/contacto"
    );
    assert.equal(contact?.title, "Contacto");
    assert.equal(contact?.visible, false);
    const login = SEM_DEFAULT_MENUS.find((menu) => menu._id === "quick-links")?.items.find(
      (item) => item.slug === "/ingresar"
    );
    assert.equal(login?.title, "Ingresar");
    assert.equal(login?.highlighted, false);

    const published = resolvePublicHeader(
      [
        { label: "Inicio", href: "/" },
        { label: "Programas", href: "/programas" },
        { label: "Contacto", href: "/contacto" },
        {
          label: "El SEM",
          href: "/el-sem",
          children: [{ label: "Historia", href: "/el-sem/historia" }],
        },
      ],
      SEM_TENANT_ID
    );
    assert.equal(published.some((link) => link.href === "/programas"), false);
    assert.equal(published.some((link) => link.href === "/contacto"), false);
    assert.equal(published.find((link) => link.href === "/el-sem")?.children?.[0]?.href, "/el-sem/historia");
  });

  it("un menú CMS publicado reemplaza el fallback y ADL no hereda el árbol SEM", () => {
    const cms = resolvePublicHeader([{ label: "Inicio", href: "/" }, { label: "Aula", href: "/aula" }], SEM_TENANT_ID);
    assert.deepEqual(cms.map((link) => link.href), ["/", "/aula"]);

    const adl = resolvePublicHeader([], ADL_TENANT_ID);
    assert.equal(adl.some((link) => link.href.startsWith("/el-sem")), false);
    assert.equal(getDefaultMenusForTenant(ADL_TENANT_ID).some((menu) => JSON.stringify(menu).includes("/el-sem")), false);
    assert.equal(JSON.stringify(SEM_DEFAULT_MENUS).includes("/programas"), false);
  });

  it("resolveNavigation conserva padre e hijo", () => {
    const main = SEM_DEFAULT_MENUS.find((menu) => menu._id === "main");
    const nav = resolveNavigation({ header: main?.items ?? [], mobile: main?.items ?? [] });
    assert.ok((nav.header.find((link) => link.label === "Formación")?.children?.length ?? 0) >= 3);
    assert.equal(nav.mobile.find((link) => link.label === "Formación")?.children?.[0]?.href, "/formacion/educacion-teologica");
    assert.equal(
      resolveNavigation({
        quickLinks: SEM_DEFAULT_MENUS.find((menu) => menu._id === "quick-links")?.items,
      }).quickLinks.find((link) => link.highlighted)?.href,
      "/admision/2027"
    );
  });
});

describe("SEM — cohortes, pie y admisión", () => {
  it("agrupa G-2023…G-2026 sin mutar el catálogo ni inventar G-2027", () => {
    const catalog = [
      { id: "p1", title: "Diploma G-2026", href: "/programas/g-2026" },
      { id: "p2", title: "Curso breve 2024", href: "/programas/curso-2024", category: "curso" },
      { id: "p3", title: "Generación 2023", href: "/programas/generacion-2023" },
      { id: "p4", title: "G-2027", href: "/programas/g-2027" },
      { id: "p5", title: "G-2024", href: "/programas/g-2024" },
      { id: "p6", title: "G-2025", href: "/programas/g-2025" },
    ];
    const snapshot = catalog.map((item) => item.id).join(",");
    const cohorts = groupTheologicalCohorts(catalog);
    assert.deepEqual(cohorts.map((item) => theologicalCohortYear(item)), [2023, 2024, 2025, 2026]);
    assert.equal(listFormationCourses(catalog).map((item) => item.id).join(","), "p2");
    assert.equal(catalog.map((item) => item.id).join(","), snapshot);
    assert.equal(theologicalCohortYear({ id: "x", title: "G-2027", href: "/programas/g-2027" }), null);

    const links = listTheologicalCohortLinks([
      ...catalog,
      { id: "dup", title: "Diploma en Teología Bíblica Pastoral — G-2023", href: "/programas/otro-g-2023" },
    ]);
    assert.deepEqual(
      links.map((link) => link.label),
      ["G-2023", "G-2024", "G-2025", "G-2026"]
    );
    assert.deepEqual(
      links.map((link) => link.href),
      [
        "/programas/otro-g-2023",
        "/programas/g-2024",
        "/programas/g-2025",
        "/programas/g-2026",
      ]
    );
    assert.equal(links.some((link) => link.label.includes("2027") || link.href?.includes("2027")), false);
    assert.equal(links.some((link) => /diploma|certific/i.test(link.label)), false);
  });

  it("el pie SEM es respaldo cuando el menú CMS ya trae columnas", () => {
    const fallback = resolveFooterContent(emptyFooter(), { tenantId: SEM_TENANT_ID });
    assert.equal(fallback.navigation[0]?.links[0]?.action.type === "url" && fallback.navigation[0].links[0].action.href, "/el-sem/quienes-somos");
    assert.equal(JSON.stringify(SEM_FOOTER_COLUMNS).includes("/programas"), false);

    const withCms = resolveFooterContent(
      {
        ...emptyFooter(),
        navigation: [
          {
            id: "cms",
            title: "CMS",
            links: [{ id: "a", label: "Historia", action: { type: "url", href: "/el-sem/historia" } }],
          },
        ],
      },
      { tenantId: SEM_TENANT_ID }
    );
    assert.equal(withCms.navigation.length, 1);
    assert.equal(withCms.navigation[0]?.title, "CMS");

    const adl = resolveFooterContent(emptyFooter(), { tenantId: ADL_TENANT_ID });
    assert.equal(adl.navigation.length, 0);
    assert.equal(adl.contact.pendingNote, undefined);
    assert.doesNotMatch(JSON.stringify(adl), /El SEM|IPN Chile|datos oficiales de contacto/);
    assert.match(fallback.contact.pendingNote ?? "", /validados institucionalmente/);
  });

  it("la home publicada no pasa por el fallback y la campaña vive en /admision/2027", () => {
    const home = readFileSync(resolve("src/core/portal/renderer/load-page.ts"), "utf8");
    assert.match(home, /published\?\.blocks\?\.length/);
    assert.match(home, /applySemPublicHome/);

    const admission = readFileSync(resolve("src/app/(site)/admision/page.tsx"), "utf8");
    const campaign = readFileSync(resolve("src/app/(site)/admision/2027/page.tsx"), "utf8");
    const form = readFileSync(resolve("src/components/portal/admission/AdmissionCampaignPage.tsx"), "utf8");
    const apply = readFileSync(resolve("src/app/api/admission/apply/route.ts"), "utf8");
    const growth = readFileSync(resolve("src/core/admission/interesado-repository.ts"), "utf8");
    assert.match(admission, /SemPreparedPublicPage|PortalCmsPage/);
    assert.doesNotMatch(admission, /AdmissionCampaignPage/);
    assert.match(campaign, /AdmissionCampaignPage/);
    assert.match(form, /AdmissionForm/);
    assert.match(apply, /createInteresadoFromApplication/);
    assert.match(growth, /ingestInteresadoToGrowthSafe/);
    assert.match(form, /SEM_THEOLOGICAL_PROGRAM_ID/);
    assert.match(apply, /resolveSemAdmission2027Interest/);
  });

  it("una entrada de admisión 2027 no queda como interés en una cohorte", () => {
    const interest = resolveSemAdmission2027Interest({
      tenantId: SEM_TENANT_ID,
      campaign: SEM_ADMISSION_2027_CAMPAIGN,
    });
    assert.equal(interest?.programId, SEM_THEOLOGICAL_PROGRAM_ID);
    assert.equal(interest?.programLabel, SEM_THEOLOGICAL_PROGRAM_LABEL);
    assert.equal(interest?.lineLabel, "Educación Teológica");
    assert.equal(
      resolveSemAdmission2027Interest({
        tenantId: SEM_TENANT_ID,
        campaign: "G-2025",
      }),
      null
    );
    assert.equal(
      resolveSemAdmission2027Interest({
        tenantId: ADL_TENANT_ID,
        campaign: SEM_ADMISSION_2027_CAMPAIGN,
      }),
      null
    );

    const projected = toGrowthAdmissionInput({
      _id: "interesado-prueba",
      tenant: SEM_TENANT_ID,
      firstName: "Prueba",
      lastName: "Corte",
      email: "prueba@example.com",
      phone: "+56900000000",
      programId: "diploma-en-teologia-biblica-pastoral",
      programLabel: "Diploma en Teologia Biblica / G-2025",
    });
    assert.equal(projected.programId, "diploma-en-teologia-biblica-pastoral");
    assert.equal(projected.campaign, undefined);

    const campaign = toGrowthAdmissionInput({
      ...{
        _id: "interesado-2027",
        tenant: SEM_TENANT_ID,
        firstName: "Prueba",
        lastName: "Corte",
        email: "prueba@example.com",
        phone: "+56900000000",
        programId: SEM_THEOLOGICAL_PROGRAM_ID,
        programLabel: SEM_THEOLOGICAL_PROGRAM_LABEL,
      },
    });
    assert.equal(campaign.programId, SEM_THEOLOGICAL_PROGRAM_ID);
    assert.equal(campaign.programLabel, SEM_THEOLOGICAL_PROGRAM_LABEL);
    assert.equal(campaign.campaign, SEM_ADMISSION_2027_CAMPAIGN);
    assert.doesNotMatch(campaign.programLabel ?? "", /G-2025|G-2027/);
  });
});
