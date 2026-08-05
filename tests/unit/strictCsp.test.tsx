import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildRendererContentSecurityPolicy } from "../../src/config/rendererCsp";
import { HistoryChart } from "../../src/renderer/components/HistoryChart";
import { TrendBars } from "../../src/renderer/components/TrendBars";
import { ThemeProvider } from "../../src/renderer/theme/ThemeProvider";

function rendererSources(directory = path.resolve("src", "renderer")): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return rendererSources(fullPath);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [readFileSync(fullPath, "utf8")] : [];
  });
}

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.theme;
  document.documentElement.removeAttribute("style");
  vi.unstubAllGlobals();
});

describe("strict renderer CSP", () => {
  it("denies inline styles and connections in production", () => {
    const policy = buildRendererContentSecurityPolicy("production");
    expect(policy).toContain("style-src 'self'");
    expect(policy).toContain("style-src-elem 'self'");
    expect(policy).toContain("style-src-attr 'none'");
    expect(policy).toContain("connect-src 'none'");
    expect(policy).not.toContain("'unsafe-inline'");
    expect(policy).not.toMatch(/(?:http|ws)s?:\/\//);
  });

  it("limits the development exception to Vite style elements and its local connection", () => {
    const policy = buildRendererContentSecurityPolicy("development");
    expect(policy).toContain("style-src 'self'");
    expect(policy).toContain("style-src-elem 'self' 'unsafe-inline'");
    expect(policy).toContain("style-src-attr 'none'");
    expect(policy).toContain("connect-src 'self' http://127.0.0.1:5173 ws://127.0.0.1:5173");
  });

  it("keeps renderer sources free of inline-style APIs and runtime chart styling", () => {
    const source = rendererSources().join("\n");
    expect(source).not.toMatch(/\bstyle\s*=/);
    expect(source).not.toMatch(/\.style(?:\.|\[)/);
    expect(source).not.toMatch(/setAttribute\(\s*["']style["']/);
    expect(source).not.toMatch(/\bcssText\b/);
    expect(source).not.toMatch(/from\s+["']recharts["']/);
  });

  it("renders dynamic chart geometry as SVG attributes without style attributes", () => {
    const { container } = render(<>
      <HistoryChart
        ariaLabel="Synthetic history"
        data={[{ year: 2025, amount: 10 }, { year: 2026, amount: 20 }]}
        format={(value) => String(value)}
        series={[{ key: "amount", label: "Amount", color: "#72d5b0" }]}
        type="bar"
      />
      <HistoryChart
        ariaLabel="Synthetic area"
        data={[{ year: 2025, amount: 10 }, { year: 2026, amount: 20 }]}
        detail={false}
        format={(value) => String(value)}
        series={[{ key: "amount", label: "Amount", color: "#f48572" }]}
        type="area"
      />
      <HistoryChart
        ariaLabel="Synthetic line"
        data={[{ year: 2025, amount: 20 }, { year: 2026, amount: 10 }]}
        format={(value) => String(value)}
        series={[{ key: "amount", label: "Amount", color: "#4e94a7" }]}
      />
      <TrendBars points={[{ year: 2025, value: 10 }, { year: 2026, value: 20 }]} format={(value) => String(value)} />
    </>);
    expect(container.querySelectorAll("[style]")).toHaveLength(0);
    expect([...container.querySelectorAll(".trend-fill")].map((bar) => Number(bar.getAttribute("height")))).toEqual([50, 100]);
    expect(container.querySelector(".financial-chart-bar")).toHaveAttribute("fill", "#72d5b0");
    expect(container.querySelectorAll(".financial-chart-area")).toHaveLength(1);
    expect(container.querySelectorAll(".financial-chart-line")).toHaveLength(2);
    expect([...container.querySelectorAll(".financial-chart-line")].every((line) => line.tagName.toLowerCase() === "path")).toBe(true);
    expect([...container.querySelectorAll(".financial-chart-line")].every((line) => /\bC\b/.test(line.getAttribute("d") ?? ""))).toBe(true);
    expect([...container.querySelectorAll(".financial-chart-line")].every((line) => line.getAttribute("pathLength") === "1")).toBe(true);
    expect(container.querySelector(".financial-chart-area")).toHaveAttribute("fill", expect.stringMatching(/^url\(#.+\)$/));
    expect(container.querySelectorAll(".financial-chart-hit-area title")).toHaveLength(6);

    const lineChart = container.querySelector('[aria-label="Synthetic line"]');
    const firstLineHitArea = lineChart?.querySelector(".financial-chart-hit-area");
    expect(firstLineHitArea).not.toBeNull();
    fireEvent.mouseEnter(firstLineHitArea!);
    expect(lineChart?.querySelector(".financial-chart-tooltip-title")).toHaveTextContent("2025");
    expect(lineChart?.querySelector(".financial-chart-tooltip-value")).toHaveTextContent("20");
    expect(lineChart?.querySelectorAll(".financial-chart-hover-point")).toHaveLength(1);
    fireEvent.mouseLeave(lineChart!.querySelector("svg")!);
    expect(lineChart?.querySelector(".financial-chart-tooltip")).toBeNull();
  });

  it("switches native control color scheme through trusted stylesheet selectors", async () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: false,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    })));
    render(<ThemeProvider
      theme="dark"
      capabilities={{ platform: "win32", systemLanguage: "it", systemTheme: "light", numbersAvailable: false }}
    ><span>content</span></ThemeProvider>);
    await waitFor(() => expect(document.documentElement).toHaveAttribute("data-theme", "dark"));
    expect(document.documentElement).not.toHaveAttribute("style");
  });
});
