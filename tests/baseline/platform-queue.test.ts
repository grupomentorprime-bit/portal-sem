import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  actorLabel,
  applyQueueAction,
  examplePlatformQueue,
  holdSince,
  orderQueue,
  queueTurn,
  waitLabel,
  type QueueItem,
} from "../../src/lib/desktop/platform-queue";

const NOW = Date.parse("2026-11-19T15:00:00.000Z");
const DAY = 86_400_000;

function item(partial: Partial<QueueItem> & Pick<QueueItem, "id">): QueueItem {
  return {
    status: "pendiente",
    priority: "normal",
    assigneeUserId: null,
    assigneeName: null,
    nextStep: "nelzuri",
    subject: partial.id,
    company: "Seminario",
    code: partial.id,
    requesterName: "Ana",
    createdAt: new Date(NOW - DAY).toISOString(),
    updatedAt: new Date(NOW - DAY).toISOString(),
    messages: [],
    events: [],
    ...partial,
  };
}

describe("cola de plataforma", () => {
  it("prioriza urgentes y, entre ellos, al que más tiempo espera al equipo", () => {
    const freshUrgent = item({
      id: "fresh",
      priority: "alta",
      createdAt: new Date(NOW - 2 * 3_600_000).toISOString(),
    });
    const oldUrgent = item({
      id: "old",
      priority: "alta",
      createdAt: new Date(NOW - 12 * DAY).toISOString(),
    });
    const olderNormal = item({
      id: "normal",
      createdAt: new Date(NOW - 40 * DAY).toISOString(),
    });
    const waitingOnClient = item({
      id: "client",
      priority: "alta",
      status: "abierto",
      nextStep: "cliente",
      createdAt: new Date(NOW - 30 * DAY).toISOString(),
    });
    const rows = orderQueue([freshUrgent, olderNormal, waitingOnClient, oldUrgent], {
      view: "por_atender",
      viewerUserId: "me",
      now: NOW,
    });
    assert.deepEqual(
      rows.map((row) => row.id),
      ["old", "fresh", "normal"]
    );
  });

  it("mide la espera desde el último mensaje del cliente, no desde la creación", () => {
    const row = item({
      id: "reply",
      createdAt: new Date(NOW - 10 * DAY).toISOString(),
      messages: [
        { at: new Date(NOW - 9 * DAY).toISOString(), role: "staff" },
        { at: new Date(NOW - 3 * 3_600_000).toISOString(), role: "client" },
      ],
    });
    assert.equal(waitLabel(holdSince(row), NOW), "3 h");
    assert.equal(actorLabel(queueTurn(row)), "NELZURI");
  });

  it("Esperando al cliente incluye la confirmación y deja fuera lo que nos toca", () => {
    const ours = item({ id: "ours" });
    const asked = item({
      id: "asked",
      status: "abierto",
      nextStep: "cliente",
      assigneeUserId: "me",
    });
    const confirm = item({
      id: "confirm",
      status: "confirmacion",
      nextStep: "nelzuri",
      assigneeUserId: "otra",
    });
    const waiting = orderQueue([ours, asked, confirm], { view: "esperando_cliente", viewerUserId: "me", now: NOW });
    assert.deepEqual(
      waiting.map((row) => row.id).sort(),
      ["asked", "confirm"]
    );
    assert.equal(queueTurn(confirm), "cliente");
    assert.equal(actorLabel(queueTurn(confirm)), "Cliente");
  });

  it("Sin asignar es solo lo que nos toca y no tiene responsable", () => {
    const free = item({ id: "free" });
    const mine = item({ id: "mine", assigneeUserId: "me" });
    const parked = item({ id: "parked", status: "confirmacion", assigneeUserId: null });
    const rows = orderQueue([free, mine, parked], { view: "sin_asignar", viewerUserId: "me", now: NOW });
    assert.deepEqual(
      rows.map((row) => row.id),
      ["free"]
    );
  });

  it("Mis tickets conserva los míos aunque esperen al cliente", () => {
    const mine = item({ id: "mine", assigneeUserId: "me", priority: "alta" });
    const mineParked = item({
      id: "parked",
      assigneeUserId: "me",
      status: "confirmacion",
      createdAt: new Date(NOW - 2 * DAY).toISOString(),
    });
    const other = item({ id: "other", assigneeUserId: "otra", priority: "alta" });
    const rows = orderQueue([other, mineParked, mine], { view: "mias", viewerUserId: "me", now: NOW });
    assert.deepEqual(
      rows.map((row) => row.id),
      ["mine", "parked"]
    );
  });

  it("arma 100 ejemplos y deja primero al urgente que más espera", () => {
    const rows = examplePlatformQueue({ viewerUserId: "me", now: NOW });
    assert.equal(rows.length, 100);
    const queue = orderQueue(rows, { view: "por_atender", viewerUserId: "me", now: NOW });
    assert.equal(queue[0]?.id, "q-urgent-oldest");
    assert.ok(queue.length >= 60);
    const waiting = orderQueue(rows, { view: "esperando_cliente", viewerUserId: "me", now: NOW });
    assert.ok(waiting.some((row) => row.status === "confirmacion"));
    assert.ok(waiting.every((row) => queueTurn(row) === "cliente"));
    assert.equal(rows.filter((row) => row.intakeChannel === "envivo").length, 1);
  });

  it("responder o pedir confirmación saca el caso de Por atender y lo deja esperando al cliente", () => {
    const open = item({ id: "open", assigneeUserId: null });
    const replied = applyQueueAction(open, { action: "message", body: "Ya quedó.", now: new Date(NOW).toISOString() });
    assert.equal(queueTurn(replied), "cliente");
    assert.equal(orderQueue([replied], { view: "por_atender", viewerUserId: "me", now: NOW }).length, 0);
    assert.equal(orderQueue([replied], { view: "esperando_cliente", viewerUserId: "me", now: NOW }).length, 1);

    const asked = applyQueueAction(open, { action: "confirm-ask", now: new Date(NOW).toISOString() });
    assert.equal(asked.status, "confirmacion");
    assert.equal(orderQueue([asked], { view: "esperando_cliente", viewerUserId: "me", now: NOW })[0]?.id, "open");

    const assigned = applyQueueAction(open, {
      action: "assign",
      assigneeUserId: "me",
      assigneeName: "Owner",
      now: new Date(NOW).toISOString(),
    });
    assert.equal(assigned.assigneeUserId, "me");
    assert.equal(assigned.assigneeName, "Owner");
    assert.equal(orderQueue([assigned], { view: "mias", viewerUserId: "me", now: NOW })[0]?.id, "open");
  });
});
