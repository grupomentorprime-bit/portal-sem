import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clientStatusLine,
  domainDraftChanged,
  planDraftChanged,
  readClientConsole,
} from "../../src/lib/desktop/client-console";

describe("consola del cliente", () => {
  it("lee estado, plan, pedido y direcciones", () => {
    const model = readClientConsole({
      name: "Seminario",
      status: "active",
      typeLabel: "Institución",
      domains: [
        { host: "seminario-ipn.mentorprime.cl", isPrimary: false, kind: "platform_subdomain" },
        { host: "www.seminario.cl", isPrimary: true, kind: "custom" },
      ],
      contractedApps: ["growth-os", "no-existe"],
      aprendeHoyEntryUrl: "https://aula.example",
      openAppRequests: [{ appId: "cumple" }, { appId: "otro" }],
    });
    assert.equal(model?.status, "active");
    assert.equal(model?.platformHost, "seminario-ipn.mentorprime.cl");
    assert.equal(model?.customHost, "www.seminario.cl");
    assert.equal(model?.primaryHost, "www.seminario.cl");
    assert.deepEqual(model?.contractedApps, ["growth-os"]);
    assert.deepEqual(model?.requestedApps, ["cumple"]);
    assert.equal(clientStatusLine("suspended"), "El portal queda en mantenimiento hasta activarlo.");
  });

  it("un estado desconocido cuenta como inactivo y un payload vacío no abre consola", () => {
    assert.equal(readClientConsole({ name: "X", status: "raro" })?.status, "inactive");
    assert.equal(readClientConsole(null), null);
    assert.equal(readClientConsole({ status: "active" }), null);
  });

  it("el plan y el dominio solo se guardan si cambiaron", () => {
    assert.equal(
      planDraftChanged({
        contracted: ["growth-os"],
        draft: ["cumple", "growth-os"],
        entryUrl: null,
        draftUrl: "",
      }),
      true
    );
    assert.equal(
      planDraftChanged({
        contracted: ["growth-os", "aprende-hoy"],
        draft: ["aprende-hoy", "growth-os"],
        entryUrl: "https://aula.example",
        draftUrl: " https://aula.example ",
      }),
      false
    );
    assert.equal(domainDraftChanged("www.seminario.cl", "www.seminario.cl"), false);
    assert.equal(domainDraftChanged(null, ""), false);
    assert.equal(domainDraftChanged("www.seminario.cl", ""), true);
  });
});
