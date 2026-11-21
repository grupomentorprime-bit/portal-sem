/**
 * Espacios sintéticos para el Mongo local.
 * Usa la fundación del producto. No lee ni copia el servidor operativo.
 */
import type { Db } from "mongodb";
import { materializeSemTenantContent } from "@/core/tenant/sem-content";
import { ensureAdlTenantFoundation } from "@/core/tenant/migrate-adl";
import { ensureSemTenantFoundation } from "@/core/tenant/migrate-sem";
import { provisionTenantFoundation } from "@/core/tenant/provision";
import { classifySpaceDomainKind } from "@/core/tenant/hosts";
import { createDefaultSiteConfig } from "@/lib/cms/defaults";
import type { TenantType } from "@/core/tenant/types";

export const SYNTHETIC_FIXTURE_ID = "synthetic-spaces-v1";
export const SYNTHETIC_FIXTURE_VERSION = 1;

const LOCAL_ENV = {
  APP_URL: "http://127.0.0.1:3000",
  NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000",
  ADL_DEV_HOST: "adl.localhost:3000",
  ADL_BOOTSTRAP_MEMBER_EMAIL: "persona.sintetica@example.test",
} as const;

const OTHER_SPACES: Array<{
  tenantId: string;
  code: string;
  siteId: string;
  siteCode: string;
  name: string;
  shortName: string;
  type: TenantType;
}> = [
  {
    tenantId: "ipn-chile",
    code: "IPN_CHILE",
    siteId: "ipn-chile",
    siteCode: "S003",
    name: "IPN Chile",
    shortName: "IPN",
    type: "education",
  },
  {
    tenantId: "mentor-cumple",
    code: "CUMPLE",
    siteId: "mentor-cumple",
    siteCode: "S004",
    name: "Mentor Cumple",
    shortName: "Cumple",
    type: "business",
  },
  {
    tenantId: "mentor-capacitacion",
    code: "MENTOR_PRIME_CAPACITACION",
    siteId: "mentor-capacitacion",
    siteCode: "S005",
    name: "Mentor Capacitación",
    shortName: "Capacitación",
    type: "education",
  },
  {
    tenantId: "fundacion-mueve",
    code: "FUNDACION_MUEVE",
    siteId: "fundacion-mueve",
    siteCode: "S006",
    name: "Fundación Mueve",
    shortName: "Mueve",
    type: "social",
  },
];

export interface SyntheticSpaceSeed {
  tenantId: string;
  code: string;
  users: number;
}

export async function seedSyntheticSpaces(db: Db): Promise<SyntheticSpaceSeed[]> {
  await ensureSemTenantFoundation(db, {
    hosts: ["seminario-ipn.localhost:3000"],
    env: LOCAL_ENV,
  });
  await materializeSemTenantContent(db);
  await ensureAdlTenantFoundation(db, { env: { ...LOCAL_ENV } });

  for (const space of OTHER_SPACES) {
    const host = `${space.tenantId}.localhost:3000`;
    const base = createDefaultSiteConfig();
    const config = {
      ...base,
      siteEnabled: false,
      sitePublished: false,
      institution: {
        ...base.institution,
        name: space.name,
        shortName: space.shortName,
        tenant: space.tenantId,
        organization: space.name,
        website: "",
        tagline: "Fixture sintético. Sin datos de personas.",
      },
      seo: {
        ...base.seo,
        title: space.name,
        description: "Espacio sintético de desarrollo.",
      },
      contact: {
        ...base.contact,
        email: "",
        phone: "",
        whatsapp: "",
        address: "",
      },
    };
    await provisionTenantFoundation(db, {
      tenantId: space.tenantId,
      code: space.code,
      name: space.name,
      type: space.type,
      siteId: space.siteId,
      siteCode: space.siteCode,
      siteName: space.shortName,
      hosts: [
        {
          host,
          kind: classifySpaceDomainKind(space.tenantId, host, { env: LOCAL_ENV }),
          isPrimary: true,
        },
      ],
      config,
      seedMenus: true,
      seedHomePage: true,
      seedRoles: true,
      seedStorageStub: true,
      membershipEmail: null,
    });
  }

  const users = await db.collection("identity_users").countDocuments();
  if (users !== 0) {
    throw new Error("El fixture sintético no puede guardar cuentas de persona.");
  }

  const spaces = [
    { tenantId: "seminario-ipn", code: "T001" },
    { tenantId: "adl", code: "T002" },
    ...OTHER_SPACES.map((space) => ({ tenantId: space.tenantId, code: space.code })),
  ];
  await db.collection("dev_fixture_manifest").replaceOne(
    { _id: SYNTHETIC_FIXTURE_ID },
    {
      _id: SYNTHETIC_FIXTURE_ID,
      synthetic: true,
      copiedFromOperational: false,
      version: SYNTHETIC_FIXTURE_VERSION,
      spaces: spaces.map((space) => space.code),
    },
    { upsert: true }
  );

  return spaces.map((space) => ({ ...space, users }));
}
