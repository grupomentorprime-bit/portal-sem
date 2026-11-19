import assert from "node:assert/strict";
import { describe, it } from "node:test";
import path from "node:path";
import {
  MEDIA_LINK_REVIEW,
  decideMediaRead,
  directStorageBypassesApp,
  isSafeMediaStorageKey,
  resolveContainedMediaPath,
  resolveMediaDistribution,
} from "../../src/core/security/media-access";

const asset = {
  tenant: "sem",
  folder: "Hero",
  storageKey: "sem/media-sintetica/",
  visibility: "active",
  status: "active",
};

describe("medios por propósito", () => {
  it("un pdf de portada es público y una imagen de documentos es privada", () => {
    assert.equal(resolveMediaDistribution({ folder: "Hero", distribution: null }), "public");
    assert.equal(
      resolveMediaDistribution({ folder: "Documentos", distribution: null }),
      "private"
    );
    assert.equal(
      resolveMediaDistribution({ folder: "Hero", distribution: "private" }),
      "private"
    );
  });

  it("la imagen pública del Espacio responde con caché de una hora", () => {
    const decision = decideMediaRead({
      key: "sem/media-sintetica/portada.webp",
      operationalTenantId: "sem",
      asset,
      memberTenantId: null,
    });
    assert.equal(decision.allow, true);
    if (!decision.allow) return;
    assert.equal(decision.cacheControl, "public, max-age=3600");
  });

  it("el archivo privado sin membresía del Espacio responde 404 y no-store si hay sesión", () => {
    const denied = decideMediaRead({
      key: "sem/media-sintetica/ficha.pdf",
      operationalTenantId: "sem",
      asset: { ...asset, folder: "Documentos" },
      memberTenantId: null,
    });
    assert.deepEqual(denied, { allow: false, status: 404 });
    const allowed = decideMediaRead({
      key: "sem/media-sintetica/ficha.pdf",
      operationalTenantId: "sem",
      asset: { ...asset, folder: "Documentos" },
      memberTenantId: "sem",
    });
    assert.equal(allowed.allow, true);
    if (!allowed.allow) return;
    assert.equal(allowed.cacheControl, "private, no-store");
  });

  it("otro Espacio, una clave con .. y la papelera responden 404", () => {
    assert.equal(isSafeMediaStorageKey("sem/media-sintetica/../../secreto"), false);
    assert.equal(
      decideMediaRead({
        key: "otro/media-sintetica/portada.webp",
        operationalTenantId: "sem",
        asset: { ...asset, tenant: "otro" },
        memberTenantId: "sem",
      }).allow,
      false
    );
    assert.equal(
      decideMediaRead({
        key: "sem/media-sintetica/portada.webp",
        operationalTenantId: "sem",
        asset: { ...asset, visibility: "trash" },
        memberTenantId: "sem",
      }).allow,
      false
    );
    assert.equal(
      resolveContainedMediaPath(path.join("data", "media"), "sem/media-sintetica/../../secreto"),
      null
    );
  });

  it("el enlace directo del bucket queda fuera de esta puerta", () => {
    assert.equal(
      directStorageBypassesApp({
        mode: "s3",
        accessMode: "public",
        publicUrl: "https://cdn.ejemplo.test",
      }),
      true
    );
    assert.equal(MEDIA_LINK_REVIEW.unchanged.includes("accessMode"), true);
  });
});
