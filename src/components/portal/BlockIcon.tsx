import type { LucideProps } from "lucide-react";
import {
  BookOpen,
  Calendar,
  Circle,
  GraduationCap,
  Heart,
  Library,
} from "lucide-react";

const ICONS = {
  BookOpen,
  GraduationCap,
  Heart,
  Calendar,
  Library,
  Circle,
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
