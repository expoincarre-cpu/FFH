import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { href } from '@/i18n/routes'
import { businessColor, getBusinesses, getDomains, getStages, getVerticals } from '@/lib/cms'
import type { Vertical } from '@/content/types'
import { Lines } from '@/components/ui/Lines'
import { CompanyLogo } from '@/components/ui/CompanyLogo'

/** Landing page of one activity: image hero, introduction, its companies, the next link. */
export async function ActivityPage({ locale, vertical }: { locale: Locale; vertical: Vertical }) {
  const dict = getDictionary(locale)
  const [domains, verticals, businesses, stages] = await Promise.all([getDomains(), getVerticals(), getBusinesses(), getStages()])
  const companies = businesses.filter((b) => b.vertical === vertical.id)
  const color = companies[0] ? businessColor(companies[0]) : '#3d6d55'
  const domain = domains.find((d) => d.verticals.includes(vertical.id))
  const siblings = (domain?.verticals ?? []).map((id) => verticals.find((v) => v.id === id)).filter((v): v is Vertical => Boolean(v))
  const next = siblings[(siblings.findIndex((v) => v.id === vertical.id) + 1) % siblings.length]

  return (
    <article className="activity" style={{ '--c': color } as React.CSSProperties}>
      <header className="activity-hero">
        <div className="activity-hero__media" aria-hidden="true">
          {vertical.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vertical.image.src} alt="" />
          ) : (
            <span className="activity-tile__placeholder" />
          )}
        </div>
        <div className="container activity-hero__text">
          <p className="label">
            <Link href={href(locale, 'ecosystem')} className="crumb">
              {dict.nav.ecosystem}
            </Link>{' '}
            / {domain?.name[locale]}
          </p>
          <Lines as="h1" lines={[vertical.name[locale]]} className="display display--xxl" />
          <p className="lead">{vertical.description[locale]}</p>
        </div>
      </header>

      <section className="section">
        <div className="container activity__intro">
          <p className="statement__text" data-reveal="up">
            {vertical.intro[locale]}
          </p>
          {vertical.stages.length > 0 && (
            <div className="chain-position chain-position--compact" aria-label={dict.ecosystem.inChain}>
              <p className="label">{dict.ecosystem.inChain}</p>
              <ol>
                {stages.map((s) => (
                  <li key={s.id} data-on={vertical.stages.includes(s.id) || undefined} style={{ '--c': s.color } as React.CSSProperties}>
                    {s.name[locale]}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </section>

      <section className="section section--companies" aria-labelledby="activity-companies">
        <div className="container">
          <h2 className="label" id="activity-companies">
            {dict.ecosystem.companies}
          </h2>
          <ul className="company-cards">
            {companies.map((b) => (
              <li key={b.slug}>
                <Link href={href(locale, 'business', { slug: b.slug })} className="company-card">
                  <CompanyLogo business={b} locale={locale} size="l" />
                  <span className="company-card__name display display--m">{b.name}</span>
                  <span className="company-card__cat">{b.category[locale]}</span>
                  <span className="company-card__text">{b.description[locale]}</span>
                  <span className="link-arrow">{dict.common.discover} →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {next && next.id !== vertical.id && (
        <Link href={href(locale, 'business', { slug: next.slug[locale] })} className="next-business">
          <span className="label">{dict.ecosystem.next}</span>
          <span className="display display--xl">{next.name[locale]}</span>
          <span className="next-business__cat">{dict.ecosystem.explore} →</span>
        </Link>
      )}
    </article>
  )
}
