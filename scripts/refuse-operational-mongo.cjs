/**
 * Cierra MongoClient.connect antes de que un script o una prueba escriba.
 * El proceso de producción no se intercepta.
 */
const path = require("node:path");
const { require: tsxRequire } = require("tsx/cjs/api");

const boundary = tsxRequire(
  path.join(__dirname, "..", "src", "lib", "mongo", "local-boundary.ts"),
  __filename
);

boundary.installOperationalMongoGuard();
