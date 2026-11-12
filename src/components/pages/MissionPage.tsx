import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getGroup } from '@/lib/cms'
import { PageHero } from '@/components/ui/PageHero'
import { SectionHead } from '@/components/ui/SectionHead'
import { GroupNav } from '@/components/group/GroupNav'

export async function MissionPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)
  const group = await getGroup()

  return (
    <>
      <PageHero eyebrow={dict.nav.group} title={dict.group.missionTitle} lead={dict.group.missionLead} />
      <GroupNav locale={locale} dict={dict} current="mission" />

      <section className="section section--statement">
        <div className="container statement">
          <p className="label">{dict.group.vision}</p>
          <p className="statement__text" data-reveal="up">
            {group.vision[locale]}
          </p>
          <p className="label">{dict.group.mission}</p>
          <p className="statement__text statement__text--muted" data-reveal="up">
            {group.mission[locale]}
          </p>
        </div>
      </section>

      <section className="section section--values">
        <div className="container">
          <SectionHead eyebrow={dict.group.values} title={locale === 'fr' ? 'Ce qui relie chaque maillon.' : 'What binds every link.'} />
          <ul className="values" data-reveal="stagger">
            {group.values.map((v) => (
              <li key={v.id}>
                <h3>{v.title[locale]}</h3>
                <p>{v.body[locale]}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
