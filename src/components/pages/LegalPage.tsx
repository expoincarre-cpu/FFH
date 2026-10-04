import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getGroup } from '@/lib/cms'
import { PageHero } from '@/components/ui/PageHero'

export async function LegalPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)
  const group = await getGroup()
  const fr = locale === 'fr'
  return (
    <>
      <PageHero eyebrow="FFH" title={[dict.legal.title]} />
      <section className="section">
        <div className="container prose">
          <h2>{fr ? 'Éditeur du site' : 'Publisher'}</h2>
          <p>
            {group.legalName} — {group.headquarters.address[locale]}
            <br />
            {group.headquarters.phone} — {group.headquarters.email}
          </p>
          <h2>{fr ? 'Données personnelles' : 'Personal data'}</h2>
          <p>
            {fr
              ? 'Les données collectées via les formulaires sont utilisées uniquement pour traiter vos demandes, conformément à la loi 09-08 relative à la protection des personnes physiques à l’égard du traitement des données à caractère personnel.'
              : 'Data collected through forms is used solely to process your requests, in accordance with Moroccan Law 09-08 on the protection of individuals with regard to the processing of personal data.'}
          </p>
          <h2>{fr ? 'Propriété intellectuelle' : 'Intellectual property'}</h2>
          <p>
            {fr
              ? 'L’ensemble des contenus de ce site est la propriété du groupe FFH ou de ses filiales. Toute reproduction est soumise à autorisation.'
              : 'All content on this site is the property of the FFH group or its companies. Any reproduction requires authorisation.'}
          </p>
          <p className="label">{dict.common.placeholderNotice}</p>
        </div>
      </section>
    </>
  )
}
