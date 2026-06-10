import { getLocaleDefinition, type LocaleCode } from "@/lib/i18n/locales";

export function formatCurrencyLocale(
  amount: number,
  locale: LocaleCode,
  currency = "USD"
): string {
  const { bcp47 } = getLocaleDefinition(locale);
  return new Intl.NumberFormat(bcp47, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateLocale(
  date: Date | string,
  locale: LocaleCode,
  options?: Intl.DateTimeFormatOptions
): string {
  const { bcp47 } = getLocaleDefinition(locale);
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(bcp47, options ?? { dateStyle: "medium" }).format(d);
}

export function formatTimeLocale(date: Date | string, locale: LocaleCode): string {
  const { bcp47 } = getLocaleDefinition(locale);
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(bcp47, { timeStyle: "short" }).format(d);
}
