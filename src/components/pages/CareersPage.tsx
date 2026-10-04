import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getBusinesses, getJobs, getStages } from '@/lib/cms'
import { pad } from '@/lib/format'
import { PageHero } from '@/components/ui/PageHero'
import { SectionHead } from '@/components/ui/SectionHead'
import { Visual } from '@/components/ui/Visual'
import { JobBoard } from '@/components/ui/JobBoard'
import { Marquee } from '@/components/motion/Marquee'

const culture = {
  fr: [
    { t: 'Le terrain', b: 'Usines, couvoirs, fermes : nos métiers se vivent sur site, au plus près du produit.' },
    { t: 'La transmission', b: 'Parcours d’intégration, formation continue et compagnonnage entre générations.' },
    { t: 'La mobilité', b: 'Sept entreprises, cinq métiers : des carrières qui traversent toute la chaîne.' },
    { t: 'L’innovation', b: 'Digitalisation des élevages, automatisation, efficacité énergétique.' },
  ],
  en: [
    { t: 'The field', b: 'Mills, hatcheries, farms: our work happens on site, close to the product.' },
    { t: 'Transmission', b: 'Onboarding paths, continuous training and mentoring across generations.' },
    { t: 'Mobility', b: 'Seven companies, five stages: careers that span the entire chain.' },
    { t: 'Innovation', b: 'Digital farming, automation, energy efficiency.' },
  ],
}

const professions = {
  fr: ['Ingénieurs', 'Vétérinaires', 'Techniciens', 'Éleveurs', 'Qualiticiens', 'Logisticiens', 'Commerciaux', 'Fonctions support'],
  en: ['Engineers', 'Veterinarians', 'Technicians', 'Farmers', 'Quality experts', 'Logisticians', 'Sales', 'Support functions'],
}

export async function CareersPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)
  const [jobs, businesses, stages] = await Promise.all([getJobs(), getBusinesses(), getStages()])
  const companyName = (slug: string) => businesses.find((b) => b.slug === slug)?.name ?? 'FFH'

  return (
    <>
      <PageHero eyebrow={dict.careers.eyebrow} title={dict.careers.title} lead={dict.careers.lead} index="04">
        <a href="#positions" className="btn btn--solid page-hero__cta">
          {dict.careers.openPositions} ↓
        </a>
      </PageHero>

      <Marquee items={professions[locale]} className="marquee--big" />

      <section className="section">
        <div className="container careers-culture">
          <SectionHead eyebrow={dict.careers.cultureTitle} index="A" title={locale === 'fr' ? 'Une culture de bâtisseurs.' : 'A culture of builders.'} />
          <div className="careers-culture__grid">
            <Visual locale={locale} caption={`${dict.common.visualPending} — ${locale === 'fr' ? 'Équipes en usine' : 'Plant teams'}`} color={stages[3].color} ratio="3 / 4" pattern="grid" />
            <ol className="values" data-reveal="stagger">
              {culture[locale].map((c, i) => (
                <li key={c.t}>
                  <span className="values__num">{pad(i + 1)}</span>
                  <h3>{c.t}</h3>
                  <p>{c.b}</p>
                </li>
              ))}
            </ol>
            <Visual locale={locale} caption={`${dict.common.visualPending} — ${locale === 'fr' ? 'Élevage' : 'Farming'}`} color={stages[2].color} ratio="4 / 3" pattern="dots" className="careers-culture__offset" />
          </div>
        </div>
      </section>

      <section className="section section--jobs" id="positions">
        <div className="container">
          <SectionHead eyebrow={dict.careers.openPositions} index="B" title={locale === 'fr' ? 'Rejoignez la chaîne.' : 'Join the chain.'} />
          <JobBoard
            jobs={jobs.map((j) => ({
              id: j.id,
              title: j.title[locale],
              location: j.location,
              company: companyName(j.business),
              department: j.department[locale],
              contract: j.contract,
              description: j.description[locale],
              requirements: j.requirements[locale],
              apply: j.application.url ?? `mailto:${j.application.email}?subject=${encodeURIComponent(j.title[locale])}`,
              date: j.publishedAt,
            }))}
            labels={{
              department: dict.careers.filterDepartment,
              location: dict.careers.filterLocation,
              contract: dict.careers.filterContract,
              all: dict.common.all,
              noResults: dict.careers.noResults,
              apply: dict.careers.apply,
              requirements: dict.careers.requirements,
              positions: dict.careers.positions,
            }}
          />
          <div className="spontaneous">
            <p className="display display--m">{dict.careers.spontaneous}</p>
            <a className="btn btn--ghost" href="mailto:careers@ffh.ma">
              careers@ffh.ma ↗
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
