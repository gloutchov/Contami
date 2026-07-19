import type { Language } from "../i18n/translations";

export const formatCurrency = (amount: number, language: Language, currency = "EUR") => new Intl.NumberFormat(
  language === "it" ? "it-IT" : "en-GB",
  { style: "currency", currency, maximumFractionDigits: 2 },
).format(amount);

export const formatDate = (date: string, language: Language) => new Intl.DateTimeFormat(
  language === "it" ? "it-IT" : "en-GB",
  { day: "2-digit", month: "short", year: "numeric" },
).format(new Date(`${date}T12:00:00Z`));

export const todayIso = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};
