import { asBoolean, asString } from "@/lib/cms/block-utils";
import { buildContactMapView, buildMapQuery } from "@/lib/portal/contact-map";
import type { ContactInfo, SocialLinks } from "@/types/cms";
import type { ExperienceAction } from "@/types/experience-action";
import {
  CONTACT_CHANNEL_TYPES,
  CONTACT_MAP_PROVIDERS,
  type ContactChannelType,
  type ContactMapProvider,
  type PortalContactChannel,
  type PortalContactChannelView,
  type PortalContactHubAction,
  type PortalContactHubSettings,
  type PortalContactHubViewModel,
  type PortalContactLocation,
  type PortalContactLocationView,
} from "@/types/contact-hub";
import { parseExperienceAction } from "@/core/experience/actions";

function isChannelType(value: string): value is ContactChannelType {
  return (CONTACT_CHANNEL_TYPES as readonly string[]).includes(value);
}

function isMapProvider(value: string): value is ContactMapProvider {
  return (CONTACT_MAP_PROVIDERS as readonly string[]).includes(value);
}

function channelAction(
  type: string,
  value: string,
  url?: string
): ExperienceAction | undefined {
  switch (type) {
    case "phone":
      return value ? { type: "phone", number: value } : undefined;
    case "whatsapp":
      return value ? { type: "whatsapp", phone: value } : undefined;
    case "email":
      return value ? { type: "email", address: value } : undefined;
    case "website":
    case "facebook":
    case "instagram":
    case "youtube":
    case "linkedin":
    case "telegram":
    case "tiktok":
    case "custom":
      return url || value ? { type: "url", href: url || value, newTab: true } : undefined;
    default:
      return undefined;
  }
}

function parseChannels(raw: unknown): PortalContactChannel[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item, index) => ({
      id: asString(item.id, `channel-${index + 1}`),
      type: asString(item.type, "custom"),
      name: asString(item.name),
      value: asString(item.value),
      icon: asString(item.icon) || undefined,
      url: asString(item.url) || undefined,
      visible: item.visible !== false,
      order: typeof item.order === "number" ? item.order : index,
    }))
    .filter((ch) => ch.name && ch.value && ch.visible !== false);
}

function parseLocations(raw: unknown): PortalContactLocation[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item, index) => ({
      id: asString(item.id, `location-${index + 1}`),
      name: asString(item.name),
      address: asString(item.address),
      city: asString(item.city) || undefined,
      region: asString(item.region) || undefined,
      country: asString(item.country) || undefined,
      email: asString(item.email) || undefined,
      phone: asString(item.phone) || undefined,
      hours: asString(item.hours) || undefined,
      mapQuery: asString(item.mapQuery) || undefined,
      primary: asBoolean(item.primary, index === 0),
      visible: item.visible !== false,
    }))
    .filter((loc) => loc.name && loc.address && loc.visible !== false);
}

function parseActions(raw: unknown): PortalContactHubAction[] {
  if (!Array.isArray(raw)) return [];

  const actions: PortalContactHubAction[] = [];

  for (const [index, item] of raw.entries()) {
    if (typeof item !== "object" || item === null) continue;

    const record = item as Record<string, unknown>;
    const action = parseExperienceAction(record.action, {
      href: asString(record.href),
      newTab: asBoolean(record.newTab, false),
    });
    if (!action) continue;

    const label = asString(record.label);
    if (!label || record.visible === false) continue;

    actions.push({
      id: asString(record.id, `action-${index + 1}`),
      label,
      action,
      variant: isButtonVariant(asString(record.variant, "primary"))
        ? (asString(record.variant, "primary") as PortalContactHubAction["variant"])
        : "primary",
      icon: asString(record.icon) || undefined,
      visible: true,
    });
  }

  return actions;
}

function isButtonVariant(value: string): value is NonNullable<PortalContactHubAction["variant"]> {
  return ["primary", "secondary", "outline", "ghost"].includes(value);
}

function defaultChannelsFromContact(
  contact: ContactInfo,
  options: { showHours: boolean; showSocial: boolean },
  social?: SocialLinks
): PortalContactChannel[] {
  const channels: PortalContactChannel[] = [];
  let order = 0;

  if (contact.phone) {
    channels.push({
      id: "phone",
      type: "phone",
      name: "Teléfono",
      value: contact.phone,
      icon: "phone",
      order: order++,
      visible: true,
    });
  }
  if (contact.whatsapp) {
    channels.push({
      id: "whatsapp",
      type: "whatsapp",
      name: "WhatsApp",
      value: contact.whatsapp,
      icon: "message-circle",
      order: order++,
      visible: true,
    });
  }
  if (contact.email) {
    channels.push({
      id: "email",
      type: "email",
      name: "Correo",
      value: contact.email,
      icon: "mail",
      order: order++,
      visible: true,
    });
  }
  if (options.showHours && contact.hours) {
    channels.push({
      id: "hours",
      type: "hours",
      name: "Horario",
      value: contact.hours,
      icon: "clock",
      order: order++,
      visible: true,
    });
  }
  if (contact.address) {
    channels.push({
      id: "address",
      type: "address",
      name: "Dirección",
      value: buildMapQuery([contact.address, contact.city, contact.country]),
      icon: "map-pin",
      order: order++,
      visible: true,
    });
  }

  if (options.showSocial && social) {
    const socialEntries: Array<{ key: keyof SocialLinks; type: ContactChannelType; name: string; icon: string }> = [
      { key: "facebook", type: "facebook", name: "Facebook", icon: "facebook" },
      { key: "instagram", type: "instagram", name: "Instagram", icon: "instagram" },
      { key: "youtube", type: "youtube", name: "YouTube", icon: "youtube" },
      { key: "linkedin", type: "linkedin", name: "LinkedIn", icon: "linkedin" },
      { key: "tiktok", type: "tiktok", name: "TikTok", icon: "music" },
      { key: "spotify", type: "website", name: "Spotify", icon: "music" },
    ];

    for (const entry of socialEntries) {
      const url = social[entry.key];
      if (!url) continue;
      channels.push({
        id: entry.key,
        type: entry.type,
        name: entry.name,
        value: url,
        url,
        icon: entry.icon,
        order: order++,
        visible: true,
      });
    }
  }

  return channels;
}

function defaultLocationFromContact(contact: ContactInfo): PortalContactLocation | null {
  if (!contact.address) return null;
  return {
    id: "primary",
    name: "Sede principal",
    address: contact.address,
    city: contact.city || undefined,
    country: contact.country || undefined,
    email: contact.email || undefined,
    phone: contact.phone || undefined,
    hours: contact.hours || undefined,
    mapQuery: buildMapQuery([contact.address, contact.city, contact.country]),
    primary: true,
    visible: true,
  };
}

function defaultActions(
  contact: ContactInfo,
  formId: string,
  showForm: boolean
): PortalContactHubAction[] {
  const actions: PortalContactHubAction[] = [];

  if (showForm) {
    actions.push({
      id: "form",
      label: "Solicitar información",
      action: { type: "form", formId },
      variant: "primary",
      visible: true,
    });
  }
  if (contact.whatsapp) {
    actions.push({
      id: "whatsapp",
      label: "Escribir WhatsApp",
      action: { type: "whatsapp", phone: contact.whatsapp },
      variant: "outline",
      icon: "message-circle",
      visible: true,
    });
  }
  if (contact.phone) {
    actions.push({
      id: "call",
      label: "Llamar",
      action: { type: "phone", number: contact.phone },
      variant: "outline",
      icon: "phone",
      visible: true,
    });
  }

  return actions;
}

function toChannelViews(channels: PortalContactChannel[]): PortalContactChannelView[] {
  return channels
    .map((channel, index) => {
      const type = isChannelType(asString(channel.type)) ? channel.type : "custom";
      const action = channelAction(type, channel.value, channel.url);
      return {
        id: asString(channel.id, `channel-${index + 1}`),
        type,
        name: channel.name,
        value: channel.value,
        icon: channel.icon,
        action,
        visible: channel.visible !== false,
        order: channel.order ?? index,
      };
    })
    .filter((ch) => ch.visible)
    .sort((a, b) => a.order - b.order);
}

function toLocationViews(locations: PortalContactLocation[]): PortalContactLocationView[] {
  return locations
    .map((loc, index) => ({
      id: asString(loc.id, `location-${index + 1}`),
      name: loc.name,
      address: loc.address,
      city: loc.city,
      region: loc.region,
      country: loc.country,
      email: loc.email,
      phone: loc.phone,
      hours: loc.hours,
      mapQuery: loc.mapQuery,
      primary: loc.primary ?? index === 0,
      visible: loc.visible !== false,
    }))
    .filter((loc) => loc.visible);
}

export interface BuildContactHubInput {
  contact: ContactInfo;
  social?: SocialLinks;
}

export function normalizeContactHubSettings(
  settings: PortalContactHubSettings | Record<string, unknown>
): PortalContactHubSettings {
  const raw = settings as PortalContactHubSettings;
  const providerRaw = asString(raw.mapProvider, "google");

  return {
    overline: asString(raw.overline) || undefined,
    title: asString(raw.title, "Contacto"),
    description: asString(raw.description) || undefined,
    showMap: asBoolean(raw.showMap, true),
    showHours: asBoolean(raw.showHours, true),
    showSocial: asBoolean(raw.showSocial, true),
    showLocations: asBoolean(raw.showLocations, false),
    showForm: asBoolean(raw.showForm, true),
    mapProvider: isMapProvider(providerRaw) ? providerRaw : "google",
    formId: asString(raw.formId, "contact"),
    channels: parseChannels(raw.channels),
    locations: parseLocations(raw.locations),
    actions: parseActions(raw.actions),
    useInstitutionDefaults: asBoolean(raw.useInstitutionDefaults, true),
  };
}

export function buildContactHubViewModel(
  settings: PortalContactHubSettings | Record<string, unknown>,
  input: BuildContactHubInput
): PortalContactHubViewModel {
  const normalized = normalizeContactHubSettings(settings);
  const { contact, social } = input;

  const useDefaults =
    normalized.useInstitutionDefaults !== false && normalized.channels!.length === 0;

  const channels = useDefaults
    ? defaultChannelsFromContact(contact, {
        showHours: normalized.showHours!,
        showSocial: normalized.showSocial!,
      }, social)
    : normalized.channels!;

  const channelViews = toChannelViews(channels);

  const locations =
    normalized.showLocations && normalized.locations!.length > 0
      ? normalized.locations!
      : normalized.showLocations
        ? [defaultLocationFromContact(contact)].filter(Boolean) as PortalContactLocation[]
        : [];

  const locationViews = toLocationViews(locations);

  const actions =
    normalized.actions!.length > 0
      ? normalized.actions!
      : defaultActions(contact, normalized.formId!, normalized.showForm!);

  const primaryLocation = locationViews.find((l) => l.primary) ?? locationViews[0];
  const addressChannel = channelViews.find((c) => c.type === "address");
  const mapQuery =
    primaryLocation?.mapQuery ??
    addressChannel?.value ??
    buildMapQuery([contact.address, contact.city, contact.country]);

  const map =
    normalized.showMap && mapQuery
      ? buildContactMapView(mapQuery, normalized.mapProvider as ContactMapProvider)
      : undefined;

  return {
    overline: normalized.overline,
    title: normalized.title!,
    description: normalized.description,
    showMap: normalized.showMap!,
    showHours: normalized.showHours!,
    showSocial: normalized.showSocial!,
    showLocations: normalized.showLocations!,
    showForm: normalized.showForm!,
    formId: normalized.formId,
    channels: channelViews.filter((ch) => {
      if (ch.type === "hours" && !normalized.showHours) return false;
      if (
        ["facebook", "instagram", "youtube", "linkedin", "telegram", "tiktok", "website"].includes(
          ch.type
        ) &&
        !normalized.showSocial
      ) {
        return false;
      }
      return true;
    }),
    locations: locationViews,
    actions,
    map,
  };
}

/** Configuración mínima para el footer — sin mapa ni acciones */
export function buildFooterContactViewModel(
  input: BuildContactHubInput,
  title?: string
): PortalContactHubViewModel {
  return buildContactHubViewModel(
    {
      title: title ?? "Contacto",
      showMap: false,
      showForm: false,
      showLocations: false,
      showSocial: false,
      showHours: false,
      useInstitutionDefaults: true,
      actions: [],
    },
    input
  );
}
