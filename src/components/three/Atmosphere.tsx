'use client'

import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { curveParam, journey } from './state'
import { STATIONS, STATION_BG, STATION_FOG } from './shared'

/**
 * Physically based atmosphere: gradient sky dome with sun glow, image-based
 * lighting generated from that sky, a shadow-casting sun that follows the
 * camera, hemisphere fill and distance fog. Blends between a Moroccan daylight
 * look (light theme) and a warm dusk with lit windows (dark theme).
 */

type Palette = {
  zenith: string
  horizon: string
  ground: string
  sun: string
  sunIntensity: number
  elevation: number
  hemiSky: string
  hemiGround: string
  hemi: number
  env: number
  exposure: number
  fogScale: number
}

const DAY: Palette = {
  zenith: '#5f93c4',
  horizon: '#e6e2d2',
  ground: '#a89878',
  sun: '#fff0d6',
  sunIntensity: 3.4,
  elevation: 0.85,
  hemiSky: '#cfe0ee',
  hemiGround: '#8c7a5c',
  hemi: 1.0,
  env: 0.9,
  exposure: 1.0,
  fogScale: 2.2,
}

const DUSK: Palette = {
  zenith: '#0b1714',
  horizon: '#4a3a28',
  ground: '#121614',
  sun: '#ffab6b',
  sunIntensity: 1.6,
  elevation: 0.2,
  hemiSky: '#3c5a52',
  hemiGround: '#0f1210',
  hemi: 0.55,
  env: 0.35,
  exposure: 0.95,
  fogScale: 1,
}

const SUN_AZIMUTH = 0.75

function sunDirection(elevation: number, out = new THREE.Vector3()) {
  return out.set(Math.cos(SUN_AZIMUTH) * Math.cos(elevation), Math.sin(elevation), -Math.sin(SUN_AZIMUTH) * Math.cos(elevation)).normalize()
}

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * p;
    gl_Position.z = gl_Position.w; // always at the far plane
  }
`
const skyFragment = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uGround;
  uniform vec3 uSunColor;
  uniform vec3 uSunDir;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    vec3 sky = mix(uHorizon, uZenith, pow(smoothstep(0.0, 0.55, h), 0.7));
    vec3 col = h > 0.0 ? sky : mix(uHorizon, uGround, smoothstep(0.0, -0.08, h));
    float s = max(dot(d, uSunDir), 0.0);
    col += uSunColor * (pow(s, 600.0) * 4.0 + pow(s, 12.0) * 0.25);
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

function makeSkyMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: skyVertex,
    fragmentShader: skyFragment,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uZenith: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uGround: { value: new THREE.Color() },
      uSunColor: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3() },
    },
  })
}

function applyPalette(m: THREE.ShaderMaterial, p: Palette) {
  m.uniforms.uZenith.value.set(p.zenith)
  m.uniforms.uHorizon.value.set(p.horizon)
  m.uniforms.uGround.value.set(p.ground)
  m.uniforms.uSunColor.value.set(p.sun)
  sunDirection(p.elevation, m.uniforms.uSunDir.value)
}

/** Pre-filtered environment maps for both looks (reflections on steel, glass, eggs). */
function useEnvironments() {
  const { gl } = useThree()
  return useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const make = (p: Palette) => {
      const scene = new THREE.Scene()
      const mat = makeSkyMaterial()
      applyPalette(mat, p)
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), mat))
      const rt = pmrem.fromScene(scene, 0.02)
      mat.dispose()
      return rt.texture
    }
    const env = { day: make(DAY), dusk: make(DUSK) }
    pmrem.dispose()
    return env
  }, [gl])
}

export function Atmosphere({ shadowSize }: { shadowSize: number }) {
  const { scene, camera, gl } = useThree()
  const env = useEnvironments()
  const sky = useMemo(makeSkyMaterial, [])
  const dome = useRef<THREE.Mesh>(null)
  const sun = useRef<THREE.DirectionalLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const fog = useMemo(() => new THREE.Fog('#000', 20, 200), [])
  const mix = useRef(journey.theme === 'light' ? 1 : 0)
  const tmp = useMemo(
    () => ({ a: new THREE.Color(), b: new THREE.Color(), dir: new THREE.Vector3(), focus: new THREE.Vector3(), stage: new THREE.Color() }),
    [],
  )
  const glowMaterials = useRef<THREE.MeshStandardMaterial[]>([])
  const bgColors = useMemo(() => STATION_BG.map((c) => new THREE.Color(c)), [])

  useEffect(() => {
    scene.fog = fog
    scene.background = null
    const list: THREE.MeshStandardMaterial[] = []
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.Material[]
      const lit = mats.some((m) => (m as THREE.MeshStandardMaterial).isMeshStandardMaterial)
      const solid = mats.every((m) => !m.transparent)
      if (lit && !mesh.userData.noShadow) {
        mesh.castShadow = solid
        mesh.receiveShadow = true
      }
      mats.forEach((m) => {
        if (m.userData?.nightGlow && !list.includes(m as THREE.MeshStandardMaterial)) list.push(m as THREE.MeshStandardMaterial)
      })
    })
    glowMaterials.current = list
    if (sun.current) scene.add(sun.current.target)
  }, [scene, fog])

  useFrame((_, dt) => {
    const target = journey.theme === 'light' ? 1 : 0
    mix.current = THREE.MathUtils.damp(mix.current, target, 2.2, Math.min(dt, 0.1))
    const m = mix.current
    const lerpC = (a: string, b: string) => tmp.a.set(a).lerp(tmp.b.set(b), m)
    const lerpN = (a: number, b: number) => a + (b - a) * m

    // Sky
    sky.uniforms.uZenith.value.copy(lerpC(DUSK.zenith, DAY.zenith))
    sky.uniforms.uHorizon.value.copy(lerpC(DUSK.horizon, DAY.horizon))
    sky.uniforms.uGround.value.copy(lerpC(DUSK.ground, DAY.ground))
    sky.uniforms.uSunColor.value.copy(lerpC(DUSK.sun, DAY.sun))
    sunDirection(lerpN(DUSK.elevation, DAY.elevation), tmp.dir)
    sky.uniforms.uSunDir.value.copy(tmp.dir)
    dome.current?.position.copy(camera.position)

    // Stage tint and fog distance follow the journey.
    const u = curveParam(journey.smooth)
    const f = u * (STATIONS.length - 1)
    const i = Math.min(Math.floor(f), STATIONS.length - 2)
    const k = f - i
    tmp.stage.copy(bgColors[i]).lerp(bgColors[i + 1], k)
    fog.color.copy(lerpC(DUSK.horizon, DAY.horizon)).lerp(tmp.stage, (1 - m) * 0.55)
    const scale = lerpN(DUSK.fogScale, DAY.fogScale)
    fog.near = THREE.MathUtils.lerp(STATION_FOG[i][0], STATION_FOG[i + 1][0], k) * scale
    fog.far = THREE.MathUtils.lerp(STATION_FOG[i][1], STATION_FOG[i + 1][1], k) * scale

    // Sun follows the point the camera looks at, so shadows stay crisp everywhere.
    if (sun.current) {
      camera.getWorldDirection(tmp.focus).multiplyScalar(36).add(camera.position)
      tmp.focus.y = 0
      sun.current.position.copy(tmp.focus).addScaledVector(tmp.dir, 140)
      sun.current.target.position.copy(tmp.focus)
      sun.current.color.copy(lerpC(DUSK.sun, DAY.sun))
      sun.current.intensity = lerpN(DUSK.sunIntensity, DAY.sunIntensity)
      const cam = sun.current.shadow.camera
      const extent = u > 0.93 ? 160 : 60
      if (cam.right !== extent) {
        cam.left = cam.bottom = -extent
        cam.right = cam.top = extent
        cam.updateProjectionMatrix()
      }
    }
    if (hemi.current) {
      hemi.current.color.copy(lerpC(DUSK.hemiSky, DAY.hemiSky))
      hemi.current.groundColor.copy(lerpC(DUSK.hemiGround, DAY.hemiGround))
      hemi.current.intensity = lerpN(DUSK.hemi, DAY.hemi)
    }

    // Image-based lighting and exposure.
    scene.environment = m > 0.5 ? env.day : env.dusk
    scene.environmentIntensity = lerpN(DUSK.env, DAY.env)
    gl.toneMappingExposure = lerpN(DUSK.exposure, DAY.exposure)

    // Lit windows at dusk.
    const glow = 1 - m
    glowMaterials.current.forEach((mat) => {
      mat.emissiveIntensity = glow * (mat.userData.nightGlow as number)
    })
  })

  return (
    <>
      <mesh ref={dome} material={sky} renderOrder={-1} frustumCulled={false} userData={{ noShadow: true }}>
        <sphereGeometry args={[800, 48, 24]} />
      </mesh>
      <hemisphereLight ref={hemi} />
      <directionalLight
        ref={sun}
        castShadow={shadowSize > 0}
        shadow-mapSize-width={shadowSize || 512}
        shadow-mapSize-height={shadowSize || 512}
        shadow-camera-near={1}
        shadow-camera-far={400}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
      />
    </>
  )
}
