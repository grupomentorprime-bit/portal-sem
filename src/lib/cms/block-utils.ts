import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Calendar,
  GraduationCap,
  Heart,
  Library,
  Circle,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  GraduationCap,
  Heart,
  Calendar,
  Library,
  Circle,
};

export function resolveBlockIcon(name?: string): LucideIcon {
  if (!name) return Circle;
  return ICON_MAP[name] ?? Circle;
}

export interface ProgramItemSettings {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon?: string;
  href: string;
}

export interface TeacherItemSettings {
  id: string;
  name: string;
  role: string;
  specialty: string;
  image?: string;
}

export interface NewsItemSettings {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  href: string;
  image?: string;
}

export interface EventItemSettings {
  id: string;
  title: string;
  date: string;
  location: string;
  href: string;
}

export interface TestimonialItemSettings {
  id: string;
  quote: string;
  author: string;
  role: string;
}

export interface StatItemSettings {
  id: string;
  value: string;
  label: string;
}

export interface GalleryItemSettings {
  id: string;
  src: string;
  alt: string;
}

export interface LibraryItemSettings {
  id: string;
  title: string;
  author: string;
  href: string;
}

export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" ? value : fallback;
}

export function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}
