import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { href } from '@/i18n/routes'
import { getGroup, getStages } from '@/lib/cms'
import { pad } from '@/lib/format'
import { PageHero } from '@/components/ui/PageHero'
import { Visual } from '@/components/ui/Visual'
import { Lines } from '@/components/ui/Lines'
import { SectionHead } from '@/components/ui/SectionHead'

export async function StoryPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)
  const [group, stages] = await Promise.all([getGroup(), getStages()])

  return (
    <>
      <PageHero eyebrow={dict.story.eyebrow} title={dict.story.title} lead={dict.story.lead} index="01" />

      <section className="section section--statement">
        <div className="container statement">
          <p className="label">Vision</p>
          <p className="statement__text" data-reveal="up">
            {group.vision[locale]}
          </p>
          <p className="label">Mission</p>
          <p className="statement__text statement__text--muted" data-reveal="up">
            {group.mission[locale]}
          </p>
        </div>
      </section>

      <section className="section chapters" aria-label={dict.story.eyebrow}>
        <div className="chapters__rail" aria-hidden="true" />
        {group.story.map((chapter, i) => {
          const stage = stages.find((s) => s.id === chapter.stage)
          return (
            <article
              key={chapter.id}
              className="chapter container"
              data-flip={i % 2 || undefined}
              style={{ '--c': stage?.color ?? 'var(--paper)' } as React.CSSProperties}
            >
              <div className="chapter__aside">
                <p className="chapter__period" data-reveal="up">
                  {chapter.period}
                </p>
                <p className="label">
                  {pad(i + 1)} / {pad(group.story.length)} — {chapter.title[locale]}
                </p>
                {stage && (
                  <p className="chapter__stage label">
                    <span className="dot" /> {dict.common.stage} {pad(stage.index)} · {stage.name[locale]}
                  </p>
                )}
              </div>
              <div className="chapter__body">
                <Lines lines={[chapter.heading[locale]]} className="display display--m" />
                <p className="chapter__text" data-reveal="up">
                  {chapter.body[locale]}
                </p>
                <Visual
                  media={chapter.media}
                  locale={locale}
                  color={stage?.color}
                  caption={`${dict.common.visualPending} — ${chapter.title[locale]}`}
                  index={pad(i + 1)}
                  ratio={i % 2 ? '4 / 5' : '16 / 10'}
                  pattern={i % 3 === 0 ? 'lines' : i % 3 === 1 ? 'grid' : 'dots'}
                />
              </div>
            </article>
          )
        })}
      </section>

      <section className="section section--values">
        <div className="container">
          <SectionHead eyebrow={locale === 'fr' ? 'Nos valeurs' : 'Our values'} index="02" title={locale === 'fr' ? 'Ce qui relie chaque maillon.' : 'What binds every link.'} />
          <ol className="values" data-reveal="stagger">
            {group.values.map((v, i) => (
              <li key={v.id}>
                <span className="values__num">{pad(i + 1)}</span>
                <h3>{v.title[locale]}</h3>
                <p>{v.body[locale]}</p>
              </li>
            ))}
          </ol>
          <div className="section-cta">
            <Link href={href(locale, 'expertise')} className="btn btn--solid">
              {dict.nav.expertise} →
            </Link>
            <Link href={href(locale, 'people')} className="link-arrow">
              {dict.nav.people} →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
