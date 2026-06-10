import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  getLocaleDefinition,
  parseLocaleCode,
  type LocaleCode,
} from "@/lib/i18n/locales";
import { buildMessages } from "@/lib/i18n/messages/overrides";
import { formatMessage, resolveMessage } from "@/lib/i18n/utils";

/** Read persisted locale from cookie (set on every language change). */
export async function getServerLocale(): Promise<LocaleCode> {
  const cookieStore = await cookies();
  const fromCookie = parseLocaleCode(cookieStore.get(LOCALE_COOKIE)?.value);
  return fromCookie ?? DEFAULT_LOCALE;
}

export function getLocaleDir(code: LocaleCode): "ltr" | "rtl" {
  return getLocaleDefinition(code).dir;
}

export function createServerTranslator(locale: LocaleCode) {
  const messages = buildMessages(locale);
  const english = buildMessages("en");

  return {
    locale,
    messages,
    dir: getLocaleDir(locale),
    t: (key: string, vars?: Record<string, string | number>) => {
      const raw =
        resolveMessage(messages, key) ?? resolveMessage(english, key) ?? key;
      return formatMessage(raw, vars);
    },
  };
}
