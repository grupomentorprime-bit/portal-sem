import { cn } from "@/lib/utils";
import { Container, Stack } from "@/components/layout";
import { Button } from "./button";

interface HeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  className?: string;
  align?: "left" | "center";
}

export function Hero({
  title,
  subtitle,
  description,
  primaryCta,
  secondaryCta,
  className,
  align = "left",
}: HeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-primary py-16 text-text-inverse sm:py-24",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at top right, var(--accent), transparent 60%)",
        }}
        aria-hidden
      />
      <Container>
        <Stack
          gap={6}
          align={align === "center" ? "center" : "start"}
          className={cn("relative max-w-3xl", align === "center" && "mx-auto text-center")}
        >
          {subtitle ? (
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              {subtitle}
            </p>
          ) : null}
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
          {description ? (
            <p className="text-lg text-text-inverse/75">{description}</p>
          ) : null}
          {(primaryCta || secondaryCta) && (
            <div
              className={cn(
                "flex flex-wrap gap-3",
                align === "center" && "justify-center"
              )}
            >
              {primaryCta ? (
                <Button href={primaryCta.href} variant="secondary" size="lg">
                  {primaryCta.label}
                </Button>
              ) : null}
              {secondaryCta ? (
                <Button
                  href={secondaryCta.href}
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-text-inverse hover:bg-white/10"
                >
                  {secondaryCta.label}
                </Button>
              ) : null}
            </div>
          )}
        </Stack>
      </Container>
    </section>
  );
}
