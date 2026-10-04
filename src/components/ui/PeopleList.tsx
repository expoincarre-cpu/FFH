'use client'

import { useState } from 'react'

type PersonView = {
  id: string
  name: string
  position: string
  department: string
  biography: string
  portrait?: string
  initials: string
}

/**
 * Editorial leadership index: a typographic list where selecting a name
 * expands its portrait and biography in place.
 */
export function PeopleList({ people, labels }: { people: PersonView[]; labels: { open: string; close: string } }) {
  const [open, setOpen] = useState<string | null>(people[0]?.id ?? null)

  return (
    <ol className="people">
      {people.map((p, i) => {
        const isOpen = open === p.id
        return (
          <li key={p.id} className="person" data-open={isOpen || undefined}>
            <button
              type="button"
              className="person__row"
              aria-expanded={isOpen}
              aria-controls={`bio-${p.id}`}
              onClick={() => setOpen(isOpen ? null : p.id)}
            >
              <span className="person__num label">{String(i + 1).padStart(2, '0')}</span>
              <span className="person__name">{p.name}</span>
              <span className="person__role">{p.position}</span>
              <span className="person__toggle" aria-hidden="true">
                {isOpen ? '−' : '+'}
              </span>
              <span className="sr-only">{isOpen ? labels.close : labels.open}</span>
            </button>
            <div className="person__panel" id={`bio-${p.id}`} role="region" aria-label={p.name}>
              <div className="person__panel-inner">
                <div className="person__portrait">
                  {p.portrait ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.portrait} alt={p.name} />
                  ) : (
                    <span aria-hidden="true">{p.initials}</span>
                  )}
                </div>
                <div className="person__bio">
                  <p className="label">{p.department}</p>
                  <p>{p.biography}</p>
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
