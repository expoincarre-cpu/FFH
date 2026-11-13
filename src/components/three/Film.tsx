'use client'

import { useEffect, useRef } from 'react'
import { curveParam, journey } from './state'

/**
 * Mobile / tablet path: the journey pre-rendered offline from the desktop
 * scene (scripts/render-film.mjs) and scrubbed with the scroll position.
 *
 * Frames are evenly spaced along the camera path, so the scroll → frame
 * mapping reuses curveParam() and stays in sync with the text panels.
 *  - Portrait and landscape framings, light and dark variants.
 *  - Progressive loading: every 16th frame first (the whole journey is
 *    scrubbable after ~10 requests), then 8th, 4th, 2nd, all. Loading stops at
 *    a byte budget until the visitor first interacts.
 *  - Only a small window of frames is kept decoded; the rest stay as
 *    compressed blobs, so memory stays flat on phones.
 *  - Adjacent frames are cross-faded, which hides the frame step on slow
 *    scrolls; theme changes cross-fade between the two sets.
 */

type Manifest = { frames: number; variants: Record<string, { width: number; height: number }> }
type Theme = 'light' | 'dark'

const BASE = '/media/journey'
const EAGER_BYTES = 3.2e6
const WINDOW = 7

class FrameSet {
  blobs: (Blob | undefined)[]
  decoded = new Map<number, CanvasImageSource>()
  pending = new Set<number>()
  queue: number[] = []
  active = 0
  bytes = 0
  loaded = 0
  dead = false
  failures = 0

  constructor(
    readonly dir: string,
    readonly count: number,
    private readonly gate: () => boolean,
    private readonly onProgress: () => void,
  ) {
    this.blobs = new Array(count)
    const seen = new Set<number>()
    for (const stride of [16, 8, 4, 2, 1])
      for (let i = 0; i < count; i += stride)
        if (!seen.has(i)) {
          seen.add(i)
          this.queue.push(i)
        }
    if (!seen.has(count - 1)) this.queue.push(count - 1)
  }

  /** Moves frames near `index` to the front of the queue. */
  prioritise(index: number) {
    const near = this.queue.filter((i) => Math.abs(i - index) <= 6)
    if (near.length) this.queue = [...near, ...this.queue.filter((i) => Math.abs(i - index) > 6)]
    this.pump()
  }

  pump() {
    while (!this.dead && this.active < 4 && this.queue.length && (this.gate() || this.bytes < EAGER_BYTES)) {
      const i = this.queue.shift()!
      this.active++
      fetch(`${this.dir}/${String(i).padStart(3, '0')}.webp`)
        .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
        .then((b) => {
          this.blobs[i] = b
          this.bytes += b.size
          this.loaded++
          this.onProgress()
        })
        .catch(() => void this.failures++)
        .finally(() => {
          this.active--
          this.pump()
        })
    }
  }

  /** Nearest loaded frame to `index`, searching outwards. */
  nearest(index: number) {
    for (let d = 0; d < this.count; d++) {
      if (this.blobs[index - d]) return index - d
      if (this.blobs[index + d]) return index + d
    }
    return -1
  }

  /** Returns the decoded frame if ready, and schedules decoding otherwise. */
  get(i: number): CanvasImageSource | undefined {
    const hit = this.decoded.get(i)
    if (hit) return hit
    const blob = this.blobs[i]
    if (!blob || this.pending.has(i)) return undefined
    this.pending.add(i)
    const done = (img: CanvasImageSource) => {
      this.pending.delete(i)
      if (this.dead) return (img as ImageBitmap).close?.()
      this.decoded.set(i, img)
      this.onProgress()
    }
    if ('createImageBitmap' in window) createImageBitmap(blob).then(done, () => this.pending.delete(i))
    else {
      const img = new Image()
      const url = URL.createObjectURL(blob)
      img.onload = () => {
        URL.revokeObjectURL(url)
        done(img)
      }
      img.onerror = () => this.pending.delete(i)
      img.src = url
    }
    return undefined
  }

  /** Frees decoded frames far from the current position. */
  trim(index: number) {
    this.decoded.forEach((img, i) => {
      if (Math.abs(i - index) > WINDOW) {
        ;(img as ImageBitmap).close?.()
        this.decoded.delete(i)
      }
    })
  }

  dispose() {
    this.dead = true
    this.decoded.forEach((img) => (img as ImageBitmap).close?.())
    this.decoded.clear()
  }
}

export default function Film({ running, onFail }: { running: boolean; onFail: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const runningRef = useRef(running)
  runningRef.current = running

  useEffect(() => {
    const el = canvas.current
    const ctx = el?.getContext('2d', { alpha: false })
    if (!el || !ctx) return onFail()
    let dead = false
    let raf = 0
    let dirty = true
    let interacted = false
    let sets: Partial<Record<Theme, FrameSet>> = {}
    let variant = ''
    let manifest: Manifest | null = null
    let shown: Theme = journey.theme
    let fade = 1
    let last = performance.now()
    let lastKey = ''

    const mark = () => void (dirty = true)
    const interact = () => {
      if (interacted) return
      interacted = true
      Object.values(sets).forEach((s) => s?.pump())
    }
    const events = ['scroll', 'touchstart', 'pointerdown', 'keydown', 'wheel'] as const
    events.forEach((e) => window.addEventListener(e, interact, { passive: true, once: true }))

    const pick = () => (window.innerWidth / window.innerHeight < 1 ? 'portrait' : 'landscape')
    const open = (theme: Theme) => {
      if (!manifest || sets[theme]) return
      const s = new FrameSet(`${BASE}/${variant}-${theme}`, manifest.frames, () => interacted, mark)
      sets[theme] = s
      s.pump()
    }
    const setup = () => {
      if (!manifest) return
      const next = pick()
      if (next === variant) return
      Object.values(sets).forEach((s) => s?.dispose())
      sets = {}
      variant = next
      const v = manifest.variants[variant]
      el.width = v.width
      el.height = v.height
      open(journey.theme)
      mark()
    }

    fetch(`${BASE}/manifest.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((m: Manifest) => {
        if (dead) return
        manifest = m
        setup()
      })
      .catch(() => !dead && onFail())
    window.addEventListener('resize', setup)

    const draw = (set: FrameSet, f: number, alpha: number) => {
      const i0 = Math.min(set.count - 1, Math.floor(f))
      const a = set.nearest(i0)
      if (a < 0) return false
      const imgA = set.get(a) ?? set.decoded.get(set.nearest(a))
      // Fall back to any decoded neighbour while the wanted frame decodes.
      let base = imgA
      if (!base) set.decoded.forEach((img, i) => (base ??= Math.abs(i - a) <= WINDOW ? img : undefined))
      if (!base) return false
      ctx.globalAlpha = alpha
      ctx.drawImage(base, 0, 0, el.width, el.height)
      // Cross-fade to the next frame when it is the true neighbour.
      const frac = f - i0
      if (imgA && a === i0 && frac > 0.02 && set.blobs[i0 + 1]) {
        const imgB = set.get(i0 + 1)
        if (imgB) {
          ctx.globalAlpha = alpha * frac
          ctx.drawImage(imgB, 0, 0, el.width, el.height)
        }
      }
      ctx.globalAlpha = 1
      return !!imgA
    }

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      if (!runningRef.current || !manifest) return
      const target = journey.progress
      journey.smooth = journey.snap ? target : journey.smooth + (target - journey.smooth) * (1 - Math.exp(-5 * dt))
      if (Math.abs(journey.smooth - target) < 1e-5) journey.smooth = target
      const f = curveParam(journey.smooth) * (manifest.frames - 1)

      // Theme changes cross-fade between the two frame sets.
      if (journey.theme !== shown && fade >= 1) {
        open(journey.theme)
        const next = sets[journey.theme]
        if (next && next.nearest(Math.round(f)) >= 0 && next.get(next.nearest(Math.round(f)))) {
          shown = journey.theme
          fade = 0
        } else next?.prioritise(Math.round(f))
      }
      if (fade < 1) {
        fade = Math.min(1, fade + dt / 0.6)
        dirty = true
      }
      journey.mix = shown === 'light' ? fade : 1 - fade

      const key = `${f.toFixed(3)}|${shown}`
      if (key === lastKey && !dirty) return
      const cur = sets[shown]
      if (!cur) return
      const other = sets[shown === 'light' ? 'dark' : 'light']
      if (fade < 1 && other) draw(other, f, 1)
      const sharp = draw(cur, f, fade < 1 ? fade : 1)
      cur.prioritise(Math.round(f))
      cur.trim(Math.round(f))
      other?.trim(Math.round(f))
      lastKey = key
      // Keep redrawing until the exact frame has decoded.
      dirty = !sharp
      journey.frames++
    }
    raf = requestAnimationFrame(tick)

    // No frames at all after a grace period: hand over to the illustration.
    const watchdog = window.setTimeout(() => {
      const s = sets[shown]
      if (!dead && (!s || s.loaded === 0)) onFail()
    }, 12000)

    return () => {
      dead = true
      cancelAnimationFrame(raf)
      clearTimeout(watchdog)
      window.removeEventListener('resize', setup)
      events.forEach((e) => window.removeEventListener(e, interact))
      Object.values(sets).forEach((s) => s?.dispose())
    }
  }, [onFail])

  return <canvas ref={canvas} className="journey__canvas journey__film" aria-hidden="true" />
}
