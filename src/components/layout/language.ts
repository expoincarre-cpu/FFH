import { locales, type Locale, hasLocale } from '@/i18n/config'
import { href, resolveRoute } from '@/i18n/routes'

/** Computes the equivalent URL of the current page in another locale. */
/** `slugPairs` maps slugs that differ between languages (articles, activities). */
export function counterpartPath(pathname: string, target: Locale, slugPairs: Record<Locale, string>[]) {
  const [current, ...rest] = pathname.split('/').filter(Boolean)
  if (!current || !hasLocale(current)) return href(target, 'home')
  const route = resolveRoute(current, rest)
  if (!route) return href(target, 'home')
  if (route.key === 'article' || route.key === 'business') {
    const match = slugPairs.find((s) => s[current] === route.params.slug)
    if (match) return href(target, route.key, { slug: match[target] })
    if (route.key === 'article') return href(target, 'news')
  }
  return href(target, route.key, route.params)
}

export { locales }
