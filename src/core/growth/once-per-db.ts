/**
 * Una tarea por base y por clave, en este proceso.
 * La clave usa el nombre de la base: `client.db()` puede devolver otro objeto cada vez.
 * Si falla, el siguiente intento puede volver a ejecutarla.
 */
const byDatabaseName = new Map<string, Promise<unknown>>();
const byObject = new WeakMap<object, Map<string, Promise<unknown>>>();

export function oncePerDatabase<T>(
  db: object & { databaseName?: string },
  key: string,
  run: () => Promise<T>
): Promise<T> {
  const name = db.databaseName?.trim();
  if (name) {
    const id = `${name}:${key}`;
    const existing = byDatabaseName.get(id) as Promise<T> | undefined;
    if (existing) return existing;
    const pending = run().catch((error: unknown) => {
      if (byDatabaseName.get(id) === pending) byDatabaseName.delete(id);
      throw error;
    });
    byDatabaseName.set(id, pending);
    return pending;
  }

  let bucket = byObject.get(db);
  if (!bucket) {
    bucket = new Map();
    byObject.set(db, bucket);
  }
  const existing = bucket.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const pending = run().catch((error: unknown) => {
    if (bucket.get(key) === pending) bucket.delete(key);
    throw error;
  });
  bucket.set(key, pending);
  return pending;
}
