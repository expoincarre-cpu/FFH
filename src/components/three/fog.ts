import * as THREE from 'three'

/**
 * Atmospheric perspective for every material in the scene.
 *
 * three's linear fog is replaced by analytically integrated exponential height
 * fog (denser near the ground, thinning with altitude) with forward scattering
 * towards the sun. It is installed by overriding the fog shader chunks, so all
 * built-in and custom materials pick it up without per-material plumbing.
 *
 * The stock fog uniforms are re-purposed (scene.fog is a THREE.Fog):
 *   fog.color → haze colour (sampled from the sky's horizon)
 *   fog.near  → extinction at ground level (1/m)
 *   fog.far   → sun direction, packed by packSun(): azimuth and elevation in one float
 */
/** Packs the sun's azimuth and elevation (radians) into fog.far. */
export function packSun(azimuth: number, elevation: number) {
  return Math.round(azimuth * 100) * 2 + Math.min(1.99, Math.max(0, elevation))
}
export const FOG_FALLOFF = 0.02

let installed = false

export function installHeightFog() {
  if (installed) return
  installed = true
  const C = THREE.ShaderChunk as Record<string, string>
  C.fog_pars_vertex = /* glsl */ `
#ifdef USE_FOG
  varying float vFogDepth;
  varying vec3 vFogWorld;
#endif
`
  C.fog_vertex = /* glsl */ `
#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  vFogWorld = transpose( mat3( viewMatrix ) ) * mvPosition.xyz + cameraPosition;
#endif
`
  C.fog_pars_fragment = /* glsl */ `
#ifdef USE_FOG
  uniform vec3 fogColor;
  uniform float fogNear;
  uniform float fogFar;
  varying float vFogDepth;
  varying vec3 vFogWorld;
#endif
`
  C.fog_fragment = /* glsl */ `
#ifdef USE_FOG
  vec3 fogRay = vFogWorld - cameraPosition;
  float fogDist = length( fogRay );
  vec3 fogDir = fogRay / max( fogDist, 1e-4 );
  float fogSlope = fogDir.y * ${FOG_FALLOFF.toFixed(4)};
  float fogPath = abs( fogSlope ) > 1e-5 ? ( 1.0 - exp( - fogDist * fogSlope ) ) / fogSlope : fogDist;
  float fogAmount = 1.0 - exp( - fogNear * exp( - max( cameraPosition.y, 0.0 ) * ${FOG_FALLOFF.toFixed(4)} ) * fogPath );
  float fogAz = floor( fogFar * 0.5 ) * 0.01;
  float fogEl = fogFar - floor( fogFar * 0.5 ) * 2.0;
  vec3 fogSun = vec3( cos( fogAz ) * cos( fogEl ), sin( fogEl ), - sin( fogAz ) * cos( fogEl ) );
  float fogForward = pow( max( dot( fogDir, fogSun ), 0.0 ), 5.0 );
  vec3 fogTint = fogColor * ( 1.0 + fogForward * 0.8 ) + vec3( 1.0, 0.62, 0.3 ) * fogForward * 0.22 * dot( fogColor, vec3( 0.333 ) );
  gl_FragColor.rgb = mix( gl_FragColor.rgb, fogTint, clamp( fogAmount, 0.0, 1.0 ) );
#endif
`
}
