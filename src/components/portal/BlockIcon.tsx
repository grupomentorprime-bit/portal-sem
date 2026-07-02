import type { LucideProps } from "lucide-react";
import {
  Award,
  BookOpen,
  Calendar,
  Circle,
  ClipboardCheck,
  Clock,
  Compass,
  GraduationCap,
  Heart,
  Library,
  Monitor,
  Shield,
  Sparkles,
  Users,
  Video,
} from "lucide-react";

const ICONS = {
  Award,
  BookOpen,
  Calendar,
  Circle,
  ClipboardCheck,
  Clock,
  Compass,
  GraduationCap,
  Heart,
  Library,
  Monitor,
  Shield,
  Sparkles,
  Users,
  Video,
} as const;

type IconName = keyof typeof ICONS;

interface BlockIconProps extends LucideProps {
  name?: string;
}

export function BlockIcon({ name, ...props }: BlockIconProps) {
  const key = (name && name in ICONS ? name : "Circle") as IconName;
  const Icon = ICONS[key];
  return <Icon {...props} />;
}
