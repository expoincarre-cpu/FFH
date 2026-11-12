import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale, locales, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { alternates, href, resolveRoute, routeSegments, type ResolvedRoute } from '@/i18n/routes'
import { getArticle, getBusiness, getVertical } from '@/lib/cms'
import { allRoutes } from '@/lib/static-routes'
import { HomePage } from '@/components/pages/HomePage'
import { GroupPage } from '@/components/pages/GroupPage'
import { GovernancePage } from '@/components/pages/GovernancePage'
import { MissionPage } from '@/components/pages/MissionPage'
import { HistoryPage } from '@/components/pages/HistoryPage'
import { EcosystemPage } from '@/components/pages/EcosystemPage'
import { ActivityPage } from '@/components/pages/ActivityPage'
import { BusinessPage } from '@/components/pages/BusinessPage'
import { CareersPage } from '@/components/pages/CareersPage'
import { ContactPage } from '@/components/pages/ContactPage'
import { NewsPage } from '@/components/pages/NewsPage'
import { ArticlePage } from '@/components/pages/ArticlePage'
import { LegalPage } from '@/components/pages/LegalPage'

/**
 * One catch-all route renders every page in every locale.
 * Localized URL segments are resolved through `src/i18n/routes.ts`, so the
 * same components serve /fr/nos-expertises/sofalim and /en/our-expertise/sofalim.
 */

type Props = { params: Promise<{ locale: string; slug?: string[] }> }

export const dynamicParams = false

export async function generateStaticParams() {
  const routes = await allRoutes()
  return routes.map(({ locale, key, params }) => ({ locale, slug: routeSegments(locale, key, params) }))
}

async function resolve(props: Props) {
  const { locale, slug } = await props.params
  if (!hasLocale(locale)) return null
  const route = resolveRoute(locale, slug)
  if (!route) return null
  return { locale, route }
}

async function languageAlternates(locale: Locale, route: ResolvedRoute) {
  if (route.key === 'business') {
    const v = await getVertical(locale, route.params.slug ?? '')
    if (v) return Object.fromEntries(locales.map((l) => [l, href(l, 'business', { slug: v.slug[l] })])) as Record<Locale, string>
  }
  if (route.key !== 'article') return alternates(route.key, route.params)
  const article = await getArticle(locale, route.params.slug ?? '')
  if (!article) return { [locale]: href(locale, 'article', route.params) } as Record<Locale, string>
  return Object.fromEntries(locales.map((l) => [l, href(l, 'article', { slug: article.slug[l] })])) as Record<Locale, string>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const resolved = await resolve(props)
  if (!resolved) return {}
  const { locale, route } = resolved
  const dict = getDictionary(locale)
  const langs = await languageAlternates(locale, route)

  let title: string | undefined
  let description: string | undefined
  switch (route.key) {
    case 'home':
      title = undefined
      break
    case 'business': {
      const v = await getVertical(locale, route.params.slug ?? '')
      const b = await getBusiness(route.params.slug ?? '')
      title = v?.name[locale] ?? b?.name
      description = v?.description[locale] ?? b?.description[locale]
      break
    }
    case 'article': {
      const a = await getArticle(locale, route.params.slug ?? '')
      title = a?.title[locale]
      description = a?.excerpt[locale]
      break
    }
    case 'legal':
      title = dict.legal.title
      break
    default:
      title = dict.nav[route.key]
  }

  return {
    title: title ?? { absolute: dict.meta.title },
    description: description ?? dict.meta.description,
    alternates: { canonical: langs[locale], languages: { ...langs, 'x-default': langs.fr } },
    openGraph: { title: title ?? dict.meta.title, description: description ?? dict.meta.description },
  }
}

export default async function Page(props: Props) {
  const resolved = await resolve(props)
  if (!resolved) notFound()
  const { locale, route } = resolved
  const slug = route.params.slug ?? ''

  switch (route.key) {
    case 'home':
      return <HomePage locale={locale} />
    case 'group':
      return <GroupPage locale={locale} />
    case 'governance':
      return <GovernancePage locale={locale} />
    case 'mission':
      return <MissionPage locale={locale} />
    case 'history':
      return <HistoryPage locale={locale} />
    case 'ecosystem':
      return <EcosystemPage locale={locale} />
    case 'business': {
      const vertical = await getVertical(locale, slug)
      if (vertical) return <ActivityPage locale={locale} vertical={vertical} />
      return <BusinessPage locale={locale} slug={slug} />
    }
    case 'careers':
      return <CareersPage locale={locale} />
    case 'contact':
      return <ContactPage locale={locale} />
    case 'news':
      return <NewsPage locale={locale} />
    case 'article':
      return <ArticlePage locale={locale} slug={slug} />
    case 'legal':
      return <LegalPage locale={locale} />
  }
}
