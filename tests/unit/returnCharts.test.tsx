import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { AssetReturnSeries } from "../../src/domain/assetReturns";
import { AnnualReturnComparisonChart } from "../../src/renderer/components/AnnualReturnComparisonChart";
import { ReturnChart } from "../../src/renderer/components/ReturnChart";
import { I18nProvider } from "../../src/renderer/i18n/I18nContext";
import { investmentCardReturnPeriod } from "../../src/renderer/utils/investmentReturnPresentation";

afterEach(cleanup);

const annualSeries = (rate: number, coverage: "complete" | "partial" | "estimated" = "complete"): AssetReturnSeries => ({
  currency: "EUR",
  monthly: [],
  annual: [{ year: 2026, rate, coverage, partialPeriod: coverage !== "complete" }],
});

describe("return chart presentation", () => {
  it("uses monthly cards in the opening year and annual cards afterwards", () => {
    expect(investmentCardReturnPeriod("2026-04-15", 2026)).toBe("monthly");
    expect(investmentCardReturnPeriod("2025-12-31", 2026)).toBe("annual");

    render(<I18nProvider language="it"><ReturnChart
      compact
      period="monthly"
      series={{
        currency: "EUR",
        annual: [],
        monthly: [
          { date: "2026-05-01", rate: 0.01, coverage: "complete" },
          { date: "2026-06-01", rate: 0.02, coverage: "complete" },
        ],
      }}
    /></I18nProvider>);

    expect(screen.getByText("Rendimento mensile")).toBeVisible();
    expect(screen.getByRole("group", { name: "Rendimento percentuale mensile" })).toBeVisible();
  });

  it("renders accessible annual return comparisons for the three investment types", () => {
    const { container } = render(<I18nProvider language="it"><AnnualReturnComparisonChart
      ariaLabel="Rendimento annuo globale per tipologia"
      comparison={[
        { key: "stock", label: "Titoli", color: "#4e94a7", series: annualSeries(0.08) },
        { key: "fund", label: "Fondi", color: "#72d5b0", series: annualSeries(0.05, "estimated") },
        { key: "savings", label: "Fogli", color: "#c79b4b", series: annualSeries(0.03, "partial") },
      ]}
    /></I18nProvider>);

    const chart = screen.getByRole("group", { name: "Rendimento annuo globale per tipologia" });
    expect(chart).toBeVisible();
    expect(container.querySelectorAll(".financial-chart-line")).toHaveLength(3);
    expect(container.querySelectorAll(".financial-chart-point")).toHaveLength(3);
    expect(container.querySelectorAll("[style]")).toHaveLength(0);
    fireEvent.focus(chart.querySelector(".financial-chart-hit-area")!);
    expect(chart.querySelector(".financial-chart-tooltip-panel")).toHaveTextContent("Titoli+8,0%");
    expect(chart.querySelector(".financial-chart-tooltip-panel")).toHaveTextContent("Fondi · Coperturastima");
    expect(chart.querySelector(".financial-chart-tooltip-panel")).toHaveTextContent("Fogli · Coperturaparziale/YTD");
  });
});
