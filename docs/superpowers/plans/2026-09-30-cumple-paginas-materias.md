# Cumple páginas de materias y SEO — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir el menú de Mentor Prime Cumple en páginas reales en código —materias, recursos, nosotros y contacto— con contenido ejecutivo anclado a fuentes oficiales, SEO por ruta y el mismo sistema visual de la home.

**Architecture:** Se extiende el contrato `cumpleSite.pages` con title/description por ruta. El contenido vive en módulos bajo `src/sites/cumple/`. Una plantilla `MateriaPage` + páginas de apoyo se envuelven en `CumpleShell` (tema, header, footer, asesor). Las vistas se registran en `production-views.tsx`. `getSiteMetadata` resuelve SEO según `x-pathname`.

**Tech Stack:** Next.js 16, React 19, TypeScript, sitio en código Cumple, `node:test` + `tsx --test`, fuentes ya modeladas en `src/sites/cumple/norma.ts`.

**Spec:** `docs/superpowers/specs/2026-09-30-cumple-paginas-materias-design.md`

## Global Constraints

- Una URL por materia; Soluciones y Normativas apuntan a la misma URL.
- Tono mixto: marco normativo → implicancia → oferta Cumple → CTA.
- Redacción en tercera persona / trato formal («la empresa», «la organización», «el empleador»).
- Hechos jurídicos solo desde fuentes oficiales (BCN/Ley Chile, DT, ministerios, etc.). Citas en cuerpo + bloque Fuentes oficiales.
- No inventar cifras ni plazos sin fuente. Preferir reutilizar URLs de `norma.ts`.
- No prometer cero multas ni ausencia de fiscalización.
- Aviso orientativo en páginas de materia: no sustituye asesoría legal formal.
- Mismo diseño Cumple (tokens, tipografías Montserrat/Caveat, `SiteHeader`, tema claro/oscuro).
- Contacto de `/contacto` y pie leen `contact`/`social` del espacio; no hardcodear correo/teléfono en el copy.
- CTA principal → `/evaluar`. Formulario = `CUMPLE_FORM_ID` existente.
- Fuera de alcance: blog, schema avanzado, sitemap dedicado, landings por industria, duplicar URL servicio/norma.

## File structure

- `src/sites/types.ts` — `CodedSitePage.description` opcional.
- `src/sites/cumple/site.ts` — registro de todas las rutas + SEO por página.
- `src/sites/cumple/seo.ts` — `resolveCumpleSeo(path)`.
- `src/sites/cumple/content.ts` — menús con `href` reales; paneles Soluciones/Normativas/Recursos.
- `src/sites/cumple/pages/types.ts` — tipos de contenido de página.
- `src/sites/cumple/pages/materias.ts` — las 6 materias.
- `src/sites/cumple/pages/como-funciona.ts`
- `src/sites/cumple/pages/faq.ts`
- `src/sites/cumple/pages/nosotros.ts`
- `src/sites/cumple/pages/evaluar.ts`
- `src/lib/cms/metadata.ts` — SEO por `x-pathname` en tenant cumple.
- `src/components/sites/cumple/CumpleShell.tsx` — wrapper compartido.
- `src/components/sites/cumple/CumpleFooter.tsx` — pie con enlaces reales.
- `src/components/sites/cumple/SourcesBlock.tsx`
- `src/components/sites/cumple/MateriaPage.tsx`
- `src/components/sites/cumple/SupportPage.tsx` — layout genérico para apoyo (o vistas dedicadas cortas).
- `src/components/sites/cumple/pages/*.tsx` — vistas registrables por ruta.
- `src/components/sites/cumple/site-header.tsx` — CTA → `/evaluar`.
- `src/components/sites/cumple/CumpleHome.tsx` — usa shell; CTAs a rutas.
- `src/sites/production-views.tsx` — registra todas las vistas.
- `tests/baseline/cumple-site.test.ts` — paths esperados.
- `tests/baseline/cumple-pages.test.ts` — menús, materias, fuentes, SEO.

---

### Task 1: Registrar rutas y SEO en el contrato del sitio

**Files:**
- Modify: `src/sites/types.ts`
- Modify: `src/sites/cumple/site.ts`
- Create: `src/sites/cumple/seo.ts`
- Modify: `tests/baseline/cumple-site.test.ts`
- Create: `tests/baseline/cumple-pages.test.ts` (primer caso SEO)

**Interfaces:**
- Consumes: `CodedSite`, `CUMPLE_SEO`.
- Produces:
  - `CodedSitePage = { path: string; title: string; navLabel: string; description?: string }`
  - `resolveCumpleSeo(path: string): { title: string; description: string }` — usa la página registrada o `CUMPLE_SEO` en `/`.

- [ ] **Step 1: Write the failing test**

En `tests/baseline/cumple-site.test.ts`, reemplazar la aserción de paths:

```ts
assert.deepEqual(
  cumpleSite.pages.map((page) => page.path),
  [
    "/",
    "/materias/ley-karin",
    "/materias/seguridad-salud-trabajo",
    "/materias/laboral-rrhh",
    "/materias/proteccion-datos",
    "/materias/inclusion-laboral",
    "/materias/contratistas-terceros",
    "/como-funciona",
    "/preguntas-frecuentes",
    "/evaluar",
    "/nosotros",
    "/contacto",
  ]
);
```

Crear `tests/baseline/cumple-pages.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveCumpleSeo } from "../../src/sites/cumple/seo";
import { CUMPLE_SEO } from "../../src/sites/cumple/site";

describe("SEO Cumple por ruta", () => {
  it("la home usa CUMPLE_SEO", () => {
    assert.deepEqual(resolveCumpleSeo("/"), CUMPLE_SEO);
  });

  it("cada materia tiene title y description propios", () => {
    const ley = resolveCumpleSeo("/materias/ley-karin");
    assert.notEqual(ley.title, CUMPLE_SEO.title);
    assert.ok(ley.description.length > 40);
    assert.match(ley.title, /Karin/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx tsx --test tests/baseline/cumple-site.test.ts tests/baseline/cumple-pages.test.ts`

Expected: FAIL — paths siguen siendo `["/"]` y/o `resolveCumpleSeo` no existe.

- [ ] **Step 3: Implement types, pages registry and SEO resolver**

En `src/sites/types.ts`, añadir `description?: string` a `CodedSitePage`.

En `src/sites/cumple/site.ts`, declarar las 12 entradas de `pages` con `title`, `navLabel` y `description` distintos. Ejemplos:

```ts
{
  path: "/materias/ley-karin",
  title: "Ley Karin: protocolos y control para la empresa | Mentor Prime Cumple",
  navLabel: "Ley Karin",
  description:
    "Qué exige la Ley Karin a la organización, qué implica para el empleador y cómo Mentor Prime Cumple ordena protocolos, investigación y evidencia.",
},
```

(Repetir para las otras 5 materias y las 5 páginas de apoyo; home conserva `CUMPLE_SEO`.)

Crear `src/sites/cumple/seo.ts`:

```ts
import { CUMPLE_SEO, cumpleSite } from "@/sites/cumple/site";

function normalizePath(pathname: string): string {
  const path = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}

export function resolveCumpleSeo(pathname: string): { title: string; description: string } {
  const path = normalizePath(pathname);
  const page = cumpleSite.pages.find((entry) => entry.path === path);
  if (!page) return { title: CUMPLE_SEO.title, description: CUMPLE_SEO.description };
  return {
    title: page.title,
    description: page.description ?? CUMPLE_SEO.description,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx tsx --test tests/baseline/cumple-site.test.ts tests/baseline/cumple-pages.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/sites/types.ts src/sites/cumple/site.ts src/sites/cumple/seo.ts tests/baseline/cumple-site.test.ts tests/baseline/cumple-pages.test.ts
git commit -m "feat(cumple): register materia and support page routes with SEO"
```

---

### Task 2: Metadata por pathname

**Files:**
- Modify: `src/lib/cms/metadata.ts`
- Modify: `tests/baseline/cumple-pages.test.ts`

**Interfaces:**
- Consumes: `resolveCumpleSeo`, `headers().get("x-pathname")`.
- Produces: `getSiteMetadata` en tenant `cumple` usa SEO de la ruta actual.

- [ ] **Step 1: Write the failing test**

Añadir en `tests/baseline/cumple-pages.test.ts` una aserción de archivo (mismo estilo que el layout en `cumple-site.test.ts`):

```ts
import { readFileSync } from "node:fs";

it("metadata Cumple resuelve SEO por x-pathname", () => {
  const source = readFileSync("src/lib/cms/metadata.ts", "utf8");
  assert.match(source, /resolveCumpleSeo/);
  assert.match(source, /x-pathname/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/cumple-pages.test.ts`

Expected: FAIL — `metadata.ts` aún fija solo `CUMPLE_SEO`.

- [ ] **Step 3: Wire metadata**

En `src/lib/cms/metadata.ts`, dentro del bloque `ctx.tenantId === CUMPLE_TENANT_ID`:

```ts
import { headers } from "next/headers";
import { resolveCumpleSeo } from "@/sites/cumple/seo";

// ...
const headerList = await headers();
const pathname = headerList.get("x-pathname") ?? "/";
const seo = resolveCumpleSeo(pathname);
return {
  ...meta,
  title: seo.title,
  description: seo.description,
  openGraph: {
    ...meta.openGraph,
    title: seo.title,
    description: seo.description,
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/cumple-pages.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/cms/metadata.ts tests/baseline/cumple-pages.test.ts
git commit -m "feat(cumple): resolve page metadata from request pathname"
```

---

### Task 3: Modelo de contenido de materias y bloque de fuentes

**Files:**
- Create: `src/sites/cumple/pages/types.ts`
- Create: `src/sites/cumple/pages/materias.ts` (estructura + Ley Karin completa; stubs tipados para las otras 5 si aún vacías — **no**: este task deja las 6 completas)
- Create: `src/components/sites/cumple/SourcesBlock.tsx`
- Modify: `tests/baseline/cumple-pages.test.ts`

**Interfaces:**
- Consumes: `Fuente` de `norma.ts` (o tipo local idéntico `{ nombre: string; url: string }`).
- Produces:
  - `MateriaContent` con `slug`, `path`, `eyebrow`, `h1`, `lead`, `exige`, `implica`, `cumple`, `sources`, `relatedPaths`.
  - `getMateria(slug: string): MateriaContent | undefined`
  - `materias: readonly MateriaContent[]` (length 6)
  - `SourcesBlock({ sources })`

- [ ] **Step 1: Write the failing test**

```ts
import { getMateria, materias } from "../../src/sites/cumple/pages/materias";

it("declara seis materias con fuentes oficiales https", () => {
  assert.equal(materias.length, 6);
  for (const materia of materias) {
    assert.ok(materia.sources.length >= 1);
    for (const source of materia.sources) {
      assert.match(source.url, /^https:\/\//);
      assert.ok(!source.url.includes("example.com"));
    }
    assert.match(materia.h1, /\S/);
    assert.ok(materia.exige.length >= 2);
  }
  assert.equal(getMateria("ley-karin")?.path, "/materias/ley-karin");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/cumple-pages.test.ts`

Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implement types, SourcesBlock and full materia content**

`src/sites/cumple/pages/types.ts`:

```ts
export type OfficialSource = { nombre: string; url: string };

export type MateriaSection = {
  heading: string;
  paragraphs: string[];
  /** Frases con mención a institución; el render puede enlazar la primera fuente coincidente. */
  citations?: { label: string; url: string }[];
};

export type MateriaContent = {
  slug: string;
  path: string;
  eyebrow: string;
  h1: string;
  lead: string;
  disclaimer: string;
  exige: MateriaSection;
  implica: MateriaSection;
  cumple: MateriaSection;
  sources: OfficialSource[];
  relatedPaths: string[];
};
```

Redactar las 6 materias en tercera persona, tono mixto, ancladas a estas fuentes mínimas (ya en `norma.ts`):

| Slug | Fuente principal (URL) |
|------|------------------------|
| `ley-karin` | `https://www.bcn.cl/leychile/navegar?idNorma=1200096` |
| `seguridad-salud-trabajo` | `https://www.bcn.cl/leychile/navegar?idNorma=1205298` (+ Ley 16.744 `idNorma=28650`) |
| `laboral-rrhh` | Código del Trabajo `idNorma=207436` (+ jornada `Ley 21.561` vía mismo texto refundido) |
| `proteccion-datos` | `https://www.bcn.cl/leychile/navegar?idNorma=141599` |
| `inclusion-laboral` | `https://www.bcn.cl/leychile/navegar?idNorma=1103997` |
| `contratistas-terceros` | `https://www.bcn.cl/leychile/navegar?idNorma=254080` |

Reglas al redactar cada materia:

1. Abrir la ficha correspondiente en `norma.ts` y no contradecirla.
2. Si se añade otra URL oficial (p. ej. direccióndeltrabajo.gob.cl), verificar que el dominio sea institucional chileno.
3. Incluir al menos una citation inline en `exige` o `implica`.
4. `cumple` describe diagnóstico → plan → implementación → control, sin garantías ilegales.
5. `disclaimer` exacto o equivalente: «Esta página ofrece información orientativa con base en fuentes oficiales. No sustituye asesoría legal formal ni determina el estado de cumplimiento de una organización concreta.»

Ejemplo mínimo de estructura para Ley Karin (completar párrafos reales en el archivo; las otras 5 con el mismo nivel de detalle):

```ts
{
  slug: "ley-karin",
  path: "/materias/ley-karin",
  eyebrow: "Materia · Ley Karin",
  h1: "La empresa necesita protocolo, procedimiento y evidencia — no solo un documento archivado.",
  lead: "La Ley 21.643 (Ley Karin) obliga a prevenir, investigar y resguardar frente al acoso laboral, el acoso sexual y la violencia en el trabajo. Mentor Prime Cumple ayuda a la organización a ordenar esas obligaciones y demostrarlas.",
  disclaimer: "Esta página ofrece información orientativa...",
  exige: {
    heading: "Qué exige el marco a la organización",
    paragraphs: [
      "Según la ficha de Ley Chile de la Biblioteca del Congreso Nacional, la Ley 21.643 modifica el Código del Trabajo en prevención, investigación y sanción...",
    ],
    citations: [
      {
        label: "Ley 21.643 en Ley Chile (BCN)",
        url: "https://www.bcn.cl/leychile/navegar?idNorma=1200096",
      },
    ],
  },
  implica: {
    heading: "Qué implica para la empresa",
    paragraphs: [
      "Sin protocolo vigente, procedimiento claro y resguardos documentados, la organización queda expuesta en fiscalización y en la gestión de casos...",
    ],
  },
  cumple: {
    heading: "Cómo lo ordena Mentor Prime Cumple",
    paragraphs: [
      "El diagnóstico identifica brechas. El plan prioriza. La implementación activa protocolos y registros. El control permanente mantiene responsables, plazos y evidencia.",
    ],
  },
  sources: [
    {
      nombre: "Ley 21.643, Ley Karin. Ley Chile, Biblioteca del Congreso Nacional.",
      url: "https://www.bcn.cl/leychile/navegar?idNorma=1200096",
    },
  ],
  relatedPaths: ["/materias/seguridad-salud-trabajo", "/como-funciona", "/evaluar"],
}
```

`SourcesBlock.tsx`: lista `<ul>` con enlaces `rel="noopener noreferrer"` `target="_blank"`, título «Fuentes oficiales», estilos tokens Cumple (`border-cline`, `text-cmuted`, `font-cdisplay`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/cumple-pages.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/sites/cumple/pages src/components/sites/cumple/SourcesBlock.tsx tests/baseline/cumple-pages.test.ts
git commit -m "feat(cumple): add materia content grounded in official sources"
```

---

### Task 4: CumpleShell, footer y plantilla MateriaPage

**Files:**
- Create: `src/components/sites/cumple/CumpleShell.tsx`
- Create: `src/components/sites/cumple/CumpleFooter.tsx`
- Create: `src/components/sites/cumple/MateriaPage.tsx`
- Create: `src/components/sites/cumple/pages/MateriaRoute.tsx` (factory o 6 wrappers delgados)
- Modify: `src/sites/production-views.tsx`
- Modify: `tests/baseline/cumple-pages.test.ts`

**Interfaces:**
- Consumes: `MateriaContent`, `CodedPageViewProps`, `SiteHeader`, `AsesorChat`, fonts/theme de home.
- Produces:
  - `CumpleShell({ contact, children })`
  - `CumpleFooter({ contact })`
  - `MateriaPage({ content }: { content: MateriaContent })`
  - Vistas registradas para las 6 rutas `/materias/...`

- [ ] **Step 1: Write the failing test**

```ts
it("registra vistas de las seis materias", () => {
  const views = readFileSync("src/sites/production-views.tsx", "utf8");
  assert.match(views, /\/materias\/ley-karin/);
  assert.match(views, /\/materias\/contratistas-terceros/);
  const materiaPage = readFileSync("src/components/sites/cumple/MateriaPage.tsx", "utf8");
  assert.match(materiaPage, /Fuentes oficiales|SourcesBlock/);
  assert.match(materiaPage, /\/evaluar/);
  assert.match(materiaPage, /disclaimer/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL

- [ ] **Step 3: Implement shell, footer, MateriaPage and register views**

Extraer de `CumpleHome` el wrapper `cumple-site` + `themeScript` + fonts + `SiteHeader` + footer + `AsesorChat` hacia `CumpleShell` / `CumpleFooter`. El footer usa rutas reales (`/materias/...`, `/como-funciona`, etc.) y CTA `/evaluar`.

`MateriaPage` renderiza en orden: hero (eyebrow, H1, lead, CTA), `exige`, `implica`, `cumple`, banda CTA, disclaimer, `SourcesBlock`, enlaces `relatedPaths`.

Registrar en `production-views.tsx`:

```ts
import { createMateriaView } from "@/components/sites/cumple/pages/MateriaRoute";
import { getMateria } from "@/sites/cumple/pages/materias";

for (const materia of [
  "ley-karin",
  "seguridad-salud-trabajo",
  "laboral-rrhh",
  "proteccion-datos",
  "inclusion-laboral",
  "contratistas-terceros",
] as const) {
  const content = getMateria(materia);
  if (!content) throw new Error(`materia faltante: ${materia}`);
  registerCodedPageView(CUMPLE_TENANT_ID, content.path, createMateriaView(content));
}
```

`createMateriaView` devuelve un componente que envuelve `<CumpleShell><MateriaPage content={...} /></CumpleShell>`.

Estilos: reutilizar clases de home (`font-cdisplay`, `bg-csand`, `glow-btn`, `max-w-6xl`, etc.). No introducir cards decorativas innecesarias fuera del patrón existente.

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/baseline/cumple-pages.test.ts tests/baseline/cumple-site.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/sites/cumple/CumpleShell.tsx src/components/sites/cumple/CumpleFooter.tsx src/components/sites/cumple/MateriaPage.tsx src/components/sites/cumple/pages src/sites/production-views.tsx tests/baseline/cumple-pages.test.ts src/components/sites/cumple/CumpleHome.tsx
git commit -m "feat(cumple): render materia pages with shared shell"
```

---

### Task 5: Páginas de apoyo (cómo funciona, FAQ, evaluar, nosotros, contacto)

**Files:**
- Create: `src/sites/cumple/pages/como-funciona.ts`
- Create: `src/sites/cumple/pages/faq.ts`
- Create: `src/sites/cumple/pages/nosotros.ts`
- Create: `src/sites/cumple/pages/evaluar.ts`
- Create: `src/components/sites/cumple/pages/ComoFuncionaPage.tsx`
- Create: `src/components/sites/cumple/pages/FaqPage.tsx`
- Create: `src/components/sites/cumple/pages/EvaluarPage.tsx`
- Create: `src/components/sites/cumple/pages/NosotrosPage.tsx`
- Create: `src/components/sites/cumple/pages/ContactoPage.tsx`
- Modify: `src/sites/production-views.tsx`
- Modify: `tests/baseline/cumple-pages.test.ts`

**Interfaces:**
- Consumes: `pasos` / `preguntas` de `content.ts` (ampliar FAQ), `EvalForm`, `CodedPageViewProps.contact/social`.
- Produces: cinco vistas registradas en las rutas del contrato.

- [ ] **Step 1: Write the failing test**

```ts
it("registra vistas de apoyo y contacto lee props de contacto", () => {
  const views = readFileSync("src/sites/production-views.tsx", "utf8");
  for (const path of ["/como-funciona", "/preguntas-frecuentes", "/evaluar", "/nosotros", "/contacto"]) {
    assert.match(views, new RegExp(path.replaceAll("/", "\\/")));
  }
  const contacto = readFileSync("src/components/sites/cumple/pages/ContactoPage.tsx", "utf8");
  assert.match(contacto, /contact\.email/);
  assert.match(contacto, /\/evaluar/);
  const faq = readFileSync("src/sites/cumple/pages/faq.ts", "utf8");
  assert.match(faq, /heading|q:/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL

- [ ] **Step 3: Implement content + views**

- **Cómo funciona:** H1 + lead + los 4 `pasos` ampliados (1–2 párrafos c/u) + CTA `/evaluar`.
- **FAQ:** array de `{ q, a }` (mínimo 6). Cada `q` se renderiza como H2. Enlaces a materias y `/evaluar` en algunas respuestas.
- **Evaluar:** copy de confianza + `<EvalForm />` (mismo `CUMPLE_FORM_ID`).
- **Nosotros:** quién es Cumple, para quién, diferencia consultoría+plataforma+acompañamiento; sin promesas ilegales.
- **Contacto:** mostrar solo campos no vacíos de `contact`/`social`; CTA a `/evaluar`; no inventar «Santiago, Chile» si no hay dato (el fallback de la home actual no se replica aquí).

Registrar las cinco vistas en `production-views.tsx`.

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/baseline/cumple-pages.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/sites/cumple/pages src/components/sites/cumple/pages src/sites/production-views.tsx tests/baseline/cumple-pages.test.ts
git commit -m "feat(cumple): add support pages for method, FAQ, eval, about, contact"
```

---

### Task 6: Menú, header CTA y enlaces de la home

**Files:**
- Modify: `src/sites/cumple/content.ts`
- Modify: `src/components/sites/cumple/site-header.tsx`
- Modify: `src/components/sites/cumple/CumpleHome.tsx`
- Modify: `src/components/sites/cumple/CumpleFooter.tsx` (si aún tiene `#`)
- Modify: `tests/baseline/cumple-pages.test.ts`
- Modify: `tests/baseline/cumple-site.test.ts` (si aserta `#evaluar`)

**Interfaces:**
- Consumes: paths de materias.
- Produces: `menus` con href reales; Normativas con las 6 materias (copy de marco); header CTA `/evaluar`.

- [ ] **Step 1: Write the failing test**

```ts
import { menus, soluciones, normativas, recursos } from "../../src/sites/cumple/content";

it("el menú usa rutas reales y no anclas sueltas en paneles", () => {
  assert.equal(soluciones.length, 6);
  assert.equal(normativas.length, 6);
  for (const item of [...soluciones, ...normativas, ...recursos]) {
    assert.ok(item.href.startsWith("/"));
    assert.ok(!item.href.startsWith("/#"));
  }
  const inicio = menus.find((m) => m.id === "inicio");
  assert.ok(inicio && "href" in inicio && inicio.href === "/");
  const nosotros = menus.find((m) => m.id === "nosotros");
  assert.ok(nosotros && "href" in nosotros && nosotros.href === "/nosotros");
  const contacto = menus.find((m) => m.id === "contacto");
  assert.ok(contacto && "href" in contacto && contacto.href === "/contacto");
  const header = readFileSync("src/components/sites/cumple/site-header.tsx", "utf8");
  assert.match(header, /href="\/evaluar"/);
  assert.doesNotMatch(header, /href="#evaluar"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL — menús aún usan `#ley-karin`, etc.

- [ ] **Step 3: Update content and links**

Actualizar `soluciones`, `normativas` (ampliar a 6 con descripciones de marco), `recursos`, `menus` (`inicio: "/"`, `nosotros: "/nosotros"`, `contacto: "/contacto"`).

Header: todos los `href="#evaluar"` → `/evaluar`.

Home: CTAs principales a `/evaluar`, `/materias/...` o secciones locales según convenga; cards de soluciones que hoy usan `#` deben apuntar a `/materias/...`. El pie ya sale de `CumpleFooter` con rutas reales.

Si el test de home busca `#evaluar` en el form embebido, dejar la sección `#evaluar` en home **o** enlazar solo a `/evaluar`; preferir mantener ancla local en home para el form embebido y menú/CTA global a `/evaluar`.

- [ ] **Step 4: Run full Cumple baseline**

Run: `npx tsx --test tests/baseline/cumple-site.test.ts tests/baseline/cumple-pages.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/sites/cumple/content.ts src/components/sites/cumple/site-header.tsx src/components/sites/cumple/CumpleHome.tsx src/components/sites/cumple/CumpleFooter.tsx tests/baseline/cumple-pages.test.ts tests/baseline/cumple-site.test.ts
git commit -m "feat(cumple): point navigation and CTAs to real page routes"
```

---

### Task 7: Verificación manual y cierre

**Files:** ninguno nuevo obligatorio; solo ajustes si la verificación falla.

- [ ] **Step 1: Run baseline suite slice**

Run: `npm run test:baseline`

Expected: PASS (o al menos sin regresiones en tests Cumple/coded-site). Si fallan tests ajenos preexistentes, no “arreglarlos” salvo que este cambio los haya roto.

- [ ] **Step 2: Manual checklist (sitio Cumple publicado en local)**

1. Abrir `/materias/ley-karin` — H1, CTA, fuentes con enlace BCN.
2. Menú Soluciones y Normativas → misma URL por tema.
3. `/preguntas-frecuentes` — preguntas como H2.
4. `/evaluar` — envío de diagnóstico.
5. `/contacto` — sin inventar datos vacíos.
6. Toggle tema claro/oscuro en una materia.
7. Ver title de pestaña distinto en home vs Ley Karin.

- [ ] **Step 3: Commit fixups if any**

```bash
git add -A
git commit -m "fix(cumple): polish materia pages after verification"
```

(Omitir si no hay cambios.)

---

## Spec coverage check

| Spec requirement | Task |
|------------------|------|
| 6 rutas `/materias/...` | 1, 3, 4 |
| Recursos, Nosotros, Contacto, Evaluar | 1, 5 |
| Menú a rutas reales; Soluciones=Normativas URL | 6 |
| Plantilla materia + disclaimer + fuentes | 3, 4 |
| SEO title/description por página | 1, 2 |
| Fuentes oficiales BCN/gobierno | 3 |
| Tercera persona / tono mixto | 3, 5 (copy) |
| Mismo diseño / shell | 4 |
| Contacto desde config | 5 |
| Form diagnóstico | 5 |
| Fuera de alcance respetado | — (no tasks for blog/schema) |

## Placeholder / consistency self-review

- Paths y slugs alineados entre `site.ts`, `materias.ts`, menús y `production-views`.
- `resolveCumpleSeo` y `CodedSitePage.description` son la única fuente de meta tags Cumple.
- CTA canónico: `/evaluar` en header y páginas internas; home puede conservar `#evaluar` para el form embebido.
