import { en } from "./locales/en";
import { zh } from "./locales/zh";

export type TranslationKey = keyof typeof en;

type Locale = "en" | "zh";
type Translations = Record<TranslationKey, string>;

const locales: Record<Locale, Translations> = { en, zh };

let currentLocale: Locale = "en";

export function setupI18n(): void {
  const lang = window.localStorage.getItem("language") ?? "en";
  currentLocale = lang.startsWith("zh") ? "zh" : "en";
}

export function getCurrentLocale(): Locale {
  return currentLocale;
}

export function t(key: TranslationKey): string {
  return locales[currentLocale][key] ?? locales["en"][key] ?? key;
}
