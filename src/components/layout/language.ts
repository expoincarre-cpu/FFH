import { locales, type Locale, hasLocale } from '@/i18n/config'
import { href, resolveRoute } from '@/i18n/routes'

/** Computes the equivalent URL of the current page in another locale. */
export function counterpartPath(pathname: string, target: Locale, articleSlugs: Record<Locale, string>[]) {
  const [current, ...rest] = pathname.split('/').filter(Boolean)
  if (!current || !hasLocale(current)) return href(target, 'home')
  const route = resolveRoute(current, rest)
  if (!route) return href(target, 'home')
  if (route.key === 'article') {
    const match = articleSlugs.find((s) => s[current] === route.params.slug)
    return match ? href(target, 'article', { slug: match[target] }) : href(target, 'news')
  }
  return href(target, route.key, route.params)
}

export { locales }
