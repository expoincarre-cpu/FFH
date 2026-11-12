import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getGroup } from '@/lib/cms'
import { PageHero } from '@/components/ui/PageHero'
import { CareerForm } from '@/components/ui/CareerForm'

export async function CareersPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)
  const group = await getGroup()
  const linkedin = group.social.find((s) => s.label === 'LinkedIn')?.url ?? 'https://www.linkedin.com/'

  return (
    <>
      <PageHero eyebrow={dict.careers.eyebrow} title={dict.careers.title} lead={dict.careers.lead} />

      <section className="section section--form" aria-labelledby="apply-title">
        <div className="container careers">
          <div className="careers__form">
            <h2 className="display display--l" id="apply-title">
              {dict.careers.formTitle}
            </h2>
            <CareerForm labels={dict.careers.form} />
          </div>
          <aside className="careers__aside">
            <a href={linkedin} target="_blank" rel="noreferrer" className="linkedin-card">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="linkedin-card__icon">
                <path
                  fill="currentColor"
                  d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"
                />
              </svg>
              <span className="display display--m">{dict.careers.linkedinTitle}</span>
              <span>{dict.careers.linkedinLead}</span>
              <span className="link-arrow">{dict.careers.linkedinCta} ↗</span>
            </a>
          </aside>
        </div>
      </section>
    </>
  )
}
