import { cn } from "@/lib/utils";
import {
  funnelSegmentColor,
  funnelSilhouetteEdge,
  funnelSilhouetteEnd,
  type GrowthOsHomeFunnelFigure,
  type GrowthOsHomeFunnelFigureRow,
} from "./home-funnel-figure";

function formatCount(n: number): string {
  return new Intl.NumberFormat("es").format(n);
}

function formatStockShare(share: number | null): string {
  if (share == null || !Number.isFinite(share)) return "—";
  const pct = share * 100;
  if (Math.abs(pct - Math.round(pct)) < 0.05) return `${Math.round(pct)}%`;
  return `${pct.toFixed(1)}%`;
}

function trapezoidPoints(topWidth: number, bottomWidth: number): string {
  const topInset = (100 - topWidth) / 2;
  const bottomInset = (100 - bottomWidth) / 2;
  return `${topInset},0.6 ${100 - topInset},0.6 ${100 - bottomInset},99.4 ${bottomInset},99.4`;
}

function rowTitle(row: GrowthOsHomeFunnelFigureRow): string {
  const count = formatCount(row.count);
  if (row.role === "result") {
    return `Ganadas del período: ${count}. Resultado comercial del período, no es una etapa del stock abierto.`;
  }
  const share = formatStockShare(row.percent);
  return `${row.label}: ${count} (${share} del stock activo).`;
}

export function HomeConversionFunnel({
  figure,
}: {
  figure: GrowthOsHomeFunnelFigure;
}) {
  const { rows, funnelLabel, stockDenominator } = figure;
  const stageRows = rows.filter((row) => row.role === "stage");
  const resultRow = rows.find((row) => row.role === "result") ?? null;
  const stageCount = stageRows.length;
  const silhouetteRows = resultRow ? [...stageRows, resultRow] : stageRows;
  const end = funnelSilhouetteEnd(
    silhouetteRows[silhouetteRows.length - 1]?.count ?? 0
  );

  return (
    <div className="mt-4 flex min-w-0 flex-1 flex-col">
      <ol
        data-home-funnel
        aria-label={
          resultRow
            ? `${funnelLabel}. Etapas = oportunidades abiertas ahora. Ganadas del período es resultado aparte, no una etapa secuencial.`
            : `${funnelLabel}. Etapas = oportunidades abiertas ahora. Stock por etapa, no es una cohorte histórica.`
        }
        title={stockDenominator}
        className="flex min-w-0 flex-1 flex-col gap-y-[3px]"
      >
        {silhouetteRows.map((row, index) => {
          const topWidth = funnelSilhouetteEdge(index, silhouetteRows.length, end);
          const bottomWidth = funnelSilhouetteEdge(
            index + 1,
            silhouetteRows.length,
            end
          );
          const stageIndex =
            row.role === "stage"
              ? stageRows.findIndex((stage) => stage.key === row.key)
              : stageCount;
          const swatch = funnelSegmentColor(stageIndex, stageCount, row.role);
          const isResult = row.role === "result";
          return (
            <li
              key={row.key}
              data-funnel-role={row.role}
              title={rowTitle(row)}
              className={cn(
                "grid min-h-[2.4rem] flex-1 grid-cols-[8.5rem_minmax(0,1fr)] items-stretch gap-x-2.5 sm:grid-cols-[12.75rem_minmax(0,1fr)] sm:gap-x-5 xl:grid-cols-[minmax(11rem,44%)_minmax(0,1fr)] xl:gap-x-6",
                isResult &&
                  "mt-1.5 border-t border-dashed border-[#D0D5DD] pt-1.5"
              )}
            >
              <div className="relative min-h-[2.55rem] min-w-0">
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="absolute inset-0 h-full w-full"
                  aria-hidden
                >
                  <polygon
                    points={trapezoidPoints(topWidth, bottomWidth)}
                    fill={swatch}
                  />
                </svg>
                <span
                  className="pointer-events-none absolute inset-0 flex items-center justify-center text-[14px] font-bold leading-none tracking-[-0.03em] text-white tabular-nums sm:text-[15px]"
                  style={{ textShadow: "0 1px 1.5px rgba(16, 24, 40, 0.38)" }}
                >
                  {formatCount(row.count)}
                </span>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: swatch }}
                    aria-hidden
                  />
                  <span className="min-w-0 break-words text-[13px] font-medium leading-snug text-[#344054] sm:text-[14px] xl:truncate">
                    {row.label}
                    {isResult ? (
                      <span className="sr-only">
                        , resultado del período, no es una etapa del stock
                      </span>
                    ) : null}
                  </span>
                </span>
                {isResult ? (
                  <span className="shrink-0 text-[12px] font-semibold text-[#3AAA4C] sm:text-[13px]">
                    Resultado
                    <span className="sr-only">
                      {" "}
                      comercial del período, no participación del stock
                    </span>
                  </span>
                ) : (
                  <span
                    className="shrink-0 whitespace-nowrap text-[13px] font-medium tabular-nums text-[#667085] sm:text-[14px]"
                    title="Participación del stock activo"
                  >
                    {formatStockShare(row.percent)}
                    <span className="ml-1 text-[11px] font-normal text-[#98A2B3]">
                      del stock
                    </span>
                    <span className="sr-only"> activo</span>
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
