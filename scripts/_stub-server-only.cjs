/**
 * Stub de `server-only` para CLIs Node/tsx (p. ej. backfill Growth Core).
 * Uso: node --require ./scripts/_stub-server-only.cjs ./node_modules/tsx/dist/cli.mjs ...
 */
const Module = require("module");
const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "server-only") {
    return {};
  }
  return originalLoad(request, parent, isMain);
};
