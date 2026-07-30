export interface DatedDescription {
  date: string;
  description: string;
}

export function detailEntryMonths(year: number): string[] {
  return Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`);
}

export function formatDetailMonth(value: string, language: "it" | "en"): string {
  return new Intl.DateTimeFormat(language === "it" ? "it-IT" : "en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}-01T12:00:00Z`));
}

export function filterDatedEntries<T extends DatedDescription>(
  entries: readonly T[],
  month: string,
  search: string,
  searchableText: (entry: T) => string = (entry) => entry.description,
): T[] {
  const selectedMonth = month === "all" ? "" : month;
  const query = search.trim().toLocaleLowerCase();
  return entries.filter((entry) => (!selectedMonth || entry.date.startsWith(selectedMonth))
    && (!query || searchableText(entry).toLocaleLowerCase().includes(query)));
}
