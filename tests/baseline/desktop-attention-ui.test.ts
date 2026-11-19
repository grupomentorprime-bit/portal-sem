import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();
const src = () =>
  readFileSync(resolve(root, "src/components/desktop/DesktopAttention.tsx"), "utf8");
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
    assert.match(css(), /position:\s*absolute/);
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