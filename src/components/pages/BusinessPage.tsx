import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { href } from '@/i18n/routes'
import { getBusiness, getBusinesses, getStages } from '@/lib/cms'
import { pad } from '@/lib/format'
import { Lines } from '@/components/ui/Lines'
import { Visual } from '@/components/ui/Visual'
import { Counter } from '@/components/ui/Counter'
import { MoroccoMap } from '@/components/ui/MoroccoMap'

/** Reusable template for every company of the group. */
export async function BusinessPage({ locale, slug }: { locale: Locale; slug: string }) {
  const dict = getDictionary(locale)
  const [business, all, stages] = await Promise.all([getBusiness(slug), getBusinesses(), getStages()])
  if (!business) notFound()

  const stage = stages.find((s) => s.id === business.stage)!
  const color = stage.color
  const upstream = all.filter((b) => b.suppliesTo.includes(business.slug))
  const downstream = all.filter((b) => business.suppliesTo.includes(b.slug))
  const next = all[(all.findIndex((b) => b.slug === business.slug) + 1) % all.length]
  const t = dict.business
  let n = 0
  const num = () => pad(++n)

  return (
    <article className="business" style={{ '--c': color } as React.CSSProperties}>
      {/* HERO */}
      <header className="business-hero">
        <div className="container business-hero__grid">
          <div className="business-hero__text">
            <p className="label" data-reveal="up">
              <Link href={href(locale, 'expertise')} className="crumb">
                {dict.nav.expertise}
              </Link>{' '}
              / {business.category[locale]}
            </p>
            <Lines as="h1" lines={[business.name]} className="display display--xxl business-hero__name" />
            <p className="business-hero__statement" data-reveal="up" data-delay="0.2">
              {business.statement[locale]}
            </p>
          </div>
          <Visual
            media={business.hero}
            locale={locale}
            color={color}
            caption={`${dict.common.visualPending} — ${business.name}`}
            index={pad(stage.index)}
            ratio="16 / 9"
            className="business-hero__visual"
            priority
          />
        </div>

        {/* Position in the chain */}
        <div className="container">
          <div className="chain-position" aria-label={t.inChain}>
            <p className="label">{t.inChain}</p>
            <ol>
              {stages.map((s) => (
                <li key={s.id} data-on={s.id === business.stage || undefined} style={{ '--c': s.color } as React.CSSProperties}>
                  <span>{pad(s.index)}</span>
                  {s.name[locale]}
                </li>
              ))}
            </ol>
            <p className="chain-position__flows">
              {upstream.length > 0 && (
                <span>
                  ← {dict.home.upstream}{' '}
                  {upstream.map((b, i) => (
                    <span key={b.slug}>
                      {i > 0 && ' · '}
                      <Link href={href(locale, 'business', { slug: b.slug })}>{b.name}</Link>
                    </span>
                  ))}
                </span>
              )}
              {downstream.length > 0 && (
                <span>
                  {dict.home.downstream} →{' '}
                  {downstream.map((b, i) => (
                    <span key={b.slug}>
                      {i > 0 && ' · '}
                      <Link href={href(locale, 'business', { slug: b.slug })}>{b.name}</Link>
                    </span>
                  ))}
                </span>
              )}
            </p>
          </div>
        </div>
      </header>

      {/* ABOUT */}
      <section className="section bsec">
        <div className="container bsec__grid">
          <h2 className="bsec__title label">
            <span>{num()}</span> {t.about}
          </h2>
          <div className="bsec__body">
            <p className="statement__text" data-reveal="up">
              {business.description[locale]}
            </p>
            <div className="columns">
              {business.about[locale].map((p, i) => (
                <p key={i} data-reveal="up">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* EXPERTISE */}
      <section className="section bsec">
        <div className="container bsec__grid">
          <h2 className="bsec__title label">
            <span>{num()}</span> {t.expertise}
          </h2>
          <ol className="bsec__body capabilities" data-reveal="stagger">
            {business.expertise.map((e, i) => (
              <li key={i}>
                <span className="capabilities__num">{pad(i + 1)}</span>
                <h3>{e.title[locale]}</h3>
                <p>{e.body[locale]}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* INDUSTRIAL CAPACITY + FIGURES */}
      <section className="section bsec bsec--dark">
        <div className="container bsec__grid">
          <h2 className="bsec__title label">
            <span>{num()}</span> {t.figures}
          </h2>
          <div className="bsec__body">
            <ul className="bfigures">
              {business.figures.map((f) => (
                <li key={f.id}>
                  <Counter figure={f} locale={locale} className="bfigures__value" />
                  <span className="bfigures__unit">{f.unit[locale]}</span>
                  <span className="bfigures__label">{f.label[locale]}</span>
                </li>
              ))}
            </ul>
            {business.placeholder && <p className="label note">{dict.common.placeholderNotice}</p>}
          </div>
        </div>
        <div className="container bsec__grid">
          <h2 className="bsec__title label">
            <span>{num()}</span> {t.capacity}
          </h2>
          <dl className="bsec__body capacity">
            {business.capacity.map((c, i) => (
              <div key={i} data-reveal="up">
                <dt className="label">{c.label[locale]}</dt>
                <dd>
                  <strong>{c.value[locale]}</strong>
                  {c.detail && <span>{c.detail[locale]}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* PRODUCTS / SERVICES */}
      <section className="section bsec">
        <div className="container">
          <h2 className="bsec__title label">
            <span>{num()}</span> {t.products}
          </h2>
          <ul className="products">
            {business.products.map((p, i) => (
              <li key={p.id} className="product">
                <Visual
                  media={p.media}
                  locale={locale}
                  color={color}
                  caption={p.name[locale]}
                  index={pad(i + 1)}
                  ratio="1 / 1"
                  pattern={(['dots', 'grid', 'rings', 'lines'] as const)[i % 4]}
                />
                <h3>{p.name[locale]}</h3>
                <p>{p.description[locale]}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* LOCATIONS */}
      <section className="section bsec">
        <div className="container bsec__grid">
          <h2 className="bsec__title label">
            <span>{num()}</span> {t.locations}
          </h2>
          <div className="bsec__body locations">
            <MoroccoMap
              locale={locale}
              sites={business.sites.map((s) => ({ ...s, color, label: `${s.city}` }))}
              highlight={business.slug}
            />
            <ul className="sites">
              {business.sites.map((s) => (
                <li key={s.id}>
                  <span className="label">{s.type[locale]}</span>
                  <strong>{s.city}</strong>
                  <span>{s.region[locale]}</span>
                  <span className="mono">
                    {s.coords.lat.toFixed(3)}°N {Math.abs(s.coords.lng).toFixed(3)}°W
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* QUALITY & CERTIFICATIONS */}
      <section className="section bsec">
        <div className="container bsec__grid">
          <h2 className="bsec__title label">
            <span>{num()}</span> {t.quality}
          </h2>
          <ul className="bsec__body certs" data-reveal="stagger">
            {business.certifications.map((c) => (
              <li key={c.name}>
                <span className="certs__seal" aria-hidden="true">
                  {c.name}
                </span>
                <p>{c.scope[locale]}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* COMMITMENTS */}
      <section className="section bsec">
        <div className="container bsec__grid">
          <h2 className="bsec__title label">
            <span>{num()}</span> {t.commitments}
          </h2>
          <ol className="bsec__body commitments">
            {business.commitments.map((c, i) => (
              <li key={i} data-reveal="up">
                <h3>{c.title[locale]}</h3>
                <p>{c.body[locale]}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CONTACT */}
      <section className="section business-contact">
        <div className="container">
          <Lines lines={[t.contactTitle]} className="display display--l" />
          <div className="business-contact__row">
            <a href={`mailto:${business.contact.email}`} className="btn btn--solid">
              {t.contactCta} {business.name} <span aria-hidden="true">↗</span>
            </a>
            <a href={`mailto:${business.contact.email}`} className="mono">
              {business.contact.email}
            </a>
          </div>
        </div>
      </section>

      {/* NEXT */}
      <Link href={href(locale, 'business', { slug: next.slug })} className="next-business" style={{ '--c': stages.find((s) => s.id === next.stage)?.color } as React.CSSProperties}>
        <span className="label">{t.next}</span>
        <span className="display display--xl">{next.name}</span>
        <span className="next-business__cat">{next.category[locale]} →</span>
      </Link>
    </article>
  )
}
