/**
 * AprendeHoy — Migration Framework
 *
 * Uso:
 *   npm run migrate           # todas las pendientes
 *   npm run migrate -- 001-hero-v2   # una sola
 */

import { runMigrationsCli } from "../src/core/migrations/runner";

const only = process.argv[2];

runMigrationsCli(only).catch((error) => {
  console.error(error);
  process.exit(1);
});
