import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getGroup, getStages } from '@/lib/cms'
import { PageHero } from '@/components/ui/PageHero'
import { GroupNav } from '@/components/group/GroupNav'

/** A deliberately concise timeline: one screen, no long scroll. */
export async function HistoryPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)
  const [group, stages] = await Promise.all([getGroup(), getStages()])

  return (
    <>
      <PageHero eyebrow={dict.nav.group} title={dict.group.historyTitle} lead={dict.group.historyLead} />
      <GroupNav locale={locale} dict={dict} current="history" />

      <section className="section">
        <div className="container">
          <ol className="timeline" data-reveal="stagger">
            {group.story.map((c) => {
              const color = stages.find((s) => s.id === c.stage)?.color ?? 'var(--gold)'
              return (
                <li key={c.id} className="timeline__item" style={{ '--c': color } as React.CSSProperties}>
                  <p className="timeline__period">{c.period}</p>
                  <h2 className="timeline__title">{c.title[locale]}</h2>
                  <p className="timeline__heading">{c.heading[locale]}</p>
                  <p className="timeline__body">{c.body[locale]}</p>
                </li>
              )
            })}
          </ol>
        </div>
      </section>
    </>
  )
}
