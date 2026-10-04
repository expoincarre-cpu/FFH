import { Lines } from './Lines'

export function PageHero({
  eyebrow,
  title,
  lead,
  index,
  children,
  color,
}: {
  eyebrow: string
  title: string[]
  lead?: string
  index?: string
  children?: React.ReactNode
  color?: string
}) {
  return (
    <section className="page-hero" style={color ? ({ '--c': color } as React.CSSProperties) : undefined}>
      <div className="container">
        <p className="label page-hero__eyebrow" data-reveal="up">
          {index && <span className="page-hero__index">{index}</span>}
          {eyebrow}
        </p>
        <Lines as="h1" lines={title} className="display display--xxl page-hero__title" />
        {lead && (
          <p className="lead page-hero__lead" data-reveal="up" data-delay="0.2">
            {lead}
          </p>
        )}
        {children}
      </div>
    </section>
  )
}
