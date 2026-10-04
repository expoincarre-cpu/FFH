'use client'

import { useMemo, useState } from 'react'

export type JobView = {
  id: string
  title: string
  location: string
  company: string
  department: string
  contract: string
  description: string
  requirements: string[]
  apply: string
  date: string
}

type Labels = {
  department: string
  location: string
  contract: string
  all: string
  noResults: string
  apply: string
  requirements: string
  positions: string
}

export function JobBoard({ jobs, labels }: { jobs: JobView[]; labels: Labels }) {
  const [filters, setFilters] = useState({ department: '', location: '', contract: '' })
  const [open, setOpen] = useState<string | null>(null)

  const options = useMemo(
    () => ({
      department: Array.from(new Set(jobs.map((j) => j.department))).sort(),
      location: Array.from(new Set(jobs.map((j) => j.location))).sort(),
      contract: Array.from(new Set(jobs.map((j) => j.contract))).sort(),
    }),
    [jobs],
  )

  const results = jobs.filter(
    (j) =>
      (!filters.department || j.department === filters.department) &&
      (!filters.location || j.location === filters.location) &&
      (!filters.contract || j.contract === filters.contract),
  )

  return (
    <div className="jobs">
      <div className="jobs__filters" role="group">
        {(['department', 'location', 'contract'] as const).map((key) => (
          <label key={key} className="select">
            <span className="label">{labels[key]}</span>
            <select value={filters[key]} onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}>
              <option value="">{labels.all}</option>
              {options[key].map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
        ))}
        <p className="jobs__count" aria-live="polite">
          <strong>{String(results.length).padStart(2, '0')}</strong> {labels.positions}
        </p>
      </div>

      {results.length === 0 ? (
        <p className="jobs__empty">{labels.noResults}</p>
      ) : (
        <ul className="jobs__list">
          {results.map((j) => {
            const isOpen = open === j.id
            return (
              <li key={j.id} className="job" data-open={isOpen || undefined}>
                <button type="button" className="job__row" aria-expanded={isOpen} aria-controls={`job-${j.id}`} onClick={() => setOpen(isOpen ? null : j.id)}>
                  <span className="job__title">{j.title}</span>
                  <span className="job__meta">{j.company}</span>
                  <span className="job__meta">{j.location}</span>
                  <span className="job__tag">{j.contract}</span>
                  <span className="job__toggle" aria-hidden="true">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                <div className="job__panel" id={`job-${j.id}`} hidden={!isOpen}>
                  <p>{j.description}</p>
                  <p className="label">{labels.requirements}</p>
                  <ul>
                    {j.requirements.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                  <a className="btn btn--solid" href={j.apply}>
                    {labels.apply} <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
