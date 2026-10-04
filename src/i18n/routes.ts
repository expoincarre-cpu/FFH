import { type Locale, locales } from './config'

/**
 * Single source of truth for localized URLs.
 * Every page is addressed by a stable `RouteKey`; each locale gets its own
 * SEO-friendly path segment. Components never hard-code URLs — they call `href()`.
 */
export type RouteKey =
  | 'home'
  | 'story'
  | 'expertise'
  | 'business'
  | 'people'
  | 'careers'
  | 'contact'
  | 'news'
  | 'article'
  | 'legal'

type Segments = Record<Locale, string>

const segments: Record<Exclude<RouteKey, 'home' | 'business' | 'article'>, Segments> = {
  story: { fr: 'notre-histoire', en: 'our-story' },
  expertise: { fr: 'nos-expertises', en: 'our-expertise' },
  people: { fr: 'nos-equipes', en: 'our-people' },
  careers: { fr: 'carrieres', en: 'careers' },
  contact: { fr: 'contact', en: 'contact' },
  news: { fr: 'actualites', en: 'newsroom' },
  legal: { fr: 'mentions-legales', en: 'legal-notice' },
}

export type RouteParams = { slug?: string }

export function href(locale: Locale, key: RouteKey, params: RouteParams = {}): string {
  switch (key) {
    case 'home':
      return `/${locale}`
    case 'business':
      return `/${locale}/${segments.expertise[locale]}/${params.slug}`
    case 'article':
      return `/${locale}/${segments.news[locale]}/${params.slug}`
    default:
      return `/${locale}/${segments[key][locale]}`
  }
}

export type ResolvedRoute = { key: RouteKey; params: RouteParams }

/** Resolve the `[[...slug]]` catch-all segments into a route key. */
export function resolveRoute(locale: Locale, slug: string[] = []): ResolvedRoute | null {
  if (slug.length === 0) return { key: 'home', params: {} }
  const [first, second, ...rest] = slug
  if (rest.length) return null
  const match = (Object.keys(segments) as (keyof typeof segments)[]).find(
    (k) => segments[k][locale] === first,
  )
  if (!match) return null
  if (second === undefined) return { key: match, params: {} }
  if (match === 'expertise') return { key: 'business', params: { slug: second } }
  if (match === 'news') return { key: 'article', params: { slug: second } }
  return null
}

/** Path segments (without locale) for static generation. */
export function routeSegments(locale: Locale, key: RouteKey, params: RouteParams = {}): string[] {
  return href(locale, key, params).split('/').filter(Boolean).slice(1)
}

export function alternates(key: RouteKey, params: RouteParams = {}) {
  return Object.fromEntries(locales.map((l) => [l, href(l, key, params)])) as Record<Locale, string>
}
