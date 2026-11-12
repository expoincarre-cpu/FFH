import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { businessColor, getBusinesses, getPeople } from '@/lib/cms'
import { PageHero } from '@/components/ui/PageHero'
import { PeopleList } from '@/components/ui/PeopleList'
import { SectionHead } from '@/components/ui/SectionHead'
import { GroupNav } from '@/components/group/GroupNav'

export async function GovernancePage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)
  const [people, businesses] = await Promise.all([getPeople(), getBusinesses()])

  const initials = (name: string, fallback: string) => {
    const source = /prénom nom/i.test(name) ? fallback : name
    return source
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('')
  }

  return (
    <>
      <PageHero eyebrow={dict.nav.group} title={dict.group.governanceTitle} lead={dict.group.governanceLead} />
      <GroupNav locale={locale} dict={dict} current="governance" />

      <section className="section">
        <div className="container">
          <SectionHead eyebrow={dict.nav.governance} title={dict.group.leadership} />
          <PeopleList
            people={people.map((p) => ({
              id: p.id,
              name: p.name,
              position: p.position[locale],
              department: p.department[locale],
              biography: p.biography[locale],
              portrait: p.portrait?.src,
              initials: initials(p.name, p.position[locale]),
            }))}
            labels={{ open: '+', close: dict.nav.close }}
          />
        </div>
      </section>

      <section className="section section--governance">
        <div className="container">
          <SectionHead eyebrow={dict.nav.governance} title={dict.group.structure} />
          <div className="gov" data-reveal="stagger">
            <div className="gov__tier">
              <div className="gov__box gov__box--strong">{dict.group.board}</div>
              <div className="gov__aside">
                {dict.group.committees.map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
            </div>
            <div className="gov__tier">
              <div className="gov__box">FFH — {dict.group.executive}</div>
              <div className="gov__aside">
                {dict.group.functions.map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
            </div>
            <div className="gov__tier gov__tier--companies">
              <p className="label">{dict.group.subsidiaries}</p>
              <ul>
                {businesses.map((b) => (
                  <li key={b.slug} style={{ '--c': businessColor(b) } as React.CSSProperties}>
                    <strong>{b.name}</strong>
                    <span>{b.category[locale]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
