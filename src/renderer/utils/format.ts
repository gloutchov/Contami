import type { Language } from "../i18n/translations";

export const formatCurrency = (amount: number, language: Language, currency = "EUR") => new Intl.NumberFormat(
  language === "it" ? "it-IT" : "en-GB",
  { style: "currency", currency, maximumFractionDigits: 2 },
).format(amount);

export const formatDate = (date: string, language: Language) => new Intl.DateTimeFormat(
  language === "it" ? "it-IT" : "en-GB",
  { day: "2-digit", month: "short", year: "numeric" },
).format(new Date(`${date}T12:00:00Z`));

export const todayIso = () => new Date().toISOString().slice(0, 10);
