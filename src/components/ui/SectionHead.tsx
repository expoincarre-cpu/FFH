import { Lines } from './Lines'

export function SectionHead({
  eyebrow,
  index,
  title,
  lead,
  className = '',
  id,
}: {
  eyebrow: string
  index?: string
  title: string | string[]
  lead?: string
  className?: string
  id?: string
}) {
  return (
    <header className={`section-head ${className}`}>
      <p className="label section-head__eyebrow" data-reveal="up">
        {index && <span className="section-head__index">{index}</span>}
        {eyebrow}
      </p>
      <Lines id={id} lines={Array.isArray(title) ? title : [title]} className="display display--l section-head__title" />
      {lead && (
        <p className="lead section-head__lead" data-reveal="up">
          {lead}
        </p>
      )}
    </header>
  )
}
