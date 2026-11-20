import {
  congressPersonSpellingKey,
  foldCongressPersonName,
} from "@/core/congress/brother-name";

export type FoldedNameRow = {
  _id: string;
  identity: { fullName: string };
};

export type FoldedNameDuplicate<T extends FoldedNameRow> = {
  row: T;
  /** El otro nombre es el mismo salvo tildes: José / Jose. */
  accentOnly: boolean;
};

/**
 * Otras fichas cuyo nombre, sin título ni acentos, es el mismo.
 * Exige al menos nombre y apellido para no marcar a todos los «José».
 */
export function findFoldedNameDuplicates<T extends FoldedNameRow>(
  fullName: string,
  rows: T[],
  exceptId?: string
): FoldedNameDuplicate<T>[] {
  const folded = foldCongressPersonName(fullName);
  if (!folded || folded.split(" ").length < 2) return [];
  const spelling = congressPersonSpellingKey(fullName);

  const matches: FoldedNameDuplicate<T>[] = [];
  for (const row of rows) {
    if (exceptId && row._id === exceptId) continue;
    if (foldCongressPersonName(row.identity.fullName) !== folded) continue;
    const otherSpelling = congressPersonSpellingKey(row.identity.fullName);
    matches.push({
      row,
      accentOnly: otherSpelling !== spelling,
    });
  }
  return matches;
}
