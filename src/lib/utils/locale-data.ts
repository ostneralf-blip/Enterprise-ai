export type LocaleString = { de: string; en: string }

export function pick(field: LocaleString, locale: string): string {
  return locale === 'en' ? field.en : field.de
}
