'use client'

import { getLenis } from '@/components/motion/SmoothScroll'

export function BackToTop({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="link-arrow"
      onClick={() => {
        const lenis = getLenis()
        if (lenis) lenis.scrollTo(0, { duration: 1.6 })
        else window.scrollTo({ top: 0, behavior: 'smooth' })
      }}
    >
      {label} ↑
    </button>
  )
}
