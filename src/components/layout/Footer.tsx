import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { href } from '@/i18n/routes'
import { getGroup } from '@/lib/cms'
import { Logo } from './Logo'
import { BackToTop } from './BackToTop'

type Props = { locale: Locale; dict: Dictionary; businesses: { slug: string; name: string }[] }

export async function Footer({ locale, dict, businesses }: Props) {
  const group = await getGroup()
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top">
          <p className="display display--l site-footer__tagline" data-reveal="lines">
            {dict.footer.tagline.map((line) => (
              <span className="line" key={line}>
                <span>{line}</span>
              </span>
            ))}
          </p>
          <Link href={href(locale, 'contact')} className="btn btn--solid">
            {dict.nav.cta} <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="site-footer__grid">
          <div>
            <p className="label">{dict.footer.group}</p>
            <ul>
              {(['story', 'expertise', 'people', 'careers', 'news', 'contact'] as const).map((key) => (
                <li key={key}>
                  <Link href={href(locale, key)}>{dict.nav[key]}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label">{dict.footer.companies}</p>
            <ul>
              {businesses.map((b) => (
                <li key={b.slug}>
                  <Link href={href(locale, 'business', { slug: b.slug })}>{b.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label">{dict.contact.hq}</p>
            <address>
              {group.headquarters.address[locale]}
              <br />
              <a href={`tel:${group.headquarters.phone.replace(/\s/g, '')}`}>{group.headquarters.phone}</a>
              <br />
              <a href={`mailto:${group.headquarters.email}`}>{group.headquarters.email}</a>
            </address>
          </div>
          <div>
            <p className="label">{dict.footer.follow}</p>
            <ul>
              {group.social.map((s) => (
                <li key={s.label}>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="site-footer__mark" aria-hidden="true">
        <Logo />
      </div>

      <div className="container site-footer__bottom">
        <p>
          © {year} {group.legalName}. {dict.footer.rights}
        </p>
        <Link href={href(locale, 'legal')}>{dict.footer.legal}</Link>
        <BackToTop label={dict.footer.backTop} />
      </div>
    </footer>
  )
}
