import * as THREE from 'three'
import { curveParam, journey } from '../state'
import { STATIONS } from '../shared'

/** Whether a zone (0–4) is near the camera — used to skip off-screen animation work. */
export function zoneAwake(index: number) {
  const f = curveParam(journey.smooth) * (STATIONS.length - 1)
  return Math.abs(f - (index + 2)) < 1.7 || f > STATIONS.length - 2.5
}

/** Triangular-prism roof, ridge along X, apex up. */
export function roofGeometry(width: number, length: number, rise: number) {
  const r = width / Math.sqrt(3)
  const g = new THREE.CylinderGeometry(r, r, length, 3, 1)
  g.rotateZ(Math.PI / 2)
  g.rotateX(-Math.PI / 2)
  g.scale(1, rise / (1.5 * r), 1)
  g.translate(0, (rise / 3), 0)
  return g
}

/** Box outline used for "architectural drawing" frames. */
export function edgesOf(geometry: THREE.BufferGeometry) {
  return new THREE.EdgesGeometry(geometry)
}
