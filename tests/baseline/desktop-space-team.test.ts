/**
 * Equipo NELZURI — invita, roles, llaves y administración sobre APIs identity existentes.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("Equipo NELZURI — panel completo", () => {
  it("gestiona invitaciones, roles, llaves y acceso sin depender de Growth OS", () => {
    const team = readSrc("src/components/desktop/DesktopSpaceTeam.tsx");

    assert.match(team, /\/api\/identity\/team/);
    assert.match(team, /\/api\/identity\/invitations/);
    assert.match(team, /\/api\/identity\/invitations\/resend/);
    assert.match(team, /\/api\/identity\/members\/\$\{encodeURIComponent\(member\.membershipId\)\}\/apps/);
    assert.match(team, /method:\s*"PATCH"[\s\S]*roleCode/);
    assert.match(team, /action=remove-access/);
    assert.match(team, /\/resend-access/);
    assert.match(team, /Invitar persona/);
    assert.match(team, /authorizedApps:\s*inviteApps/);
    assert.doesNotMatch(team, /\/admin\/settings\/team/);
  });

  it("el panel Equipo de Ajustes monta DesktopSpaceTeam", () => {
    const ajustes = readSrc("src/components/desktop/DesktopSpaceAjustes.tsx");
    assert.match(ajustes, /DesktopSpaceTeam/);
    assert.match(ajustes, /panel === "equipo"/);
  });
});
