import type { MetadataRoute } from 'next'
import { locales, type Locale } from '@/i18n/config'
import { alternates, href, type RouteKey } from '@/i18n/routes'
import { getArticles, getBusinesses, getVerticals } from '@/lib/cms'
import { siteUrl } from '@/lib/site'

function entries(langs: Record<Locale, string>): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(locales.map((l) => [l, `${siteUrl}${langs[l]}`]))
  return locales.map((l) => ({ url: `${siteUrl}${langs[l]}`, alternates: { languages } }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [businesses, articles, verticals] = await Promise.all([getBusinesses(), getArticles(), getVerticals()])
  const keys: RouteKey[] = ['home', 'group', 'governance', 'mission', 'history', 'ecosystem', 'careers', 'contact', 'news', 'legal']
  return [
    ...keys.flatMap((key) => entries(alternates(key))),
    ...businesses.flatMap((b) => entries(alternates('business', { slug: b.slug }))),
    ...[...articles, ...verticals].flatMap((a) =>
      entries(Object.fromEntries(locales.map((l) => [l, href(l, 'slug' in a && 'title' in a ? 'article' : 'business', { slug: a.slug[l] })])) as Record<Locale, string>),
    ),
  ]
}
