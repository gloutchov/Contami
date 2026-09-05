import type { AnnualReturnPoint, AssetReturnSeries, MonthlyReturnPoint } from "../../domain/assetReturns";
import { useI18n } from "../i18n/I18nContext";
import { formatCurrency, formatDate, formatMonth, formatPercent } from "../utils/format";
import { HistoryChart } from "./HistoryChart";

type ReturnPoint = MonthlyReturnPoint | AnnualReturnPoint;
export type ReturnPeriod = "monthly" | "annual";

function returnDate(point: ReturnPoint): string | number {
  return "date" in point ? point.date : point.year;
}

export function ReturnChart({
  series,
  period,
  compact = false,
}: {
  series: AssetReturnSeries;
  period: ReturnPeriod;
  compact?: boolean;
}) {
  const { t, language } = useI18n();
  const points: ReturnPoint[] = period === "monthly" ? series.monthly : series.annual;
  const hasValues = points.some((point) => point.rate !== null);
  const measuredRates = points.flatMap((point) => point.rate === null ? [] : [point.rate]);
  const averageRate = measuredRates.reduce((sum, rate) => sum + rate, 0) / measuredRates.length;
  const title = period === "monthly" ? t("monthlyReturnHistory") : t("annualReturnHistory");
  const reason = series.unavailableReason === "mixed-currency" ? t("mixedCurrencyReturnUnavailable") : t("noReturnHistory");
  if (!hasValues) return compact ? null : <p className="empty-inline return-chart-empty">{reason}</p>;
  const estimated = period === "annual" && series.annual.some((point) => point.coverage === "estimated");
  const partial = points.some((point) => point.coverage === "partial" || ("partialPeriod" in point && point.partialPeriod));
  const data = points.map((point) => {
    const components = point.components;
    const coverage = point.coverage === "complete" ? t("completeShort")
      : point.coverage === "estimated" ? t("estimatedShort")
        : point.coverage === "partial" ? t("partialShort")
          : t("returnUnavailable");
    const partialPeriod = "partialPeriod" in point && point.partialPeriod && point.coverage !== "partial";
    return {
      period: returnDate(point),
      returnRate: point.rate === null ? null : point.rate * 100,
      coverageLabel: partialPeriod ? `${coverage} · ${t("partialShort")}` : coverage,
      componentKind: components?.kind,
      openingValue: components?.kind === "investment" ? components.openingValue : null,
      endingValue: components?.kind === "investment" ? components.endingValue : null,
      netFlows: components?.kind === "investment" ? components.netFlows : null,
      weightedBase: components?.kind === "investment" ? components.weightedBase : null,
      openingObservedAt: components?.kind === "investment" ? components.openingObservedAt : null,
      endingObservedAt: components?.kind === "investment" ? components.endingObservedAt : null,
      income: components?.kind === "rental" ? components.income : null,
      expenses: components?.kind === "rental" ? components.expenses : null,
      referenceValue: components?.kind === "rental" ? components.referenceValue : null,
      periods: components?.kind === "linked" ? components.periods : null,
    };
  });
  const money = (value: number | string | null | undefined) => formatCurrency(Number(value), language, series.currency);
  return <div className={`return-chart${compact ? " compact-return-chart" : ""}`}>
    {compact && <div className="return-chart-heading"><span>{t(period === "monthly" ? "monthlyReturn" : "annualReturn")}</span>{(estimated || partial) && <small>{[estimated ? t("estimatedShort") : "", partial ? t("partialShort") : ""].filter(Boolean).join(" · ")}</small>}</div>}
    <HistoryChart
      ariaLabel={title}
      compact={compact}
      connectGaps
      data={data}
      detail={!compact}
      format={(value) => formatPercent(value / 100, language)}
      missingValueLabel={t("returnUnavailable")}
      referenceLine={{ label: t("returnAverage"), value: averageRate * 100 }}
      series={[{ key: "returnRate", label: t("returnPercentage"), color: "#4e94a7", areaColor: "#72d5b0", areaOpacity: 0.22 }]}
      showLegend={!compact}
      showPoints
      tooltipPlacement="above"
      type="area"
      xKey="period"
      xTickFormatter={(value) => period === "monthly" ? formatMonth(String(value), language) : String(value)}
      yTickFormatter={(value) => formatPercent(value / 100, language)}
      tooltipDetails={(item) => [
        { label: t("returnCoverage"), value: String(item.coverageLabel ?? t("returnUnavailable")) },
        ...(item.openingObservedAt && item.endingObservedAt ? [{
          label: t("returnObservationInterval"),
          value: `${formatDate(String(item.openingObservedAt), language)} → ${formatDate(String(item.endingObservedAt), language)}`,
        }] : []),
        ...(compact ? [] : item.componentKind === "investment" ? [
          { label: t("returnOpeningValue"), value: money(item.openingValue) },
          { label: t("returnEndingValue"), value: money(item.endingValue) },
          { label: t("returnNetFlows"), value: money(item.netFlows) },
          { label: t("returnWeightedBase"), value: money(item.weightedBase) },
        ] : item.componentKind === "rental" ? [
          { label: t("income"), value: money(item.income) },
          { label: t("expenses"), value: money(item.expenses) },
          { label: t("returnReferenceValue"), value: money(item.referenceValue) },
        ] : item.componentKind === "linked" ? [
          { label: t("returnLinkedMonths"), value: String(item.periods ?? "—") },
        ] : []),
      ]}
    />
    {!compact && (estimated || partial) && <p className="return-chart-note">
      {estimated ? t("estimatedReturnNote") : t("partialReturnNote")}
    </p>}
  </div>;
}
