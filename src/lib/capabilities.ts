/**
 * Device capability detection for the WebGL experience.
 *
 *  - `high`   desktop, capable GPU          → full scene, DPR up to 2
 *  - `medium` tablets / modest desktops     → reduced instance counts, DPR 1.25
 *  - `low`    phones with WebGL             → simplified scene, DPR 1, fewer particles
 *  - `static` no WebGL / reduced motion     → 2.5D illustrated fallback, no canvas
 */
export type Tier = 'high' | 'medium' | 'low' | 'static'

export type TierSettings = {
  dpr: [number, number]
  density: number
  particles: number
  antialias: boolean
  /** Shadow map size; 0 disables real-time shadows. */
  shadows: number
}

export const tierSettings: Record<Exclude<Tier, 'static'>, TierSettings> = {
  high: { dpr: [1, 2], density: 1, particles: 2400, antialias: true, shadows: 2048 },
  medium: { dpr: [1, 1.25], density: 0.6, particles: 1200, antialias: true, shadows: 1024 },
  low: { dpr: [1, 1], density: 0.35, particles: 500, antialias: false, shadows: 0 },
}

function hasWebGL(): { ok: boolean; renderer: string } {
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return { ok: false, renderer: '' }
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ''
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return { ok: true, renderer }
  } catch {
    return { ok: false, renderer: '' }
  }
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function detectTier(): Tier {
  if (typeof window === 'undefined') return 'static'
  const forced = new URLSearchParams(window.location.search).get('tier')
  if (forced === 'high' || forced === 'medium' || forced === 'low' || forced === 'static') return forced
  if (prefersReducedMotion()) return 'static'

  const { ok, renderer } = hasWebGL()
  if (!ok) return 'static'
  // Software rasterisers make WebGL unusable — prefer the illustrated fallback.
  if (/swiftshader|llvmpipe|software/i.test(renderer)) return 'static'

  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  if (nav.connection?.saveData) return 'static'
  const cores = nav.hardwareConcurrency ?? 4
  const memory = nav.deviceMemory ?? 4
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const width = window.innerWidth

  if (coarse && width < 768) return cores >= 6 && memory >= 4 ? 'low' : 'static'
  if (coarse || width < 1100 || cores <= 4 || memory <= 4) return 'medium'
  return 'high'
}
