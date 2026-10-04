'use client'

import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ZONES, materials, tmpObject } from '../shared'
import { edgesOf, zoneAwake } from './util'

const LINE = { x: 1.5, from: 10, to: -22 }

/** STAGE 04 — processing plant, quality control, packaging, cold chain. */
export function Transformation({ color, density }: { color: string; density: number }) {
  const gate = useMemo(() => edgesOf(new THREE.BoxGeometry(3.6, 3.6, 1.2)), [])
  const scan = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!scan.current || !zoneAwake(3)) return
    scan.current.position.y = 0.9 + (Math.sin(state.clock.elapsedTime * 1.6) * 0.5 + 0.5) * 2.4
  })

  return (
    <group position={[0, 0, ZONES.transformation]}>
      {/* Processing hall */}
      <mesh position={[14, 4.5, -4]} material={materials.clayCool}>
        <boxGeometry args={[18, 9, 26]} />
      </mesh>
      <mesh position={[14, 9.2, -4]} material={materials.graphite}>
        <boxGeometry args={[18.4, 0.4, 26.4]} />
      </mesh>
      {/* Continuous glazing — the plant runs 24/7 */}
      {[2.5, 6].map((y) => (
        <mesh key={y} position={[4.95, y, -4]}>
          <boxGeometry args={[0.1, 0.5, 24]} />
          <meshBasicMaterial color="#e9f6ff" toneMapped={false} />
        </mesh>
      ))}
      {/* Roof units */}
      {[-12, -6, 0, 6].map((z) => (
        <mesh key={z} position={[16, 10.2, z - 2]} material={materials.steel}>
          <boxGeometry args={[3, 1.6, 2.4]} />
        </mesh>
      ))}

      {/* Cold store + docks */}
      <mesh position={[-14, 4, -14]} material={materials.clay}>
        <boxGeometry args={[14, 8, 12]} />
      </mesh>
      <mesh position={[-14, 4, -7.95]}>
        <boxGeometry args={[12, 0.25, 0.1]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {[-18, -14, -10].map((x, i) => (
        <group key={x} position={[x, 0, -4 + (i % 2) * 0.6]}>
          <mesh position={[0, 2, 3]} material={materials.clayCool}>
            <boxGeometry args={[2.4, 3, 7]} />
          </mesh>
          <mesh position={[0, 1.5, 7.4]} material={materials.clay}>
            <boxGeometry args={[2.2, 2.2, 1.8]} />
          </mesh>
        </group>
      ))}

      {/* Process line: conveyor + QC gate */}
      <mesh position={[LINE.x, 1.05, (LINE.from + LINE.to) / 2]} material={materials.graphite}>
        <boxGeometry args={[1.8, 0.2, LINE.from - LINE.to]} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => LINE.to + 1 + i * 2.7).map((z) => (
        <mesh key={z} position={[LINE.x, 0.5, z]} material={materials.steel}>
          <boxGeometry args={[1.6, 1, 0.12]} />
        </mesh>
      ))}
      <lineSegments geometry={gate} position={[LINE.x, 2, -2]}>
        <lineBasicMaterial color={color} />
      </lineSegments>
      <mesh ref={scan} position={[LINE.x, 2, -2]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[3.4, 1.1]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <Packs density={density} />

      <pointLight position={[0, 8, -2]} color={color} intensity={180} distance={50} decay={1.5} />
    </group>
  )
}

function Packs({ density }: { density: number }) {
  const count = Math.round(26 * Math.max(density, 0.6))
  const ref = useRef<THREE.InstancedMesh>(null)
  const length = LINE.from - LINE.to
  useFrame((state) => {
    const mesh = ref.current
    if (!mesh || !zoneAwake(3)) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const z = LINE.from - (((t * 1.6 + (i * length) / count) % length + length) % length)
      // Packs are wrapped once they pass the quality-control gate.
      const packed = z < -2
      tmpObject.position.set(LINE.x, packed ? 1.42 : 1.36, z)
      tmpObject.rotation.set(0, 0, 0)
      tmpObject.scale.set(packed ? 1 : 0.8, packed ? 1 : 0.6, packed ? 1 : 0.8)
      tmpObject.updateMatrix()
      mesh.setMatrixAt(i, tmpObject.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[1, 0.45, 0.75]} />
      <meshStandardMaterial color="#eef3f4" roughness={0.4} />
    </instancedMesh>
  )
}
