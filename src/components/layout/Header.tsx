'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { href, type RouteKey } from '@/i18n/routes'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { counterpartPath, locales } from './language'
import { getLenis } from '@/components/motion/SmoothScroll'

type Props = { locale: Locale; dict: Dictionary; articleSlugs: Record<Locale, string>[] }

const primary: Exclude<RouteKey, 'business' | 'article' | 'legal'>[] = ['story', 'expertise', 'people', 'careers']
const overlay: Exclude<RouteKey, 'business' | 'article' | 'legal'>[] = ['home', 'story', 'expertise', 'people', 'careers', 'news', 'contact']

export function Header({ locale, dict, articleSlugs }: Props) {
  const pathname = usePathname() ?? `/${locale}`
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const last = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 40)
      setHidden(y > 240 && y > last.current + 2)
      if (y < last.current - 2) setHidden(false)
      last.current = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    const lenis = getLenis()
    document.documentElement.classList.toggle('is-menu-open', open)
    if (open) lenis?.stop()
    else lenis?.start()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const isActive = (key: RouteKey) => {
    const target = href(locale, key)
    return key === 'home' ? pathname === target : pathname.startsWith(target)
  }

  return (
    <header className="site-header" data-scrolled={scrolled || undefined} data-hidden={(hidden && !open) || undefined} data-open={open || undefined}>
      <div className="site-header__bar">
        <Link href={href(locale, 'home')} className="site-header__logo" aria-label="FFH — Accueil / Home">
          <Logo />
        </Link>

        <nav className="site-nav" aria-label="Navigation principale / Main">
          <ul>
            {primary.map((key) => (
              <li key={key}>
                <Link href={href(locale, key)} className="site-nav__link" aria-current={isActive(key) ? 'page' : undefined}>
                  <span data-text={dict.nav[key]}>{dict.nav[key]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__tools">
          <div className="lang-switch" role="group" aria-label={dict.nav.language}>
            {locales.map((l) => (
              <Link
                key={l}
                href={counterpartPath(pathname, l, articleSlugs)}
                hrefLang={l}
                lang={l}
                aria-current={l === locale ? 'true' : undefined}
                className="lang-switch__item"
              >
                {l.toUpperCase()}
              </Link>
            ))}
          </div>
          <ThemeToggle labels={{ light: dict.nav.themeLight, dark: dict.nav.themeDark }} />
          <Link href={href(locale, 'contact')} className="btn btn--ghost site-header__cta">
            {dict.nav.cta}
            <span aria-hidden="true">↗</span>
          </Link>
          <button
            type="button"
            className="site-header__menu"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span>{open ? dict.nav.close : dict.nav.menu}</span>
            <i aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="site-menu" id="site-menu" hidden={!open}>
        <nav aria-label={dict.nav.menu}>
          <ol>
            {overlay.map((key, i) => (
              <li key={key} style={{ '--i': i } as React.CSSProperties}>
                <Link href={href(locale, key)} aria-current={isActive(key) ? 'page' : undefined}>
                  <small>{String(i + 1).padStart(2, '0')}</small>
                  {dict.nav[key]}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
        <p className="site-menu__foot label">Fettah Financial Holding — Casablanca</p>
      </div>
    </header>
  )
}
