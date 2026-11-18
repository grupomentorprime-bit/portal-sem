import { isMentorAppId, type DockAppId } from "@/lib/desktop/catalog";

export type DeskIconSpot = {
  appId: DockAppId;
  /** Porcentaje del ancho de la mesa. */
  x: number;
  /** Porcentaje del alto de la mesa. */
  y: number;
};

export function isDockAppId(value: string): value is DockAppId {
  return value === "atencion" || value === "clientes" || value === "ajustes" || isMentorAppId(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseSpot(value: unknown): DeskIconSpot | null {
  if (!value || typeof value !== "object") return null;
  const appId = (value as { appId?: unknown }).appId;
  const x = (value as { x?: unknown }).x;
  const y = (value as { y?: unknown }).y;
  if (typeof appId !== "string" || !isDockAppId(appId)) return null;
  if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  return { appId, x: clamp(x, 4, 94), y: clamp(y, 14, 78) };
}

/** `null` significa que la persona todavía no acomodó la mesa. */
export function parseDesktopLayout(value: unknown): DeskIconSpot[] | null {
  if (value == null) return null;
  if (!Array.isArray(value) || value.length > 12) return null;
  const spots: DeskIconSpot[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const spot = parseSpot(item);
    if (!spot || seen.has(spot.appId)) return null;
    seen.add(spot.appId);
    spots.push(spot);
  }
  return spots;
}

/** Casilleros lógicos. La distancia visible se calcula en píxeles, igual en los dos ejes. */
const GRID_X = [8, 18, 28, 38, 48, 58, 68, 78, 88] as const;
const GRID_Y = [16, 28, 40, 52, 64, 76] as const;

/** El botón mide 92×86. El hueco entre uno y otro es el mismo número en horizontal y en vertical. */
export const DESK_ICON_WIDTH = 92;
export const DESK_ICON_HEIGHT = 86;
export const DESK_ICON_GAP = 36;
const DESK_GRID_ORIGIN_X = 78;
const DESK_GRID_ORIGIN_Y = 108;
const DESK_DOCK_CLEAR = 168;

export function deskIconGap(desk: { width: number; height: number }): number {
  const gapY =
    (desk.height - DESK_GRID_ORIGIN_Y - DESK_DOCK_CLEAR - DESK_ICON_HEIGHT * GRID_Y.length) /
    (GRID_Y.length - 1);
  const gapX =
    (desk.width - DESK_GRID_ORIGIN_X - DESK_ICON_WIDTH / 2 - DESK_ICON_WIDTH * (GRID_X.length - 1) - 24) /
    (GRID_X.length - 1);
  return Math.max(20, Math.min(DESK_ICON_GAP, Math.floor(gapX), Math.floor(gapY)));
}

/** `left` es el centro del icono; `top` es su borde superior. El aire entre iconos coincide. */
export function deskIconPixels(
  spot: DeskIconSpot,
  desk: { width: number; height: number },
): { left: number; top: number } {
  const gap = deskIconGap(desk);
  const { col, row } = spotCell(spot);
  return {
    left: DESK_GRID_ORIGIN_X + col * (DESK_ICON_WIDTH + gap),
    top: DESK_GRID_ORIGIN_Y + row * (DESK_ICON_HEIGHT + gap),
  };
}

function cellKey(col: number, row: number): string {
  return `${col}:${row}`;
}

export function spotCell(spot: DeskIconSpot): { col: number; row: number } {
  const stepX = GRID_X[1] - GRID_X[0];
  const stepY = GRID_Y[1] - GRID_Y[0];
  return {
    col: clamp(Math.round((spot.x - GRID_X[0]) / stepX), 0, GRID_X.length - 1),
    row: clamp(Math.round((spot.y - GRID_Y[0]) / stepY), 0, GRID_Y.length - 1),
  };
}

function spotFromCell(appId: DockAppId, col: number, row: number): DeskIconSpot {
  return { appId, x: GRID_X[col] ?? GRID_X[0], y: GRID_Y[row] ?? GRID_Y[0] };
}

function cellDistance(col: number, row: number, aimCol: number, aimRow: number): number {
  return (col - aimCol) ** 2 + (row - aimRow) ** 2;
}

/** Casillero libre más cercano a donde se ve el icono. No empuja ni reemplaza a otro. */
export function nearestFreeCell(input: {
  col: number;
  row: number;
  taken: ReadonlySet<string>;
  at?: { x: number; y: number; pitchX: number; pitchY: number };
}): { col: number; row: number } | null {
  let best: { col: number; row: number; dist: number } | null = null;
  for (let row = 0; row < GRID_Y.length; row += 1) {
    for (let col = 0; col < GRID_X.length; col += 1) {
      if (input.taken.has(cellKey(col, row))) continue;
      const dist = input.at
        ? (DESK_GRID_ORIGIN_X + col * input.at.pitchX - input.at.x) ** 2 +
          (DESK_GRID_ORIGIN_Y + row * input.at.pitchY + 32 - input.at.y) ** 2
        : cellDistance(col, row, input.col, input.row);
      const closer =
        !best ||
        dist < best.dist ||
        (dist === best.dist && (row < best.row || (row === best.row && col < best.col)));
      if (closer) best = { col, row, dist };
    }
  }
  return best ? { col: best.col, row: best.row } : null;
}

/**
 * Cada icono ocupa su casillero. Si dos caían en el mismo, el que ya estaba se queda
 * y el otro pasa al libre más cercano. No se intercambian.
 */
export function regulateDeskIcons(spots: readonly DeskIconSpot[]): DeskIconSpot[] {
  const taken = new Set<string>();
  const placed = new Map<string, DeskIconSpot>();
  for (const spot of spots) {
    const raw = spotCell(spot);
    const cell = nearestFreeCell({ col: raw.col, row: raw.row, taken }) ?? raw;
    taken.add(cellKey(cell.col, cell.row));
    placed.set(spot.appId, spotFromCell(spot.appId, cell.col, cell.row));
  }
  return spots
    .filter((spot) => placed.has(spot.appId))
    .map((spot) => placed.get(spot.appId)!);
}

export function cellUnderPointer(input: {
  clientX: number;
  clientY: number;
  deskLeft: number;
  deskTop: number;
  desk: { width: number; height: number };
}): { col: number; row: number } {
  const gap = deskIconGap(input.desk);
  const pitchX = DESK_ICON_WIDTH + gap;
  const pitchY = DESK_ICON_HEIGHT + gap;
  const localX = input.clientX - input.deskLeft;
  const localY = input.clientY - input.deskTop;
  return {
    col: clamp(Math.round((localX - DESK_GRID_ORIGIN_X) / pitchX), 0, GRID_X.length - 1),
    row: clamp(Math.round((localY - (DESK_GRID_ORIGIN_Y + 32)) / pitchY), 0, GRID_Y.length - 1),
  };
}

/** Centro del icono en coordenadas de pantalla, sobre la línea de la grilla. */
export function cellAnchor(input: {
  col: number;
  row: number;
  deskLeft: number;
  deskTop: number;
  desk: { width: number; height: number };
}): { x: number; y: number } {
  const gap = deskIconGap(input.desk);
  return {
    x: input.deskLeft + DESK_GRID_ORIGIN_X + input.col * (DESK_ICON_WIDTH + gap),
    y: input.deskTop + DESK_GRID_ORIGIN_Y + input.row * (DESK_ICON_HEIGHT + gap) + 32,
  };
}

/**
 * Mueve solo el icono arrastrado. Los demás se quedan en su casillero.
 * Si el destino está ocupado, el que se mueve cae en el libre más cercano.
 */
export function moveDeskIcon(input: {
  icons: readonly DeskIconSpot[];
  appId: DockAppId;
  col: number;
  row: number;
  at?: { x: number; y: number; pitchX: number; pitchY: number };
}): DeskIconSpot[] {
  const others = input.icons
    .filter((icon) => icon.appId !== input.appId)
    .map((icon) => {
      const cell = spotCell(icon);
      return spotFromCell(icon.appId, cell.col, cell.row);
    });
  const taken = new Set(others.map((icon) => cellKey(spotCell(icon).col, spotCell(icon).row)));
  const cell = nearestFreeCell({
    col: input.col,
    row: input.row,
    taken,
    at: input.at,
  });
  if (!cell) return input.icons.slice();
  return [...others, spotFromCell(input.appId, cell.col, cell.row)];
}

export function orderedDeskIcons(apps: readonly DockAppId[]): DeskIconSpot[] {
  return regulateDeskIcons(
    apps.map((appId, index) => ({
      appId,
      x: GRID_X[0] + index * (GRID_X[1] - GRID_X[0]),
      y: GRID_Y[0],
    })),
  );
}

export function defaultDeskIcons(apps: readonly DockAppId[]): DeskIconSpot[] {
  return orderedDeskIcons(apps);
}

export function deskIconsForDock(
  saved: DeskIconSpot[] | null,
  dock: readonly DockAppId[]
): DeskIconSpot[] {
  if (saved == null) return orderedDeskIcons(dock);
  return regulateDeskIcons(saved.filter((icon) => dock.includes(icon.appId)));
}

export function regulateAfterDrop(input: {
  icons: readonly DeskIconSpot[];
  appId: DockAppId;
  x: number;
  y: number;
}): DeskIconSpot[] {
  const aim = spotCell({ appId: input.appId, x: input.x, y: input.y });
  return moveDeskIcon({ icons: input.icons, appId: input.appId, col: aim.col, row: aim.row });
}

export function layoutAfterDrop(input: {
  saved: readonly DeskIconSpot[];
  dock: readonly DockAppId[];
  visible: readonly DeskIconSpot[];
}): DeskIconSpot[] {
  const others = input.saved.filter((icon) => !input.dock.includes(icon.appId));
  return [...others, ...input.visible];
}

export function deskPoint(input: {
  clientX: number;
  clientY: number;
  left: number;
  top: number;
  width: number;
  height: number;
}): { x: number; y: number } {
  const x = ((input.clientX - input.left) / input.width) * 100;
  const y = ((input.clientY - input.top) / input.height) * 100;
  return { x: clamp(x, 4, 94), y: clamp(y, 14, 78) };
}

export function pointOnDock(input: {
  clientX: number;
  clientY: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
}): boolean {
  return (
    input.clientX >= input.left &&
    input.clientX <= input.right &&
    input.clientY >= input.top &&
    input.clientY <= input.bottom
  );
}
