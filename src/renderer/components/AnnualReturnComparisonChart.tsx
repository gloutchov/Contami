import type { AssetReturnSeries, ReturnCoverage } from "../../domain/assetReturns";
import { useI18n } from "../i18n/I18nContext";
import { formatPercent } from "../utils/format";
import { HistoryChart } from "./HistoryChart";

export interface AnnualReturnComparisonSeries {
  key: string;
  label: string;
  color: string;
  series: AssetReturnSeries;
}

function coverageLabel(
  coverage: Exclude<ReturnCoverage, "missing">,
  partialPeriod: boolean,
  t: ReturnType<typeof useI18n>["t"],
): string {
  const label = coverage === "complete" ? t("completeShort")
    : coverage === "estimated" ? t("estimatedShort")
      : t("partialShort");
  return partialPeriod && coverage !== "partial" ? `${label} · ${t("partialShort")}` : label;
}

export function AnnualReturnComparisonChart({
  ariaLabel,
  comparison,
}: {
  ariaLabel: string;
  comparison: AnnualReturnComparisonSeries[];
}) {
  const { t, language } = useI18n();
  const years = [...new Set(comparison.flatMap((item) => item.series.annual.map((point) => point.year)))].sort();
  const data = years.map((year) => {
    const row: Record<string, number | string | null> = { period: year };
    for (const item of comparison) {
      const point = item.series.annual.find((candidate) => candidate.year === year);
      row[item.key] = point ? point.rate * 100 : null;
      row[`${item.key}Coverage`] = point ? coverageLabel(point.coverage, point.partialPeriod, t) : null;
    }
    return row;
  });
  const hasValues = data.some((row) => comparison.some((item) => row[item.key] !== null));
  if (!hasValues) return <p className="empty-inline return-chart-empty">{t("noReturnHistory")}</p>;

  return <div className="annual-return-comparison-chart">
    <HistoryChart
      ariaLabel={ariaLabel}
      connectGaps
      data={data}
      format={(value) => formatPercent(value / 100, language)}
      missingValueLabel={t("returnUnavailable")}
      series={comparison.map((item) => ({ key: item.key, label: item.label, color: item.color }))}
      showPoints
      tooltipDetails={(row) => comparison.flatMap((item) => {
        const coverage = row[`${item.key}Coverage`];
        return coverage === null || coverage === undefined
          ? []
          : [{ label: `${item.label} · ${t("returnCoverage")}`, value: String(coverage) }];
      })}
      tooltipPlacement="above"
      type="line"
      xKey="period"
      xTickFormatter={(value) => String(value)}
      yTickFormatter={(value) => formatPercent(value / 100, language)}
    />
  </div>;
}
