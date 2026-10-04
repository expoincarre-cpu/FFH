'use client'

import { useState } from 'react'

/** Category filter for the newsroom; items are server-rendered and tagged with data-category. */
export function NewsFilter({
  categories,
  allLabel,
  children,
}: {
  categories: { id: string; label: string; count: number }[]
  allLabel: string
  children: React.ReactNode
}) {
  const [active, setActive] = useState('')
  return (
    <div className="news-filter" data-filter={active || 'all'}>
      <div className="news-filter__bar" role="group">
        <button type="button" aria-pressed={!active} onClick={() => setActive('')}>
          {allLabel}
        </button>
        {categories.map((c) => (
          <button key={c.id} type="button" aria-pressed={active === c.id} onClick={() => setActive(c.id)}>
            {c.label} <sup>{c.count}</sup>
          </button>
        ))}
      </div>
      <style>{active ? `.news-filter [data-category]:not([data-category="${active}"]){display:none}` : ''}</style>
      {children}
    </div>
  )
}
