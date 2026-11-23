import { APP_MANIFESTS, MENTOR_APPS } from "@/nelzuri/catalog/manifests";
import type { AppManifest } from "@/nelzuri/catalog/types";
import { validateCatalog } from "@/nelzuri/catalog/validate";

/** Id publicado por el registro. No es una lista fija del núcleo. */
export type SpecializedAppId = string;

export interface SpecializedNavItem {
  id: string;
  href: string;
  label: string;
  icon?: string;
  matchPrefixes: readonly string[];
  requiredAnyPermission: readonly string[];
}

/** Ficha especializada más el lugar que ya ocupa en la navegación. */
export interface SpecializedManifestRegistration {
  manifest: AppManifest;
  aliases?: readonly string[];
  insertNavAfter: string;
  navGroupId: string;
  navSequence: number;
  navItem: SpecializedNavItem;
}

export interface SpecializedRouteRules {
  allowsPath: (pathname: string, roleCodes: readonly string[]) => boolean;
  focusedShell: (permissions: readonly string[], roleCodes: readonly string[]) => boolean;
  allowsNavItem: (
    item: { id?: string; href?: string | null },
    roleCodes: readonly string[]
  ) => boolean;
  /** Menor número se evalúa primero. Sin número, no hay shell enfocado. */
  focusOrder?: number;
}

export interface ConvocatoriaRecord {
  slug: string;
  formId: string;
  title: string;
  date: string;
  location: string;
  description: string;
  active: boolean;
  landing?: unknown;
}

export interface GenerationOption {
  value: string;
  label: string;
}

export interface SpecializedFormCatalog {
  spaceId: string;
  convocatorias: readonly ConvocatoriaRecord[];
  generations: readonly GenerationOption[];
  aliases: Readonly<Record<string, string>>;
  /** Formularios base que la siembra puede insertar. */
  createForms: (tenant: string) => readonly { _id: string }[];
  defaultFormIds: readonly string[];
  /** Plantillas que una convocatoria activa sustituye. */
  supersededFormIds: readonly string[];
}

export interface FormEffectInput {
  tenant: string;
  form: { _id: string; name: string; errorMessage: string };
  formId: string;
  data: Record<string, unknown>;
}

export interface FormEffectBeforeResult {
  data?: Record<string, unknown>;
  halt?: { status: number; body: unknown };
}

export interface FormEffectAfterInput extends FormEffectInput {
  submissionId?: string;
  message?: string;
}

export interface FormEffectAfterResult {
  /** Cuerpo completo. La ruta no agrega la respuesta genérica. */
  body?: unknown;
  extras?: Record<string, unknown>;
}

export interface SpecializedFormEffect {
  id: string;
  spaceId: string;
  matches: (form: { _id: string }, tenant: string) => boolean;
  /** `prepare` corre antes de normalizar. `guard` corre después. */
  beforePhase?: "prepare" | "guard";
  beforeSave?: (input: FormEffectInput) => Promise<FormEffectBeforeResult | void>;
  afterSave?: (input: FormEffectAfterInput) => Promise<FormEffectAfterResult | void>;
}

export type ResolvedFormEffect =
  | { status: "none" }
  | { status: "one"; effect: SpecializedFormEffect }
  | { status: "ambiguous" };

export type PublicFormKind = "congress" | "convocatoria" | "generic";

/**
 * El registro no inspecciona la ficha.
 * La variante conserva su tipo y la página lo vuelve a aplicar.
 */
type PublicFormDecorator = {
  apply(experience: unknown): unknown;
}["apply"];

export interface PublicFormResolution {
  kind: PublicFormKind;
  tone: "default" | "corporate";
  showBrandHeader: boolean;
  convocatoriaSlug?: string;
  decorate?: PublicFormDecorator;
  /** Dos extensiones reclamaron el mismo formulario. No se aplica ninguna. */
  ambiguous: boolean;
}

export interface PublicFormRegistration {
  id: string;
  spaceId: string;
  matches: (formId: string, tenantId: string) => boolean;
  resolve: (formId: string, tenantId: string) => Omit<PublicFormResolution, "ambiguous">;
}

export interface SpecializedNavPlacement {
  appId: string;
  navGroupId: string;
  insertNavAfter: string;
  navSequence: number;
  navItem: SpecializedNavItem;
  aliases: readonly string[];
}

export interface FocusedShellHit {
  appId: string;
  home: string;
  rules: SpecializedRouteRules;
}

type Phase = "open" | "sealing" | "ready" | "failed";

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => stable(item)).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right)
    );
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function sameList(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((item, index) => item === right[index]);
}

function assertManifestRegistration(input: SpecializedManifestRegistration): void {
  const manifest = input.manifest;
  const id = manifest.id?.trim() ?? "";
  if (!id || id !== manifest.id) throw new Error("La capacidad especializada necesita un id.");
  if (manifest.class !== "specialized") throw new Error(`${id} no es una capacidad especializada.`);
  if (!manifest.door?.anyPermission?.length) {
    throw new Error(`${id} no queda disponible: la puerta de autorización está incompleta.`);
  }
  if (!input.navGroupId?.trim() || !input.insertNavAfter?.trim()) {
    throw new Error(`${id} no queda disponible: no declara su lugar en la navegación.`);
  }
  if (!Number.isInteger(input.navSequence)) {
    throw new Error(`${id} no queda disponible: el orden de navegación está incompleto.`);
  }
  const item = input.navItem;
  if (!item?.id?.trim() || !item.href?.startsWith("/") || !item.label?.trim()) {
    throw new Error(`${id} no queda disponible: el ítem de navegación está incompleto.`);
  }
  if (!item.matchPrefixes?.length || item.matchPrefixes.some((prefix) => !prefix.startsWith("/"))) {
    throw new Error(`${id} no queda disponible: los prefijos de navegación están incompletos.`);
  }
  if (!sameList(item.requiredAnyPermission, manifest.door.anyPermission)) {
    throw new Error(`${id} no queda disponible: la navegación no usa la misma puerta.`);
  }
  for (const alias of input.aliases ?? []) {
    if (!alias.startsWith("/")) throw new Error(`${id} declara un alias que no es una ruta.`);
  }
}

function assertRouteRules(appId: string, rules: SpecializedRouteRules): void {
  if (
    typeof rules.allowsPath !== "function" ||
    typeof rules.focusedShell !== "function" ||
    typeof rules.allowsNavItem !== "function"
  ) {
    throw new Error(`${appId} no queda disponible: las reglas de ruta están incompletas.`);
  }
  if (rules.focusOrder != null && !Number.isInteger(rules.focusOrder)) {
    throw new Error(`${appId} declara un orden de shell inválido.`);
  }
}

function assertFormCatalog(catalog: SpecializedFormCatalog): void {
  const spaceId = catalog.spaceId?.trim() ?? "";
  if (!spaceId || spaceId !== catalog.spaceId) {
    throw new Error("El catálogo de formularios no declara el Espacio.");
  }
  if (!Array.isArray(catalog.convocatorias) || !Array.isArray(catalog.generations)) {
    throw new Error(`${spaceId} no queda disponible: el catálogo de formularios está incompleto.`);
  }
  if (typeof catalog.createForms !== "function" || !Array.isArray(catalog.defaultFormIds)) {
    throw new Error(`${spaceId} no queda disponible: la siembra de formularios está incompleta.`);
  }
  if (!Array.isArray(catalog.supersededFormIds) || catalog.aliases == null) {
    throw new Error(`${spaceId} no queda disponible: el catálogo de formularios está incompleto.`);
  }
}

function assertFormEffect(effect: SpecializedFormEffect): void {
  const id = effect.id?.trim() ?? "";
  const spaceId = effect.spaceId?.trim() ?? "";
  if (!id || !spaceId || spaceId !== effect.spaceId) {
    throw new Error("El efecto de formulario no declara id y Espacio.");
  }
  if (typeof effect.matches !== "function") {
    throw new Error(`${id} no queda disponible: no puede reconocer su formulario.`);
  }
  if (typeof effect.beforeSave !== "function" && typeof effect.afterSave !== "function") {
    throw new Error(`${id} no queda disponible: el efecto no declara qué hace.`);
  }
  if (effect.beforePhase != null && effect.beforePhase !== "prepare" && effect.beforePhase !== "guard") {
    throw new Error(`${id} declara una fase de envío desconocida.`);
  }
}

function assertPublicForm(variant: PublicFormRegistration): void {
  const id = variant.id?.trim() ?? "";
  const spaceId = variant.spaceId?.trim() ?? "";
  if (!id || !spaceId || spaceId !== variant.spaceId) {
    throw new Error("La variante pública no declara id y Espacio.");
  }
  if (typeof variant.matches !== "function" || typeof variant.resolve !== "function") {
    throw new Error(`${id} no queda disponible: la variante pública está incompleta.`);
  }
}

export interface CapabilityRegistry {
  specializedIds: string[];
  setInstaller: (install: () => void) => void;
  /** Fichas que se publican al leer, aunque ningún instalador haya corrido. */
  addManifestSeed: (entries: readonly SpecializedManifestRegistration[]) => void;
  ensure: () => void;
  registerSpecializedManifest: (input: SpecializedManifestRegistration) => void;
  registerRouteRules: (appId: string, rules: SpecializedRouteRules) => void;
  registerFormCatalog: (catalog: SpecializedFormCatalog) => void;
  registerFormEffect: (effect: SpecializedFormEffect) => void;
  registerPublicForm: (variant: PublicFormRegistration) => void;
  manifests: () => readonly AppManifest[];
  manifest: (appId: string) => AppManifest | null;
  routeRulesFor: (appId: string) => SpecializedRouteRules | null;
  formCatalogFor: (spaceId: string) => SpecializedFormCatalog | null;
  formCatalogs: () => readonly SpecializedFormCatalog[];
  resolveFormEffect: (form: { _id: string }, tenant: string) => ResolvedFormEffect;
  resolvePublicForm: (formId: string, tenantId: string) => PublicFormResolution;
  navPlacements: () => readonly SpecializedNavPlacement[];
  specializedAppForAlias: (pathname: string) => string | null;
  focusedShells: (permissions: readonly string[], roleCodes: readonly string[]) => FocusedShellHit[];
  generationOverlay: () => { aliases: Record<string, string>; labels: Record<string, string> };
}

export function createCapabilityRegistry(options: {
  transversal: readonly AppManifest[];
  contractableOrder: readonly string[];
}): CapabilityRegistry {
  const specializedIds: string[] = [];
  let phase: Phase = "open";
  let failure: unknown = null;
  let installer: (() => void) | null = null;
  let behaviorInstalled = false;
  const manifestSeed: SpecializedManifestRegistration[] = [];
  const pendingManifests = new Map<string, SpecializedManifestRegistration>();
  const publishedManifests = new Map<string, SpecializedManifestRegistration>();
  const routeRules = new Map<string, SpecializedRouteRules>();
  const formCatalogs = new Map<string, SpecializedFormCatalog>();
  const formEffects: SpecializedFormEffect[] = [];
  const publicForms: PublicFormRegistration[] = [];

  function closeFailed(error: unknown): void {
    pendingManifests.clear();
    publishedManifests.clear();
    routeRules.clear();
    formCatalogs.clear();
    formEffects.length = 0;
    publicForms.length = 0;
    specializedIds.length = 0;
    phase = "failed";
    failure = error;
  }

  function publishedList(): SpecializedManifestRegistration[] {
    return [...publishedManifests.values()].sort((left, right) =>
      left.manifest.id.localeCompare(right.manifest.id)
    );
  }

  function publish(): void {
    const specialized = [...pendingManifests.values()]
      .map((entry) => entry.manifest)
      .sort((left, right) => left.id.localeCompare(right.id));
    validateCatalog([...options.transversal, ...specialized], options.contractableOrder);
    publishedManifests.clear();
    for (const entry of pendingManifests.values()) {
      publishedManifests.set(entry.manifest.id, entry);
    }
    specializedIds.length = 0;
    specializedIds.push(...specialized.map((item) => item.id));
    phase = "ready";
  }

  function requireOpen(action: string): void {
    if (phase === "failed") throw failure;
    if (phase === "ready") {
      throw new Error(`Registro cerrado: no se puede ${action}.`);
    }
  }

  const registry: CapabilityRegistry = {
    specializedIds,

    setInstaller(install) {
      if (phase === "failed") throw failure;
      if (typeof install !== "function") throw new Error("El instalador de capacidades está incompleto.");
      if (phase === "ready") {
        if (behaviorInstalled) {
          installer = install;
          return;
        }
        phase = "sealing";
        let caught: unknown;
        try {
          install();
          for (const appId of routeRules.keys()) {
            if (!pendingManifests.has(appId) && !publishedManifests.has(appId)) {
              throw new Error(`${appId} tiene reglas de ruta sin una capacidad publicada.`);
            }
          }
          behaviorInstalled = true;
          installer = install;
          phase = "ready";
        } catch (error) {
          caught = error;
        }
        if (caught) {
          closeFailed(caught);
          throw caught;
        }
        return;
      }
      if (phase !== "open") throw new Error("Registro cerrado: el instalador ya no puede cambiar.");
      installer = install;
    },

    addManifestSeed(entries) {
      if (phase === "failed") throw failure;
      if (phase !== "open") throw new Error("Registro cerrado: las fichas ya no se agregan.");
      manifestSeed.push(...entries);
    },

    ensure() {
      if (phase === "ready") return;
      if (phase === "failed") throw failure;
      if (!installer && manifestSeed.length === 0) return;
      if (phase === "sealing") throw new Error("El registro de capacidades se reentró.");
      phase = "sealing";
      let caught: unknown;
      try {
        for (const entry of manifestSeed) registry.registerSpecializedManifest(entry);
        if (installer) {
          installer();
          behaviorInstalled = true;
        }
        for (const appId of routeRules.keys()) {
          if (!pendingManifests.has(appId)) {
            throw new Error(`${appId} tiene reglas de ruta sin una capacidad publicada.`);
          }
        }
        publish();
      } catch (error) {
        caught = error;
      }
      if (caught) {
        closeFailed(caught);
        throw caught;
      }
    },

    registerSpecializedManifest(input) {
      assertManifestRegistration(input);
      const normalized: SpecializedManifestRegistration = {
        ...input,
        aliases: [...(input.aliases ?? [])],
        navItem: {
          ...input.navItem,
          matchPrefixes: [...input.navItem.matchPrefixes],
          requiredAnyPermission: [...input.navItem.requiredAnyPermission],
        },
      };
      const id = normalized.manifest.id;
      const stored = phase === "ready" ? publishedManifests.get(id) : pendingManifests.get(id);
      if (stored) {
        if (stable(stored) === stable(normalized)) return;
        throw new Error(`${id} ya está registrada con otros datos.`);
      }
      if (phase === "failed") throw failure;
      if (phase === "ready") throw new Error("Registro cerrado: la capacidad no se agrega después.");
      const transversal = options.transversal.some((item) => item.id === id);
      if (transversal) throw new Error(`${id} ya pertenece al catálogo transversal.`);
      pendingManifests.set(id, normalized);
    },

    registerRouteRules(appId, rules) {
      const id = appId.trim();
      assertRouteRules(id, rules);
      if (!pendingManifests.has(id) && !publishedManifests.has(id)) {
        throw new Error(`${id} no puede declarar reglas sin una capacidad registrada.`);
      }
      const current = routeRules.get(id);
      if (current) {
        if (
          current.allowsPath === rules.allowsPath &&
          current.focusedShell === rules.focusedShell &&
          current.allowsNavItem === rules.allowsNavItem &&
          current.focusOrder === rules.focusOrder
        ) {
          return;
        }
        throw new Error(`${id} ya tiene otras reglas de ruta.`);
      }
      requireOpen("registrar reglas");
      routeRules.set(id, rules);
    },

    registerFormCatalog(catalog) {
      assertFormCatalog(catalog);
      const current = formCatalogs.get(catalog.spaceId);
      if (current) {
        if (current === catalog) return;
        throw new Error(`${catalog.spaceId} ya tiene otro catálogo de formularios.`);
      }
      requireOpen("registrar el catálogo");
      formCatalogs.set(catalog.spaceId, catalog);
    },

    registerFormEffect(effect) {
      assertFormEffect(effect);
      const current = formEffects.find((item) => item.id === effect.id);
      if (current) {
        if (
          current.spaceId === effect.spaceId &&
          current.matches === effect.matches &&
          current.beforeSave === effect.beforeSave &&
          current.afterSave === effect.afterSave &&
          current.beforePhase === effect.beforePhase
        ) {
          return;
        }
        throw new Error(`${effect.id} ya está registrado con otro efecto.`);
      }
      requireOpen("registrar el efecto");
      formEffects.push(effect);
    },

    registerPublicForm(variant) {
      assertPublicForm(variant);
      const current = publicForms.find((item) => item.id === variant.id);
      if (current) {
        if (
          current.spaceId === variant.spaceId &&
          current.matches === variant.matches &&
          current.resolve === variant.resolve
        ) {
          return;
        }
        throw new Error(`${variant.id} ya está registrada con otra variante pública.`);
      }
      requireOpen("registrar la variante pública");
      publicForms.push(variant);
    },

    manifests() {
      registry.ensure();
      return publishedList().map((entry) => entry.manifest);
    },

    manifest(appId) {
      registry.ensure();
      return publishedManifests.get(appId)?.manifest ?? null;
    },

    routeRulesFor(appId) {
      registry.ensure();
      if (!publishedManifests.has(appId)) return null;
      return routeRules.get(appId) ?? null;
    },

    formCatalogFor(spaceId) {
      registry.ensure();
      return formCatalogs.get(spaceId.trim()) ?? null;
    },

    formCatalogs() {
      registry.ensure();
      return [...formCatalogs.values()].sort((left, right) => left.spaceId.localeCompare(right.spaceId));
    },

    resolveFormEffect(form, tenant) {
      registry.ensure();
      const tenantId = tenant.trim();
      if (!tenantId || tenantId !== tenant) return { status: "none" };
      const hits = formEffects.filter(
        (effect) => effect.spaceId === tenantId && effect.matches(form, tenantId) === true
      );
      if (hits.length > 1) return { status: "ambiguous" };
      if (hits.length === 0) return { status: "none" };
      if (hits[0].spaceId !== tenantId) return { status: "none" };
      return { status: "one", effect: hits[0] };
    },

    resolvePublicForm(formId, tenantId) {
      registry.ensure();
      const tenant = tenantId.trim();
      const generic: PublicFormResolution = {
        kind: "generic",
        tone: "default",
        showBrandHeader: true,
        ambiguous: false,
      };
      if (!tenant || tenant !== tenantId) return { ...generic, ambiguous: true };
      const hits = publicForms.filter(
        (variant) => variant.spaceId === tenant && variant.matches(formId, tenant) === true
      );
      if (hits.length !== 1) return { ...generic, ambiguous: hits.length > 1 };
      const resolved = hits[0].resolve(formId, tenant);
      if (hits[0].spaceId !== tenant) return { ...generic, ambiguous: true };
      return { ...resolved, ambiguous: false };
    },

    navPlacements() {
      registry.ensure();
      return publishedList().map((entry) => ({
        appId: entry.manifest.id,
        navGroupId: entry.navGroupId,
        insertNavAfter: entry.insertNavAfter,
        navSequence: entry.navSequence,
        navItem: entry.navItem,
        aliases: entry.aliases ?? [],
      }));
    },

    specializedAppForAlias(pathname) {
      registry.ensure();
      const path = pathname.trim();
      if (!path) return null;
      let found: { id: string; length: number } | null = null;
      for (const entry of publishedManifests.values()) {
        for (const alias of entry.aliases ?? []) {
          if (path !== alias && !path.startsWith(`${alias}/`)) continue;
          if (!found || alias.length > found.length) found = { id: entry.manifest.id, length: alias.length };
        }
      }
      return found?.id ?? null;
    },

    focusedShells(permissions, roleCodes) {
      registry.ensure();
      const hits: FocusedShellHit[] = [];
      for (const [appId, rules] of routeRules) {
        if (rules.focusOrder == null || !publishedManifests.has(appId)) continue;
        if (rules.focusedShell(permissions, roleCodes) !== true) continue;
        const open = publishedManifests.get(appId)?.manifest.open;
        if (!open || open.type !== "internal") continue;
        hits.push({ appId, home: open.href, rules });
      }
      hits.sort(
        (left, right) =>
          (left.rules.focusOrder ?? 0) - (right.rules.focusOrder ?? 0) ||
          left.appId.localeCompare(right.appId)
      );
      return hits;
    },

    generationOverlay() {
      registry.ensure();
      const aliases: Record<string, string> = {};
      const labels: Record<string, string> = {};
      for (const catalog of [...formCatalogs.values()].sort((left, right) =>
        left.spaceId.localeCompare(right.spaceId)
      )) {
        Object.assign(aliases, catalog.aliases);
        for (const option of catalog.generations) labels[option.value] = option.label;
      }
      return { aliases, labels };
    },
  };

  return registry;
}

const platform = createCapabilityRegistry({
  transversal: APP_MANIFESTS,
  contractableOrder: MENTOR_APPS,
});

export const SPECIALIZED_APPS = platform.specializedIds;

export function setSpecializedCapabilityInstaller(install: () => void): void {
  platform.setInstaller(install);
}

/** Las mismas fichas que declara cada capacidad. No es otro catálogo. */
export function installPlatformManifests(
  entries: readonly SpecializedManifestRegistration[]
): void {
  platform.addManifestSeed(entries);
}

export function ensureSpecializedCapabilities(): void {
  platform.ensure();
}

export function registerSpecializedManifest(input: SpecializedManifestRegistration): void {
  platform.registerSpecializedManifest(input);
}

export function registerRouteRules(appId: string, rules: SpecializedRouteRules): void {
  platform.registerRouteRules(appId, rules);
}

export function registerFormCatalog(catalog: SpecializedFormCatalog): void {
  platform.registerFormCatalog(catalog);
}

export function registerFormEffect(effect: SpecializedFormEffect): void {
  platform.registerFormEffect(effect);
}

export function registerPublicForm(variant: PublicFormRegistration): void {
  platform.registerPublicForm(variant);
}

export function specializedManifests(): readonly AppManifest[] {
  return platform.manifests();
}

export function formCatalogFor(spaceId: string): SpecializedFormCatalog | null {
  return platform.formCatalogFor(spaceId);
}

export function registeredFormCatalogs(): readonly SpecializedFormCatalog[] {
  return platform.formCatalogs();
}

export function resolveFormEffect(form: { _id: string }, tenant: string): ResolvedFormEffect {
  return platform.resolveFormEffect(form, tenant);
}

export function resolvePublicForm(formId: string, tenantId: string): PublicFormResolution {
  return platform.resolvePublicForm(formId, tenantId);
}

export function routeRulesFor(appId: string): SpecializedRouteRules | null {
  return platform.routeRulesFor(appId);
}

export function specializedNavPlacements(): readonly SpecializedNavPlacement[] {
  return platform.navPlacements();
}

export function specializedAppForAlias(pathname: string): string | null {
  return platform.specializedAppForAlias(pathname);
}

export function focusedShells(
  permissions: readonly string[],
  roleCodes: readonly string[]
): FocusedShellHit[] {
  return platform.focusedShells(permissions, roleCodes);
}

export function generationOverlay(): { aliases: Record<string, string>; labels: Record<string, string> } {
  return platform.generationOverlay();
}
