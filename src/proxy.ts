import { NextResponse, type NextRequest } from 'next/server'
import { defaultLocale, locales, type Locale } from '@/i18n/config'

function preferredLocale(request: NextRequest): Locale {
  const header = request.headers.get('accept-language') ?? ''
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=')
      return { lang: tag.slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 }
    })
    .sort((a, b) => b.q - a.q)
  const match = ranked.find((r) => (locales as readonly string[]).includes(r.lang))
  return (match?.lang as Locale) ?? defaultLocale
}

/** Redirects locale-less URLs (e.g. `/`) to the visitor's preferred language. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasLocale = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
  if (hasLocale) return
  request.nextUrl.pathname = `/${preferredLocale(request)}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  matcher: ['/((?!_next|api|favicon|icon|apple-icon|robots.txt|sitemap.xml|.*\\..*).*)'],
}
