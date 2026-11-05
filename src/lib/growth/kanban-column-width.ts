/** Ancho de columna del Kanban en escritorio.
 *  Pocas etapas: se reparten todo el ancho de la fila.
 *  Muchas etapas: entran completas entre 248 y 320 px; el resto se desplaza.
 */
const GAP = 10;
const MIN = 248;
const MAX = 320;

function packedColumnWidth(laneWidth: number): number {
  const maxCount = Math.max(1, Math.floor((laneWidth + GAP) / (MIN + GAP)));
  for (let count = maxCount; count >= 1; count -= 1) {
    const size = (laneWidth - (count - 1) * GAP) / count;
    if (size >= MIN && size <= MAX) return Math.floor(size);
  }
  return MAX;
}

export function kanbanColumnWidth(laneWidth: number, columnCount: number): number | null {
  if (!Number.isFinite(laneWidth) || laneWidth < MIN || columnCount < 1) return null;
  const gaps = (columnCount - 1) * GAP;
  const natural = Math.floor((laneWidth - gaps) / columnCount);
  if (natural >= MIN) return natural;
  return packedColumnWidth(laneWidth);
}
