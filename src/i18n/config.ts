export const locales = ['fr', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'fr'

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value)

/** A value translated in every supported locale. Used by all CMS content. */
export type Localized<T = string> = Record<Locale, T>

export const t = <T,>(value: Localized<T>, locale: Locale): T => value[locale]

export const htmlLang: Record<Locale, string> = { fr: 'fr-MA', en: 'en' }
