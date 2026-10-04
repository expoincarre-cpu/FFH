'use client'

import type { ThreeElements } from '@react-three/fiber'

type GroupProps = ThreeElements['group']

import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ZONES, rng, tmpColor, tmpObject } from '../shared'
import { panels, tiled } from '../textures'
import { darkSteel, galvanized, useConcrete, useFacade, white } from '../props'
import { zoneAwake } from './util'

const RACK = { w: 2.4, h: 3.4, d: 1.5, levels: 6, cols: 5, rows: 3 }
const HALL = { w: 34, d: 40, h: 7, x: 4, z: -2 }

/**
 * STAGE 02 — incubation hall shown as an architectural cutaway: setter
 * cabinets along the walls, trolleys of hatching eggs, the hatching floor with
 * day-old chicks and turkey poults.
 */
export function Hatchery({ color, density }: { color: string; density: number }) {
  const racks = useMemo(() => {
    const out: [number, number][] = []
    const rows = density < 0.5 ? 2 : 3
    const cols = density < 0.5 ? 4 : 6
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push([-1 + r * 5.5, -14 + c * 3.6])
    return out
  }, [density])

  return (
    <group position={[0, 0, ZONES.hatchery]}>
      <Hall color={color} />
      {racks.map(([x, z], i) => (
        <Trolley key={i} position={[x, 0, z]} />
      ))}
      <Eggs racks={racks} />
      <Cabinets />

      {/* Hatching floor */}
      <mesh position={[-3, 0.35, 9]} material={galvanized}>
        <boxGeometry args={[7.2, 0.7, 5.2]} />
      </mesh>
      <mesh position={[-3, 0.71, 9]}>
        <boxGeometry args={[7, 0.02, 5]} />
        <meshStandardMaterial color="#c9b98f" roughness={1} />
      </mesh>
      <Chicks density={density} />

      <pointLight position={[4, 6, -4]} color="#ffd9a0" intensity={140} distance={40} decay={1.5} />
      <pointLight position={[-3, 4, 10]} color="#ffe2b0" intensity={40} distance={16} decay={1.6} />
    </group>
  )
}

function Hall({ color }: { color: string }) {
  const floor = useConcrete('#9fa19c', HALL.w, HALL.d)
  floor.roughness = 0.35
  const wall = useMemo(
    () => new THREE.MeshStandardMaterial({ map: tiled(panels('#e9e6dc'), HALL.d / 8, HALL.h / 8), roughness: 0.7 }),
    [],
  )
  const exterior = useFacade({ wall: '#e4ddc8', cols: 10, rows: 1, band: true, seed: 21, glass: '#c7bfa8' })
  return (
    <group position={[HALL.x, 0, HALL.z]}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]} material={floor}>
        <planeGeometry args={[HALL.w, HALL.d]} />
      </mesh>
      {/* Back and right walls (cutaway on the camera side) */}
      <mesh position={[0, HALL.h / 2, -HALL.d / 2]} material={wall}>
        <boxGeometry args={[HALL.w, HALL.h, 0.3]} />
      </mesh>
      <mesh position={[HALL.w / 2, HALL.h / 2, 0]} material={[exterior, wall, wall, wall, wall, wall]}>
        <boxGeometry args={[0.3, HALL.h, HALL.d]} />
      </mesh>
      {/* Low cut walls on the open sides */}
      <mesh position={[-HALL.w / 2, 0.6, 0]} material={wall}>
        <boxGeometry args={[0.3, 1.2, HALL.d]} />
      </mesh>
      {/* Roof structure: steel trusses, roof removed */}
      {Array.from({ length: 6 }, (_, i) => -HALL.d / 2 + 4 + i * 6.6).map((z) => (
        <group key={z} position={[0, HALL.h, z]}>
          <mesh material={darkSteel}>
            <boxGeometry args={[HALL.w, 0.35, 0.25]} />
          </mesh>
          {/* LED line under each truss */}
          <mesh position={[0, -0.3, 0]}>
            <boxGeometry args={[HALL.w * 0.8, 0.08, 0.16]} />
            <meshBasicMaterial color="#fff1d6" toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* Air handling duct */}
      <mesh position={[0, HALL.h - 0.8, -HALL.d / 2 + 1.6]} rotation-z={Math.PI / 2} material={galvanized}>
        <cylinderGeometry args={[0.55, 0.55, HALL.w - 1, 20]} />
      </mesh>
      <mesh position={[HALL.w / 2 - 1.2, 0.02, 4]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.15, HALL.d - 4]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** Setter / hatcher cabinets lining the back wall. */
function Cabinets() {
  const display = useMemo(() => new THREE.MeshBasicMaterial({ color: '#8fe0a8', toneMapped: false }), [])
  return (
    <group position={[HALL.x, 0, HALL.z - HALL.d / 2 + 1.6]}>
      {Array.from({ length: 6 }, (_, i) => -HALL.w / 2 + 3.5 + i * 5.2).map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 2.4, 0]} material={white}>
            <boxGeometry args={[4.6, 4.8, 2.6]} />
          </mesh>
          {[-1.15, 1.15].map((dx) => (
            <mesh key={dx} position={[dx, 2.3, 1.31]} material={darkSteel}>
              <boxGeometry args={[2.1, 4.2, 0.03]} />
            </mesh>
          ))}
          <mesh position={[0, 4.45, 1.33]} material={display}>
            <planeGeometry args={[0.7, 0.18]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Stainless trolley holding egg trays. */
function Trolley(props: GroupProps) {
  const { w, h, d, levels } = RACK
  return (
    <group {...props}>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[(sx * w) / 2, h / 2 + 0.3, (sz * d) / 2]} material={galvanized}>
            <boxGeometry args={[0.07, h, 0.07]} />
          </mesh>
        )),
      )}
      {Array.from({ length: levels }, (_, l) => 0.42 + l * (h / levels)).map((y) => (
        <mesh key={y} position={[0, y, 0]} material={galvanized}>
          <boxGeometry args={[w, 0.04, d]} />
        </mesh>
      ))}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`w${sx}${sz}`} position={[(sx * w) / 2, 0.14, (sz * d) / 2]} material={darkSteel}>
            <sphereGeometry args={[0.13, 8, 6]} />
          </mesh>
        )),
      )}
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
        const y = 0.6 + l * (RACK.h / RACK.levels)
        for (let a = 0; a < RACK.cols; a++)
          for (let b = 0; b < RACK.rows; b++) {
            tmpObject.position.set(x - RACK.w / 2 + 0.3 + a * 0.45, y, z - RACK.d / 2 + 0.35 + b * 0.4)
            tmpObject.rotation.set((r() - 0.5) * 0.2, 0, (r() - 0.5) * 0.2)
            tmpObject.scale.set(1, 1.3, 1)
            tmpObject.updateMatrix()
            mesh.setMatrixAt(i, tmpObject.matrix)
            mesh.setColorAt(i, tmpColor.set(r() > 0.5 ? '#f1e6d2' : '#dcc29c'))
            i++
          }
      }
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [racks])

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.15, 14, 10]} />
      <meshPhysicalMaterial roughness={0.55} sheen={0.4} sheenColor="#fff4e0" clearcoat={0.15} />
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
      tmpObject.position.set(s.x, 0.88 + hop, s.z)
      tmpObject.rotation.set(0, yaw, 0)
      tmpObject.scale.set(s.s, s.s * 0.9, s.s * 1.15)
      tmpObject.updateMatrix()
      body.current!.setMatrixAt(i, tmpObject.matrix)
      const peck = Math.max(0, Math.sin(t * 1.7 + s.ph * 2)) * 0.08
      tmpObject.position.set(s.x + Math.sin(yaw) * 0.15 * s.s, 1.1 + hop - peck, s.z + Math.cos(yaw) * 0.15 * s.s)
      tmpObject.scale.setScalar(s.s)
      tmpObject.updateMatrix()
      head.current!.setMatrixAt(i, tmpObject.matrix)
    })
    body.current.instanceMatrix.needsUpdate = true
    head.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={body} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.17, 14, 10]} />
        <meshPhysicalMaterial roughness={1} sheen={1} sheenRoughness={0.8} sheenColor="#fff2c0" />
      </instancedMesh>
      <instancedMesh ref={head} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.1, 12, 8]} />
        <meshPhysicalMaterial roughness={1} sheen={1} sheenRoughness={0.8} sheenColor="#fff2c0" />
      </instancedMesh>
    </group>
  )
}
