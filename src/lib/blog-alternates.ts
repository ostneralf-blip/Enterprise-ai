// hreflang-Alternativen für Blogbeiträge — reine Logik ohne Datenbank, damit
// Sitemap und Seiten-Metadaten dieselbe Regel nutzen und sie testbar bleibt.
//
// Beiträge sind nicht zwingend zweisprachig: Der News Bot legt DE- und EN-Fassung
// als eigene Beiträge mit eigenem Slug an. Ein Verweis auf eine Sprachfassung, die
// es nicht gibt, zeigt auf eine 404-Seite — Google meldet das als hreflang-Fehler
// und bietet der Sitemap tote URLs an. Deshalb nur vorhandene Sprachen ausgeben.

export type BlogAlternateLocale = 'de' | 'en'

const ORDER: readonly BlogAlternateLocale[] = ['de', 'en']

export function blogPostUrl(base: string, slug: string, locale: BlogAlternateLocale): string {
  return `${base}${locale === 'en' ? '/en' : ''}/blog/${slug}`
}

/** Normalisiert Sprachwerte aus der Datenbank: nur bekannte, ohne Dubletten, DE vor EN. */
export function toBlogLocales(values: ReadonlyArray<string | null | undefined>): BlogAlternateLocale[] {
  return ORDER.filter((l) => values.includes(l))
}

/**
 * `alternates.languages` für einen Beitrag. x-default zeigt auf Deutsch, falls
 * vorhanden (wie bei allen anderen Seiten), sonst auf die einzige vorhandene Fassung.
 */
export function blogAlternateLanguages(
  base: string,
  slug: string,
  locales: readonly BlogAlternateLocale[]
): Record<string, string> {
  const available = ORDER.filter((l) => locales.includes(l))
  if (available.length === 0) return {}
  const languages: Record<string, string> = {}
  for (const l of available) languages[l] = blogPostUrl(base, slug, l)
  languages['x-default'] = blogPostUrl(base, slug, available[0])
  return languages
}
