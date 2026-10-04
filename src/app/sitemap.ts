import type { MetadataRoute } from 'next'
import { locales, type Locale } from '@/i18n/config'
import { alternates, href, type RouteKey } from '@/i18n/routes'
import { getArticles, getBusinesses } from '@/lib/cms'
import { siteUrl } from '@/lib/site'

function entries(langs: Record<Locale, string>): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(locales.map((l) => [l, `${siteUrl}${langs[l]}`]))
  return locales.map((l) => ({ url: `${siteUrl}${langs[l]}`, alternates: { languages } }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [businesses, articles] = await Promise.all([getBusinesses(), getArticles()])
  const keys: RouteKey[] = ['home', 'story', 'expertise', 'people', 'careers', 'contact', 'news', 'legal']
  return [
    ...keys.flatMap((key) => entries(alternates(key))),
    ...businesses.flatMap((b) => entries(alternates('business', { slug: b.slug }))),
    ...articles.flatMap((a) =>
      entries(Object.fromEntries(locales.map((l) => [l, href(l, 'article', { slug: a.slug[l] })])) as Record<Locale, string>),
    ),
  ]
}
