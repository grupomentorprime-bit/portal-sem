import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Building2,
  ClipboardList,
  Globe,
  GraduationCap,
  HelpCircle,
  Home,
  Image,
  Megaphone,
  MessageCircle,
  Monitor,
  Settings,
  UserCircle,
  Users,
  UsersRound,
  Zap,
  Wrench,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  home: Home,
  institution: Building2,
  portal: Globe,
  site: Monitor,
  programs: GraduationCap,
  admission: ClipboardList,
  students: UsersRound,
  communications: Megaphone,
  people: UserCircle,
  media: Image,
  admin: Settings,
  settings: Settings,
  help: HelpCircle,
  development: Wrench,
  sales: Users,
  messages: MessageCircle,
  activity: Activity,
  campaigns: Megaphone,
  automations: Zap,
  analytics: BarChart3,
  team: UsersRound,
};

export function getNavIcon(icon?: string): LucideIcon {
  if (!icon) return Home;
  return ICON_MAP[icon] ?? Home;
}
