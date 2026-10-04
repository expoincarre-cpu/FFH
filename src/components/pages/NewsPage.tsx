import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { href } from '@/i18n/routes'
import { getArticles, getStages } from '@/lib/cms'
import { formatDate } from '@/lib/format'
import { PageHero } from '@/components/ui/PageHero'
import { Visual } from '@/components/ui/Visual'
import { ArticleCard } from '@/components/ui/ArticleCard'
import { NewsFilter } from '@/components/ui/NewsFilter'
import type { NewsCategory } from '@/content/types'

export async function NewsPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)
  const [articles, stages] = await Promise.all([getArticles(), getStages()])
  const featured = articles.find((a) => a.featured) ?? articles[0]
  const rest = articles.filter((a) => a !== featured)
  const categories = (Object.keys(dict.news.categories) as NewsCategory[])
    .map((id) => ({ id, label: dict.news.categories[id], count: rest.filter((a) => a.category === id).length }))
    .filter((c) => c.count > 0)

  return (
    <>
      <PageHero eyebrow={dict.news.eyebrow} title={dict.news.title} lead={dict.news.lead} index="06" />

      {featured && (
        <section className="section section--tight">
          <div className="container">
            <Link href={href(locale, 'article', { slug: featured.slug[locale] })} className="lead-story">
              <Visual
                media={featured.image}
                locale={locale}
                color={stages.find((s) => s.id === featured.stage)?.color}
                caption={dict.news.featured}
                ratio="16 / 9"
                pattern="rings"
                priority
              />
              <div className="lead-story__text">
                <p className="label">
                  {dict.news.featured} · {dict.news.categories[featured.category]} ·{' '}
                  <time dateTime={featured.date}>{formatDate(featured.date, locale)}</time>
                </p>
                <h2 className="display display--l">{featured.title[locale]}</h2>
                <p className="lead">{featured.excerpt[locale]}</p>
                <span className="link-arrow">{dict.common.readMore} →</span>
              </div>
            </Link>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <NewsFilter categories={categories} allLabel={dict.common.all}>
            <div className="news-grid">
              {rest.map((a, i) => (
                <div key={a.slug[locale]} data-category={a.category} className={i % 5 === 0 ? 'news-grid__wide' : undefined}>
                  <ArticleCard article={a} locale={locale} dict={dict} size={i % 5 === 0 ? 'l' : 'm'} />
                </div>
              ))}
            </div>
          </NewsFilter>
        </div>
      </section>
    </>
  )
}
