'use client'

import * as THREE from 'three'
import { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ZONES, rng, tmpColor, tmpObject } from '../shared'
import { darkSteel, galvanized, white } from '../props'
import { zoneAwake } from './util'

/** STAGE 05 — finished food: a rising spiral of products, shelves, the market. */
export function Food({ color, density }: { color: string; density: number }) {
  const spiral = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (spiral.current && zoneAwake(4)) spiral.current.rotation.y += dt * 0.08
  })

  return (
    <group position={[0, 0, ZONES.food]}>
      <mesh position={[-6, 0.15, 0]} material={darkSteel}>
        <cylinderGeometry args={[7, 7.2, 0.3, 64]} />
      </mesh>
      <group ref={spiral} position={[-6, 0.3, 0]}>
        <Trays color={color} density={density} />
      </group>
      <Shelves color={color} density={density} />
      <pointLight position={[-6, 9, 4]} color={color} intensity={200} distance={40} decay={1.4} />
      <pointLight position={[8, 5, 8]} color="#ffd8b0" intensity={60} distance={30} decay={1.5} />
    </group>
  )
}

function Trays({ color, density }: { color: string; density: number }) {
  const count = Math.round(150 * Math.max(density, 0.5))
  const tray = useRef<THREE.InstancedMesh>(null)
  const meat = useRef<THREE.InstancedMesh>(null)
  const label = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    if (!tray.current || !meat.current || !label.current) return
    const r = rng(52)
    const cuts = ['#e8b9a0', '#f0c7ae', '#d99c80', '#e3ad8f']
    const labels = [color, '#0f3525', '#d1b572']
    for (let i = 0; i < count; i++) {
      const k = i / count
      const a = k * Math.PI * 2 * 4.2
      const rad = 5.6 - k * 3.4
      tmpObject.position.set(Math.cos(a) * rad, 0.4 + k * 13, Math.sin(a) * rad)
      tmpObject.rotation.set(0, -a, (r() - 0.5) * 0.1)
      tmpObject.scale.setScalar(1 - k * 0.35)
      tmpObject.updateMatrix()
      tray.current.setMatrixAt(i, tmpObject.matrix)
      meat.current.setMatrixAt(i, tmpObject.matrix)
      label.current.setMatrixAt(i, tmpObject.matrix)
      meat.current.setColorAt(i, tmpColor.set(cuts[Math.floor(r() * cuts.length)]))
      label.current.setColorAt(i, tmpColor.set(labels[i % labels.length]))
    }
    for (const m of [tray.current, meat.current, label.current]) {
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
  }, [color, count])
  return (
    <group>
      <instancedMesh ref={tray} args={[trayGeo, undefined, count]}>
        <meshStandardMaterial color="#f3f1ec" roughness={0.35} />
      </instancedMesh>
      <instancedMesh ref={meat} args={[meatGeo, undefined, count]}>
        <meshPhysicalMaterial roughness={0.45} clearcoat={0.6} clearcoatRoughness={0.2} />
      </instancedMesh>
      <instancedMesh ref={label} args={[labelGeo, undefined, count]}>
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
    </group>
  )
}

const trayGeo = new THREE.BoxGeometry(1.3, 0.16, 0.9)
const meatGeo = (() => {
  const g = new THREE.SphereGeometry(1, 16, 8)
  g.scale(0.55, 0.16, 0.36)
  g.translate(0, 0.1, 0)
  return g
})()
const labelGeo = new THREE.BoxGeometry(0.5, 0.02, 0.3).translate(0.32, 0.27, 0.12)

/** Retail shelving — where the chain meets consumers. */
function Shelves({ color, density }: { color: string; density: number }) {
  const rows = [8, 13, 18]
  const perShelf = Math.round(36 * Math.max(density, 0.5))
  const count = rows.length * 3 * perShelf
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const r = rng(77)
    const tones = [new THREE.Color(color), new THREE.Color('#e9dfcd'), new THREE.Color('#b8925a'), new THREE.Color('#8e9c5c')]
    let i = 0
    rows.forEach((x) => {
      for (let level = 0; level < 3; level++)
        for (let k = 0; k < perShelf; k++) {
          tmpObject.position.set(x + (r() > 0.5 ? 0.45 : -0.45), 0.8 + level * 1.1, -12 + (k / perShelf) * 24)
          tmpObject.rotation.set(0, 0, 0)
          tmpObject.scale.set(1, 0.6 + r() * 0.6, 1)
          tmpObject.updateMatrix()
          mesh.setMatrixAt(i, tmpObject.matrix)
          mesh.setColorAt(i, tmpColor.copy(tones[Math.floor(r() * tones.length)]))
          i++
        }
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [color, perShelf])
  return (
    <group>
      {/* Refrigerated display bodies */}
      {rows.map((x) => (
        <group key={`body-${x}`} position={[x, 0, 0]}>
          <mesh position={[0, 0.2, 0]} material={white}>
            <boxGeometry args={[2, 0.4, 25.4]} />
          </mesh>
          <mesh position={[0, 2.1, 0]} material={white}>
            <boxGeometry args={[0.3, 4.2, 25.4]} />
          </mesh>
          <mesh position={[0, 4.15, 0]}>
            <boxGeometry args={[2, 0.12, 25.4]} />
            <meshBasicMaterial color="#fff6e6" toneMapped={false} />
          </mesh>
        </group>
      ))}
      {rows.map((x) =>
        [0, 1, 2].map((level) => (
          <mesh key={`${x}-${level}`} position={[x, 0.5 + level * 1.1, 0]} material={galvanized}>
            <boxGeometry args={[1.8, 0.06, 25]} />
          </mesh>
        )),
      )}
      <instancedMesh ref={ref} args={[undefined, undefined, count]}>
        <boxGeometry args={[0.6, 0.5, 0.5]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
    </group>
  )
}
