export const AVATAR_PRESETS = [
  { id: "aurora", label: "Aurora" },
  { id: "bosque", label: "Bosque" },
  { id: "cobalto", label: "Cobalto" },
  { id: "coral", label: "Coral" },
  { id: "lima", label: "Lima" },
  { id: "noche", label: "Noche" },
  { id: "arena", label: "Arena" },
  { id: "violeta", label: "Violeta" },
] as const;

export type AvatarPresetId = (typeof AVATAR_PRESETS)[number]["id"];

export function parseAvatarPresetId(raw: unknown): AvatarPresetId | null {
  if (typeof raw !== "string") return null;
  return AVATAR_PRESETS.some((p) => p.id === raw) ? (raw as AvatarPresetId) : null;
}

export function avatarPresetSrc(id: AvatarPresetId): string {
  return `/desktop/avatars/${id}.svg`;
}

export function customAvatarUrl(userId?: string | null, version?: string | null): string {
  const stamp = version?.trim() || "1";
  const who = userId?.trim();
  const base = `/api/desktop/avatar/file?v=${encodeURIComponent(stamp)}`;
  return who ? `${base}&userId=${encodeURIComponent(who)}` : base;
}

export function desktopAvatarInitials(name: string, email: string): string {
  const parts = (name || email).trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return (parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "NZ").slice(0, 2);
}

export type DesktopAvatarView =
  | { kind: "photo"; url: string }
  | { kind: "preset"; id: AvatarPresetId; src: string }
  | { kind: "initials"; text: string };

export function resolveDesktopAvatar(input: {
  displayName: string;
  email: string;
  avatarPhoto?: boolean;
  avatarPhotoUpdatedAt?: string;
  avatarPresetId?: string | null;
  userId?: string | null;
}): DesktopAvatarView {
  if (input.avatarPhoto) {
    return {
      kind: "photo",
      url: customAvatarUrl(input.userId, input.avatarPhotoUpdatedAt),
    };
  }
  const preset = parseAvatarPresetId(input.avatarPresetId);
  if (preset) return { kind: "preset", id: preset, src: avatarPresetSrc(preset) };
  return {
    kind: "initials",
    text: desktopAvatarInitials(input.displayName, input.email),
  };
}