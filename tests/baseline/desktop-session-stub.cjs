/**
 * Sustituye la cookie de Next solo en esta corrida.
 * La sesión de prueba vive en globalThis.__nelzuriTestSession.
 */
const Module = require("module");
const originalLoad = Module._load;

function cookieJar() {
  return {
    get(name) {
      const session = globalThis.__nelzuriTestSession || "";
      if (name === "ah_session" && session) return { name, value: session };
      return undefined;
    },
    set() {},
    delete() {},
  };
}

function normalized(request) {
  return String(request).replace(/\\/g, "/");
}

Module._load = function patchedLoad(request, parent, isMain) {
  const spec = normalized(request);
  if (spec === "server-only" || spec.endsWith("/server-only") || spec.endsWith("/server-only/index.js")) {
    return {};
  }
  if (
    spec === "next/headers" ||
    spec.endsWith("/next/headers.js") ||
    spec.endsWith("/next/headers/index.js")
  ) {
    return {
      cookies: async () => cookieJar(),
      headers: async () => ({ get: () => null }),
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};
