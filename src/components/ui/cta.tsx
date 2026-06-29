import { cn } from "@/lib/utils";
import { Container, Stack } from "@/components/layout";
import { Button } from "./button";

interface CTAProps {
  title: string;
  description?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  variant?: "default" | "accent";
  className?: string;
}

export function CTA({
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  variant = "default",
  className,
}: CTAProps) {
  return (
    <section
      className={cn(
        "py-12",
        variant === "accent" ? "bg-accent/10" : "bg-background-muted",
        className
      )}
    >
      <Container size="md">
        <Stack gap={6} align="center" className="text-center">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h2>
          {description ? (
            <p className="max-w-xl text-muted">{description}</p>
          ) : null}
          <div className="flex flex-wrap justify-center gap-3">
            <Button href={primaryHref} variant="primary">
              {primaryLabel}
            </Button>
            {secondaryLabel && secondaryHref ? (
              <Button href={secondaryHref} variant="outline">
                {secondaryLabel}
              </Button>
            ) : null}
          </div>
        </Stack>
      </Container>
    </section>
  );
}
