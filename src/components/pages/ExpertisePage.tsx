import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { href } from '@/i18n/routes'
import { getBusinesses, getDomains, getStages, getVerticals } from '@/lib/cms'
import { pad } from '@/lib/format'
import { PageHero } from '@/components/ui/PageHero'

/**
 * Expertise landing. Driven entirely by Domain → Vertical → Business data:
 * new verticals or domains appear here without code changes.
 */
export async function ExpertisePage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)
  const [domains, verticals, businesses, stages] = await Promise.all([getDomains(), getVerticals(), getBusinesses(), getStages()])

  return (
    <>
      <PageHero eyebrow={dict.expertise.eyebrow} title={dict.expertise.title} lead={dict.expertise.lead} index="02">
        <ol className="chain-legend chain-legend--hero" data-reveal="stagger">
          {stages.map((s) => (
            <li key={s.id} style={{ '--c': s.color } as React.CSSProperties}>
              <span>{pad(s.index)}</span>
              {s.name[locale]}
            </li>
          ))}
        </ol>
      </PageHero>

      {domains.map((domain, d) => (
        <section key={domain.id} className="section domain" aria-labelledby={`domain-${domain.id}`}>
          <div className="container">
            <header className="domain__head">
              <p className="label">
                {dict.expertise.domain} {pad(d + 1)}
              </p>
              <h2 className="display display--m" id={`domain-${domain.id}`}>
                {domain.name[locale]}
              </h2>
              <p className="lead">{domain.description[locale]}</p>
            </header>

            <ol className="verticals">
              {domain.verticals
                .map((id) => verticals.find((v) => v.id === id))
                .filter((v) => v !== undefined)
                .map((vertical, i) => {
                  const color = stages.find((s) => s.id === vertical.stages[0])?.color
                  const companies = businesses.filter((b) => b.vertical === vertical.id)
                  return (
                    <li key={vertical.id} className="vertical" style={{ '--c': color } as React.CSSProperties}>
                      <div className="vertical__num" aria-hidden="true">
                        {pad(i + 1)}
                      </div>
                      <div className="vertical__main">
                        <p className="label">
                          {dict.expertise.vertical} — {vertical.stages.map((s) => stages.find((x) => x.id === s)?.name[locale]).join(' / ')}
                        </p>
                        <h3 className="display display--m" data-reveal="up">
                          {vertical.name[locale]}
                        </h3>
                        <p className="vertical__desc">{vertical.description[locale]}</p>
                      </div>
                      <ul className="vertical__companies" aria-label={dict.expertise.companies}>
                        {companies.map((b) => (
                          <li key={b.slug}>
                            <Link href={href(locale, 'business', { slug: b.slug })}>
                              <strong>{b.name}</strong>
                              <span>{b.category[locale]}</span>
                              <span className="vertical__statement">{b.statement[locale]}</span>
                              <i aria-hidden="true">→</i>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  )
                })}
            </ol>
          </div>
        </section>
      ))}
    </>
  )
}
