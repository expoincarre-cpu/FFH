import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getBusinesses, getGroup, getPeople, getStages } from '@/lib/cms'
import { PageHero } from '@/components/ui/PageHero'
import { PeopleList } from '@/components/ui/PeopleList'
import { SectionHead } from '@/components/ui/SectionHead'
import { Counter } from '@/components/ui/Counter'
import { Visual } from '@/components/ui/Visual'

export async function PeoplePage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)
  const [people, businesses, stages, group] = await Promise.all([getPeople(), getBusinesses(), getStages(), getGroup()])
  const board = people.filter((p) => p.body === 'board')
  const executive = people.filter((p) => p.body === 'executive')
  const teamFigures = group.figures.filter((f) => ['people', 'sites', 'regions'].includes(f.id))

  const view = (list: typeof people) =>
    list.map((p) => ({
      id: p.id,
      name: p.name,
      position: p.position[locale],
      department: p.department[locale],
      biography: p.biography[locale],
      portrait: p.portrait?.src,
      initials: p.position[locale]
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, 2)
        .map((w) => w[0])
        .join(''),
    }))

  return (
    <>
      <PageHero eyebrow={dict.people.eyebrow} title={dict.people.title} lead={dict.people.lead} index="03" />

      <section className="section">
        <div className="container">
          <SectionHead eyebrow={dict.people.leadership} index="A" title={locale === 'fr' ? 'Direction du groupe' : 'Group leadership'} />
          <PeopleList people={view([...board, ...executive])} labels={{ open: '+', close: dict.nav.close }} />
        </div>
      </section>

      <section className="section section--governance">
        <div className="container">
          <SectionHead eyebrow={dict.people.governance} index="B" title={locale === 'fr' ? 'Une holding, sept entreprises.' : 'One holding, seven companies.'} />
          <div className="gov" data-reveal="stagger">
            <div className="gov__tier">
              <p className="label">01</p>
              <div className="gov__box gov__box--strong">{locale === 'fr' ? 'Conseil d’administration' : 'Board of Directors'}</div>
              <div className="gov__aside">
                <span>{locale === 'fr' ? 'Comité d’audit' : 'Audit committee'}</span>
                <span>{locale === 'fr' ? 'Comité stratégique' : 'Strategy committee'}</span>
              </div>
            </div>
            <div className="gov__tier">
              <p className="label">02</p>
              <div className="gov__box">FFH — {locale === 'fr' ? 'Direction générale & comité exécutif' : 'Executive management & committee'}</div>
              <div className="gov__aside">
                <span>Finance</span>
                <span>{locale === 'fr' ? 'Qualité' : 'Quality'}</span>
                <span>{locale === 'fr' ? 'RH' : 'People'}</span>
                <span>{locale === 'fr' ? 'Opérations' : 'Operations'}</span>
              </div>
            </div>
            <div className="gov__tier gov__tier--companies">
              <p className="label">03</p>
              <ul>
                {businesses.map((b) => (
                  <li key={b.slug} style={{ '--c': stages.find((s) => s.id === b.stage)?.color } as React.CSSProperties}>
                    <strong>{b.name}</strong>
                    <span>{b.category[locale]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--teams">
        <div className="container teams">
          <div>
            <SectionHead eyebrow={dict.people.teamsTitle} index="C" title={locale === 'fr' ? 'Le terrain, d’abord.' : 'The field comes first.'} />
            <ul className="teams__figures">
              {teamFigures.map((f) => (
                <li key={f.id}>
                  <Counter figure={f} locale={locale} className="teams__value" />
                  <span>
                    {f.unit[locale]} — {f.label[locale]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <Visual locale={locale} caption={`${dict.common.visualPending} — ${dict.people.eyebrow}`} color={stages[2].color} ratio="4 / 5" pattern="grid" />
        </div>
      </section>
    </>
  )
}
