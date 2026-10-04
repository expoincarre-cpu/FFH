'use client'

import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { curveParam, journey } from './state'
import {
  STATIONS,
  STATION_BG,
  STATION_FOG,
  ZONE_LIST,
  rng,
  threadCurve,
  threadPoint,
  tmpColor,
  tmpObject,
  zoneStops,
  materials,
} from './shared'
import { Nutrition } from './zones/Nutrition'
import { Hatchery } from './zones/Hatchery'
import { Farming } from './zones/Farming'
import { Transformation } from './zones/Transformation'
import { Food } from './zones/Food'

export type WorldProps = {
  /** Stage accent colours, from the CMS (nutrition → food). */
  colors: string[]
  /** Geometry density multiplier for the device tier (0–1). */
  density: number
  /** Ambient particle count. */
  particles: number
}

const posCurve = new THREE.CatmullRomCurve3(STATIONS.map((s) => new THREE.Vector3(...s.pos)), false, 'centripetal', 0.5)
const tgtCurve = new THREE.CatmullRomCurve3(STATIONS.map((s) => new THREE.Vector3(...s.target)), false, 'centripetal', 0.5)
const bgColors = STATION_BG.map((c) => new THREE.Color(c))

/* ----------------------------------------------------------------- CAMERA */

function CameraRig() {
  const { camera, scene } = useThree()
  const p = useMemo(() => new THREE.Vector3(), [])
  const t = useMemo(() => new THREE.Vector3(), [])
  const look = useMemo(() => new THREE.Vector3(...STATIONS[0].target), [])
  const pointer = useMemo(() => new THREE.Vector2(), [])
  const bg = useMemo(() => new THREE.Color(STATION_BG[0]), [])
  const fog = useMemo(() => new THREE.Fog(STATION_BG[0], STATION_FOG[0][0], STATION_FOG[0][1]), [])

  useMemo(() => {
    scene.background = bg
    scene.fog = fog
  }, [scene, bg, fog])

  useFrame((state, dt) => {
    const delta = Math.min(dt, 0.1)
    journey.smooth = THREE.MathUtils.damp(journey.smooth, journey.progress, 2.6, delta)
    const u = curveParam(journey.smooth)
    posCurve.getPoint(u, p)
    tgtCurve.getPoint(u, t)

    const time = state.clock.elapsedTime
    pointer.lerp(journey.pointer as unknown as THREE.Vector2, 1 - Math.exp(-3 * delta))
    p.x += Math.sin(time * 0.13) * 0.8 + pointer.x * 1.6
    p.y += Math.cos(time * 0.11) * 0.4 + pointer.y * 0.8
    camera.position.copy(p)
    look.lerp(t, 1 - Math.exp(-6 * delta))
    camera.lookAt(look)

    // Atmosphere follows the stage.
    const f = u * (STATIONS.length - 1)
    const i = Math.min(Math.floor(f), STATIONS.length - 2)
    const k = f - i
    bg.copy(bgColors[i]).lerp(bgColors[i + 1], k)
    fog.color.copy(bg)
    fog.near = THREE.MathUtils.lerp(STATION_FOG[i][0], STATION_FOG[i + 1][0], k)
    fog.far = THREE.MathUtils.lerp(STATION_FOG[i][1], STATION_FOG[i + 1][1], k)
  })
  return null
}

/* ----------------------------------------------------------------- GROUND */

function Ground({ color }: { color: string }) {
  const grid = useMemo(() => {
    const g = new THREE.GridHelper(900, 225, color, color)
    const m = g.material as THREE.LineBasicMaterial
    m.transparent = true
    m.opacity = 0.07
    m.depthWrite = false
    g.position.set(0, 0.01, -120)
    return g
  }, [color])

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -120]} material={materials.ground}>
        <planeGeometry args={[900, 900]} />
      </mesh>
      <primitive object={grid} />
    </group>
  )
}

/* -------------------------------------------------------- VALUE-CHAIN THREAD */

const threadVertex = /* glsl */ `
  varying vec2 vUv;
  #include <fog_pars_vertex>
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`

const threadFragment = /* glsl */ `
  uniform vec3 uColors[5];
  uniform float uStops[5];
  uniform float uProgress;
  uniform float uTime;
  varying vec2 vUv;
  #include <fog_pars_fragment>
  void main() {
    float x = vUv.x;
    vec3 col = uColors[0];
    for (int i = 1; i < 5; i++) {
      float mid = (uStops[i - 1] + uStops[i]) * 0.5;
      col = mix(col, uColors[i], smoothstep(mid - 0.03, mid + 0.03, x));
    }
    float lit = 1.0 - smoothstep(uProgress - 0.004, uProgress + 0.03, x);
    float pulse = 0.5 + 0.5 * sin((x * 160.0) - uTime * 3.0);
    float head = exp(-abs(x - uProgress) * 140.0);
    vec3 dim = col * 0.22;
    vec3 c = mix(dim, col * (1.15 + pulse * 0.25), lit) + head * 1.4;
    gl_FragColor = vec4(c, 1.0);
    #include <fog_fragment>
  }
`

function Thread({ colors }: { colors: string[] }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: threadVertex,
        fragmentShader: threadFragment,
        fog: true,
        uniforms: THREE.UniformsUtils.merge([
          THREE.UniformsLib.fog,
          {
            uColors: { value: colors.map((c) => new THREE.Color(c)) },
            uStops: { value: zoneStops },
            uProgress: { value: 0 },
            uTime: { value: 0 },
          },
        ]),
      }),
    [colors],
  )
  const geometry = useMemo(() => new THREE.TubeGeometry(threadCurve, 900, 0.09, 6, false), [])

  useFrame((state) => {
    const u = curveParam(journey.smooth)
    // Light the thread up to the stage the visitor has reached.
    const reach = u < 1 / 7 ? 0.08 : THREE.MathUtils.lerp(0.08, 1, Math.min(1, (u - 1 / 7) / (5 / 7)))
    material.uniforms.uProgress.value = reach
    material.uniforms.uTime.value = state.clock.elapsedTime
  })

  return <mesh geometry={geometry} material={material} />
}

/** Stage markers — survey rings on the ground at each zone. */
function ZoneRings({ colors }: { colors: string[] }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    ref.current?.children.forEach((child, i) => {
      const pulse = child.children[1] as THREE.Mesh
      const s = 1 + ((state.clock.elapsedTime * 0.15 + i * 0.2) % 1) * 0.25
      pulse.scale.setScalar(s)
      ;(pulse.material as THREE.MeshBasicMaterial).opacity = 0.35 * (1 - (s - 1) / 0.25)
    })
  })
  return (
    <group ref={ref}>
      {ZONE_LIST.map((z, i) => (
        <group key={z} position={[0, 0.03, z]} rotation-x={-Math.PI / 2}>
          <mesh>
            <ringGeometry args={[19, 19.12, 160]} />
            <meshBasicMaterial color={colors[i]} transparent opacity={0.55} depthWrite={false} />
          </mesh>
          <mesh>
            <ringGeometry args={[19, 19.06, 160]} />
            <meshBasicMaterial color={colors[i]} transparent opacity={0.3} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ------------------------------------------------------- FLOW ALONG THREAD */

/**
 * Units flowing down the chain: grain → egg → chick → bird → pack.
 * Their colour and scale change with the stage they are passing through.
 */
function Flow({ colors, density }: { colors: string[]; density: number }) {
  const count = Math.round(220 * Math.max(density, 0.4))
  const ref = useRef<THREE.InstancedMesh>(null)
  const seeds = useMemo(() => {
    const r = rng(7)
    return Array.from({ length: count }, () => ({ o: r(), a: r() * Math.PI * 2, d: 0.25 + r() * 0.45 }))
  }, [count])
  const palette = useMemo(() => colors.map((c) => new THREE.Color(c)), [colors])
  const p = useMemo(() => new THREE.Vector3(), [])

  useFrame((state) => {
    const mesh = ref.current
    if (!mesh) return
    const time = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const s = seeds[i]
      const t = (s.o + time * 0.006) % 1
      threadPoint(t, p)
      let stage = 0
      while (stage < 4 && t > (zoneStops[stage] + zoneStops[stage + 1]) / 2) stage++
      const scale = [0.08, 0.12, 0.13, 0.16, 0.15][stage]
      tmpObject.position.set(p.x + Math.cos(s.a + time * 0.4) * s.d, p.y + 0.25 + Math.sin(time * 1.3 + s.a) * 0.08, p.z + Math.sin(s.a) * s.d)
      tmpObject.scale.set(scale, stage === 1 ? scale * 1.3 : scale, stage === 4 ? scale * 0.8 : scale)
      tmpObject.rotation.set(0, s.a, 0)
      tmpObject.updateMatrix()
      mesh.setMatrixAt(i, tmpObject.matrix)
      mesh.setColorAt(i, tmpColor.copy(palette[stage]).multiplyScalar(1.4))
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

/* ------------------------------------------------------------- ATMOSPHERE */

const dustVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.y += mod(uTime * (0.15 + aSeed * 0.35) + aSeed * 30.0, 30.0);
    p.x += sin(uTime * 0.2 + aSeed * 12.0) * 1.5;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.2 + aSeed * 2.4) * uPixelRatio * (40.0 / -mv.z);
    vAlpha = smoothstep(160.0, 10.0, -mv.z) * (0.25 + aSeed * 0.5);
  }
`
const dustFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(uColor, vAlpha * smoothstep(0.5, 0.0, d));
  }
`

function Dust({ count }: { count: number }) {
  const { gl } = useThree()
  const geometry = useMemo(() => {
    const r = rng(3)
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (r() - 0.5) * 140
      positions[i * 3 + 1] = r() * 4 - 4
      positions[i * 3 + 2] = 30 - r() * 300
      seeds[i] = r()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    return g
  }, [count])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: dustVertex,
        fragmentShader: dustFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: gl.getPixelRatio() },
          uColor: { value: new THREE.Color('#e9d6a6') },
        },
      }),
    [gl],
  )
  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
  })
  return <points geometry={geometry} material={material} frustumCulled={false} />
}

/* ------------------------------------------------------------------ WORLD */

export function World({ colors, density, particles }: WorldProps) {
  return (
    <>
      <CameraRig />
      <hemisphereLight args={['#fff1dc', '#16130f', 1.1]} />
      <directionalLight position={[40, 60, 30]} intensity={2.2} color="#fff4e6" />
      <directionalLight position={[-30, 20, -60]} intensity={0.6} color="#b7c8d4" />

      <Ground color="#d1b572" />
      <Thread colors={colors} />
      <ZoneRings colors={colors} />
      <Flow colors={colors} density={density} />
      <Dust count={particles} />

      <Nutrition color={colors[0]} density={density} />
      <Hatchery color={colors[1]} density={density} />
      <Farming color={colors[2]} density={density} />
      <Transformation color={colors[3]} density={density} />
      <Food color={colors[4]} density={density} />
    </>
  )
}
