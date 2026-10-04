import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { href } from '@/i18n/routes'
import { getArticle, getArticles, getBusiness, getStages } from '@/lib/cms'
import { formatDate } from '@/lib/format'
import { Lines } from '@/components/ui/Lines'
import { Visual } from '@/components/ui/Visual'
import { ArticleCard } from '@/components/ui/ArticleCard'

export async function ArticlePage({ locale, slug }: { locale: Locale; slug: string }) {
  const dict = getDictionary(locale)
  const article = await getArticle(locale, slug)
  if (!article) notFound()
  const [all, stages, business] = await Promise.all([getArticles(), getStages(), article.business ? getBusiness(article.business) : undefined])
  const color = stages.find((s) => s.id === article.stage)?.color
  const related = all.filter((a) => a !== article).slice(0, 3)
  const [first, ...paragraphs] = article.content[locale]

  return (
    <article className="article" style={color ? ({ '--c': color } as React.CSSProperties) : undefined}>
      <header className="article__head container">
        <p className="label">
          <Link href={href(locale, 'news')} className="crumb">
            {dict.news.eyebrow}
          </Link>{' '}
          / {dict.news.categories[article.category]}
        </p>
        <Lines as="h1" lines={[article.title[locale]]} className="display display--l article__title" />
        <div className="article__meta">
          <time dateTime={article.date}>{formatDate(article.date, locale)}</time>
          <span>
            {dict.news.by} {article.author}
          </span>
          <span>
            {article.readingTime} {dict.common.minutes}
          </span>
          {business && (
            <Link href={href(locale, 'business', { slug: business.slug })}>{business.name} →</Link>
          )}
        </div>
      </header>
      <div className="container">
        <Visual media={article.image} locale={locale} color={color} caption={dict.news.categories[article.category]} ratio="21 / 9" pattern="rings" priority />
      </div>
      <div className="article__body container">
        <p className="article__standfirst">{article.excerpt[locale]}</p>
        <div className="article__text">
          {first && <p className="article__first">{first}</p>}
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
      <section className="section">
        <div className="container">
          <p className="label">{dict.news.related}</p>
          <div className="news-grid news-grid--3">
            {related.map((a) => (
              <ArticleCard key={a.slug[locale]} article={a} locale={locale} dict={dict} size="s" />
            ))}
          </div>
        </div>
      </section>
    </article>
  )
}
