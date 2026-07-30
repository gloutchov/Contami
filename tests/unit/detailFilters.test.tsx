import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { EntryFilters } from "../../src/renderer/components/EntryFilters";
import { I18nProvider } from "../../src/renderer/i18n/I18nContext";
import { detailEntryMonths, filterDatedEntries } from "../../src/renderer/utils/detailFilters";

const entries = [
  { id: "one", date: "2026-01-10", description: "Annual insurance" },
  { id: "two", date: "2026-02-12", description: "Fuel station" },
  { id: "three", date: "2026-02-20", description: "Insurance adjustment" },
];

describe("detail entry filters", () => {
  it("combines case-insensitive description and month filters", () => {
    expect(filterDatedEntries(entries, "2026-02", "  INSURANCE ")).toEqual([entries[2]]);
    expect(filterDatedEntries(entries, "", "insurance")).toEqual([entries[0], entries[2]]);
    expect(filterDatedEntries(entries, "all", "")).toEqual(entries);
  });

  it("creates all twelve stable month options for the active year", () => {
    expect(detailEntryMonths(2026)).toEqual([
      "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06",
      "2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12",
    ]);
  });

  it("resets both controls and exposes Italian labels", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [search, setSearch] = useState("assicurazione");
      const [month, setMonth] = useState("2026-02");
      return <I18nProvider language="it">
        <EntryFilters activeYear={2026} search={search} month={month} onSearchChange={setSearch} onMonthChange={setMonth} />
      </I18nProvider>;
    }

    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Azzera filtri" }));

    expect(screen.getByRole("textbox", { name: "Cerca per descrizione…" })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "Mese" })).toHaveValue("");
    expect(screen.getByRole("button", { name: "Azzera filtri" })).toBeDisabled();
  });
});
