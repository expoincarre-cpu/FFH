import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { href } from '@/i18n/routes'
import { getArticles, getChainBusinesses, getGroup, getStages } from '@/lib/cms'
import { CompanyLogo } from '@/components/ui/CompanyLogo'
import { pad } from '@/lib/format'
import { Journey } from '@/components/home/Journey'
import { Counter } from '@/components/ui/Counter'
import { Lines } from '@/components/ui/Lines'
import { SectionHead } from '@/components/ui/SectionHead'
import { Marquee } from '@/components/motion/Marquee'
import { ArticleCard } from '@/components/ui/ArticleCard'

export async function HomePage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)
  const [group, stages, businesses, articles] = await Promise.all([getGroup(), getStages(), getChainBusinesses(), getArticles()])

  return (
    <>
      <Journey
        stages={stages.map((s) => ({ id: s.id, index: s.index, name: s.name[locale], color: s.color }))}
        labels={{ scroll: dict.common.scroll, stage: dict.common.stage }}
      >
        {/* 00 — HERO */}
        <div className="jpanel jpanel--hero" data-station>
          <div className="jpanel__inner container">
            <p className="label jpanel__eyebrow" data-reveal="up">
              <span className="dot" /> {dict.home.heroEyebrow}
            </p>
            <Lines as="h1" lines={dict.home.heroTitle} className="display display--hero" />
            <div className="jpanel__hero-foot">
              <p className="lead" data-reveal="up" data-delay="0.3">
                {dict.home.heroLead}
              </p>
              <ol className="chain-legend" data-reveal="stagger">
                {stages.map((s) => (
                  <li key={s.id} style={{ '--c': s.color } as React.CSSProperties}>
                    {s.name[locale]}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* 01 — THE INTEGRATED MODEL */}
        <div className="jpanel jpanel--intro" data-station>
          <div className="jpanel__inner container" data-panel-inner>
            <p className="label">{dict.home.modelEyebrow}</p>
            <h2 className="display display--xl">
              {dict.home.modelTitle.map((l, i) => (
                <span key={l} className={i ? 'muted' : undefined}>
                  {l}
                </span>
              ))}
            </h2>
            <p className="lead">{dict.home.modelLead}</p>
          </div>
        </div>

        {/* 02–06 — THE FIVE STAGES */}
        {stages.map((stage) => {
          const companies = businesses.filter((b) => b.stage === stage.id || (stage.id === 'food' && b.stage === 'transformation'))
          const sites = companies.filter((b) => b.stage === stage.id || stage.id !== 'food').flatMap((b) => b.sites)
          return (
            <article
              key={stage.id}
              className="jpanel jpanel--stage"
              data-station
              style={{ '--c': stage.color } as React.CSSProperties}
              aria-labelledby={`stage-${stage.id}`}
            >
              <div className="jpanel__inner container" data-panel-inner>
                <div className="jpanel__card">
                  <p className="label">
                    {stage.verb[locale]}
                  </p>
                  <h2 className="display display--l" id={`stage-${stage.id}`}>
                    {stage.name[locale]}
                  </h2>
                  <p className="jpanel__desc">{stage.description[locale]}</p>

                  <ul className="jpanel__companies">
                    {companies.map((b) => (
                      <li key={b.slug}>
                        <Link href={href(locale, 'business', { slug: b.slug })}>
                          <CompanyLogo business={b} locale={locale} size="s" />
                          <span>
                            <strong>{b.name}</strong>
                            <span>{b.category[locale]}</span>
                          </span>
                          <i aria-hidden="true">→</i>
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <div className="jpanel__data">
                    <div className="jpanel__metric">
                      <Counter figure={stage.metric} locale={locale} className="jpanel__metric-value" />
                      <span className="jpanel__metric-unit">
                        {stage.metric.unit[locale]}
                        <br />
                        {stage.metric.label[locale]}
                      </span>
                    </div>
                    {sites.length > 0 && stage.id !== 'food' && (
                      <p className="jpanel__loc">
                        <span className="label">{dict.common.location}</span>
                        {Array.from(new Set(sites.map((s) => s.city))).join(' · ')}
                      </p>
                    )}
                  </div>

                </div>
              </div>
            </article>
          )
        })}

        {/* 07 — THE WHOLE SYSTEM */}
        <div className="jpanel jpanel--end" data-station>
          <div className="jpanel__inner container" data-panel-inner>
            <h2 className="display display--xl">
              {dict.home.chainEnd.map((l, i) => (
                <span key={l} className={i === 1 ? 'muted' : undefined}>
                  {l}
                </span>
              ))}
            </h2>
            <Link href={href(locale, 'ecosystem')} className="btn btn--solid">
              {dict.nav.ecosystem} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </Journey>

      {/* KEY FIGURES */}
      <section className="section section--figures" aria-labelledby="figures-title">
        <div className="container">
          <SectionHead eyebrow={dict.home.figuresEyebrow} id="figures-title" title={dict.home.figuresTitle} />
          <ul className="figures-grid">
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

      {/* STORY */}
      <section className="section section--story" aria-labelledby="story-teaser">
        <div className="container">
          <SectionHead eyebrow={dict.home.storyEyebrow} id="story-teaser" title={dict.home.storyTitle} />
          <ol className="timeline-strip" data-reveal="stagger">
            {group.story.map((c, i) => {
              const color = stages.find((s) => s.id === c.stage)?.color
              return (
                <li key={c.id} style={{ '--c': color ?? 'var(--paper)' } as React.CSSProperties}>
                  <strong>{c.title[locale]}</strong>
                  <span>{c.period}</span>
                </li>
              )
            })}
          </ol>
          <Link href={href(locale, 'history')} className="link-arrow">
            {dict.nav.history} →
          </Link>
        </div>
      </section>

      {/* NEWS */}
      <section className="section section--news" aria-labelledby="news-teaser">
        <div className="container">
          <div className="section-row">
            <SectionHead eyebrow={dict.home.newsEyebrow} id="news-teaser" title={dict.home.newsTitle} />
            <Link href={href(locale, 'news')} className="link-arrow">
              {dict.common.allNews} →
            </Link>
          </div>
          <div className="news-grid news-grid--3">
            {articles.slice(0, 3).map((a) => (
              <ArticleCard key={a.slug[locale]} article={a} locale={locale} dict={dict} />
            ))}
          </div>
        </div>
      </section>

    </>
  )
}
