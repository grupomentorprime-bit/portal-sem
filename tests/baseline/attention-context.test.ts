import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  attentionCaseInDesk,
  attentionCasesInScope,
  attentionDeskScope,
  attentionMemberActor,
  attentionOpenTarget,
  enteredTenantFromCookie,
  chatCaseActor,
  resolveChatOpening,
} from "../../src/lib/desktop/attention-context";

const MENTOR = "mentor-prime-capacitacion";
const OTRO = "adl";

describe("contexto de Atención según el espacio activo", () => {
  it("el dueño en la plataforma no hereda la empresa de la sesión", () => {
    const scope = attentionDeskScope({
      owner: true,
      sessionTenantId: MENTOR,
      enteredTenantId: null,
    });
    assert.deepEqual(scope, { desk: "platform", tenantId: null });
    assert.deepEqual(
      attentionCasesInScope(
        [
          { id: "a", tenantId: MENTOR },
          { id: "b", tenantId: OTRO },
        ],
        scope
      ).map((item) => item.id),
      ["a", "b"]
    );
  });

  it("el dueño dentro de una empresa solo ve los casos de esa empresa", () => {
    const scope = attentionDeskScope({
      owner: true,
      sessionTenantId: OTRO,
      enteredTenantId: enteredTenantFromCookie(encodeURIComponent(MENTOR)),
    });
    assert.deepEqual(scope, { desk: "company", tenantId: MENTOR });
    assert.deepEqual(
      attentionCasesInScope(
        [
          { id: "a", tenantId: MENTOR },
          { id: "b", tenantId: OTRO },
        ],
        scope
      ).map((item) => item.id),
      ["a"]
    );
    assert.equal(attentionCaseInDesk(scope, MENTOR), true);
    assert.equal(attentionCaseInDesk(scope, OTRO), false);
  });

  it("quien no es dueño no cambia de empresa con la cookie del escritorio", () => {
    const scope = attentionDeskScope({
      owner: false,
      sessionTenantId: MENTOR,
      enteredTenantId: OTRO,
    });
    assert.deepEqual(scope, { desk: "company", tenantId: MENTOR });
  });

  it("dentro de la empresa el alta usa esa empresa e ignora otra pedida", () => {
    const scope = attentionDeskScope({
      owner: true,
      sessionTenantId: OTRO,
      enteredTenantId: MENTOR,
    });
    const opened = attentionOpenTarget(scope, OTRO);
    assert.deepEqual(opened, { ok: true, tenantId: MENTOR, asMember: true });
  });

  it("dentro de la empresa el dueño actúa como cliente de ese espacio", () => {
    const staff = {
      userId: "owner",
      displayName: "Dueño",
      kind: "staff" as const,
      tenantId: OTRO,
      allAreas: true,
      areaIds: ["general"],
      orgWide: false,
      economic: false,
    };
    const member = attentionMemberActor(staff, { desk: "company", tenantId: MENTOR });
    assert.equal(member.kind, "client");
    assert.equal(member.tenantId, MENTOR);
    assert.equal(member.allAreas, false);
    assert.deepEqual([...member.areaIds], []);
    assert.equal(member.orgWide, false);
    assert.equal(member.userId, "owner");
  });

  it("en la plataforma el dueño sigue en la capa de soporte", () => {
    const staff = {
      userId: "owner",
      displayName: "Dueño",
      kind: "staff" as const,
      tenantId: null,
      allAreas: true,
      areaIds: [] as string[],
      orgWide: false,
      economic: false,
    };
    assert.equal(
      attentionMemberActor(staff, { desk: "platform", tenantId: null }),
      staff
    );
  });

  it("un cliente de la empresa conserva su propio alcance", () => {
    const person = {
      userId: "ana",
      displayName: "Ana",
      kind: "client" as const,
      tenantId: MENTOR,
      allAreas: false,
      areaIds: [] as string[],
      orgWide: true,
      economic: true,
    };
    const same = attentionMemberActor(person, { desk: "company", tenantId: MENTOR });
    assert.equal(same, person);
    assert.equal(same.orgWide, true);
  });

  it("en la plataforma el alta exige una empresa y no elige la primera", () => {
    const scope = attentionDeskScope({
      owner: true,
      sessionTenantId: MENTOR,
      enteredTenantId: "  ",
    });
    assert.deepEqual(attentionOpenTarget(scope, ""), { ok: false, reason: "company" });
    assert.deepEqual(attentionOpenTarget(scope, `  ${OTRO}  `), {
      ok: true,
      tenantId: OTRO,
      asMember: false,
    });
  });

  it("el chat usa la empresa activa y, sin ella, no inicia el caso", () => {
    const inside = attentionDeskScope({
      owner: true,
      sessionTenantId: OTRO,
      enteredTenantId: MENTOR,
    });
    assert.deepEqual(resolveChatOpening({ scope: inside, chosenTenantId: OTRO }), {
      ok: true,
      tenantId: MENTOR,
      asClient: true,
    });
    const platform = attentionDeskScope({
      owner: true,
      sessionTenantId: MENTOR,
      enteredTenantId: null,
    });
    assert.deepEqual(resolveChatOpening({ scope: platform, chosenTenantId: "" }), {
      ok: false,
      reason: "company",
    });
    assert.deepEqual(resolveChatOpening({ scope: platform, chosenTenantId: ` ${OTRO} ` }), {
      ok: true,
      tenantId: OTRO,
      asClient: true,
    });
  });

  it("quien escribe en el chat queda como cliente de la empresa, aunque sea dueño", () => {
    const owner = {
      userId: "owner",
      displayName: "Dueño",
      kind: "staff" as const,
      tenantId: null,
      allAreas: true,
      areaIds: ["general"] as string[],
      orgWide: false,
      economic: false,
    };
    const asClient = chatCaseActor(owner, MENTOR);
    assert.equal(asClient.kind, "client");
    assert.equal(asClient.tenantId, MENTOR);
    assert.equal(asClient.userId, "owner");
    assert.equal(asClient.allAreas, false);
    const member = chatCaseActor(
      {
        userId: "ana",
        displayName: "Ana",
        kind: "client" as const,
        tenantId: MENTOR,
        allAreas: false,
        areaIds: [] as string[],
        orgWide: true,
        economic: true,
      },
      MENTOR
    );
    assert.equal(member.kind, "client");
    assert.equal(member.orgWide, true);
  });
});
