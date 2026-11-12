import { type Locale, locales } from './config'

/**
 * Single source of truth for localized URLs.
 * Every page is addressed by a stable `RouteKey`; each locale gets its own
 * SEO-friendly path. Components never hard-code URLs — they call `href()`.
 */
export type RouteKey =
  | 'home'
  | 'group'
  | 'governance'
  | 'mission'
  | 'history'
  | 'ecosystem'
  /** An activity or a company under the ecosystem (`/fr/ecosysteme/<slug>`). */
  | 'business'
  | 'careers'
  | 'contact'
  | 'news'
  | 'article'
  | 'legal'

type Segments = Record<Locale, string[]>

/** Static pages and their path segments (without the locale). */
const paths: Record<Exclude<RouteKey, 'home' | 'business' | 'article'>, Segments> = {
  group: { fr: ['le-groupe'], en: ['the-group'] },
  governance: { fr: ['le-groupe', 'gouvernance'], en: ['the-group', 'governance'] },
  mission: { fr: ['le-groupe', 'mission-vision'], en: ['the-group', 'mission-vision'] },
  history: { fr: ['le-groupe', 'histoire'], en: ['the-group', 'history'] },
  ecosystem: { fr: ['ecosysteme'], en: ['ecosystem'] },
  careers: { fr: ['carrieres'], en: ['careers'] },
  contact: { fr: ['contact'], en: ['contact'] },
  news: { fr: ['actualites'], en: ['newsroom'] },
  legal: { fr: ['mentions-legales'], en: ['legal-notice'] },
}

export type RouteParams = { slug?: string }

export function href(locale: Locale, key: RouteKey, params: RouteParams = {}): string {
  switch (key) {
    case 'home':
      return `/${locale}`
    case 'business':
      return `/${locale}/${paths.ecosystem[locale].join('/')}/${params.slug}`
    case 'article':
      return `/${locale}/${paths.news[locale].join('/')}/${params.slug}`
    default:
      return `/${locale}/${paths[key][locale].join('/')}`
  }
}

export type ResolvedRoute = { key: RouteKey; params: RouteParams }

/** Resolve the `[[...slug]]` catch-all segments into a route key. */
export function resolveRoute(locale: Locale, slug: string[] = []): ResolvedRoute | null {
  if (slug.length === 0) return { key: 'home', params: {} }
  const joined = slug.join('/')
  const exact = (Object.keys(paths) as (keyof typeof paths)[]).find((k) => paths[k][locale].join('/') === joined)
  if (exact) return { key: exact, params: {} }
  if (slug.length === 2) {
    if (slug[0] === paths.ecosystem[locale][0]) return { key: 'business', params: { slug: slug[1] } }
    if (slug[0] === paths.news[locale][0]) return { key: 'article', params: { slug: slug[1] } }
  }
  return null
}

/** Path segments (without locale) for static generation. */
export function routeSegments(locale: Locale, key: RouteKey, params: RouteParams = {}): string[] {
  return href(locale, key, params).split('/').filter(Boolean).slice(1)
}

export function alternates(key: RouteKey, params: RouteParams = {}) {
  return Object.fromEntries(locales.map((l) => [l, href(l, key, params)])) as Record<Locale, string>
}

/** Pages of the group section, in navigation order. */
export const groupPages = ['governance', 'mission', 'history'] as const
