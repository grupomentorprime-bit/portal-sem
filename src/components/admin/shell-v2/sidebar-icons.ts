import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ClipboardList,
  Globe,
  GraduationCap,
  HelpCircle,
  Home,
  Image,
  Megaphone,
  Settings,
  UserCircle,
  UsersRound,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  home: Home,
  institution: Building2,
  portal: Globe,
  programs: GraduationCap,
  admission: ClipboardList,
  students: UsersRound,
  communications: Megaphone,
  people: UserCircle,
  media: Image,
  admin: Settings,
  help: HelpCircle,
};

export function getNavIcon(icon?: string): LucideIcon {
  if (!icon) return Home;
  return ICON_MAP[icon] ?? Home;
}
