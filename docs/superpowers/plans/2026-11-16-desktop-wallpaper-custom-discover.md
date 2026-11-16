# Fondo propio visible en Preferencias Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** En Mi cuenta → Preferencias, el fondo propio se descubre en la misma fila de miniaturas (tile «+») y al cargar se muestran las medidas de la imagen.

**Architecture:** Reusar la subida y validación ya existentes (`wallpaper-upload`, `wallpaper-file`, `POST /api/desktop/wallpaper`). Solo cambia la UI de Preferencias: el `label` de archivo pasa a un tile dentro de `.wall-choices`, se quita el botón azul duplicado y el test de baseline exige el nuevo markup.

**Tech Stack:** React (DesktopAccount), CSS en `mentor-desktop.css`, Node test runner (`tsx --test`), TypeScript.

**Spec:** `docs/superpowers/specs/2026-11-16-desktop-wallpaper-custom-discover-design.md`

## Global Constraints

- Sin cambios de API ni de reglas de validación (JPG/PNG/WebP, 8 MB, mín. 640×360, recomendado 1920×1080).
- Nota fija `WALLPAPER_SIZE_HINT` arriba de la fila.
- Tile «+» abre el file picker; no es un radio de selección de fondo.
- Si hay custom: tile «Mío» + tile «+» con etiqueta «Cambiar»; «Quitar» debajo.
- Sin galería múltiple, recorte ni fondos por empresa.
- Worktree actual: `C:\Users\semip\Proyectos\portal-sem\.worktrees\escritorio-mentor-prime`.

## File map

| File | Responsibility |
| --- | --- |
| `tests/baseline/desktop-wallpaper-upload.test.ts` | Exige markup de descubrimiento (tile + medidas). |
| `src/components/desktop/DesktopAccount.tsx` | Fila de fondos con tile «+» / «Cambiar»; sin botón azul suelto. |
| `src/components/desktop/mentor-desktop.css` | Estilo del tile de agregar y grilla que aguanta 6–7 celdas. |

---

### Task 1: Tile «+» en Preferencias y test de descubrimiento

**Files:**
- Modify: `tests/baseline/desktop-wallpaper-upload.test.ts`
- Modify: `src/components/desktop/DesktopAccount.tsx` (bloque Fondo del escritorio)
- Modify: `src/components/desktop/mentor-desktop.css` (`.wall-choices` / `.wall-add`)

**Interfaces:**
- Consumes: `WALLPAPER_SIZE_HINT`, `wallpaperLoadedText`, `wallpaperFileError`, `wallpaperDimensionError`, `onWallpaperFile` (ya en el componente); `customUrl`, `wallStatus`
- Produces: markup con `className="wall-add"` y texto «Agregar» o «Cambiar»; sin string «Agregar mi fondo»

- [ ] **Step 1: Write the failing test assertions**

En `tests/baseline/desktop-wallpaper-upload.test.ts`, dentro del primer `it("indica la medida recomendada...")`, **reemplazar** las aserciones de markup del account:

```ts
    const account = readFileSync(
      resolve(process.cwd(), "src/components/desktop/DesktopAccount.tsx"),
      "utf8"
    );
    assert.match(account, /WALLPAPER_SIZE_HINT/);
    assert.match(account, /wallpaperLoadedText/);
    assert.match(account, /className="wall-add"/);
    assert.match(account, />Agregar</);
    assert.match(account, />Cambiar</);
    assert.doesNotMatch(account, /Agregar mi fondo/);
    assert.doesNotMatch(account, /Cambiar mi fondo/);
    assert.match(account, /Quitar/);
```

Dejar intacto el resto del test (hint, dimension errors, route multipart).

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx tsx --test tests/baseline/desktop-wallpaper-upload.test.ts
```

Expected: FAIL — no encuentra `className="wall-add"` y/o sigue encontrando `Agregar mi fondo`.

- [ ] **Step 3: Update DesktopAccount wallpaper UI**

En `src/components/desktop/DesktopAccount.tsx`, reemplazar el bloque de la sección fondo (desde `<div className="wall-choices"...` hasta el cierre de `form-actions` del wallpaper) por:

```tsx
                <div className="wall-choices" role="radiogroup" aria-label="Fondo del escritorio">
                  {wallpaperChoices().map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={wallpaper === item.id}
                      className={wallpaper === item.id ? "is-on" : undefined}
                      disabled={wallStatus === "saving"}
                      onClick={() => void pickWallpaper(item.id)}
                      style={{ backgroundImage: `url("${wallpaperSrc(item.id)}")` }}
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}
                  {customUrl ? (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={wallpaper === "custom"}
                      className={wallpaper === "custom" ? "is-on" : undefined}
                      disabled={wallStatus === "saving"}
                      onClick={() => void pickCustom()}
                      style={{ backgroundImage: `url("${customUrl}")` }}
                    >
                      <span>Mío</span>
                    </button>
                  ) : null}
                  <label
                    className={
                      wallStatus === "saving" ? "wall-add is-busy" : "wall-add"
                    }
                  >
                    <span aria-hidden="true">+</span>
                    <span>
                      {wallStatus === "saving"
                        ? "Guardando…"
                        : customUrl
                          ? "Cambiar"
                          : "Agregar"}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                      onChange={(event) => void onWallpaperFile(event)}
                      disabled={wallStatus === "saving"}
                    />
                  </label>
                </div>
                {customUrl ? (
                  <div className="form-actions">
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => void removeCustom()}
                      disabled={wallStatus === "saving"}
                    >
                      Quitar
                    </button>
                  </div>
                ) : null}
                {wallError ? (
                  <p className="form-error" role="alert">
                    {wallError}
                  </p>
                ) : null}
                {wallAlert ? (
                  <p className="form-ok" role="status">
                    {wallAlert}
                  </p>
                ) : null}
```

Mantener arriba, sin mover:

```tsx
                <p className="field-label">Fondo del escritorio</p>
                <p className="lead">Se guarda en tu cuenta y acompaña el cambio de empresa.</p>
                <p className="account-note">{WALLPAPER_SIZE_HINT}</p>
```

No tocar `onWallpaperFile`: ya llama `wallpaperLoadedText` con las medidas al cargar.

- [ ] **Step 4: Style the add tile**

En `src/components/desktop/mentor-desktop.css`, **reemplazar** el bloque `.wall-choices` / `.file-btn` de cuenta por:

```css
.wall-choices { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 8px; }
.wall-choices button,
.wall-choices .wall-add {
  position: relative;
  aspect-ratio: 1.2;
  border: 2px solid transparent;
  border-radius: 14px;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  overflow: hidden;
  padding: 0;
}
.wall-choices button::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 35%, rgba(8,12,20,.72));
}
.wall-choices button span {
  position: absolute;
  z-index: 1;
  left: 8px;
  right: 8px;
  bottom: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0,0,0,.45);
}
.wall-choices button.is-on {
  border-color: var(--nelzuri-azul-digital);
  box-shadow: 0 0 0 2px rgba(47, 91, 255, .25);
}
.wall-choices button:disabled { opacity: .7; cursor: default; }
.wall-choices .wall-add {
  display: grid;
  place-content: center;
  gap: 2px;
  border-style: dashed;
  border-color: color-mix(in srgb, var(--nelzuri-azul-digital) 45%, #c5c0d4);
  background: color-mix(in srgb, var(--nelzuri-azul-digital) 8%, #fff);
  color: var(--nelzuri-azul-digital);
  text-align: center;
}
.wall-choices .wall-add > span:first-of-type {
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
}
.wall-choices .wall-add > span:last-of-type {
  font-size: 12px;
  font-weight: 700;
}
.wall-choices .wall-add input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
.wall-choices .wall-add.is-busy { opacity: .65; cursor: default; }
.account-pane .text-btn {
  border: 0;
  background: transparent;
  color: #b91c1c;
  font: inherit;
  font-weight: 650;
  cursor: pointer;
  padding: 0;
}
.account-pane .text-btn:disabled { opacity: .65; cursor: default; }
```

En el `@media (max-width: 800px)`, **eliminar** la regla `.wall-choices { grid-template-columns: repeat(3, minmax(0, 1fr)); }` (auto-fill ya responde).

Si `.account-pane .file-btn` queda sin usos, bórralo en este mismo paso.

- [ ] **Step 5: Run tests to verify they pass**

Run:

```bash
npx tsx --test tests/baseline/desktop-wallpaper-upload.test.ts
```

Expected: PASS (ambos `it`).

Verificación manual en `http://localhost:3001/escritorio` → Mi cuenta → Preferencias:

1. Se ve la nota 1920 × 1080 y el tile **+ / Agregar** en la misma fila.
2. Al elegir una imagen válida, aparece «Tu imagen mide … × … px».
3. Con fondo propio: tile **Mío**, **+ / Cambiar**, y **Quitar**.

- [ ] **Step 6: Commit**

```bash
git add tests/baseline/desktop-wallpaper-upload.test.ts src/components/desktop/DesktopAccount.tsx src/components/desktop/mentor-desktop.css
git commit --trailer "Co-authored-by: Cursor <cursoragent@cursor.com>" -m "feat(desktop): tile + para agregar fondo con medidas visibles"
```

---

## Spec coverage (self-review)

| Spec | Task |
| --- | --- |
| Tile + / Agregar en la fila | Task 1 |
| + → Cambiar si hay custom; Mío sigue | Task 1 |
| Quitar el botón azul duplicado | Task 1 |
| Nota 1920×1080 arriba | ya existe; Task 1 la conserva |
| Mensaje con medidas al cargar | ya en `onWallpaperFile`; test lo exige |
| Sin cambios API / límites | Global Constraints |
| Fuera de alcance (galería, crop, por empresa) | no hay tareas |

## Placeholder scan

Sin TBD / «implement later» / tests vagos.
