'use client'

import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ZONES, materials, rng, tmpColor, tmpObject } from '../shared'
import { edgesOf, zoneAwake } from './util'

const RACK = { w: 2.4, h: 3.4, d: 1.5, levels: 6, cols: 5, rows: 3 }

/** STAGE 02 — incubation hall: racks of eggs, warm light, chicks and poults. */
export function Hatchery({ color, density }: { color: string; density: number }) {
  const racks = useMemo(() => {
    const out: [number, number][] = []
    const rows = density < 0.5 ? 2 : 3
    const cols = density < 0.5 ? 4 : 6
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push([-1 + r * 5.5, -14 + c * 3.6])
    return out
  }, [density])

  const hall = useMemo(() => edgesOf(new THREE.BoxGeometry(34, 9, 40)), [])
  const rackEdges = useMemo(() => edgesOf(new THREE.BoxGeometry(RACK.w, RACK.h, RACK.d)), [])

  return (
    <group position={[0, 0, ZONES.hatchery]}>
      {/* Hall drawn as an architectural outline */}
      <lineSegments geometry={hall} position={[4, 4.5, -2]}>
        <lineBasicMaterial color={color} transparent opacity={0.6} />
      </lineSegments>
      <mesh position={[4, 0.02, -2]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[34, 40]} />
        <meshStandardMaterial color="#231c15" roughness={1} />
      </mesh>

      {racks.map(([x, z], i) => (
        <group key={i} position={[x, RACK.h / 2 + 0.3, z]}>
          <lineSegments geometry={rackEdges}>
            <lineBasicMaterial color="#d9c9ae" transparent opacity={0.55} />
          </lineSegments>
        </group>
      ))}
      <Eggs racks={racks} />

      {/* Incubator status lights on each rack */}
      {racks.map(([x, z], i) => (
        <mesh key={`l${i}`} position={[x, RACK.h + 0.55, z + RACK.d / 2 + 0.01]}>
          <planeGeometry args={[RACK.w * 0.8, 0.07]} />
          <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
        </mesh>
      ))}

      {/* Hatching tray area */}
      <mesh position={[-3, 0.25, 9]} material={materials.graphite}>
        <boxGeometry args={[7, 0.5, 5]} />
      </mesh>
      <Chicks density={density} />

      <pointLight position={[4, 6, -4]} color={color} intensity={160} distance={40} decay={1.5} />
      <pointLight position={[-3, 3, 10]} color="#ffe2b0" intensity={50} distance={16} decay={1.6} />
    </group>
  )
}

function Eggs({ racks }: { racks: [number, number][] }) {
  const perTray = RACK.cols * RACK.rows
  const count = racks.length * RACK.levels * perTray
  const ref = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const r = rng(21)
    let i = 0
    racks.forEach(([x, z]) => {
      for (let l = 0; l < RACK.levels; l++) {
        const y = 0.55 + l * (RACK.h / RACK.levels)
        for (let a = 0; a < RACK.cols; a++)
          for (let b = 0; b < RACK.rows; b++) {
            tmpObject.position.set(x - RACK.w / 2 + 0.3 + a * 0.45, y, z - RACK.d / 2 + 0.35 + b * 0.4)
            tmpObject.rotation.set((r() - 0.5) * 0.2, 0, (r() - 0.5) * 0.2)
            tmpObject.scale.set(1, 1.3, 1)
            tmpObject.updateMatrix()
            mesh.setMatrixAt(i, tmpObject.matrix)
            mesh.setColorAt(i, tmpColor.set(r() > 0.5 ? '#efe2cc' : '#e2c9a4'))
            i++
          }
      }
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [racks])

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.15, 12, 10]} />
      <meshStandardMaterial roughness={0.6} emissive="#5a3510" emissiveIntensity={0.35} />
    </instancedMesh>
  )
}

/** Newborn chicks (yellow) and turkey poults (buff), gently alive. */
function Chicks({ density }: { density: number }) {
  const count = Math.round(70 * Math.max(density, 0.5))
  const body = useRef<THREE.InstancedMesh>(null)
  const head = useRef<THREE.InstancedMesh>(null)
  const seeds = useMemo(() => {
    const r = rng(33)
    return Array.from({ length: count }, () => ({
      x: -3 + (r() - 0.5) * 6.2,
      z: 9 + (r() - 0.5) * 4.2,
      a: r() * Math.PI * 2,
      s: 0.8 + r() * 0.4,
      poult: r() > 0.6,
      ph: r() * 10,
    }))
  }, [count])

  useLayoutEffect(() => {
    seeds.forEach((s, i) => {
      const c = tmpColor.set(s.poult ? '#cdb48a' : '#f2cf5b')
      body.current?.setColorAt(i, c)
      head.current?.setColorAt(i, c)
    })
    if (body.current?.instanceColor) body.current.instanceColor.needsUpdate = true
    if (head.current?.instanceColor) head.current.instanceColor.needsUpdate = true
  }, [seeds])

  useFrame((state) => {
    if (!zoneAwake(1) || !body.current || !head.current) return
    const t = state.clock.elapsedTime
    seeds.forEach((s, i) => {
      const hop = Math.max(0, Math.sin(t * 3 + s.ph)) * 0.05
      const yaw = s.a + Math.sin(t * 0.5 + s.ph) * 0.8
      tmpObject.position.set(s.x, 0.68 + hop, s.z)
      tmpObject.rotation.set(0, yaw, 0)
      tmpObject.scale.setScalar(s.s)
      tmpObject.updateMatrix()
      body.current!.setMatrixAt(i, tmpObject.matrix)
      const peck = Math.max(0, Math.sin(t * 1.7 + s.ph * 2)) * 0.08
      tmpObject.position.set(s.x + Math.sin(yaw) * 0.14 * s.s, 0.9 + hop - peck, s.z + Math.cos(yaw) * 0.14 * s.s)
      tmpObject.updateMatrix()
      head.current!.setMatrixAt(i, tmpObject.matrix)
    })
    body.current.instanceMatrix.needsUpdate = true
    head.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={body} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.17, 12, 10]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      <instancedMesh ref={head} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.1, 10, 8]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
    </group>
  )
}
