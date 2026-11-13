import * as THREE from 'three'
import { rng } from './shared'

/**
 * Procedural, tileable PBR texture sets — colour, tangent-space normal and
 * roughness/metalness — generated at start-up, so no image files are shipped.
 * Every set is built from a few cached multi-octave noise fields and then
 * "weathered": rain streaks, sheet-to-sheet tone shifts, splash-zone dirt,
 * stains, cracks. Everything is cached by key.
 */

export type PBR = {
  map: THREE.Texture
  normalMap: THREE.Texture | null
  /** G = roughness, B = metalness (glTF convention). */
  roughnessMap: THREE.Texture | null
}

/** Global detail switch: the baked mobile path halves resolution and drops normal/roughness maps. */
export const textureDetail = { size: 512, maps: true, anisotropy: 8 }

type Field = Float32Array
const textures = new Map<string, unknown>()
const fields = new Map<string, Field>()

function cached<T>(key: string, make: () => T): T {
  const k = `${key}@${textureDetail.size}${textureDetail.maps ? 'm' : ''}`
  let t = textures.get(k) as T | undefined
  if (!t) {
    t = make()
    textures.set(k, t)
  }
  return t
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)

/** Tileable fractal value noise, values in 0…1. */
function field(size: number, cells: number, octaves: number, seed: number, gain = 0.5): Field {
  const key = `${size}-${cells}-${octaves}-${seed}-${gain}`
  let out = fields.get(key)
  if (out) return out
  out = new Float32Array(size * size)
  const r = rng(seed * 7919 + 13)
  let amp = 1
  let total = 0
  for (let o = 0; o < octaves; o++) {
    const c = Math.min(size, cells << o)
    const grid = new Float32Array(c * c)
    for (let i = 0; i < grid.length; i++) grid[i] = r()
    const i0 = new Int32Array(size)
    const i1 = new Int32Array(size)
    const tt = new Float32Array(size)
    for (let x = 0; x < size; x++) {
      const f = (x / size) * c
      const i = Math.floor(f)
      const t = f - i
      i0[x] = i % c
      i1[x] = (i + 1) % c
      tt[x] = t * t * (3 - 2 * t)
    }
    for (let y = 0; y < size; y++) {
      const r0 = i0[y] * c
      const r1 = i1[y] * c
      const ty = tt[y]
      const row = y * size
      for (let x = 0; x < size; x++) {
        const a = grid[r0 + i0[x]]
        const b = grid[r0 + i1[x]]
        const d = grid[r1 + i0[x]]
        const e = grid[r1 + i1[x]]
        const tx = tt[x]
        out[row + x] += amp * (a + (b - a) * tx + (d + (e - d) * tx - (a + (b - a) * tx)) * ty)
      }
    }
    total += amp
    amp *= gain
  }
  for (let i = 0; i < out.length; i++) out[i] /= total
  fields.set(key, out)
  return out
}

function srgb(hex: string): [number, number, number] {
  const c = new THREE.Color(hex)
  const o = { r: 0, g: 0, b: 0 }
  c.getRGB(o, THREE.SRGBColorSpace)
  return [o.r * 255, o.g * 255, o.b * 255]
}

function finish(data: Uint8Array | Uint8ClampedArray, size: number, color: boolean, height = size) {
  const t = new THREE.DataTexture(data, size, height, THREE.RGBAFormat)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.magFilter = THREE.LinearFilter
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.generateMipmaps = true
  t.anisotropy = textureDetail.anisotropy
  if (color) t.colorSpace = THREE.SRGBColorSpace
  t.needsUpdate = true
  return t
}

/** Tangent-space normal map from a height field (rows run bottom → top, like UVs). */
function normalFrom(h: Field, size: number, strength: number, height = size) {
  const data = new Uint8Array(size * height * 4)
  for (let y = 0; y < height; y++) {
    const yu = ((y + 1) % height) * size
    const yd = ((y - 1 + height) % height) * size
    for (let x = 0; x < size; x++) {
      const xl = (x - 1 + size) % size
      const xr = (x + 1) % size
      const dx = (h[y * size + xr] - h[y * size + xl]) * strength
      const dy = (h[yu + x] - h[yd + x]) * strength
      const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1)
      const i = (y * size + x) * 4
      data[i] = (-dx * inv * 0.5 + 0.5) * 255
      data[i + 1] = (-dy * inv * 0.5 + 0.5) * 255
      data[i + 2] = (inv * 0.5 + 0.5) * 255
      data[i + 3] = 255
    }
  }
  return finish(data, size, false, height)
}

/** Builds a full set from per-texel callbacks writing colour (0–255), height, roughness and metalness. */
function build(
  key: string,
  size: number,
  normalStrength: number,
  texel: (x: number, y: number, i: number, out: Float32Array) => void,
): PBR {
  return cached(key, () => {
    const color = new Uint8ClampedArray(size * size * 4)
    const orm = new Uint8Array(size * size * 4)
    const h = new Float32Array(size * size)
    // out = [r, g, b, height, roughness, metalness]
    const out = new Float32Array(6)
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const i = y * size + x
        out[3] = 0
        out[4] = 0.8
        out[5] = 0
        texel(x, y, i, out)
        const j = i * 4
        color[j] = out[0]
        color[j + 1] = out[1]
        color[j + 2] = out[2]
        color[j + 3] = 255
        h[i] = out[3]
        orm[j] = 255
        orm[j + 1] = clamp01(out[4]) * 255
        orm[j + 2] = clamp01(out[5]) * 255
        orm[j + 3] = 255
      }
    return {
      map: finish(color, size, true),
      normalMap: textureDetail.maps ? normalFrom(h, size, normalStrength) : null,
      roughnessMap: textureDetail.maps ? finish(orm, size, false) : null,
    }
  })
}

const S = () => textureDetail.size

/* ------------------------------------------------------------ mineral */

/** Cast concrete / yard slabs: mottling, pores, stains, optional saw-cut joints. */
export function concreteSet(base: string, seed = 3, joints = 0): PBR {
  const size = S()
  const [r, g, b] = srgb(base)
  return build(`conc-${base}-${seed}-${joints}`, size, 2.2, (x, y, i, o) => {
    const big = field(size, 3, 4, seed)[i]
    const mid = field(size, 14, 4, seed + 1)[i]
    const fine = field(size, 120, 2, seed + 2)[i]
    const stain = smooth(0.56, 0.74, field(size, 6, 4, seed + 3)[i])
    let v = 0.8 + 0.24 * big + 0.14 * (mid - 0.5) + 0.1 * (fine - 0.5) - stain * 0.13
    let h = fine * 0.9 + mid * 0.5
    if (fine > 0.8) {
      v -= 0.1
      h -= 0.8
    }
    if (joints) {
      const p = size / joints
      const jx = Math.min(x % p, p - (x % p))
      const jy = Math.min(y % p, p - (y % p))
      const j = 1 - smooth(0.6, 2.4, Math.min(jx, jy))
      v -= j * 0.3
      h -= j * 1.6
    }
    o[0] = r * v
    o[1] = g * v * (1 - stain * 0.03)
    o[2] = b * v * (1 - stain * 0.1)
    o[3] = h
    o[4] = 0.8 + 0.16 * fine - stain * 0.1
  })
}

/**
 * Painted render / plaster wall. Meant to span the full wall height (repeat.y = 1):
 * rain streaks run down from the top, and a dirty splash zone sits at the bottom.
 */
export function wallSet(base: string, seed = 5, opts: { streaks?: number; dirt?: number; joints?: number } = {}): PBR {
  const size = S()
  const { streaks = 0.5, dirt = 0.5, joints = 0 } = opts
  const [r, g, b] = srgb(base)
  const rnd = rng(seed)
  const columns = Array.from({ length: 26 }, () => ({ x: rnd() * size, w: 1.5 + rnd() * 7, a: rnd() * rnd(), len: 0.25 + rnd() * 0.75 }))
  const streak = new Float32Array(size)
  return build(`wall-${base}-${seed}-${streaks}-${dirt}-${joints}`, size, 1.4, (x, y, i, o) => {
    if (x === 0 && y === 0) {
      // Column profile of the streaks, wrapped horizontally.
      for (let k = 0; k < size; k++) {
        let s = 0
        for (const c of columns) {
          let d = Math.abs(k - c.x)
          d = Math.min(d, size - d)
          s += c.a * Math.exp(-(d * d) / (c.w * c.w))
        }
        streak[k] = s
      }
    }
    const v01 = y / size
    const big = field(size, 3, 3, seed)[i]
    const mid = field(size, 18, 3, seed + 1)[i]
    const fine = field(size, 128, 2, seed + 2)[i]
    const wobble = field(size, 24, 2, seed + 4)[i]
    // Streaks fade out on the way down.
    const run = streak[x] * smooth(0.0, 0.9, v01 + wobble * 0.5 - 0.1) * streaks
    const splash = (1 - smooth(0.0, 0.07 + wobble * 0.07, v01)) * dirt
    let v = 0.9 + 0.16 * big + 0.06 * (mid - 0.5) + 0.05 * (fine - 0.5) - run * 0.34 - splash * 0.3
    let h = fine + mid * 0.4
    if (joints) {
      const p = size / joints
      const jx = Math.min(x % p, p - (x % p))
      const j = 1 - smooth(0.5, 2, jx)
      v -= j * 0.22
      h -= j * 2
    }
    o[0] = r * v + splash * 26
    o[1] = g * v + splash * 18
    o[2] = b * v * (1 - run * 0.08) + splash * 6
    o[3] = h
    o[4] = 0.84 + 0.1 * fine
  })
}

/** Asphalt: aggregate, repair patches, cracks and oil stains. */
export function asphaltSet(seed = 51): PBR {
  const size = S()
  const rnd = rng(seed)
  const cracks = new Float32Array(size * size)
  for (let c = 0; c < 9; c++) {
    let x = rnd() * size
    let y = rnd() * size
    let a = rnd() * Math.PI * 2
    for (let s = 0; s < size * 0.7; s++) {
      a += (rnd() - 0.5) * 0.7
      x = (x + Math.cos(a) + size) % size
      y = (y + Math.sin(a) + size) % size
      cracks[(y | 0) * size + (x | 0)] = 1
      cracks[(y | 0) * size + ((x + 1) | 0) % size] = 0.6
    }
  }
  return build(`asph-${seed}`, size, 2.6, (x, y, i, o) => {
    const big = field(size, 3, 3, seed)[i]
    const mid = field(size, 9, 4, seed + 1)[i]
    const fine = field(size, 200, 1, seed + 2)[i]
    const grit = field(size, 96, 2, seed + 3)[i]
    const oil = smooth(0.7, 0.82, field(size, 7, 3, seed + 4)[i])
    const patch = smooth(0.6, 0.63, field(size, 2, 2, seed + 5)[i])
    let v = 62 + 26 * (big - 0.5) + 14 * (mid - 0.5) + 30 * (grit - 0.5) + (fine > 0.86 ? 34 : 0)
    v = v * (1 - patch * 0.22) * (1 - oil * 0.35) * (1 - cracks[i] * 0.6)
    o[0] = v * 1.01
    o[1] = v
    o[2] = v * 0.97
    o[3] = grit * 1.2 + (fine > 0.86 ? 0.7 : 0) - cracks[i] * 2.5
    o[4] = 0.9 - oil * 0.45 + grit * 0.08
  })
}

/** Dry Moroccan earth with pebbles and sparse dry growth. */
export function soilSet(seed = 21): PBR {
  const size = S()
  const a = srgb('#9c8762')
  const b = srgb('#7d6a4a')
  const c = srgb('#ad9a76')
  const gr = srgb('#7d7f4a')
  return build(`soil-${seed}`, size, 2.4, (x, y, i, o) => {
    const big = field(size, 2, 4, seed)[i]
    const mid = field(size, 10, 4, seed + 1)[i]
    const fine = field(size, 140, 2, seed + 2)[i]
    const veg = smooth(0.6, 0.78, field(size, 16, 3, seed + 3)[i]) * smooth(0.45, 0.6, field(size, 110, 1, seed + 4)[i])
    const k1 = smooth(0.3, 0.7, big)
    const k2 = smooth(0.45, 0.75, mid)
    const pebble = fine > 0.84 ? 1 : 0
    const sh = 0.86 + 0.26 * (fine - 0.5) + pebble * 0.16
    for (let n = 0; n < 3; n++) {
      let v = a[n] + (b[n] - a[n]) * k1
      v += (c[n] - v) * k2 * 0.55
      v += (gr[n] - v) * veg * 0.75
      o[n] = v * sh
    }
    o[3] = fine * 1.3 + mid * 0.8 + pebble * 0.9
    o[4] = 0.95
  })
}

/** Rough pasture: green to straw, with blade-scale speckle. */
export function grassSet(seed = 31, lush = 0.5): PBR {
  const size = S()
  const a = srgb('#6b7440')
  const b = srgb('#938a55')
  const c = srgb('#55602f')
  const d = srgb('#a2906a')
  return build(`grass-${seed}-${lush}`, size, 2.2, (x, y, i, o) => {
    const big = field(size, 3, 4, seed)[i]
    const mid = field(size, 14, 3, seed + 1)[i]
    const fine = field(size, 160, 2, seed + 2)[i]
    const blade = field(size, 256, 1, seed + 3)[i]
    const dry = smooth(0.35 + lush * 0.3, 0.8 + lush * 0.2, big * 0.6 + mid * 0.4)
    const bare = smooth(0.74, 0.86, mid)
    const sh = 0.72 + 0.4 * (fine - 0.5) + 0.36 * blade
    for (let n = 0; n < 3; n++) {
      let v = a[n] + (b[n] - a[n]) * dry
      v += (c[n] - v) * smooth(0.5, 0.9, fine) * 0.5
      v += (d[n] - v) * bare * 0.6
      o[n] = v * sh
    }
    o[3] = blade * 1.4 + fine
    o[4] = 0.92
  })
}

/** Gravel / compacted hardcore yard. */
export function gravelSet(base = '#a39a84', seed = 61): PBR {
  const size = S()
  const [r, g, b] = srgb(base)
  return build(`gravel-${base}-${seed}`, size, 3, (x, y, i, o) => {
    const big = field(size, 3, 3, seed)[i]
    const stones = field(size, 110, 2, seed + 1)[i]
    const fine = field(size, 256, 1, seed + 2)[i]
    const track = smooth(0.55, 0.7, field(size, 4, 2, seed + 3)[i])
    const v = (0.74 + 0.2 * big + 0.5 * (stones - 0.5) + 0.2 * (fine - 0.5)) * (1 - track * 0.12)
    o[0] = r * v
    o[1] = g * v
    o[2] = b * v
    o[3] = stones * 1.6 + fine * 0.5
    o[4] = 0.95
  })
}

/** Wood-shaving litter on a poultry-house floor. */
export function litterSet(seed = 71): PBR {
  const size = S()
  const [r, g, b] = srgb('#c9ac74')
  return build(`litter-${seed}`, size, 2.4, (x, y, i, o) => {
    const big = field(size, 4, 3, seed)[i]
    const chips = field(size, 150, 2, seed + 1)[i]
    const fine = field(size, 256, 1, seed + 2)[i]
    const damp = smooth(0.6, 0.8, field(size, 8, 3, seed + 3)[i])
    const v = (0.72 + 0.2 * big + 0.5 * (chips - 0.5) + 0.2 * (fine - 0.5)) * (1 - damp * 0.3)
    o[0] = r * v
    o[1] = g * v
    o[2] = b * v * (1 - damp * 0.2)
    o[3] = chips * 1.5
    o[4] = 0.95
  })
}


/** Cultivated field: crop rows over tilled earth. `crop` 0 = bare furrows, 1 = full green rows. */
export function fieldSet(tone: string, crop = 0.6, seed = 41): PBR {
  const size = S()
  const [r, g, b] = srgb(tone)
  const e = srgb('#8c7654')
  return build(`field-${tone}-${crop}-${seed}`, size, 3, (x, y, i, o) => {
    const rowsN = 28
    const ph = Math.sin((y / size) * rowsN * Math.PI * 2)
    const big = field(size, 3, 3, seed)[i]
    const fine = field(size, 150, 2, seed + 1)[i]
    const gap = smooth(0.62, 0.8, field(size, 20, 3, seed + 2)[i])
    const plant = smooth(0.1 - crop * 0.5, 0.75 - crop * 0.5, ph + (fine - 0.5) * 0.9) * (1 - gap * 0.8)
    const sh = 0.78 + 0.2 * big + 0.34 * (fine - 0.5) - (1 - plant) * smooth(0.2, -1, ph) * 0.16
    o[0] = (e[0] + (r - e[0]) * plant) * sh
    o[1] = (e[1] + (g - e[1]) * plant) * sh
    o[2] = (e[2] + (b - e[2]) * plant) * sh
    o[3] = ph * 0.9 + plant * fine * 1.4 + fine * 0.4
    o[4] = 0.94
  })
}

/* -------------------------------------------------------------- metal */

/**
 * Profiled (corrugated / box-rib) painted steel sheeting. Spans the full wall
 * height: lap seams, sheet-to-sheet tone shifts, fading, rain streaks.
 */
export function corrugatedSet(
  base: string,
  opts: { ribs?: number; seed?: number; sheets?: number; wear?: number; metal?: number; box?: boolean } = {},
): PBR {
  const size = S()
  const { ribs = 24, seed = 7, sheets = 3, wear = 0.5, metal = 0.1, box = false } = opts
  const [r, g, b] = srgb(base)
  const rnd = rng(seed)
  const perSheet = 6
  const tones = Array.from({ length: 64 }, () => 1 + (rnd() - 0.5) * 0.09 * (0.5 + wear))
  const cols = Array.from({ length: 30 }, () => ({ x: rnd() * size, w: 1 + rnd() * 5, a: rnd() * rnd() }))
  const streak = new Float32Array(size)
  for (let k = 0; k < size; k++) {
    let s = 0
    for (const c of cols) {
      let d = Math.abs(k - c.x)
      d = Math.min(d, size - d)
      s += c.a * Math.exp(-(d * d) / (c.w * c.w))
    }
    streak[k] = s
  }
  return build(`corr-${base}-${ribs}-${seed}-${sheets}-${wear}-${metal}-${box}`, size, box ? 5 : 7, (x, y, i, o) => {
    const v01 = y / size
    const phase = (x / size) * ribs
    const s = Math.sin(phase * Math.PI * 2)
    const profile = box ? smooth(0.55, 0.8, Math.abs(s)) * Math.sign(s) * 0.5 : Math.sign(s) * Math.pow(Math.abs(s), 0.75)
    const sheetX = Math.floor(phase / perSheet)
    const sheetY = Math.floor(v01 * sheets)
    const tone = tones[(sheetX * 7 + sheetY * 13) % tones.length]
    const lapY = v01 * sheets - sheetY
    const lap = sheets > 1 ? 1 - smooth(0.0, 0.022, Math.min(lapY, 1 - lapY)) : 0
    const big = field(size, 2, 3, seed)[i]
    const mid = field(size, 20, 3, seed + 1)[i]
    const fine = field(size, 128, 2, seed + 2)[i]
    const run = streak[x] * smooth(0.0, 0.8, (lapY + v01) * 0.5 + mid * 0.3) * wear
    const splash = (1 - smooth(0.0, 0.05 + mid * 0.05, v01)) * wear
    // Ribs catch more dust in the valleys.
    const valley = smooth(0.2, -0.9, profile) * 0.06 * wear
    const v = tone * (0.93 + 0.12 * big + 0.05 * (fine - 0.5)) - run * 0.3 - lap * 0.16 - splash * 0.28 - valley
    o[0] = r * v + splash * 30
    o[1] = g * v + splash * 22
    o[2] = b * v + splash * 10
    o[3] = profile * 2.2 - lap * 0.8 + fine * 0.15
    o[4] = 0.46 + 0.14 * mid + run * 0.3 + splash * 0.3
    o[5] = metal * (1 - splash) * (1 - run * 0.6)
  })
}

/**
 * Galvanised sheet as bolted silo panels: a patchwork of sheets with different
 * brightness, zinc spangle, bolt lines and drip streaks. Spans the full height.
 */
export function galvanizedSet(opts: { seed?: number; cols?: number; rows?: number; wear?: number } = {}): PBR {
  const size = S()
  const { seed = 17, cols = 6, rows = 10, wear = 0.5 } = opts
  const rnd = rng(seed)
  const tones = Array.from({ length: 128 }, () => 1 + (rnd() - 0.5) * 0.3)
  const gloss = Array.from({ length: 128 }, () => rnd())
  return build(`galv-${seed}-${cols}-${rows}-${wear}`, size, 3, (x, y, i, o) => {
    const v01 = y / size
    const row = Math.floor(v01 * rows)
    const fy = v01 * rows - row
    const u = (x / size) * cols + (row % 2) * 0.5
    const col = Math.floor(u)
    const fx = u - col
    const id = (col * 5 + row * 11) % tones.length
    const seamX = 1 - smooth(0.0, 0.03, Math.min(fx, 1 - fx))
    const seamY = 1 - smooth(0.0, 0.05, Math.min(fy, 1 - fy))
    const seam = Math.max(seamX, seamY)
    // Bolt heads along the seams.
    const bolt =
      (seamY > 0.3 && Math.abs(((fx * 14) % 1) - 0.5) < 0.12 ? 1 : 0) + (seamX > 0.3 && Math.abs(((fy * 6) % 1) - 0.5) < 0.12 ? 1 : 0)
    const spangle = field(size, 64, 2, seed + 1)[i]
    const big = field(size, 3, 3, seed + 2)[i]
    const fine = field(size, 160, 1, seed + 3)[i]
    const drip = smooth(0.62, 0.9, field(size, 90, 1, seed + 4)[(x + ((y * 0.04) | 0) * size) % (size * size)]) * (1 - fy) * wear
    const v = tones[id] * (0.86 + 0.2 * (spangle - 0.5) + 0.14 * big) - seam * 0.12 - drip * 0.2 + bolt * 0.08
    o[0] = 168 * v
    o[1] = 174 * v
    o[2] = 178 * v * (1 - drip * 0.15)
    o[3] = seam * 0.8 + bolt * 1.5 + fine * 0.2
    o[4] = 0.34 + gloss[id] * 0.22 + drip * 0.3 + (spangle - 0.5) * 0.12
    o[5] = 0.9 - drip * 0.5
  })
}

/** Insulated sandwich panels (processing plant, cold store, clean rooms). */
export function panelSet(base: string, opts: { seed?: number; rows?: number; cols?: number; wear?: number; metal?: number } = {}): PBR {
  const size = S()
  const { seed = 9, rows = 0, cols = 8, wear = 0.4, metal = 0.05 } = opts
  const [r, g, b] = srgb(base)
  const rnd = rng(seed)
  const tones = Array.from({ length: 64 }, () => 1 + (rnd() - 0.5) * 0.04)
  return build(`pan-${base}-${seed}-${rows}-${cols}-${wear}-${metal}`, size, 4, (x, y, i, o) => {
    const v01 = y / size
    const u = (x / size) * cols
    const fx = u - Math.floor(u)
    const jx = cols ? 1 - smooth(0.0, 0.02, Math.min(fx, 1 - fx)) : 0
    const w = v01 * rows
    const fy = w - Math.floor(w)
    const jy = rows ? 1 - smooth(0.0, 0.02, Math.min(fy, 1 - fy)) : 0
    const joint = Math.max(jx, jy)
    // Micro-ribs across each panel.
    const micro = Math.sin(fx * Math.PI * 2 * 9) * 0.06
    const big = field(size, 3, 3, seed)[i]
    const mid = field(size, 22, 3, seed + 1)[i]
    const fine = field(size, 128, 2, seed + 2)[i]
    const run = smooth(0.55, 0.8, field(size, 100, 1, seed + 3)[x]) * smooth(0.1, 0.95, v01 + mid * 0.3) * wear
    const splash = (1 - smooth(0.0, 0.05 + mid * 0.04, v01)) * wear
    const v = tones[(Math.floor(u) * 3 + Math.floor(w) * 5) % 64] * (0.95 + 0.08 * big + 0.03 * (fine - 0.5)) - joint * 0.3 - run * 0.14 - splash * 0.22
    o[0] = r * v + splash * 20
    o[1] = g * v + splash * 14
    o[2] = b * v + splash * 6
    o[3] = micro - joint * 1.6
    o[4] = 0.38 + 0.12 * mid + run * 0.3 + splash * 0.35
    o[5] = metal
  })
}

/** Brushed stainless steel (cabinets, trolleys, process line). */
export function stainlessSet(seed = 81): PBR {
  const size = Math.min(256, S())
  return build(`inox-${seed}`, size, 0.9, (x, y, i, o) => {
    const brush = field(size, 128, 1, seed)[(y * size + ((x * 0.06) | 0)) % (size * size)]
    const big = field(size, 4, 3, seed + 1)[i]
    const v = 0.9 + 0.12 * (brush - 0.5) + 0.06 * big
    o[0] = 205 * v
    o[1] = 207 * v
    o[2] = 208 * v
    o[3] = brush * 0.5
    o[4] = 0.26 + 0.16 * brush + 0.08 * big
    o[5] = 1
  })
}

/* ------------------------------------------------------------ façades */

type FacadeOpts = { wall: string; glass?: string; cols: number; rows: number; seed?: number; band?: boolean; lit?: number }

function canvas(w: number, h = w) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d', { willReadFrequently: true })!] as const
}

/** Reads a canvas into bottom-up rows, matching the UV orientation of DataTexture. */
function read(ctx: CanvasRenderingContext2D, w: number, h = w) {
  const src = ctx.getImageData(0, 0, w, h).data
  const out = new Uint8ClampedArray(src.length)
  const row = w * 4
  for (let y = 0; y < h; y++) out.set(src.subarray((h - 1 - y) * row, (h - y) * row), y * row)
  return out
}

/**
 * Façade with recessed windows: colour (frames, blinds, sill drips), normal
 * (the recess reads in raking light), roughness/metalness (glass reflects the
 * sky) and an emissive map lighting a random subset of rooms at dusk.
 */
export function facade(opts: FacadeOpts) {
  return cached(`fac-${JSON.stringify(opts)}`, () => {
    const size = S()
    const seed = opts.seed ?? 5
    const r = rng(seed)
    const [col, c] = canvas(size)
    const [hgt, hc] = canvas(size)
    const [orm, oc] = canvas(size)
    const [emi, ec] = canvas(size)
    c.fillStyle = opts.wall
    c.fillRect(0, 0, size, size)
    hc.fillStyle = 'rgb(170,170,170)'
    hc.fillRect(0, 0, size, size)
    oc.fillStyle = 'rgb(255,220,0)'
    oc.fillRect(0, 0, size, size)
    ec.fillStyle = '#000'
    ec.fillRect(0, 0, size, size)
    const cw = size / opts.cols
    const rh = size / opts.rows
    const glass = opts.glass ?? '#243236'
    const lit = opts.lit ?? (opts.band ? 0.7 : 0.45)
    for (let y = 0; y < opts.rows; y++)
      for (let x = 0; x < opts.cols; x++) {
        const wx = opts.band ? x * cw : x * cw + cw * 0.2
        const wy = y * rh + rh * (opts.band ? 0.3 : 0.24)
        const ww = opts.band ? cw : cw * 0.6
        const wh = rh * (opts.band ? 0.38 : 0.48)
        // Sill drip stains below the opening.
        const drip = c.createLinearGradient(0, wy + wh, 0, wy + wh + rh * 0.42)
        drip.addColorStop(0, 'rgba(40,34,24,0.2)')
        drip.addColorStop(1, 'rgba(40,34,24,0)')
        c.fillStyle = drip
        c.fillRect(wx + ww * 0.04, wy + wh, ww * 0.92, rh * 0.42)
        // Glass with a sky-reflection gradient.
        const g = c.createLinearGradient(0, wy, 0, wy + wh)
        g.addColorStop(0, glass)
        g.addColorStop(1, '#0d1416')
        c.fillStyle = g
        c.fillRect(wx, wy, ww, wh)
        // Blinds, drawn to a random height.
        const blind = r()
        if (blind > 0.45) {
          c.fillStyle = `rgba(${200 + r() * 30},${196 + r() * 30},${180 + r() * 30},0.8)`
          c.fillRect(wx, wy, ww, wh * (0.2 + r() * 0.6))
        }
        // Frame and mullions.
        c.strokeStyle = opts.band ? '#2b3032' : '#e8e6de'
        c.lineWidth = Math.max(1.5, size / 256)
        c.strokeRect(wx + 1, wy + 1, ww - 2, wh - 2)
        c.beginPath()
        c.moveTo(wx + ww / 2, wy)
        c.lineTo(wx + ww / 2, wy + wh)
        c.stroke()
        // Sill.
        c.fillStyle = 'rgba(255,255,255,0.35)'
        c.fillRect(wx - 2, wy + wh, ww + 4, 2.5)
        // Height: recessed glass, proud sill.
        hc.fillStyle = 'rgb(40,40,40)'
        hc.fillRect(wx, wy, ww, wh)
        hc.fillStyle = 'rgb(235,235,235)'
        hc.fillRect(wx - 2, wy + wh, ww + 4, 3)
        // Glass: glossy and reflective.
        oc.fillStyle = 'rgb(255,16,190)'
        oc.fillRect(wx + 2, wy + 2, ww - 4, wh - 4)
        // Lit rooms.
        if (r() < lit) {
          const warm = r() > 0.25
          const e = ec.createLinearGradient(0, wy, 0, wy + wh)
          const k = 0.55 + r() * 0.45
          const tint = warm ? [255, 196 + r() * 30, 120 + r() * 40] : [220, 235, 255]
          e.addColorStop(0, `rgba(${tint[0]},${tint[1]},${tint[2]},${k})`)
          e.addColorStop(1, `rgba(${tint[0]},${tint[1]},${tint[2]},${k * 0.45})`)
          ec.fillStyle = e
          ec.fillRect(wx + 2, wy + 2, ww - 4, wh - 4)
          ec.fillStyle = 'rgba(0,0,0,0.75)'
          ec.fillRect(wx + ww / 2 - 1, wy, 2, wh)
        }
      }
    // Weather the wall with noise, streaks from the parapet and splash-zone dirt.
    const data = read(c, size)
    const big = field(size, 3, 3, seed)
    const fine = field(size, 128, 2, seed + 2)
    const mid = field(size, 20, 3, seed + 1)
    const run = field(size, 90, 1, seed + 3)
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const i = y * size + x
        const v01 = y / size
        const streak = smooth(0.6, 0.9, run[x]) * smooth(0.5, 1.0, v01 + mid[i] * 0.3) * 0.2
        const splash = (1 - smooth(0.0, 0.05 + mid[i] * 0.05, v01)) * 0.32
        const v = 0.92 + 0.12 * big[i] + 0.05 * (fine[i] - 0.5) - streak - splash
        data[i * 4] = data[i * 4] * v + splash * 30
        data[i * 4 + 1] = data[i * 4 + 1] * v + splash * 20
        data[i * 4 + 2] = data[i * 4 + 2] * v + splash * 8
      }
    const heights = read(hc, size)
    const h = new Float32Array(size * size)
    for (let i = 0; i < h.length; i++) h[i] = (heights[i * 4] / 255) * 3 + fine[i] * 0.25
    return {
      map: finish(data, size, true),
      emissive: finish(read(ec, size), size, true),
      normalMap: textureDetail.maps ? normalFrom(h, size, 2.2) : null,
      roughnessMap: textureDetail.maps ? finish(read(oc, size), size, false) : null,
    }
  })
}

/* --------------------------------------------------------- vegetation */

function alphaTexture(c: HTMLCanvasElement, ctx: CanvasRenderingContext2D, bleed: [number, number, number] = [110, 140, 80]) {
  const data = read(ctx, c.width, c.height)
  // Give fully transparent texels a foliage colour so mip-mapping does not pull dark fringes in.
  for (let i = 0; i < data.length; i += 4)
    if (data[i + 3] < 8) {
      data[i] = bleed[0]
      data[i + 1] = bleed[1]
      data[i + 2] = bleed[2]
    }
  const t = finish(data, c.width, true, c.height)
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
  return t
}

/** Pinnate palm frond: rachis along +U, leaflets fanning out. Alpha-tested. */
export function frondTexture() {
  return cached('frond', () => {
    const [c, ctx] = canvas(512, 128)
    const r = rng(91)
    ctx.lineCap = 'round'
    const n = 54
    for (let side = -1; side <= 1; side += 2)
      for (let k = 0; k < n; k++) {
        const t = k / (n - 1)
        const x = 14 + t * 486
        const len = 58 * Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.95)) * (0.82 + r() * 0.3) + 4
        const a = 0.95 - t * 0.5 + (r() - 0.5) * 0.14
        const g = 96 + r() * 50
        ctx.strokeStyle = `rgb(${44 + r() * 34},${g},${34 + r() * 22})`
        ctx.lineWidth = 2.6 - t * 1.2
        ctx.beginPath()
        ctx.moveTo(x, 64)
        ctx.quadraticCurveTo(x + Math.cos(a) * len * 0.6, 64 + side * Math.sin(a) * len * 0.75, x + Math.cos(a) * len * 1.05, 64 + side * Math.sin(a) * len)
        ctx.stroke()
      }
    ctx.strokeStyle = '#8a8a4c'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, 64)
    ctx.lineTo(506, 64)
    ctx.stroke()
    return alphaTexture(c, ctx)
  })
}

/** Cluster of small leaves for tree and shrub canopy cards. Alpha-tested; tinted per instance. */
export function leafTexture(kind: 'broad' | 'fine' = 'broad') {
  return cached(`leaf-${kind}`, () => {
    const size = 256
    const [c, ctx] = canvas(size)
    const r = rng(kind === 'broad' ? 101 : 103)
    const n = kind === 'broad' ? 190 : 520
    for (let k = 0; k < n; k++) {
      const a = r() * Math.PI * 2
      const d = Math.pow(r(), 0.6) * size * 0.46
      const x = size / 2 + Math.cos(a) * d
      const y = size / 2 + Math.sin(a) * d * 0.92
      const l = kind === 'broad' ? 9 + r() * 9 : 7 + r() * 9
      const w = kind === 'broad' ? l * 0.42 : 2.3
      const shade = 0.55 + r() * 0.45
      ctx.fillStyle = `rgb(${150 * shade},${190 * shade},${120 * shade})`
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(r() * Math.PI * 2)
      ctx.beginPath()
      ctx.ellipse(0, 0, l, w, 0, 0, Math.PI * 2)
      ctx.fill()
      if (kind === 'broad') {
        ctx.strokeStyle = 'rgba(255,255,220,0.25)'
        ctx.lineWidth = 0.7
        ctx.beginPath()
        ctx.moveTo(-l, 0)
        ctx.lineTo(l, 0)
        ctx.stroke()
      }
      ctx.restore()
    }
    return alphaTexture(c, ctx)
  })
}

/** Tuft of dry grass blades for instanced ground cover. */
export function tuftTexture() {
  return cached('tuft', () => {
    const size = 128
    const [c, ctx] = canvas(size)
    const r = rng(111)
    ctx.lineCap = 'round'
    for (let k = 0; k < 46; k++) {
      const x = size / 2 + (r() - 0.5) * 50
      const lean = (r() - 0.5) * 70
      const h = 50 + r() * 70
      const shade = 0.6 + r() * 0.4
      ctx.strokeStyle = `rgb(${255 * shade},${255 * shade},${235 * shade})`
      ctx.lineWidth = 1.2 + r() * 1.6
      ctx.beginPath()
      ctx.moveTo(x, size)
      ctx.quadraticCurveTo(x + lean * 0.2, size - h * 0.6, x + lean, size - h)
      ctx.stroke()
    }
    return alphaTexture(c, ctx, [230, 230, 210])
  })
}

/** Soft radial blob: contact shadows under vehicles, silos and tree canopies. */
export function blobTexture() {
  return cached('blob', () => {
    const size = 128
    const [c, ctx] = canvas(size)
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(0,0,0,1)')
    g.addColorStop(0.45, 'rgba(0,0,0,0.75)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    return alphaTexture(c, ctx, [0, 0, 0])
  })
}

/** Low-frequency noise sampled in world space to break up tiling and add grime. */
export function macroTexture() {
  return cached('macro', () => {
    const size = 256
    const a = field(size, 4, 5, 201)
    const b = field(size, 9, 4, 202)
    const data = new Uint8Array(size * size * 4)
    for (let i = 0; i < size * size; i++) {
      data[i * 4] = a[i] * 255
      data[i * 4 + 1] = b[i] * 255
      data[i * 4 + 2] = 0
      data[i * 4 + 3] = 255
    }
    const t = finish(data, size, false)
    t.anisotropy = 1
    return t
  })
}

/** Clone a cached texture with its own repeat (per-object UV scale). */
export function tiled<T extends THREE.Texture>(t: T, x: number, y: number): T {
  const c = t.clone() as T
  c.repeat.set(x, y)
  c.needsUpdate = true
  return c
}

/** Applies a set to a material with one shared repeat. */
export function applySet(m: THREE.MeshStandardMaterial, set: PBR, x: number, y: number) {
  m.map = tiled(set.map, x, y)
  if (set.normalMap) m.normalMap = tiled(set.normalMap, x, y)
  if (set.roughnessMap) {
    m.roughnessMap = tiled(set.roughnessMap, x, y)
    m.metalnessMap = m.roughnessMap
    m.roughness = 1
    m.metalness = 1
  }
  return m
}
