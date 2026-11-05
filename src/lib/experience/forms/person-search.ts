/** Texto de búsqueda: minúsculas, sin tildes y con espacios colapsados. */
export function foldPersonSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/['’\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** RUT de búsqueda: solo dígitos y K, sin puntos, guión ni espacios. */
export function foldPersonSearchRut(value: string): string {
  return value.toLowerCase().replace(/[^0-9k]/g, "");
}

/**
 * Misma regla para el formulario público y los buscadores internos.
 * Ignora tildes y el formato del RUT. Con dos o más palabras, basta con que
 * dos coincidan, para no perder a alguien que escribió un nombre de más.
 */
export function matchesPersonSearch(
  query: string,
  fields: Array<string | undefined | null>
): boolean {
  const foldedQuery = foldPersonSearchText(query);
  if (!foldedQuery) return false;

  const haystack = fields
    .map((field) => foldPersonSearchText(String(field ?? "")))
    .filter(Boolean)
    .join(" ");

  if (haystack.includes(foldedQuery)) return true;

  const collapsedQuery = foldedQuery.replace(/ /g, "");
  const collapsedHaystack = haystack.replace(/ /g, "");
  if (collapsedQuery.length >= 4 && collapsedHaystack.includes(collapsedQuery)) return true;

  const rutQuery = foldPersonSearchRut(query);
  const digitCount = rutQuery.replace(/k/g, "").length;
  if (digitCount >= 3) {
    const rutHit = fields.some((field) =>
      foldPersonSearchRut(String(field ?? "")).includes(rutQuery)
    );
    if (rutHit) return true;
  }

  const queryTokens = foldedQuery.split(" ").filter((token) => token.length >= 2);
  if (queryTokens.length === 0) return false;

  if (queryTokens.length >= 2) {
    const haystackTokens = new Set(haystack.split(/\s+/).filter(Boolean));
    const overlap = queryTokens.filter((token) => haystackTokens.has(token));
    if (overlap.length >= 2) return true;
  }

  return queryTokens.every((token) => haystack.includes(token));
}

function nameTokens(fields: Array<string | undefined | null>): string[] {
  const tokens: string[] = [];
  for (const field of fields) {
    const folded = foldPersonSearchText(String(field ?? ""));
    const letters = folded.replace(/[^a-z]/g, "").length;
    const digits = folded.replace(/\D/g, "").length;
    if (letters === 0 || digits > letters) continue;
    for (const token of folded.split(" ")) {
      if (/[a-z]/.test(token) && token.length >= 2) tokens.push(token);
    }
  }
  return tokens;
}

/** Distancia de una edición: una letra cambiada, de más, de menos, o dos letras vecinas invertidas. */
function withinOneEdit(left: string, right: string): boolean {
  if (left === right || Math.abs(left.length - right.length) > 1) return false;
  if (left.length > right.length) return withinOneEdit(right, left);

  let edits = 0;
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (left.length === right.length) {
      const transposed =
        i + 1 < left.length && left[i] === right[j + 1] && left[i + 1] === right[j];
      if (transposed) {
        i += 2;
        j += 2;
        continue;
      }
      i += 1;
      j += 1;
      continue;
    }
    j += 1;
  }
  if (i < left.length || j < right.length) edits += 1;
  return edits === 1;
}

function tokenIsClose(token: string, tokens: string[]): boolean {
  if (token.length < 6) return false;
  return tokens.some(
    (candidate) =>
      candidate.length >= 6 &&
      token.slice(0, 2) === candidate.slice(0, 2) &&
      withinOneEdit(token, candidate)
  );
}

/** null si no es una sugerencia. Un número menor es una sugerencia más cercana. */
export function personSearchSuggestionRank(
  query: string,
  fields: Array<string | undefined | null>
): number | null {
  if (matchesPersonSearch(query, fields)) return null;

  const names = nameTokens(fields);
  const queryTokens = foldPersonSearchText(query)
    .split(" ")
    .filter((token) => token.length >= 2 && /[a-z]/.test(token));

  let fuzzy = 0;
  let satisfied = 0;
  for (const token of queryTokens) {
    const contained =
      names.some((name) => name.includes(token)) || names.join("").includes(token.replace(/ /g, ""));
    if (contained) {
      satisfied += 1;
      continue;
    }
    if (tokenIsClose(token, names)) {
      fuzzy += 1;
      satisfied += 1;
    }
  }

  if (queryTokens.length > 0 && fuzzy >= 1 && satisfied === queryTokens.length) {
    return fuzzy;
  }

  const rutQuery = foldPersonSearchRut(query);
  const rutDigits = rutQuery.replace(/k/g, "").length;
  if (rutDigits < 8) return null;

  const rutHit = fields.some((field) => {
    const rut = foldPersonSearchRut(String(field ?? ""));
    const digits = rut.replace(/k/g, "").length;
    return digits >= 8 && rut.length === rutQuery.length && withinOneEdit(rut, rutQuery);
  });
  return rutHit ? 1 : null;
}

export function collectPersonSearchSuggestions<T>(
  query: string,
  items: T[],
  getFields: (item: T) => Array<string | undefined | null>,
  limit = 8
): { items: T[]; hasMore: boolean } {
  if (foldPersonSearchText(query).length < 2) return { items: [], hasMore: false };

  const ranked = items
    .map((item) => ({ item, rank: personSearchSuggestionRank(query, getFields(item)) }))
    .filter((entry): entry is { item: T; rank: number } => entry.rank !== null)
    .sort((left, right) => left.rank - right.rank);

  return {
    items: ranked.slice(0, limit).map((entry) => entry.item),
    hasMore: ranked.length > limit,
  };
}
