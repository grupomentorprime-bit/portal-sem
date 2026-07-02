import { parseExperienceAction, isValidExperienceAction } from "@/core/experience/actions";
import {
  CTA_BUTTON_VARIANTS,
  CTA_PREMIUM_BACKGROUNDS,
  CTA_PREMIUM_VARIANTS,
  type CtaButtonVariant,
  type CtaPremiumBackground,
  type CtaPremiumVariant,
  type PortalCtaButton,
  type PortalCtaStat,
  type PortalCTAPremiumSettings,
} from "@/types/cta-premium";
import { asBoolean, asString } from "@/lib/cms/block-utils";

function isVariant(value: string): value is CtaPremiumVariant {
  return (CTA_PREMIUM_VARIANTS as readonly string[]).includes(value);
}

function isBackground(value: string): value is CtaPremiumBackground {
  return (CTA_PREMIUM_BACKGROUNDS as readonly string[]).includes(value);
}

function isButtonVariant(value: string): value is CtaButtonVariant {
  return (CTA_BUTTON_VARIANTS as readonly string[]).includes(value);
}

function parseButtons(raw: unknown): PortalCtaButton[] {
  if (!Array.isArray(raw)) return [];

  const buttons: PortalCtaButton[] = [];

  for (const [index, item] of raw.entries()) {
    if (typeof item !== "object" || item === null) continue;

    const record = item as Record<string, unknown>;
    const action = parseExperienceAction(record.action, {
      href: asString(record.href),
      newTab: asBoolean(record.newTab, false),
    });

    if (!isValidExperienceAction(action)) continue;

    const label = asString(record.label);
    if (!label || record.visible === false) continue;

    buttons.push({
      id: asString(record.id, `btn-${index + 1}`),
      label,
      action,
      variant: isButtonVariant(asString(record.variant, "primary"))
        ? (asString(record.variant, "primary") as CtaButtonVariant)
        : "primary",
      icon: asString(record.icon) || undefined,
      visible: true,
    });

    if (buttons.length >= 3) break;
  }

  return buttons;
}

function parseStats(raw: unknown): PortalCtaStat[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item, index) => ({
      id: asString(item.id, `stat-${index + 1}`),
      value: asString(item.value),
      label: asString(item.label),
      visible: item.visible !== false,
    }))
    .filter((stat) => stat.value && stat.label && stat.visible !== false)
    .slice(0, 6);
}

function legacyButtons(settings: PortalCTAPremiumSettings): PortalCtaButton[] {
  const buttons: PortalCtaButton[] = [];
  const primaryLabel = asString(settings.primaryLabel);
  const primaryHref = asString(settings.primaryHref);
  const secondaryLabel = asString(settings.secondaryLabel);
  const secondaryHref = asString(settings.secondaryHref);

  if (primaryLabel && primaryHref) {
    buttons.push({
      id: "primary",
      label: primaryLabel,
      action: { type: "url", href: primaryHref },
      variant: "primary",
      visible: true,
    });
  }
  if (secondaryLabel && secondaryHref) {
    buttons.push({
      id: "secondary",
      label: secondaryLabel,
      action: { type: "url", href: secondaryHref },
      variant: "outline",
      visible: true,
    });
  }
  return buttons;
}

export function normalizeCtaPremiumSettings(
  settings: PortalCTAPremiumSettings | Record<string, unknown>
): {
  overline?: string;
  title: string;
  description?: string;
  variant: CtaPremiumVariant;
  background: CtaPremiumBackground;
  image?: string;
  imageAlt?: string;
  showStats: boolean;
  stats: PortalCtaStat[];
  buttons: PortalCtaButton[];
} {
  const raw = settings as PortalCTAPremiumSettings;
  const variantRaw = asString(raw.variant, "center");
  const backgroundRaw = asString(raw.background, "primary");
  const legacyVariant = asString(raw.variant);
  const mappedVariant =
    legacyVariant === "default"
      ? "minimal"
      : legacyVariant === "primary"
        ? "highlight"
        : variantRaw;

  const parsedButtons = parseButtons(raw.buttons);
  const buttons = parsedButtons.length > 0 ? parsedButtons : legacyButtons(raw);

  return {
    overline: asString(raw.overline) || undefined,
    title: asString(raw.title),
    description: asString(raw.description) || undefined,
    variant: isVariant(mappedVariant) ? mappedVariant : "center",
    background: isBackground(backgroundRaw) ? backgroundRaw : "primary",
    image: asString(raw.image) || undefined,
    imageAlt: asString(raw.imageAlt, asString(raw.title, "CTA")) || "CTA",
    showStats: asBoolean(raw.showStats, false),
    stats: parseStats(raw.stats),
    buttons,
  };
}
