import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TrendBars } from "../../src/renderer/components/TrendBars";

afterEach(cleanup);

describe("property compact chart layout", () => {
  it("keeps every year label rendered as the chart x-axis", () => {
    render(<TrendBars points={Array.from({ length: 14 }, (_, index) => ({ year: 2014 + index, value: index * 100 + 10 }))} format={(value) => `${value}`} />);

    expect(screen.getByText("2014")).toBeInTheDocument();
    expect(screen.getByText("2027")).toBeInTheDocument();
  });

  it("reserves vertical space for labels while allowing horizontal scrolling only", () => {
    const css = readFileSync(path.join(process.cwd(), "src/renderer/linked-workflows.css"), "utf8");

    expect(css).toContain(".utility-cost-charts { grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }");
    expect(css).toContain(".trend-bars { height: 196px;");
    expect(css).toContain("overflow-x: auto;");
    expect(css).toContain("overflow-y: visible;");
    expect(css).toContain("padding: 4px 0 22px;");
    expect(css).toContain("grid-template-rows: 24px 122px 22px;");
    expect(css).toContain(".trend-track { height: 122px;");
  });
});
