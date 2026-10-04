import * as THREE from 'three'
import { rng } from './shared'

/**
 * Procedural, tileable textures generated on a canvas — realistic surface
 * detail without shipping image files. Each texture is cached by key.
 */

const cache = new Map<string, THREE.Texture>()

function canvas(size: number) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  return [c, c.getContext('2d')!] as const
}

function finish(c: HTMLCanvasElement, color: boolean) {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 4
  if (color) t.colorSpace = THREE.SRGBColorSpace
  return t
}

function noise(ctx: CanvasRenderingContext2D, size: number, amount: number, seed: number, scale = 1) {
  const r = rng(seed)
  const img = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * amount * 255 * scale
    img.data[i] += n
    img.data[i + 1] += n
    img.data[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)
}

function cached(key: string, make: () => THREE.Texture) {
  let t = cache.get(key)
  if (!t) {
    t = make()
    cache.set(key, t)
  }
  return t
}

/** Height map of corrugated sheeting (vertical ribs). */
export function corrugatedBump(ribs = 32) {
  return cached(`corr-${ribs}`, () => {
    const [c, ctx] = canvas(256)
    for (let x = 0; x < 256; x++) {
      const v = 128 + 110 * Math.sin((x / 256) * ribs * Math.PI * 2)
      ctx.fillStyle = `rgb(${v},${v},${v})`
      ctx.fillRect(x, 0, 1, 256)
    }
    return finish(c, false)
  })
}

/** Weathered colour for cladding / steel: streaks and grime. */
export function weathered(base: string, seed = 1, streaks = 0.08) {
  return cached(`w-${base}-${seed}-${streaks}`, () => {
    const [c, ctx] = canvas(256)
    ctx.fillStyle = base
    ctx.fillRect(0, 0, 256, 256)
    const r = rng(seed)
    for (let i = 0; i < 70; i++) {
      const x = r() * 256
      const g = ctx.createLinearGradient(0, 0, 0, 256)
      const a = r() * streaks
      g.addColorStop(0, `rgba(0,0,0,${a})`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.fillRect(x, 0, 1 + r() * 3, 256)
    }
    noise(ctx, 256, 0.06, seed)
    return finish(c, true)
  })
}

/** Concrete / render: soft mottling. */
export function concrete(base: string, seed = 3) {
  return cached(`conc-${base}-${seed}`, () => {
    const [c, ctx] = canvas(256)
    ctx.fillStyle = base
    ctx.fillRect(0, 0, 256, 256)
    const r = rng(seed)
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${r() * 0.035})`
      const s = 6 + r() * 40
      ctx.beginPath()
      ctx.arc(r() * 256, r() * 256, s, 0, Math.PI * 2)
      ctx.fill()
    }
    noise(ctx, 256, 0.05, seed)
    return finish(c, true)
  })
}

/**
 * Façade with a grid of windows. Returns colour + emissive maps; the emissive
 * map lights a random subset of windows (visible at dusk).
 */
export function facade(opts: { wall: string; glass?: string; cols: number; rows: number; seed?: number; band?: boolean }) {
  const key = `fac-${JSON.stringify(opts)}`
  const map = cached(key, () => {
    const [c, ctx] = canvas(512)
    ctx.fillStyle = opts.wall
    ctx.fillRect(0, 0, 512, 512)
    noise(ctx, 512, 0.04, opts.seed ?? 5)
    const cw = 512 / opts.cols
    const rh = 512 / opts.rows
    for (let y = 0; y < opts.rows; y++)
      for (let x = 0; x < opts.cols; x++) {
        ctx.fillStyle = opts.glass ?? '#2c3a3c'
        if (opts.band) ctx.fillRect(x * cw, y * rh + rh * 0.3, cw, rh * 0.38)
        else ctx.fillRect(x * cw + cw * 0.18, y * rh + rh * 0.22, cw * 0.64, rh * 0.5)
        ctx.fillStyle = 'rgba(255,255,255,0.12)'
        if (!opts.band) ctx.fillRect(x * cw + cw * 0.18, y * rh + rh * 0.22, cw * 0.64, rh * 0.08)
      }
    return finish(c, true)
  })
  const emissive = cached(`${key}-e`, () => {
    const [c, ctx] = canvas(512)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, 512, 512)
    const r = rng((opts.seed ?? 5) + 11)
    const cw = 512 / opts.cols
    const rh = 512 / opts.rows
    for (let y = 0; y < opts.rows; y++)
      for (let x = 0; x < opts.cols; x++) {
        if (r() > (opts.band ? 0.25 : 0.55)) continue
        ctx.fillStyle = `rgba(255,${200 + r() * 40},${140 + r() * 50},${0.6 + r() * 0.4})`
        if (opts.band) ctx.fillRect(x * cw, y * rh + rh * 0.3, cw, rh * 0.38)
        else ctx.fillRect(x * cw + cw * 0.18, y * rh + rh * 0.22, cw * 0.64, rh * 0.5)
      }
    return finish(c, true)
  })
  return { map, emissive }
}

/** Horizontal sandwich-panel cladding (processing plant). */
export function panels(base: string) {
  return cached(`pan-${base}`, () => {
    const [c, ctx] = canvas(256)
    ctx.fillStyle = base
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = 'rgba(0,0,0,0.12)'
    for (let y = 0; y < 256; y += 32) ctx.fillRect(0, y, 256, 2)
    noise(ctx, 256, 0.03, 9)
    return finish(c, true)
  })
}

/** Ground: dry Moroccan soil with sparse grass. */
export function soil() {
  return cached('soil', () => {
    const [c, ctx] = canvas(512)
    ctx.fillStyle = '#9c8a66'
    ctx.fillRect(0, 0, 512, 512)
    const r = rng(21)
    for (let i = 0; i < 900; i++) {
      const g = r()
      ctx.fillStyle = g > 0.55 ? `rgba(92,110,58,${0.15 + r() * 0.25})` : `rgba(${120 + r() * 60},${100 + r() * 40},${70 + r() * 30},${0.2 + r() * 0.2})`
      ctx.beginPath()
      ctx.arc(r() * 512, r() * 512, 2 + r() * 14, 0, Math.PI * 2)
      ctx.fill()
    }
    noise(ctx, 512, 0.1, 22)
    return finish(c, true)
  })
}

export function grass() {
  return cached('grass', () => {
    const [c, ctx] = canvas(256)
    ctx.fillStyle = '#5d7440'
    ctx.fillRect(0, 0, 256, 256)
    const r = rng(31)
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = `rgba(${60 + r() * 60},${90 + r() * 50},${30 + r() * 30},0.5)`
      ctx.fillRect(r() * 256, r() * 256, 1 + r() * 2, 2 + r() * 5)
    }
    noise(ctx, 256, 0.08, 32)
    return finish(c, true)
  })
}

/** Ploughed / cultivated field rows. */
export function fieldRows(base: string) {
  return cached(`rows-${base}`, () => {
    const [c, ctx] = canvas(256)
    ctx.fillStyle = base
    ctx.fillRect(0, 0, 256, 256)
    for (let y = 0; y < 256; y += 8) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      ctx.fillRect(0, y, 256, 3)
    }
    noise(ctx, 256, 0.08, 41)
    return finish(c, true)
  })
}

export function asphalt() {
  return cached('asphalt', () => {
    const [c, ctx] = canvas(256)
    ctx.fillStyle = '#3d3f3e'
    ctx.fillRect(0, 0, 256, 256)
    noise(ctx, 256, 0.14, 51)
    ctx.fillStyle = 'rgba(240,235,220,0.75)'
    for (let x = 0; x < 256; x += 64) ctx.fillRect(x, 126, 34, 4)
    return finish(c, true)
  })
}

/** Clone a cached texture with its own repeat (per-object UV scale). */
export function tiled<T extends THREE.Texture>(t: T, x: number, y: number): T {
  const c = t.clone() as T
  c.repeat.set(x, y)
  c.needsUpdate = true
  return c
}
