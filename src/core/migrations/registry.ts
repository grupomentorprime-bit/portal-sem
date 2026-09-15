import { migration001HeroV2 } from "@/core/migrations/001-hero-v2";
import { migration002MenuV2 } from "@/core/migrations/002-menu-v2";
import { migration003FooterV2 } from "@/core/migrations/003-footer-v2";
import { migration004BrandingV2 } from "@/core/migrations/004-branding-v2";
import { migration005ContentV2 } from "@/core/migrations/005-content-v2";
import { migration006SaasFoundation } from "@/core/migrations/006-saas-foundation";
import { migration007SaasIsolation } from "@/core/migrations/007-saas-isolation";
import { migration008SaasSingletons } from "@/core/migrations/008-saas-singletons";
import { migration009SaasBranding } from "@/core/migrations/009-saas-branding";
import { migration010SaasSemContent } from "@/core/migrations/010-saas-sem-content";
import { migration011SaasDomains } from "@/core/migrations/011-saas-domains";
import { migration012SaasAdlTenant } from "@/core/migrations/012-saas-adl-tenant";
import { migration013GrowthPersonas } from "@/core/migrations/013-growth-personas";
import { migration014GrowthOportunidades } from "@/core/migrations/014-growth-oportunidades";
import { migration015GrowthActividades } from "@/core/migrations/015-growth-actividades";
import { migration016GrowthAutomations } from "@/core/migrations/016-growth-automations";
import { migration017GrowthAutomationRuns } from "@/core/migrations/017-growth-automation-runs";
import { migration018GrowthMessaging } from "@/core/migrations/018-growth-messaging";
import { migration019GrowthWhatsApp } from "@/core/migrations/019-growth-whatsapp";
import { migration020GrowthWhatsAppOutbound } from "@/core/migrations/020-growth-whatsapp-outbound";
import { migration021GrowthCampaigns } from "@/core/migrations/021-growth-campaigns";
import { migration022GrowthAnalytics } from "@/core/migrations/022-growth-analytics";
import { migration023GrowthTeamMembershipUnique } from "@/core/migrations/023-growth-team-membership-unique";
import { migration024GrowthStartupNextAction } from "@/core/migrations/024-growth-startup-next-action";
import type { MigrationDefinition } from "@/core/migrations/types";

/** Registro ordenado de migraciones — añadir nuevas al final */
export const MIGRATIONS: MigrationDefinition[] = [
  migration001HeroV2,
  migration002MenuV2,
  migration003FooterV2,
  migration004BrandingV2,
  migration005ContentV2,
  migration006SaasFoundation,
  migration007SaasIsolation,
  migration008SaasSingletons,
  migration009SaasBranding,
  migration010SaasSemContent,
  migration011SaasDomains,
  migration012SaasAdlTenant,
  migration013GrowthPersonas,
  migration014GrowthOportunidades,
  migration015GrowthActividades,
  migration016GrowthAutomations,
  migration017GrowthAutomationRuns,
  migration018GrowthMessaging,
  migration019GrowthWhatsApp,
  migration020GrowthWhatsAppOutbound,
  migration021GrowthCampaigns,
  migration022GrowthAnalytics,
  migration023GrowthTeamMembershipUnique,
  migration024GrowthStartupNextAction,
];

export function getMigrationById(id: string): MigrationDefinition | undefined {
  return MIGRATIONS.find((m) => m.id === id);
}
