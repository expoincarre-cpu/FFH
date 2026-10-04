'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { hasLocale, defaultLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { href } from '@/i18n/routes'

export function NotFoundView() {
  const seg = usePathname()?.split('/')[1] ?? ''
  const locale = hasLocale(seg) ? seg : defaultLocale
  const dict = getDictionary(locale)
  return (
    <section className="notfound">
      <div className="container">
        <p className="label">404</p>
        <h1 className="display display--xl">{dict.notFound.title}</h1>
        <p className="lead">{dict.notFound.lead}</p>
        <Link href={href(locale, 'home')} className="btn btn--solid">
          {dict.notFound.cta} →
        </Link>
      </div>
    </section>
  )
}
