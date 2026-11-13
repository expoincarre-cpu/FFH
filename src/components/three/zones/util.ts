import * as THREE from 'three'
import { curveParam, journey } from '../state'
import { STATIONS } from '../shared'
import { beam } from '../props'

type P3 = [number, number, number]

/** Whether a zone (0–4) is near the camera — used to skip off-screen animation work. */
export function zoneAwake(index: number) {
  const f = curveParam(journey.smooth) * (STATIONS.length - 1)
  return Math.abs(f - (index + 2)) < 1.7 || f > STATIONS.length - 2.5
}

/** Gable roof as two pitched slabs meeting at a ridge along X, with overhang. UVs run along the slope. */
export function gableRoof(width: number, length: number, rise: number, overhang = 0.4, thickness = 0.12) {
  const half = width / 2 + overhang
  const slope = Math.hypot(half, rise * (half / (width / 2)))
  const angle = Math.atan2(rise, width / 2)
  const slab = new THREE.BoxGeometry(length + overhang * 2, thickness, slope)
  const a = slab.clone().translate(0, 0, slope / 2).rotateX(angle)
  const b = slab.clone().translate(0, 0, -slope / 2).rotateX(-angle)
  const merged = new THREE.BufferGeometry()
  for (const name of ['position', 'normal', 'uv'] as const) {
    const A = a.attributes[name].array as Float32Array
    const B = b.attributes[name].array as Float32Array
    const out = new Float32Array(A.length + B.length)
    out.set(A)
    out.set(B, A.length)
    merged.setAttribute(name, new THREE.BufferAttribute(out, name === 'uv' ? 2 : 3))
  }
  const ia = Array.from(a.index!.array)
  const ib = Array.from(b.index!.array).map((i) => i + a.attributes.position.count)
  merged.setIndex([...ia, ...ib])
  merged.translate(0, rise, 0)
  return merged
}

/** Handrail along a polyline: posts plus top and mid rails, as beam matrices for one instanced mesh. */
export function railing(path: P3[], height = 1.1, t = 0.045, spacing = 1.6): THREE.Matrix4[] {
  const out: THREE.Matrix4[] = []
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]
    const b = path[i + 1]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
    const n = Math.max(1, Math.round(len / spacing))
    for (let k = 0; k <= n; k++) {
      const f = k / n
      const p: P3 = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]
      out.push(beam(p, [p[0], p[1] + height, p[2]], t))
    }
    out.push(beam([a[0], a[1] + height, a[2]], [b[0], b[1] + height, b[2]], t))
    out.push(beam([a[0], a[1] + height * 0.5, a[2]], [b[0], b[1] + height * 0.5, b[2]], t * 0.8))
  }
  return out
}

/** Square lattice tower (legs, horizontals, alternating diagonals) as beam matrices. */
export function lattice(origin: P3, height: number, half = 1.1, step = 1.7, t = 0.1): THREE.Matrix4[] {
  const [ox, oy, oz] = origin
  const out: THREE.Matrix4[] = []
  const legs: [number, number][] = [
    [-half, -half],
    [half, -half],
    [half, half],
    [-half, half],
  ]
  legs.forEach(([x, z]) => out.push(beam([ox + x, oy, oz + z], [ox + x, oy + height, oz + z], t * 1.4)))
  let level = 0
  for (let y = 0; y < height - 0.01; y += step, level++) {
    const y1 = Math.min(y + step, height)
    for (let i = 0; i < 4; i++) {
      const [x1, z1] = legs[i]
      const [x2, z2] = legs[(i + 1) % 4]
      out.push(beam([ox + x1, oy + y1, oz + z1], [ox + x2, oy + y1, oz + z2], t * 0.8))
      const flip = (level + i) % 2 === 0
      out.push(beam([ox + x1, oy + (flip ? y : y1), oz + z1], [ox + x2, oy + (flip ? y1 : y), oz + z2], t * 0.7))
    }
  }
  return out
}

/** Warren truss between two points (top/bottom chords and diagonals) as beam matrices. */
export function truss(a: P3, b: P3, depth = 0.7, bays = 10, t = 0.09): THREE.Matrix4[] {
  const out: THREE.Matrix4[] = []
  const at = (f: number, dy: number): P3 => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f + dy, a[2] + (b[2] - a[2]) * f]
  out.push(beam(at(0, 0), at(1, 0), t * 1.3), beam(at(0, -depth), at(1, -depth), t * 1.3))
  for (let i = 0; i < bays; i++) {
    const f0 = i / bays
    const f1 = (i + 1) / bays
    out.push(i % 2 ? beam(at(f0, 0), at(f1, -depth), t) : beam(at(f0, -depth), at(f1, 0), t))
    out.push(beam(at(f0, 0), at(f0, -depth), t * 0.8))
  }
  out.push(beam(at(1, 0), at(1, -depth), t * 0.8))
  return out
}
