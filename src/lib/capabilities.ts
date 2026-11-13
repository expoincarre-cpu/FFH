/**
 * Device capability detection for the homepage journey.
 *
 *  - `high`   desktop, fine pointer, capable GPU → real-time WebGL with the full post-processing chain
 *  - `medium` modest desktops / laptops          → real-time WebGL, lighter post-processing
 *  - `low`    phones, tablets (coarse pointer) and desktops that miss the frame budget
 *             → the pre-rendered, scroll-scrubbed journey ("film"): desktop image quality at almost no GPU cost
 *  - `static` no WebGL / reduced motion / save-data / software renderer → 2.5D illustrated fallback
 */
export type Tier = 'high' | 'medium' | 'low' | 'static'

export type PostSettings = {
  /** Ambient occlusion: full resolution, half resolution or off. */
  ao: 'full' | 'half' | false
  bloom: boolean
  dof: boolean
  /** MSAA samples on the HDR scene buffer (0 = SMAA only). */
  msaa: number
}

export type TierSettings = {
  dpr: [number, number]
  /** Upper bound on rendered pixels; DPR is lowered to respect it. */
  pixels: number
  density: number
  particles: number
  /** Shadow map size; 0 disables real-time shadows. */
  shadows: number
  /** Environment (PMREM) cube size. */
  env: number
  /** Texture resolution and whether normal/roughness maps are generated. */
  textures: { size: number; maps: boolean; anisotropy: number }
  post: PostSettings | null
}

export type WebGLTier = 'high' | 'medium'

export const tierSettings: Record<WebGLTier | 'baked', TierSettings> = {
  high: {
    dpr: [1, 1.5],
    pixels: 4.2e6,
    density: 1,
    particles: 1800,
    shadows: 4096,
    env: 256,
    textures: { size: 512, maps: true, anisotropy: 8 },
    post: { ao: 'full', bloom: true, dof: true, msaa: 4 },
  },
  medium: {
    dpr: [1, 1.25],
    pixels: 2.4e6,
    density: 0.6,
    particles: 900,
    shadows: 2048,
    env: 128,
    textures: { size: 512, maps: true, anisotropy: 4 },
    post: { ao: 'half', bloom: true, dof: false, msaa: 0 },
  },
  /** Prototype of the baked mobile WebGL path (?mobile=baked): no real-time shadows, AO or post-processing. */
  baked: {
    dpr: [1, 1.5],
    pixels: 1.6e6,
    density: 0.3,
    particles: 0,
    shadows: 0,
    env: 64,
    textures: { size: 256, maps: false, anisotropy: 2 },
    post: null,
  },
}

function probeWebGL(): { any: boolean; full: boolean; renderer: string } {
  try {
    const canvas = document.createElement('canvas')
    const gl2 = canvas.getContext('webgl2') as WebGL2RenderingContext | null
    const gl = gl2 ?? (canvas.getContext('webgl') as WebGLRenderingContext | null)
    if (!gl) return { any: false, full: false, renderer: '' }
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ''
    // The real-time tiers need WebGL 2 with float render targets (HDR buffers, MSAA, AO).
    const full = !!gl2 && (!!gl2.getExtension('EXT_color_buffer_float') || !!gl2.getExtension('EXT_color_buffer_half_float'))
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return { any: true, full, renderer }
  } catch {
    return { any: false, full: false, renderer: '' }
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

  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  if (nav.connection?.saveData) return 'static'

  const { any, full, renderer } = probeWebGL()
  // No WebGL, or a software rasteriser: the illustrated fallback.
  if (!any || /swiftshader|llvmpipe|software|basic render/i.test(renderer)) return 'static'

  const coarse = window.matchMedia('(pointer: coarse)').matches
  const width = window.innerWidth
  // Phones and tablets, and desktops without WebGL 2 float targets, get the pre-rendered journey.
  if (coarse || width < 900 || !full) return 'low'

  const cores = nav.hardwareConcurrency ?? 4
  const memory = nav.deviceMemory ?? 8
  const integrated = /intel|uhd|iris|mali|adreno|powervr/i.test(renderer) && !/arc/i.test(renderer)
  if (cores <= 4 || memory <= 4 || integrated || width < 1100) return 'medium'
  return 'high'
}
