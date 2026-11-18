/** Quita un prefijo IPN inicial (con o sin espacio). */
export function stripCongressChurchIpnPrefix(name: string): string {
  return name.trim().replace(/^ipn\s+/i, "").trim();
}

/** Base plegada para comparar iglesias (sin acentos, sin prefijo IPN). */
export function foldCongressChurchBase(name: string): string {
  return stripCongressChurchIpnPrefix(name)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function sameCongressChurch(a: string, b: string): boolean {
  const left = foldCongressChurchBase(a);
  const right = foldCongressChurchBase(b);
  if (!left || !right) return false;
  return left === right;
}

/** Etiqueta canónica: siempre `IPN` + nombre en mayúsculas (sin duplicar el prefijo). */
export function formatCongressChurchLabel(name: string): string {
  const base = stripCongressChurchIpnPrefix(name).toLocaleUpperCase("es-CL");
  if (!base) return "IPN";
  return `IPN ${base}`;
}

export type CongressChurchOption = {
  /** Clave plegada sin IPN (value estable en selects). */
  baseKey: string;
  label: string;
};

/**
 * Fusiona nombres equivalentes (p. ej. `ÑUBLE ALTO` + `IPN Ñuble alto`)
 * y devuelve opciones con etiqueta `IPN …`.
 */
export function mergeCongressChurchOptions(
  names: Iterable<string>
): CongressChurchOption[] {
  const byKey = new Map<string, string[]>();
  for (const raw of names) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = foldCongressChurchBase(trimmed);
    if (!key) continue;
    const list = byKey.get(key) ?? [];
    list.push(trimmed);
    byKey.set(key, list);
  }

  const options: CongressChurchOption[] = [];
  for (const [baseKey, variants] of byKey) {
    const preferred =
      variants.find((v) => /^ipn\b/i.test(v.trim())) ?? variants[0]!;
    options.push({
      baseKey,
      label: formatCongressChurchLabel(preferred),
    });
  }

  return options.sort((a, b) => a.label.localeCompare(b.label, "es"));
}
