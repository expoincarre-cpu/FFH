import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { href } from '@/i18n/routes'
import { getBusinesses, getGroup, getStages } from '@/lib/cms'
import { PageHero } from '@/components/ui/PageHero'
import { MoroccoMap } from '@/components/ui/MoroccoMap'
import { ContactForm } from '@/components/ui/ContactForm'

export async function ContactPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)
  const [group, businesses, stages] = await Promise.all([getGroup(), getBusinesses(), getStages()])
  const sites = businesses.flatMap((b) =>
    b.sites.map((s) => ({ ...s, color: stages.find((x) => x.id === b.stage)?.color, label: `${b.name} — ${s.city}` })),
  )
  const hq = group.headquarters

  return (
    <>
      <PageHero eyebrow={dict.contact.eyebrow} title={dict.contact.title} lead={dict.contact.lead} index="05" />

      <section className="section contact">
        <div className="container contact__grid">
          <div className="contact__info">
            <div className="contact__block" data-reveal="up">
              <p className="label">{dict.contact.hq}</p>
              <address>
                <p>{hq.address[locale]}</p>
                <a href={`tel:${hq.phone.replace(/\s/g, '')}`} className="contact__big">
                  {hq.phone}
                </a>
                <a href={`mailto:${hq.email}`} className="contact__big">
                  {hq.email}
                </a>
              </address>
              <p className="mono">
                {hq.coords.lat.toFixed(4)}°N {Math.abs(hq.coords.lng).toFixed(4)}°W
              </p>
            </div>
            <div className="contact__block" data-reveal="up">
              <p className="label">{dict.contact.sites}</p>
              <ul className="contact__sites">
                {businesses.map((b) => (
                  <li key={b.slug} style={{ '--c': stages.find((s) => s.id === b.stage)?.color } as React.CSSProperties}>
                    <Link href={href(locale, 'business', { slug: b.slug })}>
                      <strong>{b.name}</strong>
                      <span>{b.sites.map((s) => s.city).join(', ')}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <MoroccoMap locale={locale} sites={sites} hq={{ coords: hq.coords, label: 'FFH — Casablanca' }} className="contact__map" />
        </div>
      </section>

      <section className="section section--form">
        <div className="container form-wrap">
          <h2 className="display display--l">{locale === 'fr' ? 'Écrivez-nous.' : 'Write to us.'}</h2>
          <ContactForm labels={dict.contact.form} />
        </div>
      </section>

      <Link href={href(locale, 'careers')} className="next-business">
        <span className="label">{dict.nav.careers}</span>
        <span className="display display--xl">{dict.contact.careersCta}</span>
        <span className="next-business__cat">{dict.careers.openPositions} →</span>
      </Link>
    </>
  )
}
