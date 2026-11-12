import { locales, type Locale } from '@/i18n/config'
import type { RouteKey, RouteParams } from '@/i18n/routes'
import { getArticles, getBusinesses, getVerticals } from './cms'

export type StaticRoute = { locale: Locale; key: RouteKey; params: RouteParams }

/** Every page of the site, per locale — feeds static generation and the sitemap. */
export async function allRoutes(): Promise<StaticRoute[]> {
  const [businesses, articles, verticals] = await Promise.all([getBusinesses(), getArticles(), getVerticals()])
  const simple: RouteKey[] = ['home', 'group', 'governance', 'mission', 'history', 'ecosystem', 'careers', 'contact', 'news', 'legal']
  return locales.flatMap((locale) => [
    ...simple.map((key) => ({ locale, key, params: {} })),
    ...businesses.map((b) => ({ locale, key: 'business' as const, params: { slug: b.slug } })),
    ...articles.map((a) => ({ locale, key: 'article' as const, params: { slug: a.slug[locale] } })),
    ...verticals.map((v) => ({ locale, key: 'business' as const, params: { slug: v.slug[locale] } })),
  ])
}
