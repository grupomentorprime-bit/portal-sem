/** Rutas de formulario individual — sin navegación ni footer del portal. */
export function isFocusedFormPath(pathname: string): boolean {
  return /^\/formularios\/[^/]+$/.test(pathname);
}
