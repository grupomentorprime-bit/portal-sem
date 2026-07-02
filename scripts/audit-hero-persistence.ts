/**
 * OT-BUG-HERO-007 — Auditoría de persistencia del Hero
 * Ejecutar: npx tsx --env-file=.env.local scripts/audit-hero-persistence.ts
 *
 * No importa módulos server-only; replica la lógica de lookup/resolve en línea.
 */
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

if (!uri || !dbName) {
  console.error("Faltan MONGODB_URI o MONGODB_DB en .env.local");
  process.exit(1);
}

type StageStatus = "ok" | "fail" | "skip" | "warn";

interface StageRow {
  stage: string;
  status: StageStatus;
  detail: string;
}

interface MediaResponsive {
  w1920?: string;
  w1080?: string;
  webp?: string;
  w1200?: string;
}

interface MediaDoc {
  _id: string;
  tenant: string;
  visibility?: string;
  url?: string;
  thumbnail?: string;
  responsive?: MediaResponsive;
}

interface HeroSlideDoc {
  id: string;
  order: number;
  priority: string;
  publication: { status: string };
  scheduling: { showFrom: string; showUntil: string };
  multimedia: {
    desktopMediaId: string;
    mobileMediaId: string;
  };
}

function statusIcon(s: StageStatus): string {
  if (s === "ok") return "✅";
  if (s === "fail") return "❌";
  if (s === "warn") return "⚠️";
  return "—";
}

function truncate(s: string, max = 72): string {
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function pickW1920(asset: MediaDoc): string {
  const r = asset.responsive ?? {};
  return (r.w1920 ?? r.webp ?? asset.url ?? "").trim();
}

/** Réplica de findMediaById (lookup.ts) */
async function findMediaById(
  db: ReturnType<MongoClient["db"]>,
  tenant: string,
  mediaId: string
): Promise<MediaDoc | null> {
  if (!mediaId?.trim()) return null;
  return db.collection<MediaDoc>("cms_media").findOne({
    _id: mediaId,
    tenant,
    $or: [{ visibility: "active" }, { visibility: { $exists: false } }],
  });
}

function isSlideVisible(slide: HeroSlideDoc, at = new Date()): boolean {
  const { status } = slide.publication;
  if (status === "archived" || status === "draft") return false;
  const from = slide.scheduling?.showFrom?.trim();
  const until = slide.scheduling?.showUntil?.trim();
  if (from && at < new Date(from)) return false;
  if (until) {
    const end = new Date(until);
    end.setHours(23, 59, 59, 999);
    if (at > end) return false;
  }
  return true;
}

function simulateHeroPremiumImage(view: {
  id: string;
  imagenDesktopUrl?: string;
  imagenMobileUrl?: string;
}): StageRow {
  const desktopUrl = view.imagenDesktopUrl;
  const mobileUrl = view.imagenMobileUrl;
  const hasDistinctMobile = Boolean(mobileUrl && mobileUrl !== desktopUrl);

  if (!desktopUrl && !mobileUrl) {
    return {
      stage: `HeroPremiumImage (${view.id}) — render <img>`,
      status: "fail",
      detail: "sin URLs → capa vacía (no hay <img>)",
    };
  }

  if (desktopUrl && hasDistinctMobile) {
    return {
      stage: `HeroPremiumImage (${view.id}) — render <img>`,
      status: "ok",
      detail: `desktop + mobile <img>`,
    };
  }

  if (!hasDistinctMobile && (desktopUrl ?? mobileUrl)) {
    return {
      stage: `HeroPremiumImage (${view.id}) — render <img>`,
      status: "ok",
      detail: `single <img src="${truncate(desktopUrl ?? mobileUrl!)}"`,
    };
  }

  return {
    stage: `HeroPremiumImage (${view.id}) — render <img>`,
    status: "fail",
    detail: `desktop=${truncate(desktopUrl ?? "")} mobile=${truncate(mobileUrl ?? "")}`,
  };
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  console.log("═".repeat(60));
  console.log("OT-BUG-HERO-007 — Auditoría de persistencia del Hero");
  console.log("═".repeat(60));

  const rawConfig = await db.collection("cms_config").findOne({ _id: "site" });
  if (!rawConfig) {
    console.error("❌ No hay cms_config con _id=site");
    await client.close();
    process.exit(1);
  }

  const tenant = (rawConfig as { institution?: { tenant?: string } }).institution?.tenant ?? "";
  const heroPortal = (rawConfig as { heroPortal?: { enabled?: boolean; type?: string; slides?: HeroSlideDoc[] } })
    .heroPortal;
  const slides = heroPortal?.slides ?? [];

  console.log(`\nTenant config: "${tenant}"`);
  console.log(`heroPortal.enabled: ${heroPortal?.enabled}`);
  console.log(`heroPortal.type: ${heroPortal?.type}`);
  console.log(`Total slides en MongoDB: ${slides.length}`);

  const visibleSlides = slides.filter((s) => isSlideVisible(s));
  console.log(`Slides visibles (público): ${visibleSlides.length}`);

  const allRows: StageRow[] = [];

  if (visibleSlides.length === 0) {
    console.log("\n⚠️  Ningún slide visible en portal público:");
    for (const [i, slide] of slides.entries()) {
      console.log(
        `  [${i}] id=${slide.id} status=${slide.publication?.status} desktopMediaId=${slide.multimedia?.desktopMediaId || "(vacío)"}`
      );
    }
    await client.close();
    process.exit(0);
  }

  const resolvedViews: Array<{
    id: string;
    imagenDesktopUrl?: string;
    imagenMobileUrl?: string;
  }> = [];

  for (const [i, slide] of visibleSlides.entries()) {
    const desktopId = slide.multimedia?.desktopMediaId?.trim() ?? "";
    const mobileId = slide.multimedia?.mobileMediaId?.trim() ?? "";
    const label = `slide[${i}] id=${slide.id}`;

    // Etapa: valor en memoria/CMS (lo que está en el documento)
    allRows.push({
      stage: `${label} — MongoDB cms_config.desktopMediaId`,
      status: desktopId.startsWith("media-") ? "ok" : "fail",
      detail: desktopId || "(vacío)",
    });

    if (!desktopId) continue;

    // Media Manager equivalent: existe en cms_media?
    const assetByIdOnly = await db.collection<MediaDoc>("cms_media").findOne({ _id: desktopId });
    allRows.push({
      stage: `${label} — Media Library (cms_media por _id)`,
      status: assetByIdOnly ? "ok" : "fail",
      detail: assetByIdOnly
        ? `_id=${assetByIdOnly._id}, tenant=${assetByIdOnly.tenant}, visibility=${assetByIdOnly.visibility ?? "(sin campo)"}`
        : "documento no existe",
    });

    // findMediaById con tenant del config
    const asset = await findMediaById(db, tenant, desktopId);
    allRows.push({
      stage: `${label} — findMediaById(tenant="${tenant}")`,
      status: asset ? "ok" : "fail",
      detail: asset ? `encontrado` : "null",
    });

    if (!asset && assetByIdOnly) {
      allRows.push({
        stage: `${label} — DIAGNÓSTICO tenant mismatch`,
        status: "warn",
        detail: `asset.tenant="${assetByIdOnly.tenant}" ≠ config.tenant="${tenant}" → findMediaById devuelve null`,
      });
    }

    if (assetByIdOnly?.visibility === "trash") {
      allRows.push({
        stage: `${label} — visibility`,
        status: "fail",
        detail: "asset en papelera — excluido por findMediaById",
      });
    }

    if (asset) {
      const w1920 = pickW1920(asset);
      allRows.push({
        stage: `${label} — pickVariantUrl(w1920)`,
        status: w1920 ? "ok" : "fail",
        detail: truncate(w1920) || "responsive.w1920, webp y url vacíos",
      });
    }

    const imagenDesktopUrl = asset ? pickW1920(asset) || null : null;
    let imagenMobileUrl: string | null = imagenDesktopUrl;

    if (mobileId && mobileId !== desktopId) {
      const mobileAsset = await findMediaById(db, tenant, mobileId);
      imagenMobileUrl = mobileAsset ? pickW1920(mobileAsset) || imagenDesktopUrl : imagenDesktopUrl;
    } else if (mobileId) {
      const mobileAsset = await findMediaById(db, tenant, mobileId);
      imagenMobileUrl = mobileAsset ? pickW1920(mobileAsset) || imagenDesktopUrl : imagenDesktopUrl;
    }

    allRows.push({
      stage: `${label} — resolveHeroSlides() → imagenDesktopUrl`,
      status: imagenDesktopUrl ? "ok" : "fail",
      detail: truncate(imagenDesktopUrl ?? "") || "undefined",
    });

    allRows.push({
      stage: `${label} — resolveHeroSlides() → imagenMobileUrl`,
      status: imagenMobileUrl ? "ok" : "fail",
      detail: truncate(imagenMobileUrl ?? "") || "undefined",
    });

    resolvedViews.push({
      id: slide.id,
      imagenDesktopUrl: imagenDesktopUrl ?? undefined,
      imagenMobileUrl: imagenMobileUrl ?? undefined,
    });
  }

  for (const view of resolvedViews) {
    allRows.push({
      stage: `HeroPremiumSection (${view.id}) — recibe URLs`,
      status: view.imagenDesktopUrl || view.imagenMobileUrl ? "ok" : "fail",
      detail: `imagenDesktopUrl=${truncate(view.imagenDesktopUrl ?? "") || "undefined"}`,
    });
    allRows.push(simulateHeroPremiumImage(view));
  }

  console.log("\n┌─────────────────────────────────────────────────────────────┐");
  console.log("│ TABLA DE AUDITORÍA (evidencia runtime MongoDB)              │");
  console.log("└─────────────────────────────────────────────────────────────┘\n");

  console.log("| Etapa | Estado | Detalle |");
  console.log("|-------|--------|---------|");
  for (const row of allRows) {
    console.log(`| ${row.stage} | ${statusIcon(row.status)} | ${row.detail} |`);
  }

  const fails = allRows.filter((r) => r.status === "fail");
  const warns = allRows.filter((r) => r.status === "warn");

  if (fails.length > 0) {
    console.log("\n── Punto de ruptura (primera falla) ──");
    console.log(`Etapa: ${fails[0]!.stage}`);
    console.log(`Detalle: ${fails[0]!.detail}`);
  }

  if (warns.length > 0) {
    console.log("\n── Advertencias ──");
    for (const w of warns) {
      console.log(`⚠️  ${w.stage}: ${w.detail}`);
    }
  }

  if (fails.length === 0) {
    console.log("\n✅ Cadena servidor OK en esta ejecución.");
  }

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
