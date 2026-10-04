'use client'

import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ZONES, materials, rng, threadPoint, tmpObject, zoneStops } from '../shared'
import { edgesOf, roofGeometry, zoneAwake } from './util'

const BARN = { length: 28, width: 5, height: 2.6, rise: 1.6 }

/** STAGE 03 — farmland, climate-controlled barns, flocks, feed silos, transport. */
export function Farming({ color, density }: { color: string; density: number }) {
  const barns = useMemo(() => {
    const rows = density < 0.5 ? 4 : 6
    return Array.from({ length: rows }, (_, i) => ({ x: -34, z: -16 + i * 7.5, open: i === 2 }))
  }, [density])
  const roof = useMemo(() => roofGeometry(BARN.width + 0.6, BARN.length + 0.6, BARN.rise), [])
  const barnEdges = useMemo(() => edgesOf(new THREE.BoxGeometry(BARN.length, BARN.height, BARN.width)), [])
  const roofEdges = useMemo(() => edgesOf(roof), [roof])

  return (
    <group position={[0, 0, ZONES.farming]}>
      <Terrain color={color} />

      {barns.map((b, i) => (
        <group key={i} position={[b.x + BARN.length / 2, 0, b.z]}>
          {b.open ? (
            <>
              <lineSegments geometry={barnEdges} position={[0, BARN.height / 2, 0]}>
                <lineBasicMaterial color={color} transparent opacity={0.9} />
              </lineSegments>
              <lineSegments geometry={roofEdges} position={[0, BARN.height, 0]}>
                <lineBasicMaterial color={color} transparent opacity={0.9} />
              </lineSegments>
            </>
          ) : (
            <>
              <mesh position={[0, BARN.height / 2, 0]} material={materials.clay}>
                <boxGeometry args={[BARN.length, BARN.height, BARN.width]} />
              </mesh>
              <mesh geometry={roof} position={[0, BARN.height, 0]} material={materials.graphite} />
            </>
          )}
          {/* Feed silos at the gable end */}
          {[-1, 1].map((s) => (
            <group key={s} position={[BARN.length / 2 + 1.4, 0, s * 1.2]}>
              <mesh position={[0, 2.6, 0]} material={materials.steel}>
                <cylinderGeometry args={[0.55, 0.55, 3.6, 16]} />
              </mesh>
              <mesh position={[0, 4.8, 0]} material={materials.steel}>
                <coneGeometry args={[0.55, 0.8, 16]} />
              </mesh>
              <mesh position={[0, 0.4, 0]} rotation-x={Math.PI} material={materials.steel}>
                <coneGeometry args={[0.55, 0.8, 16]} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      <Flock density={density} barn={barns.find((b) => b.open)!} />
      <Trees density={density} />
      <Trucks />
      <pointLight position={[-20, 10, 0]} color={color} intensity={140} distance={60} decay={1.4} />
    </group>
  )
}

function Terrain({ color }: { color: string }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(220, 64, 110, 32)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      // Flat around the farm and the value-chain road, rolling hills beyond.
      const flat = THREE.MathUtils.smoothstep(Math.max(Math.abs(x + 14) - 26, Math.abs(z) - 18), 0, 10)
      const edge = 1 - THREE.MathUtils.smoothstep(Math.max(Math.abs(x) - 90, Math.abs(z) - 24), 0, 8)
      const h = (Math.sin(x * 0.06) * Math.cos(z * 0.08) * 3 + Math.sin(x * 0.17 + z * 0.11) * 1.2 + 2.2) * flat * edge
      pos.setY(i, h - 0.02)
    }
    g.computeVertexNormals()
    return g
  }, [])
  const fields = useMemo(() => {
    const r = rng(9)
    return Array.from({ length: 14 }, (_, i) => ({
      x: 22 + (i % 2) * 15,
      z: -40 + Math.floor(i / 2) * 12,
      w: 13,
      d: 10,
      shade: r(),
    }))
  }, [])
  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial color="#2a3020" roughness={1} flatShading />
      </mesh>
      {fields.map((f, i) => (
        <mesh key={i} position={[f.x, 0.05, f.z]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[f.w, f.d]} />
          <meshStandardMaterial color={new THREE.Color(color).lerp(new THREE.Color('#2a3020'), 0.45 + f.shade * 0.4)} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

/** Birds inside the "x-ray" barn, slowly milling. */
function Flock({ density, barn }: { density: number; barn: { x: number; z: number } }) {
  const count = Math.round(420 * Math.max(density, 0.35))
  const ref = useRef<THREE.InstancedMesh>(null)
  const seeds = useMemo(() => {
    const r = rng(17)
    return Array.from({ length: count }, () => ({
      x: barn.x + 0.8 + r() * (BARN.length - 1.6),
      z: barn.z + (r() - 0.5) * (BARN.width - 1),
      ph: r() * 10,
      s: 0.85 + r() * 0.3,
    }))
  }, [count, barn])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    seeds.forEach((s, i) => {
      tmpObject.position.set(s.x, 0.22, s.z)
      tmpObject.rotation.set(0, s.ph, 0)
      tmpObject.scale.set(s.s, s.s * 0.85, s.s * 1.3)
      tmpObject.updateMatrix()
      mesh.setMatrixAt(i, tmpObject.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [seeds])

  useFrame((state) => {
    const mesh = ref.current
    if (!mesh || !zoneAwake(2)) return
    const t = state.clock.elapsedTime
    seeds.forEach((s, i) => {
      tmpObject.position.set(s.x + Math.sin(t * 0.3 + s.ph) * 0.3, 0.22, s.z + Math.cos(t * 0.25 + s.ph) * 0.2)
      tmpObject.rotation.set(0, s.ph + Math.sin(t * 0.4 + s.ph) * 0.8, 0)
      tmpObject.scale.set(s.s, s.s * 0.85, s.s * 1.3)
      tmpObject.updateMatrix()
      mesh.setMatrixAt(i, tmpObject.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.2, 8, 6]} />
      <meshStandardMaterial color="#f1ece2" roughness={1} emissive="#3b3a30" />
    </instancedMesh>
  )
}

function Trees({ density }: { density: number }) {
  const count = Math.round(90 * Math.max(density, 0.4))
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const r = rng(41)
    for (let i = 0; i < count; i++) {
      // Windbreak lines around the farm.
      const side = i % 3
      const k = r()
      const x = side === 0 ? -40 + k * 34 : side === 1 ? -42 : 24 + k * 30
      const z = side === 0 ? -24 : side === 1 ? -24 + k * 46 : -12 + r() * 24
      const s = 0.8 + r() * 0.7
      tmpObject.position.set(x + (r() - 0.5), 1.6 * s, z + (r() - 0.5))
      tmpObject.rotation.set(0, r() * 6, 0)
      tmpObject.scale.set(s, s * 1.5, s)
      tmpObject.updateMatrix()
      mesh.setMatrixAt(i, tmpObject.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [count])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <coneGeometry args={[0.9, 2.2, 6]} />
      <meshStandardMaterial color="#3d4a2c" roughness={1} flatShading />
    </instancedMesh>
  )
}

/** Live-bird trucks driving the thread from the farms to the processing plant. */
function Trucks() {
  const refs = useRef<(THREE.Group | null)[]>([])
  const a = useMemo(() => new THREE.Vector3(), [])
  const b = useMemo(() => new THREE.Vector3(), [])
  const from = zoneStops[2]
  const to = zoneStops[3]
  useFrame((state) => {
    if (!zoneAwake(2) && !zoneAwake(3)) return
    const t = state.clock.elapsedTime
    refs.current.forEach((g, i) => {
      if (!g) return
      const k = from + (((t * 0.012 + i / 3) % 1) * (to - from))
      threadPoint(k, a)
      threadPoint(k + 0.002, b)
      g.position.set(a.x + 2.2, 0, a.z - ZONES.farming)
      g.lookAt(b.x + 2.2, 0, b.z - ZONES.farming)
    })
  })
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(el) => void (refs.current[i] = el)}>
          <mesh position={[0, 1.4, 1.8]} material={materials.clay}>
            <boxGeometry args={[2, 2, 1.6]} />
          </mesh>
          <mesh position={[0, 1.7, -2]} material={materials.clayWarm}>
            <boxGeometry args={[2.1, 2.6, 5.6]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
