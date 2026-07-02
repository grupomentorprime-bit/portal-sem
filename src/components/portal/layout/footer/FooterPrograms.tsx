/**
 * @deprecated Usar PortalFooterNavigation — ver docs/core/CORE-FOOTER-PREMIUM-v1.md
 */

import Link from "next/link";
import { focusRing } from "@/components/ui/shared";
import { cn } from "@/lib/utils";
import type { ProgramItem } from "@/types/content";
import { FooterSectionHeading } from "./FooterSectionHeading";

interface FooterProgramsProps {
  title: string;
  programs: ProgramItem[];
}

export function FooterPrograms({ title, programs }: FooterProgramsProps) {
  if (programs.length === 0) return null;

  return (
    <div className="portal-footer-premium__column">
      <FooterSectionHeading title={title} />
      <ul className="portal-footer-premium__links">
        {programs.map((program) => (
          <li key={program.id}>
            <Link
              href={program.href}
              className={cn("portal-footer-premium__link", focusRing)}
            >
              {program.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
