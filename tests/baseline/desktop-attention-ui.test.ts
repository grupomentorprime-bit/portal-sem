import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();
const src = () =>
  [
    "src/components/desktop/DesktopAttention.tsx",
    "src/components/desktop/PlatformAttention.tsx",
    "src/components/desktop/attention-attach.tsx",
  ]
    .map((file) => readFileSync(resolve(root, file), "utf8"))
    .join("\n");
const css = () =>
  readFileSync(resolve(root, "src/components/desktop/mentor-desktop.css"), "utf8");

describe("Atención UI — Plataforma", () => {
  it("Nuevo ticket usa Seleccionar empresa y no Elige una empresa", () => {
    const text = src();
    assert.match(text, /Seleccionar empresa/);
    assert.doesNotMatch(text, /Elige una empresa/);
  });

  it("la ventana de Plataforma se titula Atención · Plataforma", () => {
    assert.match(src(), /Atención · Plataforma/);
  });

  it("Filtros tiene Aplicar y Limpiar, y el panel es flotante en CSS", () => {
    const text = src();
    assert.match(text, />Aplicar</);
    assert.match(text, />Limpiar</);
    assert.match(css(), /\.attn-filter-float/);
    assert.match(css(), /\.attn-filter-float\s*\{[^}]*position:\s*absolute/);
  });

  it("Compose se remonta con composeSession", () => {
    assert.match(src(), /composeSession/);
    assert.match(src(), /key=\{composeSession\}/);
  });

  it("el ticket acepta pegar, arrastrar e imagen o PDF", () => {
    const text = src();
    assert.match(text, /addEventListener\("paste"/);
    assert.match(text, /application\/pdf/);
    assert.match(text, /Arrastra aquí, pega \(Ctrl\+V\) o elige/);
    assert.match(text, /\.doc/);
    assert.match(css(), /\.attn-dropzone/);
  });

  it("Nuevo ticket ocupa el cuerpo, separa usuario y contacto, y deja el pie fijo", () => {
    const text = src();
    const intake = text.slice(text.indexOf('aria-label="Nuevo ticket"'), text.indexOf('aria-label="Enviar informe"'));
    const empresa = intake.indexOf(">Empresa");
    const solicitante = intake.indexOf(">Solicitante");
    const usuario = intake.indexOf("Elegir usuario de la empresa");
    const contacto = intake.indexOf("Registrar contacto sin cuenta");
    const canal = intake.indexOf("Canal de origen");
    const asunto = intake.indexOf(">Asunto");
    const description = intake.indexOf('aria-label="Descripción"');
    const attach = intake.indexOf("plat-drawer-attach");
    const footer = intake.lastIndexOf("<footer>");
    assert.ok(empresa >= 0 && empresa < solicitante && solicitante < usuario && usuario < contacto && contacto < canal && canal < asunto && asunto < description && description < attach && attach < footer);
    assert.match(intake, /mode === "user" && tenantId/);
    assert.match(intake, /mode === "contact" && tenantId/);
    assert.match(intake, /setContactName\(person\?\.name \?\? ""\)/);
    assert.match(intake, /Cuenta · \{chosen\.email\}/);
    assert.match(intake, /rows=\{6\}/);
    assert.match(text, /closeComposer/);
    assert.match(text, /viewMemory/);
    assert.match(css(), /\.plat-stage\.is-intake > \.plat-drawer\.is-intake/);
    assert.match(css(), /\.plat-intake-copy\s*\{[^}]*min-height:\s*108px/);
    const send = text.slice(text.indexOf('aria-label="Enviar informe"'));
    assert.ok(send.indexOf("plat-send-meta") > send.indexOf("plat-drawer-body"));
    assert.ok(send.lastIndexOf("<footer>") > send.indexOf("plat-send-meta"));
  });

  it("los filtros de Plataforma pueden reordenarse y la pestaña activa conserva el azul", () => {
    const styles = css();
    assert.match(styles, /\.plat-tools\s*\{[^}]*flex-wrap:\s*wrap/);
    assert.match(styles, /\.plat-tabs > button:not\(\.primary\):not\(\.ghost\)\.is-on\s*\{[^}]*background:\s*#e7eeff/);
    assert.match(styles, /\.plat-bar\s*\{[^}]*backdrop-filter:\s*blur/);
    assert.match(styles, /grid-template-columns:\s*minmax\(0,\s*1\.7fr\)/);
  });

  it("la cola de Plataforma abre en Por atender, compacta, y el detalle no reemplaza la lista", () => {
    const platform = readFileSync(resolve(root, "src/components/desktop/PlatformAttention.tsx"), "utf8");
    assert.match(platform, /useState<QueueView>\("por_atender"\)/);
    assert.match(platform, /aria-label="Cola de tickets"/);
    assert.match(platform, /plat-queue-meta/);
    assert.match(platform, /plat-scroll/);
    assert.match(css(), /-webkit-line-clamp:\s*2/);
    assert.match(css(), /\.plat-scroll\s*\{[^}]*overflow-x:\s*hidden/);
    assert.match(platform, /Pedir confirmación/);
    assert.match(platform, /Pasar a ticket/);
    assert.doesNotMatch(platform, /Bandeja de tickets/);
    assert.match(css(), /\.plat-scroll\s*\{[^}]*overflow:\s*auto/);
  });

  it("la mesa Plataforma usa is-platform-capsule y CSS scoped, sin tocar live-chat ni empresa", () => {
    const text = src();
    const styles = css();
    assert.match(text, /is-platform-capsule/);
    assert.match(text, /globalDesk/);
    assert.match(styles, /\.ajustes-window\.is-platform-capsule/);
    assert.match(styles, /\.ajustes-window\.is-platform-capsule\s+\.attn-inbox/);
    assert.match(styles, /\.ajustes-window\.is-platform-capsule\s+\.attn-stage/);
    assert.match(styles, /@keyframes\s+attn-capsule-in/);
    assert.doesNotMatch(styles, /\.live-chat-sheet\.is-platform-capsule/);
    assert.doesNotMatch(styles, /\.is-attention-company\.is-platform-capsule/);
  });
});