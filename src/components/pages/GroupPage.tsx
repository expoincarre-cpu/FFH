import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { groupPages, href } from '@/i18n/routes'
import { getGroup } from '@/lib/cms'
import { PageHero } from '@/components/ui/PageHero'
import { Counter } from '@/components/ui/Counter'
import { Visual } from '@/components/ui/Visual'
import { GroupNav } from '@/components/group/GroupNav'
import { Monogram } from '@/components/layout/Logo'

export async function GroupPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)
  const group = await getGroup()
  const chairman = group.chairman
  const [lead, ...rest] = chairman.message[locale]
  const leads = { governance: dict.group.governanceLead, mission: dict.group.missionLead, history: dict.group.historyLead }
  const visuals = {
    governance: { src: undefined, color: '#0f3525', pattern: 'grid' as const },
    mission: { src: '/media/activities/farming.webp', color: '#3d6d55', pattern: 'lines' as const },
    history: { src: '/media/sofalim-aerial.webp', color: '#d1b572', pattern: 'rings' as const },
  }

  return (
    <>
      <PageHero eyebrow={dict.group.eyebrow} title={dict.group.title} lead={dict.group.lead} />
      <GroupNav locale={locale} dict={dict} current="group" />

      {/* Chairman & CEO's word */}
      <section className="section chairman" aria-labelledby="chairman-word">
        <div className="container chairman__grid">
          <figure className="chairman__portrait" data-reveal="media">
            <div className="chairman__frame" data-media-inner>
              {chairman.portrait ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={chairman.portrait.src} alt={chairman.portrait.alt[locale]} />
              ) : (
                <Monogram finish="gradient" className="chairman__mark" />
              )}
            </div>
            <figcaption>
              <strong>{chairman.name}</strong>
              <span>{chairman.title[locale]}</span>
            </figcaption>
          </figure>

          <div className="chairman__text">
            <p className="label" id="chairman-word">
              {dict.group.wordEyebrow}
            </p>
            <blockquote>
              <p className="chairman__lead" data-reveal="up">
                {lead}
              </p>
              {rest.map((p, i) => (
                <p key={i} data-reveal="up">
                  {p}
                </p>
              ))}
            </blockquote>
            <p className="chairman__sign">
              <span className="chairman__signature">{chairman.name}</span>
              <span className="label">{chairman.title[locale]}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Figures */}
      <section className="section section--figures" aria-labelledby="group-figures">
        <div className="container">
          <h2 className="display display--m" id="group-figures">
            {dict.group.figuresTitle}
          </h2>
          <ul className="figures-grid figures-grid--compact">
            {group.figures.map((f) => (
              <li className="figure" key={f.id}>
                <Counter figure={f} locale={locale} className="figure__value" />
                <span className="figure__unit">{f.unit[locale]}</span>
                <span className="figure__label">{f.label[locale]}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The three sub-pages */}
      <section className="section" aria-label={dict.group.explore}>
        <div className="container">
          <ul className="group-cards">
            {groupPages.map((key) => (
              <li key={key}>
                <Link href={href(locale, key)} className="group-card">
                  <Visual
                    locale={locale}
                    media={visuals[key].src ? { src: visuals[key].src!, alt: { fr: '', en: '' } } : undefined}
                    color={visuals[key].color}
                    caption={dict.nav[key]}
                    ratio="4 / 3"
                    pattern={visuals[key].pattern}
                  />
                  <h3 className="display display--m">{dict.nav[key]}</h3>
                  <p>{leads[key]}</p>
                  <span className="link-arrow">{dict.common.discover} →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
