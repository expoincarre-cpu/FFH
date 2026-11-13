import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { href } from '@/i18n/routes'
import { businessColor, getBusinesses, getDomains, getVerticals } from '@/lib/cms'
import type { Business, Vertical } from '@/content/types'
import { PageHero } from '@/components/ui/PageHero'
import { CompanyLogo } from '@/components/ui/CompanyLogo'

/**
 * The ecosystem as a roundabout: the group's workflow drawn as a chain of
 * activity tiles (title over image), each leading to its activity page.
 */
export async function EcosystemPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)
  const [domains, verticals, businesses] = await Promise.all([getDomains(), getVerticals(), getBusinesses()])
  const byDomain = (id: string) =>
    (domains.find((d) => d.id === id)?.verticals ?? []).map((v) => verticals.find((x) => x.id === v)).filter((v): v is Vertical => Boolean(v))
  const chain = byDomain('poultry')
  const diversification = byDomain('diversification')
  const companiesOf = (v: Vertical) => businesses.filter((b) => b.vertical === v.id)

  return (
    <>
      <PageHero eyebrow={dict.ecosystem.eyebrow} title={dict.ecosystem.title} lead={dict.ecosystem.lead} />

      <section className="section eco-flow" aria-labelledby="chain-title">
        <div className="container">
          <header className="eco-flow__head">
            <h2 className="display display--m" id="chain-title">
              {dict.ecosystem.chainTitle}
            </h2>
            <p className="lead">{dict.ecosystem.chainLead}</p>
          </header>

          <ol className="eco-flow__chain">
            {chain.map((v, i) => (
              <li key={v.id} className="eco-flow__step">
                <ActivityTile vertical={v} companies={companiesOf(v)} locale={locale} explore={dict.ecosystem.explore} />
                {v.output && i < chain.length - 1 && (
                  <p className="eco-flow__link">
                    <span>{v.output[locale]}</span>
                  </p>
                )}
              </li>
            ))}
          </ol>
          <p className="eco-flow__note">
            <span className="eco-flow__note-line" aria-hidden="true" />
            {chain[0]?.name[locale]} {dict.ecosystem.feeds}
          </p>
        </div>
      </section>

      {diversification.length > 0 && (
        <section className="section eco-flow eco-flow--secondary" aria-labelledby="div-title">
          <div className="container">
            <header className="eco-flow__head">
              <h2 className="display display--m" id="div-title">
                {dict.ecosystem.diversificationTitle}
              </h2>
              <p className="lead">{dict.ecosystem.diversificationLead}</p>
            </header>
            <ul className="eco-flow__grid">
              {diversification.map((v) => (
                <li key={v.id}>
                  <ActivityTile vertical={v} companies={companiesOf(v)} locale={locale} explore={dict.ecosystem.explore} wide />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}

function ActivityTile({
  vertical,
  companies,
  locale,
  explore,
  wide,
}: {
  vertical: Vertical
  companies: Business[]
  locale: Locale
  explore: string
  wide?: boolean
}) {
  const color = companies[0] ? businessColor(companies[0]) : '#3d6d55'
  return (
    <Link
      href={href(locale, 'business', { slug: vertical.slug[locale] })}
      className={`activity-tile ${wide ? 'activity-tile--wide' : ''}`}
      style={{ '--c': color } as React.CSSProperties}
    >
      <span className="activity-tile__media" aria-hidden="true">
        {vertical.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vertical.image.src} alt="" loading="lazy" />
        ) : (
          <span className="activity-tile__placeholder" />
        )}
      </span>
      <span className="activity-tile__body">
        <span className="activity-tile__title">{vertical.name[locale]}</span>
        <span className="activity-tile__desc">{vertical.description[locale]}</span>
        <span className="activity-tile__logos">
          {companies.map((b) => (
            <CompanyLogo key={b.slug} business={b} locale={locale} size="s" />
          ))}
        </span>
        <span className="activity-tile__cta">{explore} →</span>
      </span>
    </Link>
  )
}
