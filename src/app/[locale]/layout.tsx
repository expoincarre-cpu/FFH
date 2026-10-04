import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import '@fontsource-variable/inter'
import '@fontsource-variable/newsreader'
import { hasLocale, htmlLang, locales, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getArticles, getBusinesses } from '@/lib/cms'
import { siteUrl } from '@/lib/site'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SmoothScroll } from '@/components/motion/SmoothScroll'
import { MotionController } from '@/components/motion/MotionController'
import '../brand-fonts.css'
import '../globals.css'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(locale)) return {}
  const dict = getDictionary(locale)
  return {
    metadataBase: new URL(siteUrl),
    title: { default: dict.meta.title, template: `%s — FFH` },
    description: dict.meta.description,
    openGraph: { siteName: 'Fettah Financial Holding', locale: htmlLang[locale], type: 'website' },
  }
}

export const viewport: Viewport = {
  themeColor: '#0f3525',
  colorScheme: 'dark',
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const [businesses, articles] = await Promise.all([getBusinesses(), getArticles()])
  const articleSlugs = articles.map((a) => a.slug as Record<Locale, string>)

  return (
    <html lang={htmlLang[locale]}>
      <body>
        <a href="#main" className="skip-link">
          {dict.nav.skip}
        </a>
        <SmoothScroll />
        <MotionController />
        <Header locale={locale} dict={dict} articleSlugs={articleSlugs} />
        <main id="main">{children}</main>
        <Footer locale={locale} dict={dict} businesses={businesses.map((b) => ({ slug: b.slug, name: b.name }))} />
      </body>
    </html>
  )
}
