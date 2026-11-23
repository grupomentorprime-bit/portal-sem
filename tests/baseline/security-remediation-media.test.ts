import assert from "node:assert/strict";
import { describe, it } from "node:test";
import path from "node:path";
import {
  MEDIA_LINK_REVIEW,
  anonymousReadWouldExposePrivate,
  authorizedDeliveryUrl,
  decideMediaRead,
  isSafeMediaStorageKey,
  mediaDiskIsPublicWebRoot,
  mediaDiskRoot,
  presentMediaUrl,
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
      memberUserId: null,
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
      memberUserId: null,
    });
    assert.deepEqual(denied, { allow: false, status: 404 });
    const allowedWithoutUser = decideMediaRead({
      key: "sem/media-sintetica/ficha.pdf",
      operationalTenantId: "sem",
      asset: { ...asset, folder: "Documentos" },
      memberTenantId: "sem",
      memberUserId: null,
    });
    assert.equal(allowedWithoutUser.allow, false);
    const allowed = decideMediaRead({
      key: "sem/media-sintetica/ficha.pdf",
      operationalTenantId: "sem",
      asset: { ...asset, folder: "Documentos" },
      memberTenantId: "sem",
      memberUserId: "usr-sintetico",
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
        memberUserId: "usr-sintetico",
      }).allow,
      false
    );
    assert.equal(
      decideMediaRead({
        key: "sem/media-sintetica/portada.webp",
        operationalTenantId: "sem",
        asset: { ...asset, visibility: "trash" },
        memberTenantId: "sem",
        memberUserId: "usr-sintetico",
      }).allow,
      false
    );
    assert.equal(
      resolveContainedMediaPath(path.join("data", "media"), "sem/media-sintetica/../../secreto"),
      null
    );
  });

  it("un documento privado no sale con la URL del bucket y una imagen pública sí", () => {
    const bucket = "https://cdn.ejemplo.test/media/sem/media-sintetica/ficha.pdf";
    assert.equal(
      presentMediaUrl({ distribution: "private", url: bucket }),
      "/api/cms/media/stream?key=sem%2Fmedia-sintetica%2Fficha.pdf"
    );
    const cover = "https://cdn.ejemplo.test/media/sem/media-sintetica/portada.webp";
    assert.equal(presentMediaUrl({ distribution: "public", url: cover }), cover);
    assert.equal(
      presentMediaUrl({ distribution: "private", url: "/media/sem/media-sintetica/ficha.pdf" }),
      "/api/cms/media/stream?key=sem%2Fmedia-sintetica%2Fficha.pdf"
    );
  });

  it("un privado no sale por CDN y el disco del CMS no es público", () => {
    assert.equal(
      anonymousReadWouldExposePrivate(
        { mode: "s3", accessMode: "public", publicUrl: "https://cdn.ejemplo.test" },
        "private"
      ),
      true
    );
    assert.equal(
      anonymousReadWouldExposePrivate(
        { mode: "s3", accessMode: "private", publicUrl: "https://cdn.ejemplo.test" },
        "private"
      ),
      false
    );
    assert.equal(
      authorizedDeliveryUrl({
        distribution: "private",
        key: "sem/media-sintetica/ficha.pdf",
        publicBase: "https://cdn.ejemplo.test",
        accessMode: "public",
      }),
      "/api/cms/media/stream?key=sem%2Fmedia-sintetica%2Fficha.pdf"
    );
    assert.equal(
      authorizedDeliveryUrl({
        distribution: "public",
        key: "sem/media-sintetica/portada.webp",
        publicBase: "https://cdn.ejemplo.test",
        accessMode: "public",
      }),
      "https://cdn.ejemplo.test/media/sem/media-sintetica/portada.webp"
    );
    assert.equal(mediaDiskIsPublicWebRoot(mediaDiskRoot()), false);
    assert.equal(MEDIA_LINK_REVIEW.localDev.includes("data/media"), true);
  });
});
