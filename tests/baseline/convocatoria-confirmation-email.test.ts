import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { TALCA_AURORA_VENUE } from "../../src/lib/experience/forms/talca-aurora-venue";
import type { FormConvocatoria } from "../../src/lib/admin/forms-center";
import type { EmailIdentity } from "../../src/lib/notifications/identity";

const require = createRequire(import.meta.url);
require("../../scripts/_stub-server-only.cjs");

async function renderEmail(
  input: Parameters<
    typeof import("../../src/lib/notifications/convocatoria-confirmation-email").renderConvocatoriaConfirmationEmail
  >[0]
) {
  const { renderConvocatoriaConfirmationEmail } = await import(
    "../../src/lib/notifications/convocatoria-confirmation-email"
  );
  return renderConvocatoriaConfirmationEmail(input);
}

const identity: EmailIdentity = {
  tenantId: "seminario-ipn",
  siteId: "seminario-ipn",
  displayName: "Seminario IPN",
  origin: "https://seminario-ipn.mentorprime.cl",
};

const convocatoria: FormConvocatoria = {
  slug: "talca-aurora-nov-2026",
  formId: "convocatoria-talca-aurora-nov-2026",
  title: "Cierre del año académico — Talca Aurora",
  date: "2026-11-07",
  location: "Talca Aurora",
  description: "Cierre del año",
  active: true,
};

describe("correo de confirmación de convocatoria", () => {
  it("si asiste, incluye cómo llegar en Google Maps y Waze", async () => {
    const email = await renderEmail({
      identity,
      participantName: "Ana Pérez",
      attendance: "yes",
      convocatoria,
      eventWhen: "Sábado 7 de noviembre de 2026 · Desde las 9:00 a. m.",
    });

    assert.match(email.html, /Cómo llegar/);
    assert.match(email.html, /Centro de Convenciones IPN/);
    assert.match(email.html, /Google Maps/);
    assert.match(email.html, /Waze/);
    assert.match(email.html, /destination=-35\.4908396,-71\.5411355/);
    assert.match(email.html, /waze\.com\/ul\?ll=-35\.4908396,-71\.5411355/);
    assert.match(email.html, /Desde las 9:00 a\. m\./);
    assert.doesNotMatch(email.html, /Resumen de tu respuesta/);
    assert.doesNotMatch(email.html, /10:00/);
  });

  it("si no asiste, el correo no empuja la ruta", async () => {
    const email = await renderEmail({
      identity,
      participantName: "Ana Pérez",
      attendance: "no",
      convocatoria,
    });

    assert.match(email.html, /no podrás asistir/i);
    assert.doesNotMatch(email.html, /waze\.com/);
    assert.doesNotMatch(email.html, /Cómo llegar/);
  });

  it("el envío usa la fecha y el horario del formulario", () => {
    const route = readFileSync(
      resolve(process.cwd(), "src/app/api/experience/forms/[id]/submit/route.ts"),
      "utf8"
    );
    assert.match(route, /eventWhen/);
    assert.match(route, /card\.icon === "clock"/);
  });
});
