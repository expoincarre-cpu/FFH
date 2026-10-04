'use client'

import type { ThreeElements } from '@react-three/fiber'

type GroupProps = ThreeElements['group']

import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { rng, tmpColor, tmpObject } from './shared'
import { concrete, corrugatedBump, facade, tiled, weathered } from './textures'

/* ----------------------------------------------------------- materials */

export function useCladding(color: string, w: number, h: number, ribs = 1.4) {
  return useMemo(() => {
    const bump = tiled(corrugatedBump(), (w / 4) * ribs, 1)
    return new THREE.MeshStandardMaterial({
      map: tiled(weathered(color, 7), w / 8, 1),
      bumpMap: bump,
      bumpScale: 2.5,
      roughness: 0.62,
      metalness: 0.25,
    })
  }, [color, w, h, ribs])
}

export function useConcrete(color: string, w: number, h: number) {
  return useMemo(
    () => new THREE.MeshStandardMaterial({ map: tiled(concrete(color), w / 10, h / 10), roughness: 0.92 }),
    [color, w, h],
  )
}

/** Façade material with windows; window glow is driven by the scene's night factor. */
export function useFacade(opts: { wall: string; cols: number; rows: number; band?: boolean; seed?: number; glass?: string }) {
  return useMemo(() => {
    const { map, emissive } = facade(opts)
    const m = new THREE.MeshStandardMaterial({
      map,
      emissiveMap: emissive,
      emissive: new THREE.Color('#ffd9a0'),
      emissiveIntensity: 0,
      roughness: 0.8,
    })
    m.userData.nightGlow = 1.6
    return m
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(opts)])
}

export const galvanized = new THREE.MeshStandardMaterial({ color: '#bfc4c4', roughness: 0.48, metalness: 0.5 })
export const darkSteel = new THREE.MeshStandardMaterial({ color: '#3a4241', roughness: 0.5, metalness: 0.6 })
export const glass = new THREE.MeshStandardMaterial({ color: '#2a3b40', roughness: 0.08, metalness: 0.9 })
export const rubber = new THREE.MeshStandardMaterial({ color: '#161818', roughness: 0.9 })
export const crateSteel = new THREE.MeshStandardMaterial({ color: '#8c9188', roughness: 0.7, metalness: 0.4 })
export const white = new THREE.MeshStandardMaterial({ color: '#eceae2', roughness: 0.55 })

/* -------------------------------------------------------------- trucks */

type TruckKind = 'bulk' | 'reefer' | 'live'

const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.36, 18).rotateZ(Math.PI / 2)

/** Articulated truck, nose towards +Z. */
export function Truck({ kind = 'reefer', cab = '#e7e3d8', ...props }: { kind?: TruckKind; cab?: string } & GroupProps) {
  const cabMat = useMemo(() => new THREE.MeshStandardMaterial({ color: cab, roughness: 0.35, metalness: 0.3 }), [cab])
  const wheels: [number, number][] = [
    [-1.05, 3.1],
    [1.05, 3.1],
    [-1.05, 1.6],
    [1.05, 1.6],
    [-1.05, -3.6],
    [1.05, -3.6],
    [-1.05, -4.7],
    [1.05, -4.7],
  ]
  return (
    <group {...props}>
      {/* Cab */}
      <mesh position={[0, 1.75, 3.35]} material={cabMat}>
        <boxGeometry args={[2.3, 2.3, 1.9]} />
      </mesh>
      <mesh position={[0, 2.25, 4.31]} material={glass}>
        <boxGeometry args={[2.1, 0.9, 0.02]} />
      </mesh>
      <mesh position={[0, 0.62, 2.4]} material={darkSteel}>
        <boxGeometry args={[2.1, 0.35, 4.6]} />
      </mesh>
      {/* Body */}
      {kind === 'bulk' && (
        <group position={[0, 2.25, -2.3]}>
          <mesh rotation-x={Math.PI / 2} material={galvanized}>
            <cylinderGeometry args={[1.25, 1.25, 7.4, 28]} />
          </mesh>
          {[-2.4, 0, 2.4].map((z) => (
            <mesh key={z} position={[0, -1.1, z]} rotation-x={Math.PI} material={galvanized}>
              <coneGeometry args={[0.9, 0.9, 16]} />
            </mesh>
          ))}
        </group>
      )}
      {kind === 'reefer' && (
        <group position={[0, 2.35, -2.2]}>
          <mesh material={white}>
            <boxGeometry args={[2.5, 2.7, 8.2]} />
          </mesh>
          <mesh position={[0, 0.4, 4.15]} material={darkSteel}>
            <boxGeometry args={[1.8, 1.4, 0.3]} />
          </mesh>
        </group>
      )}
      {kind === 'live' && (
        <group position={[0, 2.3, -2.2]}>
          <mesh material={crateSteel}>
            <boxGeometry args={[2.5, 2.6, 8]} />
          </mesh>
          {[-0.8, 0, 0.8].map((y) => (
            <mesh key={y} position={[1.26, y, 0]} material={darkSteel}>
              <boxGeometry args={[0.02, 0.18, 7.8]} />
            </mesh>
          ))}
        </group>
      )}
      <mesh position={[0, 0.7, -2.2]} material={darkSteel}>
        <boxGeometry args={[2, 0.3, 7.6]} />
      </mesh>
      {wheels.map(([x, z], i) => (
        <mesh key={i} geometry={wheelGeo} position={[x, 0.48, z]} material={rubber} />
      ))}
    </group>
  )
}

/* ---------------------------------------------------------- vegetation */

const frondGeo = (() => {
  const g = new THREE.SphereGeometry(1, 8, 4)
  g.scale(0.32, 0.05, 1.7)
  g.translate(0, 0, 1.5)
  return g
})()
const trunkGeo = new THREE.CylinderGeometry(0.16, 0.24, 1, 7).translate(0, 0.5, 0)

/** Date / fan palms — instanced trunks and fronds. */
export function Palms({ spots, seed = 1 }: { spots: [number, number][]; seed?: number }) {
  const trunks = useRef<THREE.InstancedMesh>(null)
  const fronds = useRef<THREE.InstancedMesh>(null)
  const F = 9
  useLayoutEffect(() => {
    const r = rng(seed)
    spots.forEach(([x, z], i) => {
      const h = 5 + r() * 4
      const lean = (r() - 0.5) * 0.12
      tmpObject.position.set(x, 0, z)
      tmpObject.rotation.set(lean, 0, (r() - 0.5) * 0.12)
      tmpObject.scale.set(1, h, 1)
      tmpObject.updateMatrix()
      trunks.current!.setMatrixAt(i, tmpObject.matrix)
      const top = new THREE.Vector3(0, h, 0).applyEuler(tmpObject.rotation).add(tmpObject.position)
      for (let k = 0; k < F; k++) {
        tmpObject.position.copy(top)
        tmpObject.rotation.set(0.35 + r() * 0.5, (k / F) * Math.PI * 2 + r() * 0.3, 0, 'YXZ')
        tmpObject.scale.setScalar(0.85 + r() * 0.35)
        tmpObject.updateMatrix()
        fronds.current!.setMatrixAt(i * F + k, tmpObject.matrix)
        fronds.current!.setColorAt(i * F + k, tmpColor.set(r() > 0.3 ? '#5f7a3c' : '#7b8a45'))
      }
    })
    trunks.current!.instanceMatrix.needsUpdate = true
    fronds.current!.instanceMatrix.needsUpdate = true
    if (fronds.current!.instanceColor) fronds.current!.instanceColor.needsUpdate = true
  }, [spots, seed])
  return (
    <group>
      <instancedMesh ref={trunks} args={[trunkGeo, undefined, spots.length]}>
        <meshStandardMaterial color="#7a6a52" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={fronds} args={[frondGeo, undefined, spots.length * F]}>
        <meshStandardMaterial roughness={0.8} side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  )
}

const blobGeo = new THREE.IcosahedronGeometry(1, 1)

/** Broadleaf trees / shrubs as clustered low-poly canopies. */
export function Trees({
  spots,
  seed = 2,
  colors = ['#4f6a38', '#5d7a40', '#3f5a30'],
  size = 1,
  trunk = true,
}: {
  spots: [number, number][]
  seed?: number
  colors?: string[]
  size?: number
  trunk?: boolean
}) {
  const canopy = useRef<THREE.InstancedMesh>(null)
  const trunks = useRef<THREE.InstancedMesh>(null)
  const per = 3
  useLayoutEffect(() => {
    const r = rng(seed)
    spots.forEach(([x, z], i) => {
      const s = (0.8 + r() * 0.6) * size
      const h = trunk ? 1.6 * s : 0
      if (trunks.current) {
        tmpObject.position.set(x, 0, z)
        tmpObject.rotation.set(0, 0, 0)
        tmpObject.scale.set(s, h + 0.6, s)
        tmpObject.updateMatrix()
        trunks.current.setMatrixAt(i, tmpObject.matrix)
      }
      for (let k = 0; k < per; k++) {
        tmpObject.position.set(x + (r() - 0.5) * 1.4 * s, h + (0.8 + r() * 1.2) * s, z + (r() - 0.5) * 1.4 * s)
        tmpObject.rotation.set(r() * 3, r() * 3, r() * 3)
        tmpObject.scale.setScalar((0.9 + r() * 0.7) * s)
        tmpObject.updateMatrix()
        canopy.current!.setMatrixAt(i * per + k, tmpObject.matrix)
        canopy.current!.setColorAt(i * per + k, tmpColor.set(colors[Math.floor(r() * colors.length)]))
      }
    })
    canopy.current!.instanceMatrix.needsUpdate = true
    if (canopy.current!.instanceColor) canopy.current!.instanceColor.needsUpdate = true
    if (trunks.current) trunks.current.instanceMatrix.needsUpdate = true
  }, [spots, seed, colors, size, trunk])
  return (
    <group>
      {trunk && (
        <instancedMesh ref={trunks} args={[trunkGeo, undefined, spots.length]}>
          <meshStandardMaterial color="#5e5040" roughness={1} />
        </instancedMesh>
      )}
      <instancedMesh ref={canopy} args={[blobGeo, undefined, spots.length * per]}>
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>
    </group>
  )
}

/** Deterministic scatter along a line, for rows of trees or palms. */
export function row(from: [number, number], to: [number, number], n: number, jitter = 0.6, seed = 1): [number, number][] {
  const r = rng(seed)
  return Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1)
    return [from[0] + (to[0] - from[0]) * t + (r() - 0.5) * jitter, from[1] + (to[1] - from[1]) * t + (r() - 0.5) * jitter]
  })
}
