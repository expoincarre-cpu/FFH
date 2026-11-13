import * as THREE from 'three'
import { macroTexture } from './textures'

/** Shared clock for vertex-shader wind (foliage, grass). Advanced once per frame by the world. */
export const windTime = { value: 0 }

type WeatherOpts = {
  /** Strength of the large-scale tone variation that hides texture tiling. */
  macro?: number
  /** World-space size of that variation, in metres. */
  scale?: number
  /** Darkening of the splash zone where a surface meets the ground (0 disables). */
  grime?: number
  /** Height of the splash zone in metres. */
  height?: number
}

/**
 * Adds world-space weathering to a standard material: slow tone variation
 * that breaks up tiling, and ground-contact grime on walls — a cheap stand-in
 * for dirt and for the ambient occlusion where buildings meet the ground.
 */
export function weather<T extends THREE.MeshStandardMaterial>(m: T, opts: WeatherOpts = {}): T {
  const { macro = 0.22, scale = 38, grime = 0, height = 1.4 } = opts
  m.defines = {
    ...m.defines,
    WEATHER_MACRO: macro.toFixed(3),
    WEATHER_SCALE: (1 / scale).toFixed(5),
    WEATHER_GRIME: grime.toFixed(3),
    WEATHER_HEIGHT: height.toFixed(3),
  }
  if (grime > 0) m.defines.WEATHER_HAS_GRIME = ''
  const macroMap = { value: null as THREE.Texture | null }
  m.onBeforeCompile = (shader) => {
    macroMap.value = macroTexture()
    shader.uniforms.uMacro = macroMap
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vec4 wPos4 = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
          wPos4 = instanceMatrix * wPos4;
        #endif
        vWPos = ( modelMatrix * wPos4 ).xyz;`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nuniform sampler2D uMacro;')
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        vec2 wUv = vWPos.xz * WEATHER_SCALE + vWPos.y * WEATHER_SCALE * vec2( 0.71, - 0.58 );
        vec2 wMacro = texture2D( uMacro, wUv ).rg;
        float wFine = texture2D( uMacro, wUv * 5.3 ).g;
        diffuseColor.rgb *= 1.0 + ( wMacro.r - 0.5 ) * WEATHER_MACRO * 2.0 + ( wFine - 0.5 ) * WEATHER_MACRO * 0.6;
        #ifdef WEATHER_HAS_GRIME
          float wGrime = ( 1.0 - smoothstep( 0.0, WEATHER_HEIGHT * ( 0.35 + wMacro.g * 1.3 ), vWPos.y ) ) * WEATHER_GRIME;
          diffuseColor.rgb *= mix( vec3( 1.0 ), vec3( 0.62, 0.56, 0.47 ), wGrime );
        #endif`,
      )
  }
  m.customProgramCacheKey = () => 'weather'
  return m
}

/**
 * Alpha-tested foliage material: leaf cards, palm fronds or grass tufts.
 *  - cards take a rounded "canopy" normal (from the per-instance aCenter attribute)
 *    so a cloud of flat cards shades like one soft volume;
 *  - wind sways everything in the vertex shader, weighted along the card;
 *  - back faces are lit like front faces, as thin leaves are.
 */
export function foliageMaterial(map: THREE.Texture, kind: 'card' | 'frond' | 'grass', opts: { alphaTest?: number; roughness?: number } = {}) {
  const m = new THREE.MeshStandardMaterial({
    map,
    alphaTest: opts.alphaTest ?? 0.42,
    side: THREE.DoubleSide,
    roughness: opts.roughness ?? 0.72,
    metalness: 0,
  })
  m.defines = { ...m.defines, [`FOLIAGE_${kind.toUpperCase()}`]: '' }
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = windTime
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uWind;
        #ifdef FOLIAGE_CARD
          attribute vec3 aCenter;
        #endif`,
      )
      .replace(
        '#include <defaultnormal_vertex>',
        `#ifdef FOLIAGE_CARD
          vec3 fLocal = ( instanceMatrix * vec4( position, 1.0 ) ).xyz;
          vec3 transformedNormal = normalMatrix * normalize( fLocal - aCenter + vec3( 0.0, 0.35, 0.0 ) );
        #elif defined( FOLIAGE_GRASS )
          vec3 transformedNormal = normalMatrix * vec3( 0.0, 1.0, 0.0 );
        #else
          #include <defaultnormal_vertex>
        #endif`,
      )
      .replace(
        '#include <project_vertex>',
        `vec4 mvPosition = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif
        {
          float fPhase = dot( mvPosition.xz, vec2( 0.31, 0.17 ) );
          #ifdef FOLIAGE_CARD
            float fW = 0.5 + uv.y * 0.5;
            vec3 fSway = vec3( sin( uWind * 1.1 + fPhase ), 0.0, cos( uWind * 0.83 + fPhase * 1.3 ) ) * 0.07;
            fSway += vec3( 0.0, sin( uWind * 2.7 + fPhase * 6.0 + uv.x * 5.0 ) * 0.035, 0.0 );
            mvPosition.xyz += fSway * fW;
          #elif defined( FOLIAGE_FROND )
            float fW = uv.x * uv.x;
            mvPosition.xyz += vec3( sin( uWind * 0.9 + fPhase ) * 0.12, sin( uWind * 1.7 + fPhase * 2.0 + uv.x * 3.0 ) * 0.16, cos( uWind * 0.7 + fPhase ) * 0.12 ) * fW;
          #else
            float fW = uv.y * uv.y;
            mvPosition.xz += vec2( sin( uWind * 1.6 + fPhase * 3.0 ), cos( uWind * 1.3 + fPhase * 2.0 ) ) * 0.09 * fW;
          #endif
        }
        mvPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;`,
      )
    shader.fragmentShader = shader.fragmentShader.replace('gl_FrontFacing ? 1.0 : - 1.0', '1.0')
  }
  m.customProgramCacheKey = () => `foliage-${kind}`
  return m
}

/** Glass that turns mirror-like at grazing angles (Fresnel-driven opacity). */
export function glassMaterial(opts: { color?: string; opacity?: number } = {}) {
  const m = new THREE.MeshStandardMaterial({
    color: opts.color ?? '#9fbfc4',
    transparent: true,
    opacity: opts.opacity ?? 0.2,
    roughness: 0.04,
    metalness: 0.5,
    envMapIntensity: 1.6,
    depthWrite: false,
  })
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `#include <dithering_fragment>
      float gFresnel = pow( 1.0 - saturate( dot( normalize( vViewPosition ), normal ) ), 3.0 );
      gl_FragColor.a = mix( gl_FragColor.a, 0.9, gFresnel );`,
    )
  }
  m.customProgramCacheKey = () => 'glass'
  return m
}
