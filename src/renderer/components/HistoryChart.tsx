import { useId, useLayoutEffect, useRef, useState, type RefObject } from "react";

export interface HistorySeries {
  key: string;
  label: string;
  color: string;
  strokeWidth?: number;
  areaColor?: string;
  areaOpacity?: number;
}

export interface HistoryTooltipRow {
  label: string;
  value: string;
}

type ChartType = "area" | "bar" | "line";
type ChartPoint = { x: number; y: number };

const FALLBACK_WIDTH = 640;
const FALLBACK_HEIGHT = 210;
const PLOT = { left: 58, right: 14, top: 14, bottom: 34 } as const;
const GRID_INTERVALS = 4;
const MAX_X_LABELS = 6;

function useResponsiveChartSize(): {
  ref: RefObject<SVGSVGElement | null>;
  width: number;
  height: number;
} {
  const ref = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: FALLBACK_WIDTH, height: FALLBACK_HEIGHT });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = (width: number, height: number) => {
      if (width <= 0 || height <= 0) return;
      const next = { width: Math.round(width), height: Math.round(height) };
      setSize((current) => current.width === next.width && current.height === next.height ? current : next);
    };
    const rect = element.getBoundingClientRect();
    update(rect.width, rect.height);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => update(entry.contentRect.width, entry.contentRect.height));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, ...size };
}

function numericValue(value: number | string | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function chartNumber(value: number): string {
  return String(Number(value.toPrecision(12)));
}

function niceStep(range: number): number {
  const roughStep = range / GRID_INTERVALS;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const fraction = roughStep / magnitude;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return niceFraction * magnitude;
}

function chartScale(values: number[]): { minimum: number; maximum: number; ticks: number[] } {
  const rawMinimum = Math.min(0, ...values);
  const rawMaximum = Math.max(0, ...values);
  const rawRange = rawMaximum - rawMinimum || Math.abs(rawMaximum) || Math.abs(rawMinimum) || 1;
  const step = niceStep(rawRange);
  const minimum = Math.floor(rawMinimum / step) * step;
  const maximum = Math.ceil(rawMaximum / step) * step || step;
  const intervalCount = Math.round((maximum - minimum) / step);
  return {
    minimum,
    maximum,
    ticks: Array.from({ length: intervalCount + 1 }, (_, index) => Number((minimum + index * step).toPrecision(12))),
  };
}

function monotonePath(points: ChartPoint[]): string {
  if (!points.length) return "";
  if (points.length === 1) return `M ${chartNumber(points[0].x)} ${chartNumber(points[0].y)}`;

  const slopes = points.slice(0, -1).map((point, index) =>
    (points[index + 1].y - point.y) / (points[index + 1].x - point.x),
  );
  const tangents = points.map((_, index) => {
    if (index === 0) return slopes[0];
    if (index === points.length - 1) return slopes.at(-1) ?? 0;
    const previous = slopes[index - 1];
    const next = slopes[index];
    return previous * next <= 0 ? 0 : 2 / (1 / previous + 1 / next);
  });

  slopes.forEach((slope, index) => {
    if (slope === 0) {
      tangents[index] = 0;
      tangents[index + 1] = 0;
      return;
    }
    const startRatio = tangents[index] / slope;
    const endRatio = tangents[index + 1] / slope;
    const magnitude = Math.hypot(startRatio, endRatio);
    if (magnitude > 3) {
      const scale = 3 / magnitude;
      tangents[index] = scale * startRatio * slope;
      tangents[index + 1] = scale * endRatio * slope;
    }
  });

  const commands = [`M ${chartNumber(points[0].x)} ${chartNumber(points[0].y)}`];
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const width = end.x - start.x;
    commands.push([
      "C",
      chartNumber(start.x + width / 3),
      chartNumber(start.y + tangents[index] * width / 3),
      chartNumber(end.x - width / 3),
      chartNumber(end.y - tangents[index + 1] * width / 3),
      chartNumber(end.x),
      chartNumber(end.y),
    ].join(" "));
  }
  return commands.join(" ");
}

function selectedLabelIndexes(length: number): Set<number> {
  if (length <= MAX_X_LABELS) return new Set(Array.from({ length }, (_, index) => index));
  return new Set(Array.from({ length: MAX_X_LABELS }, (_, index) => Math.round(index * (length - 1) / (MAX_X_LABELS - 1))));
}

export function HistoryChart({
  data,
  series,
  format,
  type = "line",
  ariaLabel,
  xKey = "year",
  xTickFormatter,
  yTickFormatter,
  detail = true,
  showLegend = true,
  showPoints,
  compact = false,
  missingValueLabel = "—",
  tooltipDetails,
}: {
  data: Array<Record<string, number | string | null | undefined>>;
  series: HistorySeries[];
  format: (value: number) => string;
  type?: ChartType;
  ariaLabel: string;
  xKey?: string;
  xTickFormatter?: (value: string | number) => string;
  yTickFormatter?: (value: number) => string;
  detail?: boolean;
  showLegend?: boolean;
  showPoints?: boolean;
  compact?: boolean;
  missingValueLabel?: string;
  tooltipDetails?: (item: Record<string, number | string | null | undefined>) => HistoryTooltipRow[];
}) {
  const chartId = useId().replaceAll(":", "");
  const { ref: svgRef, width, height } = useResponsiveChartSize();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const values = data.flatMap((item) => series.map((candidate) => numericValue(item[candidate.key])))
    .filter((value): value is number => value !== undefined);
  if (!data.length || !values.length) return null;

  const { minimum, maximum, ticks } = chartScale(values);
  const range = maximum - minimum || 1;
  const plotWidth = width - PLOT.left - PLOT.right;
  const plotHeight = height - PLOT.top - PLOT.bottom;
  const pointX = (index: number) => data.length === 1
    ? PLOT.left + plotWidth / 2
    : PLOT.left + index * plotWidth / (data.length - 1);
  const slotX = (index: number) => PLOT.left + (index + 0.5) * plotWidth / data.length;
  const pointY = (value: number) => PLOT.top + (maximum - value) / range * plotHeight;
  const zeroY = pointY(0);
  const labels = selectedLabelIndexes(data.length);
  const renderPoints = showPoints ?? (type === "line" && data.length < 15);
  const animationKey = `${width}x${height}-${values.join("-")}`;
  const xLabel = (item: Record<string, number | string | null | undefined>) => {
    const value = item[xKey] ?? "";
    return xTickFormatter ? xTickFormatter(value) : String(value);
  };
  const formattedValue = (value: number | string | null | undefined) => {
    const numeric = numericValue(value);
    return numeric === undefined ? missingValueLabel : format(numeric);
  };
  const nativeTooltip = (item: Record<string, number | string | null | undefined>) => [
    xLabel(item),
    ...series.map((candidate) => `${candidate.label}: ${formattedValue(item[candidate.key])}`),
    ...(tooltipDetails?.(item).map((row) => `${row.label}: ${row.value}`) ?? []),
  ].join("\n");
  const hoveredItem = hoveredIndex === null ? undefined : data[hoveredIndex];
  const hoveredDetails = hoveredItem ? tooltipDetails?.(hoveredItem) ?? [] : [];
  const tooltipWidth = Math.min(248, Math.max(140, plotWidth - 12));
  const tooltipHeight = 36 + (series.length + hoveredDetails.length) * 19;
  const tooltipAnchorX = hoveredIndex === null ? PLOT.left : type === "bar" ? slotX(hoveredIndex) : pointX(hoveredIndex);
  const hoveredValues = hoveredItem
    ? series.map((candidate) => numericValue(hoveredItem[candidate.key])).filter((value): value is number => value !== undefined)
    : [];
  const tooltipAnchorY = hoveredValues.length
    ? Math.min(...hoveredValues.map(pointY))
    : PLOT.top;
  const preferredTooltipX = tooltipAnchorX + 14 + tooltipWidth <= width - PLOT.right
    ? tooltipAnchorX + 14
    : tooltipAnchorX - tooltipWidth - 14;
  const tooltipX = Math.min(width - PLOT.right - tooltipWidth, Math.max(PLOT.left, preferredTooltipX));
  const maximumTooltipY = Math.max(PLOT.top + 4, height - PLOT.bottom - tooltipHeight);
  const tooltipY = Math.min(
    maximumTooltipY,
    Math.max(PLOT.top + 4, tooltipAnchorY - tooltipHeight / 2),
  );

  return <div className={`history-chart${detail ? " detail-history-chart" : ""}${compact ? " compact-history-chart" : ""}`} role="group" aria-label={ariaLabel}>
    <svg className="financial-chart-svg" ref={svgRef} viewBox={`0 0 ${width} ${height}`} onMouseLeave={() => setHoveredIndex(null)}>
      <title>{ariaLabel}</title>
      {type === "area" && <defs>
        {series.map((candidate, index) => <linearGradient id={`${chartId}-area-${index}`} key={candidate.key} x1="0" x2="0" y1="0" y2="1">
          <stop offset="5%" stopColor={candidate.areaColor ?? candidate.color} stopOpacity={candidate.areaOpacity ?? 0.3} />
          <stop offset="95%" stopColor={candidate.areaColor ?? candidate.color} stopOpacity="0" />
        </linearGradient>)}
      </defs>}

      {ticks.map((value) => {
        const y = pointY(value);
        return <g key={value}>
          <line className="financial-chart-grid" x1={PLOT.left} x2={width - PLOT.right} y1={y} y2={y} />
          <text className="financial-chart-axis financial-chart-y-label" x={PLOT.left - 8} y={y + 3}>{yTickFormatter ? yTickFormatter(value) : chartNumber(value)}</text>
        </g>;
      })}
      {minimum < 0 && maximum > 0 && <line className="financial-chart-zero" x1={PLOT.left} x2={width - PLOT.right} y1={zeroY} y2={zeroY} />}

      {type === "bar" && data.flatMap((item, dataIndex) => {
        const slotWidth = plotWidth / data.length;
        const groupWidth = slotWidth * 0.72;
        const barWidth = Math.max(1, groupWidth / series.length);
        const groupStart = slotX(dataIndex) - groupWidth / 2;
        return series.map((candidate, seriesIndex) => {
          const value = numericValue(item[candidate.key]);
          if (value === undefined) return null;
          const valueY = pointY(value);
          const y = Math.min(valueY, zeroY);
          const height = Math.max(1, Math.abs(zeroY - valueY));
          return <rect
            className="financial-chart-bar"
            fill={candidate.color}
            height={height}
            key={`${candidate.key}-${dataIndex}-${animationKey}`}
            rx="4"
            width={Math.max(1, barWidth - 1)}
            x={groupStart + seriesIndex * barWidth}
            y={y}
          />;
        });
      })}

      {(type === "line" || type === "area") && series.map((candidate, seriesIndex) => {
        const segments: ChartPoint[][] = [];
        data.forEach((item, index) => {
          const value = numericValue(item[candidate.key]);
          if (value === undefined) return;
          const previousValue = index > 0 ? numericValue(data[index - 1][candidate.key]) : undefined;
          if (previousValue === undefined) segments.push([]);
          segments.at(-1)!.push({ x: pointX(index), y: pointY(value) });
        });
        return <g key={`${candidate.key}-${animationKey}`}>
          {segments.map((points, segmentIndex) => {
            const linePath = monotonePath(points);
            const areaPath = `${linePath} L ${chartNumber(points.at(-1)?.x ?? PLOT.left)} ${chartNumber(zeroY)} L ${chartNumber(points[0].x)} ${chartNumber(zeroY)} Z`;
            return <g key={`${candidate.key}-segment-${segmentIndex}`}>
              {type === "area" && <path className="financial-chart-area" d={areaPath} fill={`url(#${chartId}-area-${seriesIndex})`} />}
              <path className="financial-chart-line" d={linePath} pathLength="1" stroke={candidate.color} strokeWidth={candidate.strokeWidth ?? 2.5} />
            </g>;
          })}
          {renderPoints && data.flatMap((item, index) => {
            const value = numericValue(item[candidate.key]);
            if (value === undefined) return [];
            const point = { x: pointX(index), y: pointY(value) };
            return [<circle
            className="financial-chart-point"
            cx={point.x}
            cy={point.y}
            fill={candidate.color}
            key={`${candidate.key}-${index}`}
            r="3"
            />];
          })}
        </g>;
      })}

      {data.map((item, index) => labels.has(index) && <text
        className="financial-chart-axis financial-chart-x-label"
        key={`${String(item[xKey])}-${index}`}
        textAnchor={index === 0 && type !== "bar" ? "start" : index === data.length - 1 && type !== "bar" ? "end" : "middle"}
        x={type === "bar" ? slotX(index) : pointX(index)}
        y={height - 10}
      >{xLabel(item)}</text>)}

      {data.map((item, index) => {
        const center = type === "bar" ? slotX(index) : pointX(index);
        const interval = type === "bar" ? plotWidth / data.length : plotWidth / Math.max(1, data.length - 1);
        const left = index === 0 ? PLOT.left : center - interval / 2;
        const right = index === data.length - 1 ? width - PLOT.right : center + interval / 2;
        return <rect
          aria-label={nativeTooltip(item)}
          className="financial-chart-hit-area"
          fill="transparent"
          height={plotHeight}
          key={`hit-${index}`}
          onBlur={() => setHoveredIndex(null)}
          onFocus={() => setHoveredIndex(index)}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseMove={() => setHoveredIndex(index)}
          tabIndex={0}
          width={Math.max(1, right - left)}
          x={left}
          y={PLOT.top}
        ><title>{nativeTooltip(item)}</title></rect>;
      })}

      {hoveredItem && hoveredIndex !== null && <g className="financial-chart-tooltip">
        <line className="financial-chart-cursor" x1={tooltipAnchorX} x2={tooltipAnchorX} y1={PLOT.top} y2={height - PLOT.bottom} />
        {type !== "bar" && series.flatMap((candidate) => {
          const value = numericValue(hoveredItem[candidate.key]);
          return value === undefined ? [] : [<circle
            className="financial-chart-hover-point"
            cx={tooltipAnchorX}
            cy={pointY(value)}
            fill={candidate.color}
            key={candidate.key}
            r="4"
          />];
        })}
        <rect className="financial-chart-tooltip-box" height={tooltipHeight} rx="10" width={tooltipWidth} x={tooltipX} y={tooltipY} />
        <text className="financial-chart-tooltip-title" x={tooltipX + 11} y={tooltipY + 18}>{xLabel(hoveredItem)}</text>
        <line className="financial-chart-tooltip-divider" x1={tooltipX + 10} x2={tooltipX + tooltipWidth - 10} y1={tooltipY + 27} y2={tooltipY + 27} />
        {series.map((candidate, index) => {
          const rowY = tooltipY + 45 + index * 19;
          return <g key={candidate.key}>
            <circle cx={tooltipX + 13} cy={rowY - 3} fill={candidate.color} r="3" />
            <text className="financial-chart-tooltip-label" x={tooltipX + 22} y={rowY}>{candidate.label}</text>
            <text className="financial-chart-tooltip-value" textAnchor="end" x={tooltipX + tooltipWidth - 10} y={rowY}>{formattedValue(hoveredItem[candidate.key])}</text>
          </g>;
        })}
        {hoveredDetails.map((row, index) => {
          const rowY = tooltipY + 45 + (series.length + index) * 19;
          return <g key={`${row.label}-${index}`}>
            <text className="financial-chart-tooltip-label" x={tooltipX + 13} y={rowY}>{row.label}</text>
            <text className="financial-chart-tooltip-value" textAnchor="end" x={tooltipX + tooltipWidth - 10} y={rowY}>{row.value}</text>
          </g>;
        })}
      </g>}
    </svg>
    {showLegend && <div className="financial-chart-legend" aria-hidden="true">
      {series.map((candidate) => <span key={candidate.key}>
        <svg viewBox="0 0 16 10">
          {type === "bar" ? <rect fill={candidate.color} height="10" rx="3" width="12" x="2" />
            : <line stroke={candidate.color} strokeLinecap="round" strokeWidth={candidate.strokeWidth ?? 2.5} x1="1" x2="15" y1="5" y2="5" />}
        </svg>
        {candidate.label}
      </span>)}
    </div>}
  </div>;
}
