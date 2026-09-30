# Sitio público en código — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cada espacio nace sin publicar y muestra «Este sitio está por comenzar» hasta que Ajustes del sitio active Publicar sitio; un sitio publicado se sirve desde código y sus formularios entran a Formularios y a Personas.

**Architecture:** Un resolvedor puro decide portada de plataforma, página de inicio o página de código. El layout de `(site)` obedece esa decisión y deja de renderizar el portal CMS. `sitePublished` vive en `SiteConfig` y falta significa `false`. La carpeta `src/sites/<tenantId>/` no se crea en este corte; un registro vacío permite que las pruebas inyecten un sitio ficticio. Los formularios de ese registro se sincronizan a `experience_forms` y se envían con `submitExperienceForm`.

**Tech Stack:** Next.js 16, React 19, TypeScript, MongoDB, `node:test` + `tsx --test`.

## Global Constraints

- El texto público exacto es `Este sitio está por comenzar`.
- `sitePublished` ausente se trata como `false`. Todos los espacios, incluidos los que ya están en línea, quedan sin publicar.
- `institution.status` no elige la página pública. El único interruptor es Publicar sitio.
- Publicar sin carpeta de sitio sigue mostrando la página de inicio.
- `/admin` y `/api` no pasan por el resolvedor público. Las pantallas retiradas de Páginas, Menús, Autoridades, Programas, Cursos, Comunicaciones y Medios dejan de abrir el editor, en el menú y en su URL, para todos los espacios.
- Siguen Formularios, Dominio, Ajustes del sitio, Identidad visual, el centro de admisión, la operación de formularios, Personas y el resto de Growth.
- El destino de un formulario de código solo puede ser `contact`, `information_request` o `event_registration`.
- El código manda sobre nombre, campos, destino y mensajes. Las respuestas guardadas no se tocan. Un id que desaparece de la carpeta se archiva.
- Este corte no agrega la carpeta de ningún espacio real, no escribe páginas reales y no borra el código viejo del editor.
- Los campos que crean persona se llaman `email` y `phone`, porque `extractGrowthContactFromFormData` lee esas claves.

## File structure

- `src/types/cms.ts` — `sitePublished` en `SiteConfig`.
- `src/lib/cms/defaults.ts` — default `false`.
- `src/lib/cms/normalize.ts` — ausente → `false`.
- `src/core/tenant/types.ts` y `src/core/tenant/site-config-mirror.ts` — el flag sobrevive al espejo `site_config`.
- `src/sites/public-decision.ts` — `decidePublicSite` y `comingSoonModel`.
- `src/sites/types.ts` — contrato de sitio y formulario.
- `src/sites/registry.ts` — registro en memoria, vacío en producción.
- `src/sites/sync-forms.ts` — sincroniza y archiva formularios de código.
- `src/sites/submit-coded-form.ts` — valida y llama `submitExperienceForm`.
- `src/components/sites/ComingSoonPage.tsx` — página de inicio.
- `src/components/sites/CodedSiteView.tsx` — página registrada (título y menú) hasta que exista un sitio real.
- `src/app/(site)/layout.tsx` — aplica la decisión y sincroniza formularios.
- `src/components/config/ConfigurationHub.tsx` — control Publicar sitio.
- `src/lib/admin/retired-site-admin.ts` — URLs que ya no abren el editor.
- `src/lib/admin/nav-domains.ts` — saca esas entradas del menú.
- Páginas de admin retiradas — `notFound()`.
- Tests en `tests/baseline/coded-site-*.test.ts`.

---

### Task 1: Flag `sitePublished`

**Files:**
- Modify: `src/types/cms.ts`
- Modify: `src/lib/cms/defaults.ts`
- Modify: `src/lib/cms/normalize.ts`
- Modify: `src/core/tenant/types.ts`
- Modify: `src/core/tenant/site-config-mirror.ts`
- Test: `tests/baseline/coded-site-publish-flag.test.ts`

**Interfaces:**
- Consumes: `SiteConfig`, `normalizeSiteConfig`, `createDefaultSiteConfig`.
- Produces: `SiteConfig.sitePublished: boolean`. `normalizeSiteConfig` devuelve `false` si el campo falta o no es `true`.

- [ ] **Step 1: Write the failing test**

Crear `tests/baseline/coded-site-publish-flag.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDefaultSiteConfig } from "../../src/lib/cms/defaults";
import { normalizeSiteConfig } from "../../src/lib/cms/normalize";
import { SITE_CONFIG_ID } from "../../src/types/cms";

describe("sitePublished", () => {
  it("default de un sitio nuevo es false", () => {
    assert.equal(createDefaultSiteConfig().sitePublished, false);
  });

  it("un documento sin el campo queda sin publicar", () => {
    const config = normalizeSiteConfig({
      _id: SITE_CONFIG_ID,
      institution: { name: "SEM", shortName: "SEM", tenant: "sem", status: "active" },
    });
    assert.ok(config);
    assert.equal(config.sitePublished, false);
  });

  it("solo true explícito publica", () => {
    const published = normalizeSiteConfig({
      _id: SITE_CONFIG_ID,
      sitePublished: true,
      institution: { name: "SEM", shortName: "SEM", tenant: "sem", status: "active" },
    });
    const inactive = normalizeSiteConfig({
      _id: SITE_CONFIG_ID,
      sitePublished: true,
      institution: { name: "SEM", shortName: "SEM", tenant: "sem", status: "inactive" },
    });
    assert.equal(published?.sitePublished, true);
    assert.equal(inactive?.sitePublished, true);
    assert.equal(inactive?.institution.status, "inactive");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/coded-site-publish-flag.test.ts`

Expected: FAIL porque `sitePublished` no existe.

- [ ] **Step 3: Write minimal implementation**

En `src/types/cms.ts`, dentro de `SiteConfig`, después de `features`:

```ts
  /** false o ausente: el dominio muestra «Este sitio está por comenzar». */
  sitePublished: boolean;
```

En el objeto que retorna `createDefaultSiteConfig`, después de `features`:

```ts
    sitePublished: false,
```

En el objeto que retorna `normalizeSiteConfig`, después de `features`:

```ts
    sitePublished: raw.sitePublished === true,
```

En `SiteConfigDocument` (`src/core/tenant/types.ts`), después de `features`:

```ts
  sitePublished?: boolean;
```

En `mirrorLegacyConfigToSiteConfig`, dentro de `document`, después de `features: config.features,`:

```ts
    sitePublished: config.sitePublished === true,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/coded-site-publish-flag.test.ts`

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/types/cms.ts src/lib/cms/defaults.ts src/lib/cms/normalize.ts src/core/tenant/types.ts src/core/tenant/site-config-mirror.ts tests/baseline/coded-site-publish-flag.test.ts
git commit -m "feat: default public sites to unpublished"
```

---

### Task 2: Decisión pública y modelo de «por comenzar»

**Files:**
- Create: `src/sites/public-decision.ts`
- Test: `tests/baseline/coded-site-public.test.ts`

**Interfaces:**
- Consumes: `ContactInfo`, `SocialLinks` de `src/types/cms.ts`.
- Produces:

```ts
export type PublicSiteDecision =
  | { kind: "platform" }
  | { kind: "coming-soon" }
  | { kind: "page"; path: string }
  | { kind: "not-found" };

export function decidePublicSite(input: {
  hasTenant: boolean;
  sitePublished: boolean;
  hasSiteModule: boolean;
  pathname: string;
  registeredPaths: string[];
}): PublicSiteDecision;

export interface ComingSoonLine {
  label: string;
  value: string;
  href?: string;
}

export interface ComingSoonModel {
  institutionName: string;
  message: "Este sitio está por comenzar";
  lines: ComingSoonLine[];
}

export function comingSoonModel(input: {
  institutionName: string;
  contact: ContactInfo;
  social: SocialLinks;
}): ComingSoonModel;
```

- [ ] **Step 1: Write the failing test**

Crear `tests/baseline/coded-site-public.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { comingSoonModel, decidePublicSite } from "../../src/sites/public-decision";
import type { ContactInfo, SocialLinks } from "../../src/types/cms";

const emptyContact: ContactInfo = {
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  city: "",
  country: "",
  hours: "",
};

const emptySocial: SocialLinks = {
  facebook: "",
  instagram: "",
  youtube: "",
  linkedin: "",
  tiktok: "",
  spotify: "",
};

describe("decidePublicSite", () => {
  it("sin espacio muestra la portada de la plataforma", () => {
    assert.deepEqual(
      decidePublicSite({
        hasTenant: false,
        sitePublished: true,
        hasSiteModule: true,
        pathname: "/contacto",
        registeredPaths: ["/"],
      }),
      { kind: "platform" }
    );
  });

  it("sin publicar muestra por comenzar en cualquier ruta", () => {
    assert.equal(
      decidePublicSite({
        hasTenant: true,
        sitePublished: false,
        hasSiteModule: true,
        pathname: "/noticias",
        registeredPaths: ["/"],
      }).kind,
      "coming-soon"
    );
  });

  it("publicado sin carpeta sigue en por comenzar", () => {
    assert.equal(
      decidePublicSite({
        hasTenant: true,
        sitePublished: true,
        hasSiteModule: false,
        pathname: "/",
        registeredPaths: [],
      }).kind,
      "coming-soon"
    );
  });

  it("publicado con carpeta abre la ruta registrada y 404 en el resto", () => {
    assert.deepEqual(
      decidePublicSite({
        hasTenant: true,
        sitePublished: true,
        hasSiteModule: true,
        pathname: "/",
        registeredPaths: ["/", "/contacto"],
      }),
      { kind: "page", path: "/" }
    );
    assert.deepEqual(
      decidePublicSite({
        hasTenant: true,
        sitePublished: true,
        hasSiteModule: true,
        pathname: "/contacto/",
        registeredPaths: ["/", "/contacto"],
      }),
      { kind: "page", path: "/contacto" }
    );
    assert.equal(
      decidePublicSite({
        hasTenant: true,
        sitePublished: true,
        hasSiteModule: true,
        pathname: "/admision",
        registeredPaths: ["/", "/contacto"],
      }).kind,
      "not-found"
    );
  });
});

describe("comingSoonModel", () => {
  it("usa el texto exacto y omite campos vacíos", () => {
    const model = comingSoonModel({
      institutionName: "Seminario",
      contact: { ...emptyContact, email: "hola@sem.cl", phone: " " },
      social: { ...emptySocial, instagram: "https://instagram.com/sem" },
    });
    assert.equal(model.institutionName, "Seminario");
    assert.equal(model.message, "Este sitio está por comenzar");
    assert.deepEqual(
      model.lines.map((line) => line.label),
      ["Correo", "Instagram"]
    );
  });

  it("sin contacto deja solo el nombre y la frase", () => {
    const model = comingSoonModel({
      institutionName: "Seminario",
      contact: emptyContact,
      social: emptySocial,
    });
    assert.deepEqual(model.lines, []);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/coded-site-public.test.ts`

Expected: FAIL con error de módulo no encontrado.

- [ ] **Step 3: Write minimal implementation**

Crear `src/sites/public-decision.ts`:

```ts
import type { ContactInfo, SocialLinks } from "@/types/cms";

export type PublicSiteDecision =
  | { kind: "platform" }
  | { kind: "coming-soon" }
  | { kind: "page"; path: string }
  | { kind: "not-found" };

function normalizePublicPath(pathname: string): string {
  const path = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}

export function decidePublicSite(input: {
  hasTenant: boolean;
  sitePublished: boolean;
  hasSiteModule: boolean;
  pathname: string;
  registeredPaths: string[];
}): PublicSiteDecision {
  if (!input.hasTenant) return { kind: "platform" };
  if (!input.sitePublished || !input.hasSiteModule) return { kind: "coming-soon" };

  const path = normalizePublicPath(input.pathname);
  const registered = new Set(input.registeredPaths.map(normalizePublicPath));
  if (registered.has(path)) return { kind: "page", path };
  return { kind: "not-found" };
}

export interface ComingSoonLine {
  label: string;
  value: string;
  href?: string;
}

export interface ComingSoonModel {
  institutionName: string;
  message: "Este sitio está por comenzar";
  lines: ComingSoonLine[];
}

function line(label: string, value: string, href?: string): ComingSoonLine | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return href ? { label, value: trimmed, href } : { label, value: trimmed };
}

export function comingSoonModel(input: {
  institutionName: string;
  contact: ContactInfo;
  social: SocialLinks;
}): ComingSoonModel {
  const { contact, social } = input;
  const lines = [
    line("Correo", contact.email, contact.email.trim() ? `mailto:${contact.email.trim()}` : undefined),
    line("Teléfono", contact.phone, contact.phone.trim() ? `tel:${contact.phone.trim()}` : undefined),
    line("WhatsApp", contact.whatsapp),
    line("Dirección", contact.address),
    line("Ciudad", contact.city),
    line("País", contact.country),
    line("Horario", contact.hours),
    line("Facebook", social.facebook, social.facebook.trim()),
    line("Instagram", social.instagram, social.instagram.trim()),
    line("YouTube", social.youtube, social.youtube.trim()),
    line("LinkedIn", social.linkedin, social.linkedin.trim()),
    line("TikTok", social.tiktok, social.tiktok.trim()),
    line("Spotify", social.spotify, social.spotify.trim()),
  ].filter((item): item is ComingSoonLine => item !== null);

  return {
    institutionName: input.institutionName.trim(),
    message: "Este sitio está por comenzar",
    lines,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/coded-site-public.test.ts`

Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/sites/public-decision.ts tests/baseline/coded-site-public.test.ts
git commit -m "feat: decide coming soon versus a coded public site"
```

---

### Task 3: Mostrar «por comenzar» en el sitio público

**Files:**
- Create: `src/components/sites/ComingSoonPage.tsx`
- Create: `src/components/sites/CodedSiteView.tsx`
- Create: `src/sites/registry.ts`
- Create: `src/sites/types.ts`
- Modify: `src/app/(site)/layout.tsx`
- Test: `tests/baseline/coded-site-layout.test.ts`

**Interfaces:**
- Consumes: `comingSoonModel`, `decidePublicSite`, `getPortalContext`.
- Produces: el layout de `(site)` no renderiza `children` de un espacio sin publicar o sin módulo. Renderiza `ComingSoonPage`.

- [ ] **Step 1: Write the failing test**

Crear `tests/baseline/coded-site-layout.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const layout = readFileSync("src/app/(site)/layout.tsx", "utf8");

describe("site layout gate", () => {
  it("decide la página pública y muestra por comenzar", () => {
    assert.match(layout, /decidePublicSite/);
    assert.match(layout, /ComingSoonPage/);
    assert.match(layout, /comingSoonModel/);
    assert.doesNotMatch(layout, /institution\.status/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/coded-site-layout.test.ts`

Expected: FAIL porque el layout no menciona `decidePublicSite`.

- [ ] **Step 3: Write minimal implementation**

Crear `src/components/sites/ComingSoonPage.tsx`:

```tsx
import type { ComingSoonModel } from "@/sites/public-decision";

export function ComingSoonPage({ model }: { model: ComingSoonModel }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
      {model.institutionName ? (
        <h1 className="text-3xl font-semibold text-foreground">{model.institutionName}</h1>
      ) : null}
      <p className={model.institutionName ? "mt-4 text-lg text-muted" : "text-lg text-muted"}>
        {model.message}
      </p>
      {model.lines.length > 0 ? (
        <ul className="mt-8 space-y-2 text-sm text-foreground">
          {model.lines.map((item) => (
            <li key={item.label}>
              <span className="text-muted">{item.label}: </span>
              {item.href ? (
                <a href={item.href} className="underline">
                  {item.value}
                </a>
              ) : (
                item.value
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
```

Reemplazar `src/app/(site)/layout.tsx` por:

```tsx
import { ComingSoonPage } from "@/components/sites/ComingSoonPage";
import { CodedSiteView } from "@/components/sites/CodedSiteView";
import { getPortalContext } from "@/lib/portal/site";
import { comingSoonModel, decidePublicSite } from "@/sites/public-decision";
import { getCodedSite } from "@/sites/registry";
import {
  resolveRequestHost,
  shouldEnterPlatformHome,
} from "@/core/tenant/hosts";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const host = resolveRequestHost(headerList);
  const pathname = headerList.get("x-pathname") ?? "/";
  const ctx = await getPortalContext();

  if (shouldEnterPlatformHome(host, Boolean(ctx))) {
    if (pathname !== "/" && pathname !== "") {
      redirect("/");
    }
    return children;
  }

  if (!ctx) {
    return children;
  }

  const site = getCodedSite(ctx.tenant);
  const decision = decidePublicSite({
    hasTenant: true,
    sitePublished: ctx.config.sitePublished === true,
    hasSiteModule: Boolean(site),
    pathname,
    registeredPaths: site?.pages.map((page) => page.path) ?? [],
  });

  if (decision.kind === "coming-soon") {
    return (
      <ComingSoonPage
        model={comingSoonModel({
          institutionName: ctx.config.institution.name,
          contact: ctx.config.contact,
          social: ctx.config.social,
        })}
      />
    );
  }

  if (decision.kind === "not-found") {
    notFound();
  }

  if (decision.kind === "page" && site) {
    return (
      <CodedSiteView
        site={site}
        path={decision.path}
        institutionName={ctx.config.institution.name}
        contact={ctx.config.contact}
        social={ctx.config.social}
      />
    );
  }

  notFound();
}
```

Un espacio con tenant no vuelve al portal CMS. Si la decisión no es portada, inicio o página registrada, `notFound()`. El subdominio y el dominio propio pasan por `getPortalContext`, así que los dos muestran la misma decisión.

Crear `src/components/sites/CodedSiteView.tsx`:

```tsx
import type { ContactInfo, SocialLinks } from "@/types/cms";
import type { CodedSite } from "@/sites/types";

export function CodedSiteView({
  site,
  path,
  institutionName,
  contact,
  social,
}: {
  site: CodedSite;
  path: string;
  institutionName: string;
  contact: ContactInfo;
  social: SocialLinks;
}) {
  const page = site.pages.find((item) => item.path === path);
  if (!page) return null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm text-muted">{institutionName}</p>
      <nav className="mt-4 flex gap-4 text-sm">
        {site.pages.map((item) => (
          <a key={item.path} href={item.path}>
            {item.navLabel}
          </a>
        ))}
      </nav>
      <h1 className="mt-8 text-3xl font-semibold">{page.title}</h1>
      <p className="mt-4 text-sm text-muted">{contact.email || social.instagram || ""}</p>
    </main>
  );
}
```

Crear `src/sites/registry.ts`:

```ts
import type { CodedSite } from "@/sites/types";

const sites = new Map<string, CodedSite>();

export function getCodedSite(tenantId: string): CodedSite | undefined {
  return sites.get(tenantId);
}

export function registerCodedSite(site: CodedSite): void {
  sites.set(site.tenantId, site);
}

export function clearCodedSites(): void {
  sites.clear();
}
```

Crear `src/sites/types.ts`:

```ts
import type { ExperienceFormField } from "@/types/experience-forms";

export const CODED_FORM_DESTINATIONS = [
  "contact",
  "information_request",
  "event_registration",
] as const;

export type CodedFormDestination = (typeof CODED_FORM_DESTINATIONS)[number];

export interface CodedSiteFormDeclaration {
  _id: string;
  name: string;
  description?: string;
  successMessage: string;
  errorMessage: string;
  destination: CodedFormDestination;
  fields: ExperienceFormField[];
}

export interface CodedSitePage {
  path: string;
  title: string;
  navLabel: string;
}

export interface CodedSite {
  tenantId: string;
  pages: CodedSitePage[];
  forms: CodedSiteFormDeclaration[];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/coded-site-layout.test.ts`

Expected: PASS, 1 test.

- [ ] **Step 5: Commit**

```bash
git add src/components/sites/ComingSoonPage.tsx src/components/sites/CodedSiteView.tsx src/sites/registry.ts src/sites/types.ts src/app/(site)/layout.tsx tests/baseline/coded-site-layout.test.ts
git commit -m "feat: show coming soon until a coded site is published"
```

---

### Task 4: Registro del sitio en código

**Files:**
- Modify: `src/components/sites/CodedSiteView.tsx`
- Modify: `src/sites/registry.ts` (ya creado en Task 3)
- Test: `tests/baseline/coded-site-registry.test.ts`

**Interfaces:**
- Consumes: `CodedSite` de `src/sites/types.ts`, `registerCodedSite`, `getCodedSite`, `clearCodedSites`.
- Produces: `CodedSiteView` pinta el `navLabel` de cada página y el `title` de la ruta activa. No crea `src/sites/<tenantId>/`.

- [ ] **Step 1: Write the failing test**

Crear `tests/baseline/coded-site-registry.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";
import { clearCodedSites, getCodedSite, registerCodedSite } from "../../src/sites/registry";

describe("coded site registry", () => {
  afterEach(() => {
    clearCodedSites();
  });

  it("empieza vacío y solo devuelve el sitio registrado", () => {
    assert.equal(getCodedSite("sem"), undefined);
    registerCodedSite({
      tenantId: "fixture",
      pages: [{ path: "/", title: "Inicio", navLabel: "Inicio" }],
      forms: [],
    });
    assert.equal(getCodedSite("sem"), undefined);
    assert.equal(getCodedSite("fixture")?.pages[0]?.title, "Inicio");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/coded-site-registry.test.ts`

Expected: FAIL si `clearCodedSites` aún no existe. Si Task 3 ya lo creó, el test pasa y se sigue al Step 3 para completar la vista.

- [ ] **Step 3: Write minimal implementation**

Dejar `src/sites/registry.ts` como en Task 3. Reemplazar `src/components/sites/CodedSiteView.tsx` por:

```tsx
import type { ContactInfo, SocialLinks } from "@/types/cms";
import type { CodedSite } from "@/sites/types";

export function CodedSiteView({
  site,
  path,
  institutionName,
  contact,
  social,
}: {
  site: CodedSite;
  path: string;
  institutionName: string;
  contact: ContactInfo;
  social: SocialLinks;
}) {
  const page = site.pages.find((item) => item.path === path);
  if (!page) return null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm text-muted">{institutionName}</p>
      <nav className="mt-4 flex gap-4 text-sm">
        {site.pages.map((item) => (
          <a key={item.path} href={item.path}>
            {item.navLabel}
          </a>
        ))}
      </nav>
      <h1 className="mt-8 text-3xl font-semibold">{page.title}</h1>
      <p className="mt-4 text-sm text-muted">{contact.email || social.instagram || ""}</p>
    </main>
  );
}
```

`contact` y `social` quedan en la firma para que las páginas reales los reciban. Este corte solo muestra el correo o Instagram si existen, como prueba de que el dato sale de la configuración y no del código de la página.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/coded-site-registry.test.ts tests/baseline/coded-site-layout.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sites/registry.ts src/sites/types.ts src/components/sites/CodedSiteView.tsx tests/baseline/coded-site-registry.test.ts
git commit -m "feat: register a coded site per space"
```

---

### Task 5: Botón Publicar sitio

**Files:**
- Modify: `src/components/config/ConfigurationHub.tsx`
- Test: `tests/baseline/coded-site-publish-control.test.ts`

**Interfaces:**
- Consumes: `SiteConfig.sitePublished`.
- Produces: el guardado de Ajustes del sitio incluye `sitePublished`. El control se llama `Publicar sitio` y no escribe `institution.status`.

- [ ] **Step 1: Write the failing test**

Crear `tests/baseline/coded-site-publish-control.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const hub = readFileSync("src/components/config/ConfigurationHub.tsx", "utf8");

describe("Publicar sitio", () => {
  it("el guardado envía sitePublished y el control no toca institution.status", () => {
    assert.match(hub, /sitePublished: config\.sitePublished === true/);
    assert.match(hub, /Publicar sitio/);
    assert.match(hub, /Este sitio está por comenzar/);
    assert.match(hub, /sitePublished: event\.target\.checked/);
    assert.doesNotMatch(hub, /sitePublished: status/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/coded-site-publish-control.test.ts`

Expected: FAIL porque `toUpdate` no copia `sitePublished`.

- [ ] **Step 3: Write minimal implementation**

En `toUpdate`, después de `features: config.features,`:

```ts
    sitePublished: config.sitePublished === true,
```

En el bloque `activeSection === "general"`, antes de `<InstitutionForm`:

```tsx
          <label className="mb-6 flex items-start gap-3 rounded-lg border border-border p-4">
            <input
              type="checkbox"
              className="mt-1"
              checked={config.sitePublished === true}
              onChange={(event) =>
                setConfig((prev) => ({ ...prev, sitePublished: event.target.checked }))
              }
            />
            <span>
              <span className="block text-sm font-semibold text-foreground">Publicar sitio</span>
              <span className="mt-1 block text-sm text-muted">
                Mientras esté apagado, el dominio muestra «Este sitio está por comenzar».
              </span>
            </span>
          </label>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/coded-site-publish-control.test.ts`

Expected: PASS, 1 test.

- [ ] **Step 5: Commit**

```bash
git add src/components/config/ConfigurationHub.tsx tests/baseline/coded-site-publish-control.test.ts
git commit -m "feat: add a publish switch for the public site"
```

---

### Task 6: Sincronizar y enviar formularios de código

**Files:**
- Modify: `src/types/experience-forms.ts`
- Create: `src/sites/sync-forms.ts`
- Create: `src/sites/submit-coded-form.ts`
- Modify: `src/app/(site)/layout.tsx`
- Test: `tests/baseline/coded-site-forms.test.ts`

**Interfaces:**
- Consumes: `ExperienceFormDefinition`, `ExperienceFormCreate`, `ExperienceFormUpdate`, `validateFormSubmission`, `submitExperienceForm`, `FormSubmitResult`, `FormSubmissionStore`.
- Produces:

```ts
export async function syncCodedSiteForms(
  tenantId: string,
  forms: CodedSiteFormDeclaration[],
  deps: {
    list: (tenant: string) => Promise<ExperienceFormDefinition[]>;
    create: (data: ExperienceFormCreate) => Promise<ExperienceFormDefinition>;
    update: (
      tenant: string,
      id: string,
      update: ExperienceFormUpdate
    ) => Promise<ExperienceFormDefinition | null>;
  }
): Promise<{ upserted: string[]; archived: string[] }>;

export async function submitCodedSiteForm(input: {
  form: ExperienceFormDefinition;
  data: Record<string, unknown>;
  store: FormSubmissionStore;
  submit?: typeof submitExperienceForm;
}): Promise<FormSubmitResult>;
```

`ExperienceFormDefinition` gana `managedBy?: "coded-site"`.

- [ ] **Step 1: Write the failing test**

Crear `tests/baseline/coded-site-forms.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { syncCodedSiteForms } from "../../src/sites/sync-forms";
import { submitCodedSiteForm } from "../../src/sites/submit-coded-form";
import type { CodedSiteFormDeclaration } from "../../src/sites/types";
import type {
  ExperienceFormCreate,
  ExperienceFormDefinition,
  ExperienceFormUpdate,
} from "../../src/types/experience-forms";

function definition(partial: ExperienceFormCreate): ExperienceFormDefinition {
  return { ...partial, createdAt: "2026-09-28T00:00:00.000Z", updatedAt: "2026-09-28T00:00:00.000Z" };
}

const contacto: CodedSiteFormDeclaration = {
  _id: "contacto",
  name: "Contacto",
  successMessage: "Listo",
  errorMessage: "Error",
  destination: "contact",
  fields: [
    { id: "email", type: "email", name: "email", label: "Correo", validation: { required: true } },
    { id: "nombre", type: "text", name: "name", label: "Nombre" },
  ],
};

describe("syncCodedSiteForms", () => {
  it("el código reescribe campos y archiva el que desaparece, sin tocar respuestas", async () => {
    const stored = [
      definition({
        _id: "contacto",
        tenant: "fixture",
        name: "Viejo",
        successMessage: "Viejo",
        errorMessage: "Viejo",
        destination: "contact",
        postSubmit: { type: "message", message: "Viejo" },
        fields: [],
        active: true,
        visible: true,
        managedBy: "coded-site",
      }),
      definition({
        _id: "baja",
        tenant: "fixture",
        name: "Baja",
        successMessage: "Baja",
        errorMessage: "Baja",
        destination: "contact",
        postSubmit: { type: "message", message: "Baja" },
        fields: [],
        active: true,
        visible: true,
        managedBy: "coded-site",
      }),
      definition({
        _id: "manual",
        tenant: "fixture",
        name: "Manual",
        successMessage: "Manual",
        errorMessage: "Manual",
        destination: "subscription",
        postSubmit: { type: "message", message: "Manual" },
        fields: [],
        active: true,
        visible: true,
      }),
    ];
    const updates: Array<{ id: string; update: ExperienceFormUpdate }> = [];
    const result = await syncCodedSiteForms("fixture", [contacto], {
      list: async () => stored,
      create: async (data) => definition(data),
      update: async (_tenant, id, update) => {
        updates.push({ id, update });
        return stored.find((form) => form._id === id) ?? null;
      },
    });

    assert.deepEqual(result.upserted, ["contacto"]);
    assert.deepEqual(result.archived, ["baja"]);
    const contactoUpdate = updates.find((item) => item.id === "contacto");
    assert.equal(contactoUpdate?.update.name, "Contacto");
    assert.equal(contactoUpdate?.update.fields?.[0]?.name, "email");
    assert.equal(updates.find((item) => item.id === "baja")?.update.archived, true);
    assert.equal(updates.some((item) => item.id === "manual"), false);
    assert.equal(JSON.stringify(updates).includes("submission"), false);
  });
});

describe("submitCodedSiteForm", () => {
  it("un campo inválido no guarda", async () => {
    let saved = 0;
    const form = definition({
      _id: "contacto",
      tenant: "fixture",
      name: "Contacto",
      successMessage: "Listo",
      errorMessage: "Error",
      destination: "contact",
      postSubmit: { type: "message", message: "Listo" },
      fields: contacto.fields,
      active: true,
      visible: false,
      managedBy: "coded-site",
    });
    const result = await submitCodedSiteForm({
      form,
      data: { name: "Ana" },
      store: { save: async () => { saved += 1; return { id: "s1" }; } },
      submit: async () => {
        saved += 1;
        return { ok: true, submissionId: "s1" };
      },
    });
    assert.equal(result.ok, false);
    assert.equal(saved, 0);
  });

  it("con correo entrega el envío al motor existente", async () => {
    const form = definition({
      _id: "contacto",
      tenant: "fixture",
      name: "Contacto",
      successMessage: "Listo",
      errorMessage: "Error",
      destination: "contact",
      postSubmit: { type: "message", message: "Listo" },
      fields: [{ id: "email", type: "email", name: "email", label: "Correo" }],
      active: true,
      visible: false,
      managedBy: "coded-site",
    });
    let received: { destination: string; email: unknown } | null = null;
    const result = await submitCodedSiteForm({
      form,
      data: { email: "ana@sem.cl" },
      store: { save: async () => ({ id: "s1" }) },
      submit: async ({ form: submitted, data }) => {
        received = { destination: submitted.destination, email: data.email };
        return { ok: true, submissionId: "s1", message: submitted.successMessage };
      },
    });
    assert.equal(result.ok, true);
    assert.deepEqual(received, { destination: "contact", email: "ana@sem.cl" });
  });

  it("sin correo ni teléfono igual entrega el envío", async () => {
    const form = definition({
      _id: "nota",
      tenant: "fixture",
      name: "Nota",
      successMessage: "Listo",
      errorMessage: "Error",
      destination: "information_request",
      postSubmit: { type: "message", message: "Listo" },
      fields: [{ id: "nota", type: "text", name: "note", label: "Nota" }],
      active: true,
      visible: false,
      managedBy: "coded-site",
    });
    let called = false;
    const result = await submitCodedSiteForm({
      form,
      data: { note: "Hola" },
      store: { save: async () => ({ id: "s2" }) },
      submit: async () => {
        called = true;
        return { ok: true, submissionId: "s2" };
      },
    });
    assert.equal(result.ok, true);
    assert.equal(called, true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/coded-site-forms.test.ts`

Expected: FAIL con módulo no encontrado.

- [ ] **Step 3: Write minimal implementation**

En `ExperienceFormDefinition` (`src/types/experience-forms.ts`), después de `archived?: boolean;`:

```ts
  /** Declarado en src/sites. El panel no es la fuente de los campos. */
  managedBy?: "coded-site";
```

Crear `src/sites/sync-forms.ts`:

```ts
import type {
  ExperienceFormCreate,
  ExperienceFormDefinition,
  ExperienceFormUpdate,
} from "@/types/experience-forms";
import type { CodedSiteFormDeclaration } from "@/sites/types";
import { CODED_FORM_DESTINATIONS } from "@/sites/types";

export async function syncCodedSiteForms(
  tenantId: string,
  forms: CodedSiteFormDeclaration[],
  deps: {
    list: (tenant: string) => Promise<ExperienceFormDefinition[]>;
    create: (data: ExperienceFormCreate) => Promise<ExperienceFormDefinition>;
    update: (
      tenant: string,
      id: string,
      update: ExperienceFormUpdate
    ) => Promise<ExperienceFormDefinition | null>;
  }
): Promise<{ upserted: string[]; archived: string[] }> {
  for (const form of forms) {
    if (!(CODED_FORM_DESTINATIONS as readonly string[]).includes(form.destination)) {
      throw new Error(`Destino de formulario no permitido: ${form.destination}`);
    }
  }

  const existing = await deps.list(tenantId);
  const byId = new Map(existing.map((form) => [form._id, form]));
  const declaredIds = new Set(forms.map((form) => form._id));
  const upserted: string[] = [];
  const archived: string[] = [];

  for (const form of forms) {
    const payload: ExperienceFormUpdate = {
      name: form.name,
      description: form.description,
      successMessage: form.successMessage,
      errorMessage: form.errorMessage,
      destination: form.destination,
      postSubmit: { type: "message", message: form.successMessage },
      fields: form.fields,
      active: true,
      visible: false,
      private: true,
      archived: false,
      managedBy: "coded-site",
    };
    if (byId.has(form._id)) {
      await deps.update(tenantId, form._id, payload);
    } else {
      await deps.create({
        _id: form._id,
        tenant: tenantId,
        name: form.name,
        description: form.description,
        successMessage: form.successMessage,
        errorMessage: form.errorMessage,
        destination: form.destination,
        postSubmit: { type: "message", message: form.successMessage },
        fields: form.fields,
        active: true,
        visible: false,
        private: true,
        archived: false,
        managedBy: "coded-site",
      });
    }
    upserted.push(form._id);
  }

  for (const form of existing) {
    if (form.managedBy !== "coded-site" || declaredIds.has(form._id)) continue;
    await deps.update(tenantId, form._id, { archived: true, active: false });
    archived.push(form._id);
  }

  return { upserted, archived };
}
```

Crear `src/sites/submit-coded-form.ts`:

```ts
import { submitExperienceForm, type FormSubmissionStore, type FormSubmitResult } from "@/core/experience/forms";
import { validateFormSubmission } from "@/core/experience/forms/validation";
import type { ExperienceFormDefinition } from "@/types/experience-forms";

export async function submitCodedSiteForm(input: {
  form: ExperienceFormDefinition;
  data: Record<string, unknown>;
  store: FormSubmissionStore;
  submit?: typeof submitExperienceForm;
}): Promise<FormSubmitResult> {
  const errors = validateFormSubmission(input.form, input.data);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: input.form.errorMessage };
  }
  const submit = input.submit ?? submitExperienceForm;
  return submit({ form: input.form, data: input.data, store: input.store });
}
```

Comprobar el export real de `validateFormSubmission` y `FormSubmissionStore` en `src/core/experience/forms/index.ts` y `src/core/experience/forms/engine.ts`. Importar desde el archivo que los exporta. No duplicar la validación dentro de `submitExperienceForm`: el retorno temprano es el que evita el guardado en el test.

En `src/app/(site)/layout.tsx`, después de `const site = getCodedSite(ctx.tenant);` y antes de `decidePublicSite`:

```tsx
  if (site) {
    try {
      const { syncCodedSiteForms } = await import("@/sites/sync-forms");
      const {
        listExperienceForms,
        createExperienceForm,
        updateExperienceForm,
      } = await import("@/lib/experience/forms/repository");
      await syncCodedSiteForms(ctx.tenant, site.forms, {
        list: listExperienceForms,
        create: createExperienceForm,
        update: updateExperienceForm,
      });
    } catch (error) {
      console.error(
        "[coded-site] no se pudieron sincronizar los formularios",
        error instanceof Error ? error.message : error
      );
    }
  }
```

Confirmar que `createExperienceForm` y `updateExperienceForm` están exportados en `src/lib/experience/forms/repository.ts`. Sí lo están.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/coded-site-forms.test.ts`

Expected: PASS, 4 tests.

Si `validateFormSubmission` exige más campos de los que el test manda, ajustar solo los datos del test para que el caso inválido falle por `email` requerido y el caso válido pase. No relajar la validación existente.

- [ ] **Step 5: Commit**

```bash
git add src/types/experience-forms.ts src/sites/sync-forms.ts src/sites/submit-coded-form.ts src/app/(site)/layout.tsx tests/baseline/coded-site-forms.test.ts
git commit -m "feat: sync coded forms into submissions and people"
```

---

### Task 7: Retirar las pantallas de la web vieja

**Files:**
- Create: `src/lib/admin/retired-site-admin.ts`
- Modify: `src/lib/admin/nav-domains.ts`
- Modify: `src/app/admin/pages/page.tsx`
- Modify: `src/app/admin/pages/[id]/page.tsx`
- Modify: `src/app/admin/menus/page.tsx`
- Modify: `src/app/admin/menus/[id]/page.tsx`
- Modify: `src/app/admin/media/page.tsx`
- Modify: `src/app/admin/content/page.tsx`
- Modify: `src/app/admin/content/[section]/page.tsx`
- Modify: `src/app/admin/content/[section]/edit/[id]/page.tsx`
- Test: `tests/baseline/coded-site-admin-retired.test.ts`

**Interfaces:**
- Consumes: `getAllNavTreeItems`, `ADMIN_SIDEBAR_SUPPLEMENTAL`.
- Produces:

```ts
export function isRetiredSiteAdminPath(pathname: string): boolean;
export function isRetiredContentSection(section: string): boolean;
```

- [ ] **Step 1: Write the failing test**

Crear `tests/baseline/coded-site-admin-retired.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ADMIN_SIDEBAR_SUPPLEMENTAL, getAllNavTreeItems } from "../../src/lib/admin/nav-domains";
import {
  isRetiredContentSection,
  isRetiredSiteAdminPath,
} from "../../src/lib/admin/retired-site-admin";

const removedIds = [
  "portal-pages",
  "portal-menus",
  "institution-authorities",
  "academic-programs",
  "academic-courses",
  "communications-hub",
  "communications-media",
];

describe("retired site admin", () => {
  it("esas pantallas salen del menú", () => {
    const ids = new Set(getAllNavTreeItems().map((item) => item.id));
    for (const id of removedIds) assert.equal(ids.has(id), false);
    const supplemental = ADMIN_SIDEBAR_SUPPLEMENTAL.map((item) => item.href);
    assert.equal(supplemental.includes("/admin/menus"), false);
    assert.equal(ids.has("convocatorias-config"), true);
    assert.equal(ids.has("site-domain"), true);
    assert.equal(ids.has("institution-info"), true);
    assert.equal(ids.has("institution-branding"), true);
    assert.equal(ids.has("portal-admission"), true);
    assert.equal(ids.has("convocatorias-resultados"), true);
  });

  it("la URL ya no abre el editor y el resto del admin sigue", () => {
    assert.equal(isRetiredSiteAdminPath("/admin/pages"), true);
    assert.equal(isRetiredSiteAdminPath("/admin/pages/abc"), true);
    assert.equal(isRetiredSiteAdminPath("/admin/menus"), true);
    assert.equal(isRetiredSiteAdminPath("/admin/menus/principal"), true);
    assert.equal(isRetiredSiteAdminPath("/admin/media"), true);
    assert.equal(isRetiredSiteAdminPath("/admin/content"), true);
    assert.equal(isRetiredSiteAdminPath("/admin/content/people"), true);
    assert.equal(isRetiredSiteAdminPath("/admin/content/programs/edit/1"), true);
    assert.equal(isRetiredSiteAdminPath("/admin/content/news"), true);
    assert.equal(isRetiredSiteAdminPath("/admin/config"), false);
    assert.equal(isRetiredSiteAdminPath("/admin/portal/forms"), false);
    assert.equal(isRetiredSiteAdminPath("/admin/portal/admission"), false);
    assert.equal(isRetiredContentSection("people"), true);
    assert.equal(isRetiredContentSection("courses"), true);
    assert.equal(isRetiredContentSection("testimonials"), false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/coded-site-admin-retired.test.ts`

Expected: FAIL porque los ids siguen en el menú.

- [ ] **Step 3: Write minimal implementation**

Crear `src/lib/admin/retired-site-admin.ts`:

```ts
const RETIRED_EXACT = new Set([
  "/admin/pages",
  "/admin/menus",
  "/admin/media",
  "/admin/content",
]);

const RETIRED_PREFIXES = [
  "/admin/pages/",
  "/admin/menus/",
  "/admin/media/",
  "/admin/content/people",
  "/admin/content/team",
  "/admin/content/programs",
  "/admin/content/courses",
  "/admin/content/news",
  "/admin/content/events",
  "/admin/content/library",
  "/admin/content/academic-agenda",
  "/admin/content/academic_agenda",
  "/admin/content/avisos",
  "/admin/content/institutional_notices",
];

const RETIRED_SECTIONS = new Set([
  "people",
  "team",
  "programs",
  "courses",
  "news",
  "events",
  "library",
  "academic-agenda",
  "academic_agenda",
  "avisos",
  "institutional_notices",
]);

export function isRetiredContentSection(section: string): boolean {
  return RETIRED_SECTIONS.has(section);
}

export function isRetiredSiteAdminPath(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? pathname;
  if (RETIRED_EXACT.has(path)) return true;
  return RETIRED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(prefix));
}
```

El `startsWith(prefix)` sin barra cubre `/admin/content/people` y `/admin/content/programs/edit/1` porque el prefijo `/admin/content/programs` es prefijo de esa ruta. No uses un prefijo corto como `/admin/content` en `RETIRED_PREFIXES`: `/admin/content` solo está en `RETIRED_EXACT`, para no retirar `/admin/content/testimonials`.

En `src/lib/admin/nav-domains.ts`, borrar estos ítems completos del array:

- En `ADMIN_SIDEBAR_SUPPLEMENTAL`, el ítem con `href: "/admin/menus"`.
- En el grupo `sitio-web`, los ítems `id: "portal-pages"` e `id: "portal-menus"`.
- En el grupo `institucion`, los ítems `institution-authorities`, `academic-programs`, `academic-courses`, `communications-hub` y `communications-media`.

No borrar Formularios (`convocatorias-config`), Dominio (`site-domain`), Ajustes del sitio (`institution-info`), Identidad visual (`institution-branding`), Centro de admisión (`portal-admission`) ni Operación de formularios (`convocatorias-resultados`).

Reemplazar el cuerpo de estas páginas por `notFound()` y borrar imports que queden sin uso:

`src/app/admin/pages/page.tsx`, `src/app/admin/pages/[id]/page.tsx`, `src/app/admin/menus/page.tsx`, `src/app/admin/menus/[id]/page.tsx`, `src/app/admin/media/page.tsx`, `src/app/admin/content/page.tsx`:

```tsx
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default function RetiredSiteAdminPage() {
  notFound();
}
```

En `src/app/admin/content/[section]/page.tsx`, justo después de `const { section } = await params;`:

```tsx
  if (isRetiredContentSection(section)) notFound();
```

Importar `isRetiredContentSection` desde `@/lib/admin/retired-site-admin` y `notFound` desde `next/navigation` si aún no está.

En `src/app/admin/content/[section]/edit/[id]/page.tsx`, justo después de `const { section, id } = await params;`:

```tsx
  if (isRetiredContentSection(section)) notFound();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/coded-site-admin-retired.test.ts`

Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin/retired-site-admin.ts src/lib/admin/nav-domains.ts src/app/admin/pages/page.tsx src/app/admin/pages/[id]/page.tsx src/app/admin/menus/page.tsx src/app/admin/menus/[id]/page.tsx src/app/admin/media/page.tsx src/app/admin/content/page.tsx src/app/admin/content/[section]/page.tsx src/app/admin/content/[section]/edit/[id]/page.tsx tests/baseline/coded-site-admin-retired.test.ts
git commit -m "feat: remove the old website editor from the admin"
```

---

### Task 8: Verificación del corte

**Files:**
- Test: los cuatro archivos `tests/baseline/coded-site-*.test.ts` ya creados.

- [ ] **Step 1: Run the coded-site tests**

Run: `npx tsx --test tests/baseline/coded-site-publish-flag.test.ts tests/baseline/coded-site-public.test.ts tests/baseline/coded-site-layout.test.ts tests/baseline/coded-site-registry.test.ts tests/baseline/coded-site-publish-control.test.ts tests/baseline/coded-site-forms.test.ts tests/baseline/coded-site-admin-retired.test.ts`

Expected: PASS en todos.

- [ ] **Step 2: Check the running site**

Con `npm run dev` ya levantado, abrir el host del espacio (el seminario en local). La home y una ruta interna como `/contacto` muestran el nombre de la organización y el texto `Este sitio está por comenzar`, más teléfono, correo o redes solo si Ajustes del sitio los tiene. `/admin` sigue abriendo. `/admin/pages` no abre la lista de páginas. En Ajustes del sitio, Publicar sitio se puede activar; sin carpeta `src/sites/<tenantId>/`, la web sigue en «por comenzar».

- [ ] **Step 3: Commit only if Step 1 or Step 2 forced a fix**

Si no hubo cambios, no crear un commit vacío.
