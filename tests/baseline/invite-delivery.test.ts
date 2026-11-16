import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { inviteCreateFeedback } from "../../src/lib/desktop/invite-delivery";
import { publicTransactionalEmailError } from "../../src/lib/notifications/email-errors";

describe("entrega de invitaciones NELZURI", () => {
  it("distingue invitación creada, correo enviado y fallo de creación", () => {
    assert.deepEqual(
      inviteCreateFeedback({ ok: true, emailSent: true }),
      {
        status: "created_sent",
        message: "Invitación creada y correo enviado. La persona recibirá un enlace para unirse.",
      }
    );

    const unsent = inviteCreateFeedback({
      ok: true,
      emailSent: false,
      deliveryError: "El servicio de correo rechazó el destinatario.",
    });
    assert.equal(unsent.status, "created_unsent");
    assert.match(unsent.message, /Invitación creada/);
    assert.match(unsent.message, /correo no se envió/i);
    assert.match(unsent.message, /reintentar/i);
    assert.doesNotMatch(unsent.message, /armar/i);

    const failed = inviteCreateFeedback({
      ok: false,
      error: "El correo es obligatorio.",
    });
    assert.equal(failed.status, "not_created");
    assert.equal(failed.message, "El correo es obligatorio.");
  });

  it("no habla de armar el correo cuando Resend rechaza el destinatario", () => {
    const message = publicTransactionalEmailError({ name: "validation_error" });
    assert.match(message, /servicio de correo/i);
    assert.doesNotMatch(message, /armar/i);

    assert.match(
      publicTransactionalEmailError({ name: "missing_api_key" }),
      /no está configurado/i
    );
  });

  it("la API conserva la invitación aunque falle el envío", () => {
    const route = readFileSync(
      resolve(process.cwd(), "src/app/api/identity/invitations/route.ts"),
      "utf8"
    );
    assert.match(route, /emailSent/);
    assert.match(route, /deliveryError/);
    assert.doesNotMatch(
      route,
      /if \(!sent\.ok\) \{\s*return NextResponse\.json\(\{ ok: false, error: sent\.error \}, \{ status: 422 \}\);/
    );
  });

  it("Equipo muestra los tres estados y reenvía pendientes", () => {
    const team = readFileSync(
      resolve(process.cwd(), "src/components/desktop/DesktopSpaceTeam.tsx"),
      "utf8"
    );
    assert.match(team, /inviteCreateFeedback/);
    assert.match(team, /\/api\/identity\/invitations\/resend/);
    assert.match(team, /canResendInvitation/);
  });
});
