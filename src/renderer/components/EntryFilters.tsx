import { RotateCcw, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "../i18n/I18nContext";
import { detailEntryMonths, formatDetailMonth } from "../utils/detailFilters";

export function EntryFilters({
  activeYear,
  search,
  month,
  onSearchChange,
  onMonthChange,
  summary,
}: {
  activeYear: number;
  search: string;
  month: string;
  onSearchChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  summary?: ReactNode;
}) {
  const { t, language } = useI18n();
  const months = detailEntryMonths(activeYear);
  const hasFilters = Boolean(search || month);

  return <section className="detail-filters entry-filters" aria-label={t("filters")}>
    <label className="search-field">
      <Search size={16}/>
      <input
        aria-label={t("searchByDescription")}
        placeholder={t("searchByDescription")}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
    </label>
    <select aria-label={t("month")} value={month} onChange={(event) => onMonthChange(event.target.value)}>
      <option value="">{t("allMonths")}</option>
      {months.map((item) => <option key={item} value={item}>{formatDetailMonth(item, language)}</option>)}
    </select>
    <button
      type="button"
      className="secondary-button filter-reset-button"
      disabled={!hasFilters}
      onClick={() => {
        onSearchChange("");
        onMonthChange("");
      }}
    >
      <RotateCcw size={15}/>
      {t("resetFilters")}
    </button>
    {summary && <div className="filtered-entry-totals">{summary}</div>}
  </section>;
}
