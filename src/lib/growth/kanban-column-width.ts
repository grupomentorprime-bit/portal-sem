/** Ancho de columna del Kanban en escritorio: entran completas, entre 248 y 320 px. */
const GAP = 10;
const MIN = 248;
const MAX = 320;

export function kanbanColumnWidth(laneWidth: number): number | null {
  if (!Number.isFinite(laneWidth) || laneWidth < MIN) return null;
  const maxCount = Math.max(1, Math.floor((laneWidth + GAP) / (MIN + GAP)));
  for (let count = maxCount; count >= 1; count -= 1) {
    const size = (laneWidth - (count - 1) * GAP) / count;
    if (size >= MIN && size <= MAX) return Math.floor(size);
  }
  return MAX;
}
