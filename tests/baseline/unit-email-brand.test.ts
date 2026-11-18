/**
 * Correo de una unidad: el departamento se nombra y lleva su logo.
 * Un Espacio sin unidad sigue hablando del Espacio.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import {
  departmentEmailBrand,
  ensureDepartmentLogo,
  invitationEmailVoice,
  recoveryEmailVoice,
  renderEmailBrandMark,
  unitIdsFromAccess,
} from "../../src/lib/notifications/email-brand";

describe("correo del departamento", () => {
  it("Varones nombra al departamento y apunta a su logo", () => {
    const brand = departmentEmailBrand(["departamento-nacional-de-varones"]);
    assert.ok(brand);
    assert.equal(brand.name, "Departamento Nacional de Varones");
    assert.equal(brand.logoSrc, "cid:varones-nacional");
    assert.equal(
      existsSync(resolve(process.cwd(), "public", brand.logoFile)),
      true
    );
  });

  it("otra unidad o el Espacio completo no toman la marca de Varones", () => {
    assert.equal(departmentEmailBrand(undefined), null);
    assert.equal(departmentEmailBrand([]), null);
    assert.equal(departmentEmailBrand(["dorcas"]), null);
  });

  it("la invitación del departamento no habla del Espacio", () => {
    const voice = invitationEmailVoice(
      "IPN Chile",
      "Departamento Nacional de Varones"
    );
    assert.equal(
      voice.subject,
      "Bienvenido a la plataforma del Departamento Nacional de Varones"
    );
    assert.match(voice.lead, /Departamento Nacional de Varones/);
    assert.doesNotMatch(voice.lead, /Espacio/);
    assert.match(voice.preview, /Departamento Nacional de Varones/);
  });

  it("sin departamento el correo sigue siendo del Espacio", () => {
    const voice = invitationEmailVoice("IPN Chile");
    assert.equal(voice.subject, "Invitación — IPN Chile");
    assert.match(voice.lead, /Espacio/);
    assert.match(voice.lead, /IPN Chile/);
  });

  it("el encabezado muestra el logo y, si no hay, el nombre", () => {
    const withLogo = renderEmailBrandMark({
      name: "Departamento Nacional de Varones",
      logoSrc: "cid:varones-nacional",
    });
    assert.match(withLogo, /src="cid:varones-nacional"/);
    assert.match(withLogo, /alt="Departamento Nacional de Varones"/);
    assert.doesNotMatch(withLogo, /text-transform:uppercase/);

    const plain = renderEmailBrandMark({ name: "IPN Chile" });
    assert.match(plain, /IPN Chile/);
    assert.doesNotMatch(plain, /<img/);
  });

  it("la recuperación del departamento también nombra a Varones", () => {
    const voice = recoveryEmailVoice("IPN Chile", "Departamento Nacional de Varones");
    assert.equal(voice.subject, "Recupera tu contraseña — Departamento Nacional de Varones");
    assert.match(voice.lead, /Departamento Nacional de Varones/);
    assert.doesNotMatch(voice.lead, /Espacio/);
  });

  it("un correo del departamento sin logo recibe la marca en el encabezado", () => {
    const plain = `<td>${renderEmailBrandMark({ name: "IPN Chile" })}</td>`;
    const branded = ensureDepartmentLogo(plain, {
      name: "Departamento Nacional de Varones",
      logoSrc: "cid:varones-nacional",
    });
    assert.match(branded, /src="cid:varones-nacional"/);
    assert.doesNotMatch(branded, /IPN Chile/);
    assert.equal(
      ensureDepartmentLogo(branded, {
        name: "Departamento Nacional de Varones",
        logoSrc: "cid:varones-nacional",
      }).match(/cid:varones-nacional/g)?.length,
      1
    );
  });

  it("solo una invitación de unidades aporta ids", () => {
    assert.deepEqual(
      unitIdsFromAccess({ mode: "units", unitIds: ["departamento-nacional-de-varones"] }),
      ["departamento-nacional-de-varones"]
    );
    assert.equal(unitIdsFromAccess({ mode: "tenant" }), undefined);
    assert.equal(unitIdsFromAccess(undefined), undefined);
  });
});
