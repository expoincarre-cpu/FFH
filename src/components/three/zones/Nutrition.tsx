'use client'

import type { ThreeElements } from '@react-three/fiber'

type GroupProps = ThreeElements['group']

import * as THREE from 'three'
import { useMemo } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { ZONES, rng } from '../shared'
import { asphalt, tiled } from '../textures'
import { Palms, Trees, Truck, darkSteel, galvanized, row, useCladding, useConcrete, useFacade } from '../props'
import { zoneAwake } from './util'

/**
 * STAGE 01 — SOFALIM feed mill, modelled on the aerial photograph of the site:
 * green-clad mill tower with its concrete core, a battery of galvanised silos
 * under a conveyor gallery, the orange production block, offices, palms.
 */
export function Nutrition({ color, density }: { color: string; density: number }) {
  return (
    <group position={[0, 0, ZONES.nutrition]}>
      <MillTower />
      <SiloBattery density={density} />
      <OrangeBlock />
      <Offices />
      <Warehouse />
      <SiteGround />
      <Palms spots={[...row([-34, 15], [-8, 15], 7, 1.2, 3), ...row([-4, 21], [20, 21], 5, 1.5, 4), [-12, 8], [-20, 9]]} seed={5} />
      <Trees spots={row([-40, 26], [44, 26], density < 0.5 ? 10 : 18, 2, 6)} seed={7} size={1.1} />
      <Trees
        spots={row([24, 22], [44, 22], density < 0.5 ? 6 : 12, 1.4, 8)}
        seed={9}
        size={0.55}
        trunk={false}
        colors={['#a8366e', '#b9457c', '#5d7440']}
      />
      <Truck kind="bulk" cab="#f0ece2" position={[19.7, 0, 6.3]} />
      <Truck kind="bulk" cab="#d9d4c6" position={[30, 0, 3]} rotation-y={Math.PI / 2} />
      <GrainStream color={color} density={density} />
    </group>
  )
}

/** Green corrugated mill tower, lower annex, concrete core and SOFALIM sign. */
function MillTower() {
  const green = useCladding('#7f9f5f', 9, 28)
  const greenLow = useCladding('#86a566', 9, 12)
  const core = useConcrete('#d3c9a2', 4, 26)
  const coreFacade = useFacade({ wall: '#d3c9a2', cols: 2, rows: 9, seed: 4 })
  const sign = useLoader(THREE.TextureLoader, '/brand/companies/sofalim.webp')
  sign.colorSpace = THREE.SRGBColorSpace
  return (
    <group>
      <mesh position={[0, 14, 0]} material={green}>
        <boxGeometry args={[9, 28, 10]} />
      </mesh>
      {/* Parapet + rooftop plant room */}
      <mesh position={[0, 28.3, 0]} material={darkSteel}>
        <boxGeometry args={[9.2, 0.6, 10.2]} />
      </mesh>
      <mesh position={[1.5, 29.6, -1]} material={core}>
        <boxGeometry args={[4, 2.2, 4]} />
      </mesh>
      {/* Concrete core with window slits */}
      <mesh position={[-5.6, 13, 1.8]} material={[core, core, core, core, coreFacade, coreFacade]}>
        <boxGeometry args={[3.8, 26, 3.8]} />
      </mesh>
      {/* Lower green annex */}
      <mesh position={[8.2, 6, 1]} material={greenLow}>
        <boxGeometry args={[8, 12, 10]} />
      </mesh>
      <mesh position={[8.2, 12.2, 1]} material={darkSteel}>
        <boxGeometry args={[8.2, 0.4, 10.2]} />
      </mesh>
      {/* Rooftop SOFALIM sign */}
      <group position={[-2.2, 31.2, 4.6]}>
        <mesh position={[0, 0, -0.06]}>
          <boxGeometry args={[6.4, 2.7, 0.1]} />
          <meshStandardMaterial color="#f4f1e8" roughness={0.6} />
        </mesh>
        <mesh>
          <planeGeometry args={[6, 2.44]} />
          <meshStandardMaterial map={sign} transparent roughness={0.6} />
        </mesh>
        {[-2.6, 2.6].map((x) => (
          <mesh key={x} position={[x, -1.8, -0.2]} material={darkSteel}>
            <boxGeometry args={[0.12, 1.2, 0.12]} />
          </mesh>
        ))}
      </group>
      {/* Low office block in front of the tower */}
      <OfficeBlock position={[-3, 0, 9]} size={[10, 7, 6]} cols={6} rows={3} />
    </group>
  )
}

function OfficeBlock({ size, cols, rows, ...props }: { size: [number, number, number]; cols: number; rows: number } & GroupProps) {
  const [w, h, d] = size
  const front = useFacade({ wall: '#e3dcc6', cols, rows, seed: cols * 3 + rows })
  const side = useFacade({ wall: '#e3dcc6', cols: Math.max(2, Math.round((cols * d) / w)), rows, seed: cols + rows })
  const roof = useConcrete('#cfc8b4', w, d)
  return (
    <group {...props}>
      <mesh position={[0, h / 2, 0]} material={[side, side, roof, roof, front, front]}>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      <mesh position={[0, h + 0.2, 0]} material={roof}>
        <boxGeometry args={[w + 0.2, 0.4, d + 0.2]} />
      </mesh>
    </group>
  )
}

/** Seven galvanised silos under a conveyor gallery, with the bucket-elevator tower. */
function SiloBattery({ density }: { density: number }) {
  const silo = useCladding('#b9bec0', 17, 11, 3)
  silo.metalness = 0.65
  silo.roughness = 0.4
  const count = density < 0.5 ? 5 : 7
  const xs = Array.from({ length: count }, (_, i) => 17 + i * 5.4)
  const end = xs[xs.length - 1]
  return (
    <group position={[0, 0, -4]}>
      {xs.map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.6, 0]} material={darkSteel}>
            <cylinderGeometry args={[2.75, 2.75, 1.2, 36]} />
          </mesh>
          <mesh position={[0, 6.7, 0]} material={silo}>
            <cylinderGeometry args={[2.6, 2.6, 11, 48, 1]} />
          </mesh>
          <mesh position={[0, 13.4, 0]} material={galvanized}>
            <coneGeometry args={[2.68, 2.4, 48, 1]} />
          </mesh>
          {[3.4, 7.2, 10.9].map((y) => (
            <mesh key={y} position={[0, y, 0]} material={darkSteel}>
              <torusGeometry args={[2.62, 0.06, 6, 48]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Conveyor gallery across the silo tops */}
      <mesh position={[(xs[0] + end) / 2 - 2, 15.3, 0]} material={galvanized}>
        <boxGeometry args={[end - xs[0] + 9, 1.3, 1.6]} />
      </mesh>
      <mesh position={[(xs[0] + end) / 2 - 2, 16.05, 0]} material={darkSteel}>
        <boxGeometry args={[end - xs[0] + 9, 0.1, 1.9]} />
      </mesh>
      {/* Bridge from the gallery into the mill annex */}
      <mesh position={[11.5, 15.6, 2]} rotation-y={-0.3} material={galvanized}>
        <boxGeometry args={[6.5, 1.2, 1.4]} />
      </mesh>
      <LatticeTower position={[13.6, 0, -1]} height={19} />
      <LatticeTower position={[end + 4.5, 0, 0]} height={16} />
    </group>
  )
}

/** Steel lattice elevator tower: four legs with cross bracing. */
function LatticeTower({ height, ...props }: { height: number } & GroupProps) {
  const geo = useMemo(() => {
    const pts: number[] = []
    const s = 1.1
    const legs = [
      [-s, -s],
      [s, -s],
      [s, s],
      [-s, s],
    ]
    legs.forEach(([x, z]) => pts.push(x, 0, z, x, height, z))
    const step = 1.6
    for (let y = 0; y < height; y += step)
      for (let i = 0; i < 4; i++) {
        const [x1, z1] = legs[i]
        const [x2, z2] = legs[(i + 1) % 4]
        pts.push(x1, y, z1, x2, y, z2)
        pts.push(x1, y, z1, x2, Math.min(y + step, height), z2)
      }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [height])
  return (
    <group {...props}>
      <lineSegments geometry={geo}>
        <lineBasicMaterial color="#9aa3a3" />
      </lineSegments>
      <mesh position={[0, height + 0.8, 0]} material={galvanized}>
        <boxGeometry args={[2.8, 1.6, 2.8]} />
      </mesh>
    </group>
  )
}

/** The orange production block (left of the mill in the photograph). */
function OrangeBlock() {
  const orange = useConcrete('#d65a2c', 10, 15)
  const orangeDark = useConcrete('#c44f26', 7, 13)
  return (
    <group position={[-17, 0, -6]}>
      <mesh position={[0, 7.5, 0]} material={orange}>
        <boxGeometry args={[10, 15, 9]} />
      </mesh>
      <mesh position={[-7.5, 6.5, 1]} material={orangeDark}>
        <boxGeometry args={[6, 13, 8]} />
      </mesh>
      {/* Recessed vertical joints */}
      {[-2.5, 0, 2.5].map((x) => (
        <mesh key={x} position={[x, 7.5, 4.52]}>
          <boxGeometry args={[0.12, 15, 0.04]} />
          <meshStandardMaterial color="#a8441f" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function Offices() {
  return (
    <group>
      <OfficeBlock position={[-34, 0, 2]} size={[16, 7.5, 9]} cols={10} rows={3} />
      <OfficeBlock position={[-30, 0, 13]} size={[11, 3.6, 6]} cols={7} rows={1} />
    </group>
  )
}

/** Large storage hall with a pale roof (bottom right of the photograph). */
function Warehouse() {
  const walls = useFacade({ wall: '#e8e3d4', cols: 8, rows: 2, band: true, seed: 12, glass: '#b9b4a4' })
  const roof = useCladding('#d9d6cc', 28, 15, 2)
  return (
    <group position={[33, 0, 10]}>
      <mesh position={[0, 3.5, 0]} material={walls}>
        <boxGeometry args={[28, 7, 14]} />
      </mesh>
      <mesh position={[0, 7.4, 0]} rotation-x={Math.PI / 2} material={roof}>
        <planeGeometry args={[28.6, 14.6]} />
      </mesh>
      <mesh position={[0, 7.25, 0]} material={roof}>
        <boxGeometry args={[28.6, 0.3, 14.6]} />
      </mesh>
    </group>
  )
}

/** Yard paving, access road and planted verge. */
function SiteGround() {
  const road = useMemo(() => tiled(asphalt(), 22, 1), [])
  const yard = useConcrete('#b8b0a0', 90, 34)
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[2, 0.02, 2]} material={yard}>
        <planeGeometry args={[90, 34]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.04, 23.5]}>
        <planeGeometry args={[130, 7]} />
        <meshStandardMaterial map={road} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.12, 19.6]}>
        <boxGeometry args={[130, 0.24, 0.6]} />
        <meshStandardMaterial color="#d8d2c2" roughness={0.9} />
      </mesh>
      {/* Lawn in front of the offices */}
      <mesh rotation-x={-Math.PI / 2} position={[-18, 0.05, 15]}>
        <planeGeometry args={[18, 6]} />
        <meshStandardMaterial color="#5f7d3e" roughness={1} />
      </mesh>
    </group>
  )
}

/** Grain loading from the silo outlet into a bulk truck — GPU-animated points. */
function GrainStream({ color, density }: { color: string; density: number }) {
  const count = Math.round(900 * Math.max(density, 0.3))
  const origin = new THREE.Vector3(19.7, 0, 4)
  const geometry = useMemo(() => {
    const r = rng(11)
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2
      const rad = Math.sqrt(r()) * 0.35
      pos[i * 3] = origin.x + Math.cos(a) * rad
      pos[i * 3 + 2] = origin.z + Math.sin(a) * rad
      seed[i] = r()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    return g
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color).multiplyScalar(1.1) } },
        vertexShader: /* glsl */ `
          uniform float uTime;
          attribute float aSeed;
          varying float vA;
          void main() {
            vec3 p = position;
            float h = mod(aSeed * 6.0 + uTime * (4.0 + aSeed * 2.0), 6.0);
            p.y = 9.5 - h;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (1.6 + aSeed * 1.6) * (30.0 / -mv.z);
            vA = smoothstep(0.0, 0.6, h) * smoothstep(6.0, 5.0, h);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying float vA;
          void main() {
            if (length(gl_PointCoord - 0.5) > 0.5) discard;
            gl_FragColor = vec4(uColor, vA);
          }
        `,
      }),
    [color],
  )
  useFrame((state) => {
    if (zoneAwake(0)) material.uniforms.uTime.value = state.clock.elapsedTime
  })
  return (
    <group>
      {/* Truck loading bin on legs, fed from the gallery */}
      <mesh position={[origin.x, 12.2, origin.z]} material={galvanized}>
        <boxGeometry args={[3.2, 2.6, 3.2]} />
      </mesh>
      <mesh position={[origin.x, 10.3, origin.z]} rotation-x={Math.PI} material={galvanized}>
        <coneGeometry args={[1.6, 1.4, 4]} />
      </mesh>
      {[-1.5, 1.5].flatMap((x) => [-1.5, 1.5].map((z) => (
        <mesh key={`${x}${z}`} position={[origin.x + x, 5.6, origin.z + z]} material={darkSteel}>
          <boxGeometry args={[0.22, 11.2, 0.22]} />
        </mesh>
      )))}
      <mesh position={[origin.x, 14.3, origin.z - 3]} material={galvanized}>
        <boxGeometry args={[0.9, 0.9, 5.5]} />
      </mesh>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  )
}
