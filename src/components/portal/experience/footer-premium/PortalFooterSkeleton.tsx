import { PortalContainer } from "@/components/portal/layout/PortalContainer";

export function PortalFooterSkeleton() {
  return (
    <footer
      className="portal-footer-premium portal-footer-premium--skeleton"
      aria-busy="true"
      aria-label="Cargando pie de página"
    >
      <PortalContainer className="portal-footer-premium__main">
        <div className="portal-footer-premium__grid portal-footer-premium__grid--experience">
          <div className="portal-footer-premium__column portal-footer-premium__column--institution space-y-4">
            <div className="h-12 w-40 animate-pulse rounded bg-text-inverse/10" />
            <div className="h-4 w-full max-w-xs animate-pulse rounded bg-text-inverse/10" />
            <div className="h-4 w-3/4 max-w-xs animate-pulse rounded bg-text-inverse/10" />
          </div>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="portal-footer-premium__column space-y-3">
              <div className="h-3 w-20 animate-pulse rounded bg-text-inverse/10" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((__, j) => (
                  <div key={j} className="h-3 w-28 animate-pulse rounded bg-text-inverse/10" />
                ))}
              </div>
            </div>
          ))}
          <div className="portal-footer-premium__column space-y-3">
            <div className="h-3 w-20 animate-pulse rounded bg-text-inverse/10" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-3 w-36 animate-pulse rounded bg-text-inverse/10" />
              ))}
            </div>
          </div>
        </div>
      </PortalContainer>
      <div className="portal-footer-premium__bottom">
        <div className="portal-footer-premium__bottom-inner">
          <div className="h-3 w-48 animate-pulse rounded bg-text-inverse/10" />
        </div>
      </div>
    </footer>
  );
}
