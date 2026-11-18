import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import type { EmailIdentity } from "../../src/lib/notifications/identity";

const require = createRequire(import.meta.url);
require("../../scripts/_stub-server-only.cjs");

const PROGRAM_PATH = "/documentos/Triptico-Congreso-Varones-2026.pdf";

const identity: EmailIdentity = {
  tenantId: "ipn-chile",
  siteId: "ipn-chile",
  displayName: "IPN Chile",
  origin: "https://ipn-chile.mentorprime.cl",
};

describe("el programa del congreso llega al inscrito", () => {
  it("la pantalla de confirmación enlaza el tríptico", () => {
    const program = readFileSync(
      resolve(process.cwd(), "src/lib/experience/forms/already-enrolled.ts"),
      "utf8"
    );
    const page = readFileSync(
      resolve(process.cwd(), "src/app/(site)/formularios/[id]/page.tsx"),
      "utf8"
    );
    assert.match(program, new RegExp(`CONGRESS_VARONES_PROGRAM_PATH = "${PROGRAM_PATH}"`));
    assert.match(page, /confirmationEmailCtaUrl: CONGRESS_VARONES_PROGRAM_PATH/);
    assert.match(page, /confirmationEmailCtaLabel: CONGRESS_VARONES_PROGRAM_LABEL/);
  });

  it("el correo incluye el enlace al tríptico y avisa que va adjunto", async () => {
    const { renderCongressConfirmationEmail } = await import(
      "../../src/lib/notifications/congress-confirmation-email"
    );
    const email = renderCongressConfirmationEmail({
      identity,
      participantName: "Juan Pérez",
      programUrl: `https://ipn-chile.mentorprime.cl${PROGRAM_PATH}`,
      hasAttachment: true,
    });

    assert.match(email.subject, /programa/i);
    assert.match(email.subject, /Congreso de Varones/);
    assert.match(email.html, /Triptico-Congreso-Varones-2026\.pdf/);
    assert.match(email.html, /adjunto/i);
    assert.match(email.html, /Quilicura/);
    assert.match(email.html, /21/);
    assert.match(email.html, /22 de noviembre/);
    assert.match(email.html, /Descargar el tríptico/);
  });

  it("una inscripción nueva del congreso envía ese correo", () => {
    const route = readFileSync(
      resolve(process.cwd(), "src/app/api/experience/forms/[id]/submit/route.ts"),
      "utf8"
    );
    assert.match(route, /sendCongressConfirmationEmail/);
    assert.match(route, /CONGRESS_VARONES_PROGRAM_PATH/);
  });
});
