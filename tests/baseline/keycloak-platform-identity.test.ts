/**
 * Identidad central de Keycloak: Growth OS es la plataforma.
 * El id técnico del realm sigue siendo seminario-ipn.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import {
  GROWTH_OS_KEYCLOAK_CLIENT_IDS,
  KEYCLOAK_GROWTH_OS_LOGIN_THEME,
  KEYCLOAK_REALM_DISPLAY_NAME,
  KEYCLOAK_REALM_TECHNICAL_ID,
  KEYCLOAK_SEM_SPACE_LOGIN_THEME,
  SEM_SPACE_KEYCLOAK_CLIENT_ID,
} from "../../src/core/identity/auth/keycloak-identity";

function read(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("identidad Keycloak — Growth OS es la plataforma", () => {
  it("el id técnico del realm se conserva y el nombre visible es Growth OS", () => {
    assert.equal(KEYCLOAK_REALM_TECHNICAL_ID, "seminario-ipn");
    assert.equal(KEYCLOAK_REALM_DISPLAY_NAME, "Growth OS");
    assert.equal(KEYCLOAK_GROWTH_OS_LOGIN_THEME, "growth-os");
    assert.equal(KEYCLOAK_SEM_SPACE_LOGIN_THEME, "sem");
    assert.equal(SEM_SPACE_KEYCLOAK_CLIENT_ID, "seminario-ipn-web");
    assert.deepEqual([...GROWTH_OS_KEYCLOAK_CLIENT_IDS], ["growth-os-web", "growth-os-dev"]);
  });

  it("el tema de plataforma nombra Growth OS y el tema SEM no", () => {
    const growth = read("infra/keycloak/themes/growth-os/login/messages/messages.properties");
    const sem = read("infra/keycloak/themes/sem/login/messages/messages.properties");
    assert.match(growth, /loginTitleHtml=Growth OS/);
    assert.doesNotMatch(growth, /Seminario|seminario-ipn/);
    assert.match(sem, /loginTitleHtml=Seminario Eclesiástico Mayor/);
    assert.doesNotMatch(sem, /Growth OS/);
    assert.match(read("infra/keycloak/themes/growth-os/login/theme.properties"), /parent=keycloak/);
    assert.match(read("infra/keycloak/themes/sem/login/theme.properties"), /parent=keycloak/);
  });

  it("el script no renombra el realm ni regenera secrets ni callbacks", () => {
    const script = read("scripts/align-keycloak-identity.ts");
    assert.match(script, /KEYCLOAK_REALM_TECHNICAL_ID/);
    assert.match(script, /no lo renombra/);
    assert.match(script, /client-secret/);
    assert.match(script, /redirectUris/);
    assert.doesNotMatch(script, /regenerate/);
    assert.doesNotMatch(script, /realm:\s*"growth-os"/);
    const envExample = read(".env.example");
    assert.match(envExample, /KEYCLOAK_REALM=seminario-ipn/);
    assert.match(envExample, /Display Name\) es Growth OS/);
    assert.match(envExample, /seminario-ipn-web es el cliente del Espacio SEM/);
  });

  it("el acceso de plataforma no describe a SEM como el realm", () => {
    const keycloak = read("src/core/identity/auth/keycloak.ts");
    const admin = read("src/lib/identity/keycloak-admin.ts");
    assert.doesNotMatch(keycloak, /institucional/);
    assert.doesNotMatch(admin, /institucional/);
    assert.match(read("docs/core/IDENTITY.md"), /Display Name y la identidad visual general son \*\*Growth OS\*\*/);
    assert.match(read("docs/GLOSSARY.md"), /Espacios equivalentes/);
    assert.match(read("docs/GLOSSARY.md"), /Mentor Capacitación/);
    assert.match(read("docs/GLOSSARY.md"), /Fundación Mueve/);
  });
});
