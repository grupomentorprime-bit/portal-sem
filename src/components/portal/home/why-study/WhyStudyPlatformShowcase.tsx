"use client";

import Image from "next/image";
import { BlockIcon } from "@/components/portal/BlockIcon";
import { iconSizes } from "@/design";
import { SEM_PLATFORM_SHOWCASE } from "@/lib/portal/sem-why-study-content";
import { cn } from "@/lib/utils";

interface WhyStudyPlatformShowcaseProps {
  className?: string;
}

export function WhyStudyPlatformShowcase({
  className,
}: WhyStudyPlatformShowcaseProps) {
  const showcase = SEM_PLATFORM_SHOWCASE;

  return (
    <section
      className={cn("why-study-platform", className)}
      aria-labelledby="why-study-platform-heading"
    >
      <div className="why-study-platform__intro">
        <p className="why-study-platform__eyebrow">{showcase.overline}</p>
        <h2 id="why-study-platform-heading" className="why-study-platform__title">
          {showcase.title}
        </h2>
        <p className="why-study-platform__description">{showcase.description}</p>
      </div>

      <div className="why-study-platform__layout">
        <ul className="why-study-platform__features" role="list">
          {showcase.features.map((feature) => (
            <li key={feature.id} className="why-study-platform__feature">
              <span className="why-study-platform__feature-icon" aria-hidden>
                <BlockIcon name={feature.icon} size={iconSizes.lg} strokeWidth={1.75} />
              </span>
              <div className="why-study-platform__feature-body">
                <h3 className="why-study-platform__feature-title">{feature.title}</h3>
                <p className="why-study-platform__feature-description">
                  {feature.description}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <figure className="why-study-platform__visual">
          <div className="why-study-platform__device">
            <Image
              src={showcase.image}
              alt={showcase.imageAlt}
              fill
              className="why-study-platform__image"
              sizes="(max-width: 768px) 100vw, 480px"
            />
            <div className="why-study-platform__device-badge" aria-hidden>
              <span className="why-study-platform__device-label">Modalidad</span>
              <strong className="why-study-platform__device-value">100% Online</strong>
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}
